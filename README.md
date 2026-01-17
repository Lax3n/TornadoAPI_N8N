# 🌪️ Tornado API for n8n

Download YouTube videos & Spotify podcasts directly in your n8n workflows.

## Installation

### Via npm (recommended)
```bash
cd ~/.n8n/custom
npm install n8n-nodes-tornado-api
```

### Via Docker
```bash
docker run -it --rm -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -v /path/to/n8n-nodes-tornado-api:/home/node/.n8n/custom/n8n-nodes-tornado-api \
  n8nio/n8n
```

---

## Credentials Setup

1. Go to **Credentials** → **New**
2. Search for **Tornado API**
3. Enter your API Key (starts with `sk_`)
4. Base URL: `https://tornado.velys.software` (default)

---

## Operations

### Job → Create

Creates a download job. Returns immediately with a `job_id`.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| URL | string | ✅ | YouTube or Spotify URL |
| Format | select | ❌ | mp4, mkv, webm, mov |
| Video Codec | select | ❌ | copy, h264, h265, vp9 |
| Audio Codec | select | ❌ | copy, aac, opus, mp3 |
| Audio Bitrate | select | ❌ | 64k to 320k |
| Video Quality | number | ❌ | CRF 0-51 (lower = better) |
| Filename | string | ❌ | Custom filename |
| Folder | string | ❌ | S3 folder prefix |
| Webhook URL | string | ❌ | Notification URL |

**Output (YouTube):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Output (Spotify Show):**
```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440001",
  "total_episodes": 142,
  "episode_jobs": ["job-1", "job-2", "..."]
}
```

---

### Job → Get Status

Check the current status of a job.

**Input:**
| Field | Type | Required |
|-------|------|----------|
| Job ID | string | ✅ |

**Output:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://youtube.com/watch?v=...",
  "status": "Completed",
  "s3_url": "https://your-bucket.s3.amazonaws.com/videos/video.mp4?X-Amz-Algorithm=...",
  "step": "Finished",
  "error": null
}
```

---

## 📦 S3 Storage - How It Works

### Default Flow

```
1. You create a job → Tornado downloads the video
2. Video is uploaded to S3 → Tornado generates a presigned URL
3. You get the s3_url → Valid for 24 hours
```

### The `s3_url` Field

When a job completes, you receive a **presigned S3 URL**:

```json
{
  "s3_url": "https://bucket.s3.region.amazonaws.com/videos/my-video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Signature=..."
}
```

This URL:
- ✅ Can be downloaded directly (no auth needed)
- ✅ Works in browsers, wget, curl
- ✅ Valid for **24 hours**
- ❌ Expires after 24h (request new URL via Get Status)

### Using s3_url in n8n

**Download the file:**
```
HTTP Request node:
- Method: GET
- URL: {{ $json.s3_url }}
- Response: File
```

**Send to user:**
```
Telegram/Slack/Discord node:
- File URL: {{ $json.s3_url }}
```

**Save to Google Drive:**
```
Google Drive node:
- Upload from URL: {{ $json.s3_url }}
```

---

## 🔄 Workflow Examples

### Example 1: Simple YouTube Download with Polling

Use n8n's **Wait** and **IF** nodes to poll for job completion:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Trigger   │ →  │ Tornado API │ →  │    Wait     │ →  │ Tornado API │ →  │     IF      │
│  (Manual)   │    │ Job:Create  │    │  (5 sec)    │    │ Job:Status  │    │ Completed?  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                                      ▲                  │
                         ▼                                      │                  ▼
                   { job_id: ... }                         Loop back         { s3_url: ... }
```

**Node 1 - Tornado API (Create):**
- Resource: Job
- Operation: Create
- URL: `https://youtube.com/watch?v=dQw4w9WgXcQ`

**Node 2 - Wait:**
- Wait Time: 5 seconds

**Node 3 - Tornado API (Get Status):**
- Resource: Job
- Operation: Get Status
- Job ID: `{{ $('Tornado API').item.json.job_id }}`

**Node 4 - IF:**
- Condition: `{{ $json.status }}` equals `Completed`
- True: Continue to next step
- False: Loop back to Wait node

---

### Example 2: Download + Send to Telegram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Telegram   │ →  │ Tornado API │ →  │    Wait     │ →  │ Tornado API │ →  │  Telegram   │
│  Trigger    │    │ Job:Create  │    │  + Loop     │    │ Job:Status  │    │ Send Video  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Telegram Trigger:** Receives YouTube URL from user
**Tornado Create:** URL = `{{ $json.message.text }}`
**Wait + Loop:** Poll every 5 seconds until status = Completed
**Telegram Send:** Video URL = `{{ $json.s3_url }}`

---

### Example 3: Batch Spotify Podcast

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Trigger   │ →  │ Tornado API │ →  │  Split In   │ →  │ Tornado API │
│             │    │ Job:Create  │    │   Batches   │    │ Job:Status  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                                      │
                         ▼                                      ▼
                   { batch_id: ...,                    (with Wait + Loop
                     episode_jobs: [...] }              for each job)
```

**Tornado Create:**
- URL: `https://open.spotify.com/show/...`
- Folder: `my-podcast`

**Split In Batches:**
- Input: `{{ $json.episode_jobs }}`
- Batch Size: 10

**Tornado Get Status (with Wait + Loop):**
- Job ID: `{{ $json }}`
- Loop until status = Completed

---

### Example 4: Configure Custom S3 Bucket + Download

