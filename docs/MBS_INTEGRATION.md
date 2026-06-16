# Meta Business Suite Integration

DraftForge supports Meta Business Suite (MBS) draft creation as a **workspace-only extension**.

## How It Works

MBS draft mode takes a prepared pack manifest and creates a browser-automated draft in your Meta Business Suite account.

```bash
# Dry-run validation (works in standalone repo)
node mbs-draft.js --manifest ./pack/manifest.json --dry-run

# Live execution (workspace-only)
node mbs-draft.js --manifest ./pack/manifest.json --allow-live-mutation
```

## Workspace Setup Required

**Live MBS mode requires:**

1. An authenticated Chrome browser session with Meta Business Suite access
2. Environment variables or config with:
   - `businessId` - Your Meta Business Suite business ID
   - `assetId` - Your Instagram asset ID  
   - `expectedAccountLabel` - Account verification label
3. The `scripts/instagram/meta-business-suite-runner.js` automation (80KB workspace module)

## Configuration

In your `draftforge.config.json`:

```json
{
  "metaBusinessSuite": {
    "businessId": "YOUR_BUSINESS_ID",
    "assetId": "YOUR_ASSET_ID",
    "expectedAccountLabel": "Instagram Account Name"
  }
}
```

## Safety Model

- `--allow-live-mutation` flag required for any live action
- Dry-run validates manifest without touching Meta
- All drafts are "finish-later" - never published/scheduled
- Manual review required before any social action

## For Development

The MBS runner is workspace-specific and not included in the public DraftForge repo. Contact the maintainer for integration details.