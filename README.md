# 🎙 Lecture Audio Note AI (講義音声ノートAI)

A mobile-first web application that transcribes, summarizes, and extracts key points from lecture audio using the **Google Gemini API**.

> **Training Task 6** — Gemini API Integration Project

---

## ✨ Features

- **Full Transcription** — Converts lecture audio to text with proper punctuation (fillers removed)
- **Smart Summary** — Generates a 300–500 character summary of the lecture content
- **Key Points Extraction** — Lists 5–10 important points in bullet format
- **Smart Categorization** — Automatically classifies notes into categories (e.g., Seminar, Job Hunting, Research, Internship) using AI, displayed as color-coded tags
- **Session Metadata Management** — Input and display the **Date** (📅) and **Session Number** (🔢) for each lecture, included in results, downloads, and AI context
- **One-click Copy** — Copy any section to clipboard instantly
- **Text Download** — Export all results as a formatted `.txt` file with full metadata
- **Mobile-first Design** — Optimized for smartphone browsers with responsive layout
- **Secure API Key Storage** — Keys stored locally in `localStorage`, never hardcoded

---

## 🛠 Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML / Tailwind CSS / JavaScript |
| AI Model | `gemini-2.5-flash` (Google Gemini API) |
| Hosting | Static files (GitHub Pages compatible) |
| API Communication | REST API via `generativelanguage.googleapis.com` |
| Backend | None (client-side only) |

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, Safari, Firefox)
- A **Google Gemini API key** ([Get one here](https://aistudio.google.com/apikey))

### Setup

1. **Clone or download** this repository:
   ```bash
   git clone <repository-url>
   cd 研修課題6
   ```

2. **Open the app** — Simply open `index.html` in your browser:
   ```bash
   # Option A: Direct file open
   open index.html

   # Option B: Local server (recommended)
   python -m http.server 8080
   # Then visit http://localhost:8080
   ```

3. **Set your API key**:
   - On first launch, the settings modal appears automatically.
   - Enter your Gemini API key and click **"保存" (Save)**.
   - Click **"🔌 接続テスト" (Connection Test)** to verify.

---

## 📖 Usage

### Step 1: Enter Lecture Name (Optional)
Type the lecture name (e.g., "情報工学概論 第5回"). This is used for the download filename. If left blank, a timestamp-based name is generated automatically.

### Step 2: Select Audio File
Click the upload area or drag & drop an audio file.

**Supported formats:**
| Format | Extensions |
|---|---|
| WAV | `.wav` |
| MP3 | `.mp3` |
| AAC | `.aac`, `.m4a` |
| OGG Vorbis | `.ogg` |
| FLAC | `.flac` |
| AIFF | `.aiff` |

### Step 3: Process with AI
Click **"⚡ AIで処理を実行"** to start. The app will:
1. Read and encode the audio file (Base64)
2. Send it to the Gemini API with a structured prompt
3. Display results in 3 tabs: **📝 Full Text**, **📋 Summary**, **💡 Key Points**

### Step 4: Export Results
- **📋 Copy** — Copies the current tab's content to clipboard
- **📥 Download** — Saves all 3 sections as a formatted `.txt` file

---

## ⚠️ Important Notes

### File Size Limit: 15MB
Audio files must be **under 15MB**. This is due to the Base64 inline data method (20MB API limit ÷ 1.33 encoding overhead ≈ 15MB).

**Approximate recording limits:**
| Codec | Bitrate | Max Duration |
|---|---|---|
| MP3 | 128 kbps | ~15 minutes |
| MP3 | 64 kbps | ~30 minutes |
| OGG | 96 kbps | ~20 minutes |

> 💡 **Tip**: For longer lectures, use a lower bitrate or compress the audio before uploading.

### API Key Security
- Your API key is stored in the browser's `localStorage`.
- It is **never** sent to any server other than Google's API endpoint.
- ⚠️ The key is accessible via browser developer tools. **Do not use on shared/public devices.**

### API Rate Limits
The Gemini API has usage quotas. If you encounter a 429 error, wait a few minutes before retrying. The app displays the specific error detail from the API for troubleshooting.

---

## 📁 File Structure

```
研修課題6/
├── index.html              # Main application page
├── js/
│   └── app.js              # Application logic (API, UI, file handling)
├── docs/
│   ├── SPEC.md             # Functional specification (confirmed)
│   ├── STATUS.md           # Development status tracker
│   ├── TESTCASES.md        # Test plan with 15 scenarios
│   └── PROMPTS.md          # Development prompts reference
└── README.md               # This file
```

---

## 🔧 Development Phases

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Specification & Planning (`SPEC.md`) | ✅ Complete |
| Phase 2 | UI Implementation (Mobile-first SPA) | ✅ Complete |
| Phase 3 | Gemini API Integration & Testing | ✅ Complete |
| Phase 4 | Deployment & Documentation | ✅ Complete |

### Key Technical Decision
During Phase 3, the initial model `gemini-2.0-flash` returned HTTP 429 (rate limit) errors even for small files. Investigation revealed the model was **deprecated**. Migrating to `gemini-2.5-flash` resolved the issue immediately.

---

## 🚀 Future Roadmap

This project is actively evolving. Below are planned enhancements that will expand its capabilities beyond simple note-taking into a comprehensive lecture-learning platform.

| Priority | Feature | Description |
|---|---|---|
| 🔥 High | **Long-form Audio Support** | Implementing client-side audio compression and chunked uploading to reliably handle full 90-minute lectures, breaking through the current 15MB limit. |
| ⭐ High | **AI-Generated Review Quiz** | Automatically generating practice questions (multiple choice, fill-in-the-blank) from lecture content to reinforce learning and enable self-assessment. |
| 💡 Medium | **Schedule Extraction** | Intelligently identifying and extracting dates, deadlines, assignment due dates, and future schedules mentioned within the audio, presented as a structured timeline. |

> 🎯 **Vision**: Transform from a transcription tool into an **AI-powered lecture companion** that helps students not just capture, but truly *understand and retain* lecture content.

---

## 📄 License

This project is developed as part of a training exercise (研修課題6).

---

## 🔗 References

- [Gemini API — Audio Understanding](https://ai.google.dev/gemini-api/docs/audio)
- [Gemini API — Models](https://ai.google.dev/gemini-api/docs/models)
- [Google AI Studio — API Key](https://aistudio.google.com/apikey)
