# Meta Business Suite Integration (Plug-in Architecture)

DraftForge supports Meta Business Suite draft creation via a **plug-in architecture**. The clean repo includes validation and bundle preparation. Live browser automation requires a separate runner.

## Architecture

```
draftforge/
├── mbs-draft.js           # Validates manifest, creates bundle
├── lib/instagram/         # MBS utility library
└── lib/mbs-runner.js      # YOUR runner goes here (template provided)
```

## What Works Out of the Box

```bash
# Validate your MBS config (no browser needed)
node mbs-draft.js --manifest ./pack/manifest.json --dry-run

# Generate a ready-to-import bundle
node mbs-draft.js --manifest ./pack/manifest.json --config ./draftforge.config.json
# Output: pack/mbs-run-<timestamp>/bundle.json
```

## Browser Automation Plug-in

To enable live MBS drafts, implement `lib/mbs-runner.js` with this interface:

```javascript
// lib/mbs-runner.js - IMPLEMENT THIS
// Required exports:
module.exports = {
  runMbsBundle: async ({ bundlePath, businessId, assetId, expectedAccountLabel }) => {
    // Your browser automation here:
    // 1. Open Chrome/Playwright with persistent session
    // 2. Navigate to https://business.facebook.com/latest/composer/
    // 3. Upload media from bundle.exported_file_paths
    // 4. Enter caption from bundle.caption_draft
    // 5. Save draft (never publish)
    
    return {
      status: 'draft-saved' | 'failed',
      draftId: 'optional',
      url: 'composer-url-if-available',
      error: null | 'message'
    };
  }
};
```

## Prerequisites for Live Mode

Users must:
1. Log into Meta Business Suite in a Chrome profile
2. Install the plug-in runner (your implementation)
3. Configure credentials in `draftforge.config.json`

See `docs/MANIFEST_SPEC.md` for the bundle format.

## Safety Boundary

- `--allow-live-mutation` flag required for any live action
- Dry-run validates without touching Meta
- All drafts are "finish-later" - never published/scheduled
- Manual review required before any social action