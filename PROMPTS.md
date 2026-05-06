# Lecture Audio Note AI — Development Prompts Reference

> **Purpose**: This document summarizes the key prompts used during the development of this project, serving as a reference for the development methodology and AI-assisted engineering workflow.
>
> **Last Updated**: 2026-05-04

---

## 1. Phase 1 — Initial Specification Prompt

### Prompt Title
**【研修課題6】講義音声ノートAI（Gemini API連携）の策定：フェーズ1**

### Prompt Summary
Instructed the AI to act as a world-class engineer and execute "Phase 1: Specification Planning" based on the following requirements:

### Key Instructions
- **Directory constraint**: All files must be created within the `研修課題6/` directory.
- **Objective**: Build a mobile-first web app that uses the Gemini API to transcribe, summarize, and extract key points from lecture audio.
- **Technical constraints**:
  - Frontend-only (no backend server)
  - Gemini API via REST (direct client-side calls)
  - Audio sent as Base64 inline data
  - API key stored in `localStorage`
- **Output format**: `docs/SPEC.md` — a comprehensive functional specification document.
- **Research requirement**: Verify against official Gemini API documentation before writing the spec.

### Result
- Created `docs/SPEC.md` (v0.1.0 draft)
- Researched and documented: supported audio formats, token conversion rates, inline data limits, API endpoint structure, and error handling specifications.

---

## 2. Phase 1.5 — Specification Confirmation Prompt

### Prompt Title
**【研修課題6】フェーズ1仕様確定 ＆ フェーズ2：UI実装（MVP①）の開始**

### Prompt Summary
Project Owner confirmed the specification with the following decisions:

### Key Decisions
1. **Model**: `gemini-2.0-flash` (later changed to `gemini-2.5-flash`)
2. **File size limit**: 15MB accepted. UI must show "推奨：30分以内（15MB以下）" annotation.
3. **API key flow**: Auto-display settings modal when key is not set. Include a setup guide within the UI.
4. **Storage strategy**: No auto-save history. Only session-based temporary storage + manual `.txt` download.

### Instructions for Phase 2
- Implement the UI based on the confirmed spec
- Mobile-first design (Tailwind CSS)
- Create: `index.html`, `js/app.js`, `docs/STATUS.md`

### Result
- `SPEC.md` updated to v1.0.0 (confirmed)
- `index.html` created with full UI (settings modal, file upload, 3-tab results, copy/download)
- `js/app.js` created with UI logic (file validation, tab switching, simulated processing)
- `docs/STATUS.md` created for progress tracking

---

## 3. Phase 3 — API Integration Prompt

### Prompt Title
**【研修課題6】フェーズ3：API開通確認 ＆ 文字起こし実装**

### Prompt Summary
Instructed implementation of real Gemini API integration following a strict "least-likely-to-get-stuck" order:

### Three-Step Approach
1. **Step 1: Hello World connection test** — Send a simple text prompt ("こんにちは") to verify API key and endpoint are working. Implemented as `testApiConnection()` function, callable from the console or the "🔌 接続テスト" button.

2. **Step 2: Short audio transcription** — Implement the actual audio processing pipeline:
   - File → Base64 encoding (`fileToBase64()`)
   - MIME type detection (`guessMimeType()`)
   - Structured prompt requesting JSON output with 3 fields: `transcript`, `summary`, `keypoints`
   - `responseMimeType: 'application/json'` for reliable parsing

3. **Step 3: Error handling** — Implement comprehensive error handling for all HTTP status codes (400, 401, 403, 404, 429, 500, 503) and network/parse errors.

### Key Prompt Sent to Gemini API
```
あなたは大学の講義音声を処理する優秀なアシスタントです。
以下の音声を分析し、次の3つの項目をJSON形式で出力してください。

1. "transcript": 音声の全文文字起こし。フィラー（えー、あのー等）は除去し、適切に句読点を付けてください。
2. "summary": 講義内容の要約（300〜500字程度）。段落分けして読みやすくしてください。
3. "keypoints": 講義の要点を箇条書きリスト（5〜10項目）。各項目は1〜2文で簡潔に記述してください。

出力は以下のJSON形式のみで返してください：
{"transcript": "...", "summary": "...", "keypoints": ["...", "..."]}
```

### Result
- `testApiConnection()` — Hello world test passed
- `sendAudioToGemini()` — Audio transcription implemented
- Settings modal — "🔌 接続テスト" button added
- Error handling — All status codes covered with user-friendly Japanese messages

---

## 4. Debugging — Model Migration

### Issue
After implementing Phase 3, a 10-second audio file (123KB) returned **HTTP 429** (rate limit) error on the very first request.

### Root Cause
`gemini-2.0-flash` was **deprecated** by Google. The 429 error was misleading — it was not an actual rate limit but a rejection of requests to a retired model.

### Resolution
- Changed `GEMINI_MODEL` from `gemini-2.0-flash` to `gemini-2.5-flash`
- Enhanced the 429 error handler to display the API's detailed error message (previously only showed a generic message)
- Updated all documentation (`SPEC.md`, `STATUS.md`) to reflect the model change

### Result
Transcription succeeded immediately after the model change.

---

## 5. Phase 5 — Verification & Final Deliverables Prompt

### Prompt Title
**【研修課題6】Final Phase: Verification and Documentation**

### Prompt Summary
Final documentation phase to create:
1. `docs/TESTCASES.md` — 15 test scenarios with screenshot placeholders
2. `README.md` — Comprehensive setup and usage guide
3. `docs/PROMPTS.md` — This document
4. `docs/STATUS.md` — Final status update

---

## Reference URLs

| Resource | URL |
|---|---|
| Gemini API — Audio Understanding | https://ai.google.dev/gemini-api/docs/audio |
| Gemini API — Models | https://ai.google.dev/gemini-api/docs/models |
| Gemini API — File Input Methods | https://ai.google.dev/gemini-api/docs/file-input-methods |
| Google AI Studio — API Key | https://aistudio.google.com/apikey |
| Tailwind CSS CDN | https://cdn.tailwindcss.com |
| Google Fonts (Noto Sans JP) | https://fonts.googleapis.com/css2?family=Noto+Sans+JP |