Use your own S3 bucket (AWS, Cloudflare R2, MinIO):

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Manual    │ →  │ Tornado API │ →  │ Tornado API │ →  │    Wait     │
│   Trigger   │    │ Storage:    │    │ Job:Create  │    │  + Loop     │
│             │    │ Configure   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                                      │
                         ▼                                      ▼
                   Bucket linked!                    s3_url points to
                                                    YOUR bucket!
```

**Node 1 - Tornado API (Configure Bucket):**
- Resource: **Storage**
- Operation: **Configure Bucket**
- Provider: Amazon S3 / Cloudflare R2 / MinIO
- Endpoint URL: `https://s3.us-east-1.amazonaws.com`
- Bucket Name: `my-videos-bucket`
- Region: `us-east-1`
- Access Key ID: `AKIA...`
- Secret Access Key: `********`

**Node 2 - Tornado API (Create Job):**
- Resource: Job
- Operation: Create
- URL: `https://youtube.com/watch?v=...`

**Node 3 - Wait + Loop:**
- Use n8n Wait node (5 seconds) + Get Status + IF node to poll until completed

**Output (when completed):**
```json
{
  "status": "Completed",
  "s3_url": "https://my-videos-bucket.s3.us-east-1.amazonaws.com/videos/video.mp4?X-Amz-..."
}
```

---

### Example 5: Cloudflare R2 Setup

```
┌─────────────┐
│ Tornado API │
│ Storage:    │
│ Configure   │
└─────────────┘
```

**Settings for R2:**
- Provider: **Cloudflare R2**
- Endpoint URL: `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
- Bucket Name: `my-r2-bucket`
- Region: `auto`
- Access Key ID: (from R2 API Tokens)
- Secret Access Key: (from R2 API Tokens)

---

### Example 6: Reset to Default Storage

If you want to stop using your custom bucket:

```
┌─────────────┐
│ Tornado API │
│ Storage:    │
│ Reset       │
└─────────────┘
```

- Resource: **Storage**
- Operation: **Reset to Default**

Files will be uploaded to Tornado's default storage again.

---

## 📊 Status Values

| Status | Description | s3_url |
|--------|-------------|--------|
| `Pending` | In queue | ❌ |
| `Processing` | Downloading/encoding | ❌ |
| `Completed` | Done! | ✅ |
| `Failed` | Error occurred | ❌ |

## 📍 Processing Steps

| Step | Description |
|------|-------------|
| `Queued` | Waiting in queue |
| `Downloading` | Fetching video/audio |
| `Muxing` | Combining with FFmpeg |
| `Uploading` | Sending to S3 |
| `Finished` | Complete |

---

## ⚠️ Error Handling

Use the **IF** node to handle errors:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Tornado API │ →  │     IF      │ →  │   Success   │
│ Job:Wait    │    │status=Done? │    │   Path      │
└─────────────┘    └─────────────┘    └─────────────┘
                         │
                         ▼ (else)
                   ┌─────────────┐
                   │   Error     │
                   │   Handler   │
                   └─────────────┘
```

**IF Condition:**
```
{{ $json.status }} == "Completed"
```

---

## 🛠️ Development

### Build from Source

```bash
git clone https://github.com/Lax3n/TornadoAPI_N8N
cd n8n-nodes-tornado-api
npm install
npm run build
```

### Local Testing

1. Build the node: `npm run build`
2. Link to n8n:
   ```bash
   # Windows
   mklink /D "%USERPROFILE%\.n8n\custom\n8n-nodes-tornado-api" "D:\path\to\n8n-nodes-tornado-api"

   # Linux/Mac
   ln -s /path/to/n8n-nodes-tornado-api ~/.n8n/custom/n8n-nodes-tornado-api
   ```
3. Start n8n: `n8n start`

### Watch Mode

```bash
npm run dev
```

Automatically rebuilds on file changes.

---

## 📦 Publishing to npm

To publish this node so others can install it via `npm install`:

### 1. Prerequisites

- npm account ([npmjs.com](https://www.npmjs.com/))
- Node.js 18+ installed

### 2. Login to npm

```bash
npm login
```

### 3. Update package.json

Ensure these fields are correct:
```json
{
  "name": "n8n-nodes-tornado-api",
  "version": "1.0.0",
  "description": "n8n node for Tornado API - Download YouTube videos & Spotify podcasts",
  "author": "Velys Software",
  "license": "MIT"
}
```

### 4. Build & Publish

```bash
npm run build
npm publish
```

### 5. Versioning

For updates:
```bash
npm version patch  # 1.0.0 → 1.0.1 (bug fixes)
npm version minor  # 1.0.0 → 1.1.0 (new features)
npm version major  # 1.0.0 → 2.0.0 (breaking changes)
npm publish
```

---

## ✅ n8n Community Verification (Optional)

To get your node listed in the official n8n integrations:

### 1. Requirements

- Node must be published on npm
- Must follow n8n node naming: `n8n-nodes-*`
- Include proper documentation
- Include icon (SVG or PNG)
- Pass basic functionality tests

### 2. Submit for Review

1. Go to [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
2. Submit your node for review via their process
3. n8n team will review and potentially feature it

### 3. Benefits of Verification

- Listed in n8n's official integrations
- Discoverable in n8n node search
- Increased trust and visibility

---

## 🔗 Links

- [Tornado API](https://tornado.velys.software)
- [API Documentation](https://docs.tornado.velys.software)
- [Get API Key](https://tornado.velys.software/dashboard)
- [Support](mailto:support@velys.software)
