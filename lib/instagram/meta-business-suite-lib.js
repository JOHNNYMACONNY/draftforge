const { URL } = require('node:url');

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLooseText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCaptionProbe(captionSnippet) {
  const normalizedCaption = normalizeText(captionSnippet);
  if (!normalizedCaption) {
    return {
      exact: '',
      boundedPrefix: '',
    };
  }

  const words = normalizedCaption.split(' ').filter(Boolean);
  const boundedPrefix = words.slice(0, Math.min(words.length, 6)).join(' ');
  return {
    exact: normalizedCaption,
    boundedPrefix: boundedPrefix.length >= 24 ? boundedPrefix : '',
    exactLoose: normalizeLooseText(normalizedCaption),
    boundedPrefixLoose: boundedPrefix.length >= 24 ? normalizeLooseText(boundedPrefix) : '',
  };
}

function buildComposerUrl({ assetId, businessId }) {
  if (!assetId || !businessId) {
    throw new Error('assetId and businessId are required to build the composer URL.');
  }

  const url = new URL('https://business.facebook.com/latest/composer/');
  url.searchParams.set('asset_id', assetId);
  url.searchParams.set('business_id', businessId);
  url.searchParams.set('ir_qe_exposed', '1');
  url.searchParams.set('nav_ref', 'internal_nav');
  url.searchParams.set('ref', 'biz_web_content_manager_calendar_view');
  url.searchParams.set('context_ref', 'CONTENT_CALENDAR');
  return url.toString();
}

function scoreTarget(target, options = {}) {
  const expectedBusinessId = options.expectedBusinessId || '';
  const expectedAssetId = options.expectedAssetId || '';
  let score = 0;
  const url = String(target.url || '');
  const title = String(target.title || '');

  if (target.type === 'page') {
    score += 2;
  }
  if (url.includes('business.facebook.com')) {
    score += 4;
  }
  if (title.includes('Meta Business Suite')) {
    score += 4;
  }
  if (expectedBusinessId && url.includes(`business_id=${expectedBusinessId}`)) {
    score += 3;
  }
  if (expectedAssetId && url.includes(`asset_id=${expectedAssetId}`)) {
    score += 3;
  }
  if (url.includes('/latest/composer/') || url.includes('/latest/content_calendar')) {
    score += 2;
  }

  return score;
}

