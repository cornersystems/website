# Google Sheets Auto-Sync — One-Time Setup

After this (~10 min), every pipeline run pushes leads to your sheet automatically. No copy-paste ever again.

Your sheet: https://docs.google.com/spreadsheets/d/1Z2mNEyKcsPwJWX3eqnSA3cflt--gb3f6x3ErN9m9jdA

---

## Step 1 — Create a Google Cloud project
1. Go to https://console.cloud.google.com/
2. Top bar → project dropdown → **New Project** → name it "Corner Systems" → Create
3. Make sure it's selected as the active project

## Step 2 — Enable the Sheets API
1. Go to https://console.cloud.google.com/apis/library/sheets.googleapis.com
2. Click **Enable**

## Step 3 — Create a service account
1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. **Create Service Account** → name "corner-sheets-bot" → Create and Continue
3. Skip the optional role steps → **Done**

## Step 4 — Download its key
1. Click the service account you just made
2. **Keys** tab → **Add Key → Create new key → JSON** → Create
3. A `.json` file downloads. **Rename it `google-key.json`** and move it to:
   ```
   C:\Users\thoma\OneDrive\Documents\GitHub\website\agent\google-key.json
   ```

## Step 5 — Share your sheet with the bot
1. Open `google-key.json`, find the `"client_email"` value
   (looks like `corner-sheets-bot@corner-systems-xxxx.iam.gserviceaccount.com`)
2. In your Google Sheet → **Share** → paste that email → set to **Editor** → Send
   (Untick "notify people" — it's a bot.)

## Step 6 — Tell me you're done
The `.env` is already configured. Once `google-key.json` is in the `agent/` folder
and you've shared the sheet, run:
```bash
node agent/sync-to-sheets.js
```
All 55 leads appear in a "Leads" tab. From then on it's automatic.

---

**Security note:** `google-key.json` is git-ignored — it never leaves your machine.
It only grants access to sheets you explicitly share with that bot email.
