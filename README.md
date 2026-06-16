[![DraftForge](assets/draftforge-logo.svg)](https://github.com/JOHNNYMACONNY/draftforge)

# DraftForge

DraftForge prepares local photos, videos, and optional music into review-ready social carousel drafts.

It is **not** an Instagram bot. It does not publish. It does not schedule. The core workflow is local-first and works without a social login.

## Status: v1.0.0

The product is usable. Config-driven onboarding works. Audio modes work. CLI is stable.

## Installation

```bash
# Clone and run from GitHub:
git clone https://github.com/JOHNNYMACONNY/draftforge
cd draftforge
node index.js --help
```

## Onboarding

Create a local config file with placeholders for your media and optional music:

```bash
node index.js init --out ./draftforge.config.json
```

Check your setup before rendering:

```bash
node index.js doctor --config ./draftforge.config.json
```

## What It Does

- Reads source media from:
  - Apple Photos albums on macOS
  - regular folders anywhere
- Renders social-ready MP4 carousel cards (1080x1350)
- Supports audio modes:
  - `none`
  - `original`
  - `local`
  - `mix`
- Emits:
  - `media/`
  - `manifest.json`
  - `caption.txt`
  - `review.md`
  - `preview.html`

## Meta Business Suite Draft Assist

**DraftForge can save drafts directly to Meta Business Suite using your authenticated Chrome session.** This is the key feature - local-first creation that seamlessly integrates with your existing Meta workflow.

**Prerequisites:**
- Chrome installed (not Chromium-only)
- `playwright-core` for browser automation

```bash
# Install dependencies
npm install

# Validate without login
node mbs-draft.js --manifest ./draftforge-pack/manifest.json --dry-run

# Live execution (browser opens for login)
node mbs-draft.js --manifest ./draftforge-pack/manifest.json --allow-live-mutation
```

**One-time setup:** Login to Meta Business Suite when the browser opens. Your session persists via `~/.draftforge/browser-profile/`.

See [docs/MBS_INTEGRATION.md](docs/MBS_INTEGRATION.md) for details.

## Quick Start: Local Carousel Creation

```bash
node index.js init --out ./draftforge.config.json
node index.js doctor --config ./draftforge.config.json
node index.js prepare \
  --config ./draftforge.config.json \
  --count 6 \
  --out ./draftforge-pack
```

Open `./draftforge-pack/preview.html` to review, or zip for handoff:

```bash
node handoff.js \
  --pack ./draftforge-pack \
  --out ./draftforge-handoff.zip
```

## Tests

```bash
npm run test:draftforge
```

## Safety Boundary

- No publish mode.
- No schedule mode.
- No boost/payment/account recovery handling.
- Manual review required before posting.

## License

MIT