function pickBusinessSuiteTarget(targets, options = {}) {
  const ranked = (targets || [])
    .map((target) => ({ target, score: scoreTarget(target, options) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked.length > 0 ? ranked[0].target : null;
}

function extractComposerSignals({ title, href, bodyText, expectedAccountLabel }) {
  const normalizedTitle = normalizeText(title);
  const normalizedHref = normalizeText(href);
  const normalizedBody = normalizeText(bodyText);
  const lowerBody = normalizedBody.toLowerCase();
  const looseBody = normalizeLooseText(normalizedBody);
  const expectedLabel = normalizeText(expectedAccountLabel);
  const expectedLabelLower = expectedLabel.toLowerCase();

  const hasInstagram = lowerBody.includes('instagram');
  const hasFacebook = lowerBody.includes('facebook');
  const hasPostTo = lowerBody.includes('post to');
  const hasPublish = /\bpublish\b/.test(lowerBody);
  const hasSchedule = /\bschedule\b/.test(lowerBody);
  const hasFinishLater = lowerBody.includes('finish later');
  const hasMedia = lowerBody.includes('add photo/video') || /\bmedia\b/.test(lowerBody);
  const accountLabelSeen = expectedLabel
    ? lowerBody.includes(expectedLabelLower)
    : false;

  return {
    title: normalizedTitle,
    href: normalizedHref,
    expectedAccountLabel: expectedLabel || null,
    accountLabelSeen,
    hasInstagram,
    hasFacebook,
    hasPostTo,
    hasPublish,
    hasSchedule,
    hasFinishLater,
    hasMedia,
    isComposerUrl: normalizedHref.includes('/latest/composer/'),
    confirmedInstagramDestination: hasInstagram && hasPostTo,
    usableComposer: hasMedia && hasPostTo && (hasFinishLater || hasSchedule || hasPublish),
    bodySnippet: normalizedBody.slice(0, 1000),
  };
}

const POST_DETAILS_EDITOR_ARIA_LABEL = 'Write into the dialogue box to include text with your post.';

function extractPostDetailsSignals({ bodyText, editorAriaLabel } = {}) {
  const normalizedBody = normalizeText(bodyText);
  const lowerBody = normalizedBody.toLowerCase();
  const normalizedEditorAriaLabel = normalizeText(editorAriaLabel);
  const hasPostDetails = lowerBody.includes('post details');
  const hasTextLabel = /\btext\b/.test(lowerBody);
  const hasFinishLater = lowerBody.includes('finish later');
  const hasPublish = /\bpublish\b/.test(lowerBody);
  const hasSchedule = /\bschedule\b/.test(lowerBody);
  const nextMentioned = /\bnext\b/.test(lowerBody);
  const nextDisabled = nextMentioned && lowerBody.includes('next remained disabled');
  const editorLabelMatches = normalizedEditorAriaLabel === POST_DETAILS_EDITOR_ARIA_LABEL;
  const safeTextEntrySurface = hasPostDetails && hasTextLabel && editorLabelMatches;
  const validNonPublishSurface =
    (hasPostDetails || hasFinishLater) && (hasPublish || hasSchedule || hasFinishLater);

  return {
    hasPostDetails,
    hasTextLabel,
    hasFinishLater,
    hasPublish,
    hasSchedule,
    editorAriaLabel: normalizedEditorAriaLabel || null,
    safeTextEntrySurface,
    validNonPublishSurface,
    requiresNext: false,
    prefersNext: false,
    nextMentioned,
    nextDisabled,
    bodySnippet: normalizedBody.slice(0, 1000),
  };
}

function extractDraftSaveSignals({ bodyText } = {}) {
  const normalizedBody = normalizeText(bodyText);
  const lowerBody = normalizedBody.toLowerCase();
  const hasFinishLater = lowerBody.includes('finish later');
  const hasPostDetails = lowerBody.includes('post details');
  const hasPublish = /\bpublish\b/.test(lowerBody);
  const hasSchedule = /\bschedule\b/.test(lowerBody);

  return {
    readyForDraftSave: hasFinishLater && (hasPostDetails || hasPublish || hasSchedule),
    actionLabel: hasFinishLater ? 'Finish later' : null,
    hasFinishLater,
    hasPostDetails,
    hasPublish,
    hasSchedule,
    assumesCaptionLabel: false,
    bodySnippet: normalizedBody.slice(0, 1000),
  };
}

function inferRecoverySurface({ bodyText, href } = {}) {
  const normalizedBody = normalizeText(bodyText);
  const lowerBody = normalizedBody.toLowerCase();
  const normalizedHref = normalizeText(href).toLowerCase();
  const hasDraftDetailEditor =
    normalizedHref.includes('/latest/composer')
    && normalizedHref.includes('business_content_id=')
    && (lowerBody.includes('finish later') || lowerBody.includes('post details'));
  const hasHomeDraftPosts =
    lowerBody.includes('home')
    && lowerBody.includes('draft posts');
  const hasPlannerDrafts =
    lowerBody.includes('planner')
    && lowerBody.includes('drafts');

  if (hasDraftDetailEditor) {
    return 'Draft detail / Editor';
  }

  if (
    hasHomeDraftPosts
    && (
      normalizedHref.includes('/latest/home')
      || !normalizedHref.includes('/latest/content_calendar')
    )
  ) {
    return 'Home -> Draft posts';
  }

  if (
    hasPlannerDrafts
    || (
      lowerBody.includes('drafts')
      && normalizedHref.includes('/latest/content_calendar')
    )
  ) {
    return 'Planner / Drafts';
  }

  return null;
}

function summarizeMediaEvidence(mediaEvidence = {}) {
  const assetFileNames = Array.isArray(mediaEvidence.assetFileNames)
    ? mediaEvidence.assetFileNames.filter(Boolean)
    : [];
  const assetCount = Number(mediaEvidence.assetCount) > 0
    ? Number(mediaEvidence.assetCount)
    : assetFileNames.length;
  const expectedImageCount = Number(mediaEvidence.expectedImageCount) || 0;
  const expectedVideoCount = Number(mediaEvidence.expectedVideoCount) || 0;
  const hasExplicitKinds = expectedImageCount > 0 || expectedVideoCount > 0;

  return {
    assetFileNames,
    assetCount,
    expectedImageCount: hasExplicitKinds ? expectedImageCount : assetCount,
    expectedVideoCount: hasExplicitKinds ? expectedVideoCount : 0,
    hasExplicitKinds,
  };
}

function extractObservedBodyMediaEvidence(bodyText) {
  const normalizedBody = normalizeText(bodyText);
  const countMatches = (pattern) => Array.from(normalizedBody.matchAll(pattern))
    .reduce((sum, match) => sum + Number(match[1] || 0), 0);

  const photoCount = countMatches(/\b(\d+)\s+(?:photos?|images?)\b/gi);
  const videoCount = countMatches(/\b(\d+)\s+videos?\b/gi);
  const genericTotalCount = countMatches(/\b(\d+)\s+(?:media|items?|assets?)\b/gi);

  return {
    photoCount,
    videoCount,
    genericTotalCount,
    totalCount: photoCount + videoCount || genericTotalCount,
  };
}

function extractCreatedOnLabels(bodyText) {
  const normalizedBody = normalizeText(bodyText);
  return Array.from(normalizedBody.matchAll(/Created on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}\s*[AP]M)/gi))
    .map((match) => normalizeText(match[1]));
}

function parseLocalLabelDate(label) {
  const normalized = normalizeText(label);
  if (!normalized) {
    return null;
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function extractRecoverySignals({
  bodyText,
  href,
  expectedAccountLabel,
  captionSnippet,
  mediaEvidence,
  workspaceMatched,
  observedAssetCount,
  observedMediaCount,
  observedPreviewImageCount,
  observedPreviewVideoCount,
  runStartedAt,
} = {}) {
  const normalizedBody = normalizeText(bodyText);
  const lowerBody = normalizedBody.toLowerCase();
  const looseBody = normalizeLooseText(normalizedBody);
  const normalizedAccountLabel = normalizeText(expectedAccountLabel);
  const captionProbe = buildCaptionProbe(captionSnippet);
  const expectedMedia = summarizeMediaEvidence(mediaEvidence);
  const observedBodyMedia = extractObservedBodyMediaEvidence(normalizedBody);
  const isMixedExpected = expectedMedia.expectedVideoCount > 0 && expectedMedia.expectedImageCount > 0;
  const observedPreviewCounts = {
    imageCount: Number(observedPreviewImageCount) || 0,
    videoCount: Number(observedPreviewVideoCount) || 0,
    totalCount: Number(observedMediaCount) || 0,
  };
  const observedTotalAssetCount = Number(observedAssetCount) || 0;
  const surface = inferRecoverySurface({ bodyText: normalizedBody, href });
  const createdOnLabels = extractCreatedOnLabels(normalizedBody);
  const runStartedAtDate = runStartedAt ? new Date(runStartedAt) : null;
  const recentDraftMatched = Boolean(
    surface === 'Home -> Draft posts'
    && runStartedAtDate
    && !Number.isNaN(runStartedAtDate.getTime())
    && createdOnLabels.some((label) => {
      const parsed = parseLocalLabelDate(label);
      if (!parsed) {
        return false;
      }
      const deltaMs = parsed.getTime() - runStartedAtDate.getTime();
      return deltaMs >= -2 * 60 * 1000 && deltaMs <= 20 * 60 * 1000;
    })
  );

  const accountMatched = workspaceMatched === true
    ? true
    : normalizedAccountLabel
    ? new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedAccountLabel)}([^a-z0-9]|$)`, 'i').test(normalizedBody)
    : false;
  const captionMatched = captionProbe.exact
    ? (
      lowerBody.includes(captionProbe.exact.toLowerCase())
      || looseBody.includes(captionProbe.exactLoose)
      || (captionProbe.boundedPrefix
        ? (
          lowerBody.includes(captionProbe.boundedPrefix.toLowerCase())
          || looseBody.includes(captionProbe.boundedPrefixLoose)
        )
        : false)
    )
    : false;

  const bodyCountMatched = expectedMedia.assetCount > 0 && (
    isMixedExpected
      ? observedBodyMedia.photoCount === expectedMedia.expectedImageCount
        && observedBodyMedia.videoCount === expectedMedia.expectedVideoCount
      : observedBodyMedia.photoCount === expectedMedia.assetCount
        || observedBodyMedia.totalCount === expectedMedia.assetCount
  );
  const exactAssetCountMatched = expectedMedia.assetCount > 0
    && observedTotalAssetCount === expectedMedia.assetCount
    && (!isMixedExpected || observedPreviewCounts.videoCount > 0 || observedBodyMedia.videoCount > 0);
  const previewMatched = expectedMedia.assetCount > 0
    && observedPreviewCounts.totalCount === expectedMedia.assetCount
    && (
      isMixedExpected
        ? observedPreviewCounts.imageCount >= expectedMedia.expectedImageCount
          && observedPreviewCounts.videoCount >= expectedMedia.expectedVideoCount
        : observedPreviewCounts.imageCount === expectedMedia.assetCount
    );
  const mediaMatched = bodyCountMatched || exactAssetCountMatched || previewMatched;
  const matchReasonParts = [];

  if (surface) {
    matchReasonParts.push(`surface:${surface}`);
  }
  if (accountMatched) {
    matchReasonParts.push('account');
  }
  if (captionMatched) {
    matchReasonParts.push('caption');
  }
  if (mediaMatched) {
    matchReasonParts.push(
      bodyCountMatched
        ? 'media-count'
        : exactAssetCountMatched
          ? 'media-assets'
          : 'media-preview',
    );
  }
  if (recentDraftMatched) {
    matchReasonParts.push('recent-draft');
  }

  return {
    surface,
    accountMatched,
    captionMatched,
    mediaMatched,
    matchedAssetCount: mediaMatched ? expectedMedia.assetCount : 0,
    expectedAssetCount: expectedMedia.assetCount,
    expectedImageCount: expectedMedia.expectedImageCount,
    expectedVideoCount: expectedMedia.expectedVideoCount,
    observedAssetCount: observedTotalAssetCount,
    observedMediaCount: observedPreviewCounts.totalCount,
    observedPreviewImageCount: observedPreviewCounts.imageCount,
    observedPreviewVideoCount: observedPreviewCounts.videoCount,
    observedBodyMedia,
    recentDraftMatched,
    createdOnLabels,
    savedDraftMatch: Boolean(surface && accountMatched && (captionMatched && mediaMatched || recentDraftMatched)),
    matchReason: matchReasonParts.join('+') || null,
    bodySnippet: normalizedBody.slice(0, 1000),
  };
}

module.exports = {
  buildComposerUrl,
  buildCaptionProbe,
  extractDraftSaveSignals,
  extractComposerSignals,
  extractObservedBodyMediaEvidence,
  extractCreatedOnLabels,
  extractPostDetailsSignals,
  extractRecoverySignals,
  inferRecoverySurface,
  normalizeLooseText,
  normalizeText,
  pickBusinessSuiteTarget,
  POST_DETAILS_EDITOR_ARIA_LABEL,
  summarizeMediaEvidence,
};
