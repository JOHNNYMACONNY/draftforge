# Meta Business Suite Integration

DraftForge supports Meta Business Suite draft creation via browser automation. This uses your authenticated Chrome session.

## Quick Start

```bash
# Validate your setup (no login required)
node mbs-draft.js --manifest ./pack/manifest.json --dry-run

# Live execution (requires Meta login in Chrome)
node mbs-draft.js --manifest ./pack/manifest.json --allow-live-mutation
```

## Setup

1. **Install Chrome** (if not already installed)
2. **One-time login**: Run the command once and complete Meta login in the opened browser
3. **Set credentials** in `draftforge.config.json`:

```json
{
  "metaBusinessSuite": {
    "businessId": "YOUR_BUSINESS_ID",
    "assetId": "YOUR_INSTAGRAM_ASSET_ID",
    "expectedAccountLabel": "Instagram Account Name"
  }
}
```

## Browser Profile

The runner uses a persistent Chrome profile to maintain your login session:

- Default: `~/.draftforge/browser-profile/`
- Custom: Set `DRAFTFORGE_BROWSER_PROFILE=/path/to/profile` environment variable

## Safety Model

- `--allow-live-mutation` flag required for live execution
- Dry-run validates manifest without touching Meta
- Browser opens in visible mode (not headless) for control
- Only saves drafts - never publishes or schedules

## Troubleshooting

**LOGIN_REQUIRED error?**
- Complete login in the opened browser
- Keep the browser window open
- Rerun the command

**Wrong account?**
- Check `expectedAccountLabel` matches your Instagram account name
- Clear the browser profile and login again