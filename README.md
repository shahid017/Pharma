# Pharmacy Prescription Processor

Upload prescription images, extract text with OpenAI Vision, and normalize medical abbreviations into plain-language instructions.

Built for **Cloudflare Pages** (static React frontend + Pages Functions API).

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **API**: Cloudflare Pages Functions (`/api/*`)
- **OCR**: OpenAI `gpt-4o` (optional Google Cloud Vision REST fallback)

The original FastAPI backend in `backend/` remains available for local Python development.

## Prerequisites

- Node.js 20+
- A Cloudflare account
- OpenAI API key

## Local development

### Option A — Cloudflare Pages (recommended)

```bash
npm install
cp .dev.vars.example .dev.vars   # add your OPENAI_API_KEY
npm run build
npm run pages:dev
```

Opens the Vite-built app plus Functions at `http://localhost:8788`.

### Option B — Vite + FastAPI

```bash
# Terminal 1 — API
cd backend
# install deps with uv or pip, then:
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend (proxies /api → :8000)
npm install
npm run dev
```

## Deploy to Cloudflare Pages

1. Build and deploy:

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name=pharma
```

Or connect this GitHub repo in the Cloudflare dashboard:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

2. Set secrets (dashboard **Settings → Environment variables**, or CLI):

```bash
npx wrangler pages secret put OPENAI_API_KEY --project-name=pharma
# optional:
npx wrangler pages secret put GOOGLE_VISION_API_KEY --project-name=pharma
```

3. Confirm health:

```text
GET https://<your-pages-url>/api/health
```

## API

### `POST /api/process-prescription`

Multipart form field: `file` (JPEG or PNG)

Response:

```json
{
  "raw_text": "...",
  "normalized_instructions": "...",
  "administration_time": ["morning"],
  "success": true,
  "error": null
}
```

### `GET /api/health`

Returns configuration status for OCR providers.
