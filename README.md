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

## Quick Start: Folder Source, No Audio

```bash
node index.js init --out ./draftforge.config.json
node index.js doctor --config ./draftforge.config.json
node index.js prepare \
  --config ./draftforge.config.json \
  --count 6 \
  --out ./draftforge-pack
```

Open:

```text
./draftforge-pack/preview.html
./draftforge-pack/review.md
```

## Manual Handoff Zip

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