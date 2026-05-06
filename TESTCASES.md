# Lecture Audio Note AI — Test Cases

> **Version**: 1.0.0  
> **Last Updated**: 2026-05-04  
> **Tester**: _To be filled_

---

## 1. Test Environment

| Item | Details |
|---|---|
| Browser | Chrome / Edge / Safari (latest) |
| Device | Smartphone / Desktop |
| API Model | `gemini-2.5-flash` |
| Network | Stable internet connection required |

---

## 2. Test Scenarios

### TC-01: API Key — Save and Persist

| Item | Details |
|---|---|
| **Precondition** | No API key in localStorage |
| **Steps** | 1. Open the app → Settings modal auto-appears. 2. Enter a valid API key. 3. Click "保存" (Save). |
| **Expected Result** | Green toast "APIキーを保存しました ✅" appears. Status indicator shows "APIキー設定済み" with green dot. Key persists after page reload. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the settings modal with the key saved successfully._

---

### TC-02: API Key — Connection Test (Success)

| Item | Details |
|---|---|
| **Precondition** | Valid API key saved |
| **Steps** | 1. Open settings modal. 2. Click "🔌 接続テスト" (Connection Test). |
| **Expected Result** | Green toast "API接続成功 ✅: ..." appears with the model's response. Console log shows `[API Test] ✅ 成功！`. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the successful connection test toast._

---

### TC-03: API Key — Connection Test (Invalid Key)

| Item | Details |
|---|---|
| **Precondition** | Invalid/expired API key saved |
| **Steps** | 1. Save an invalid key (e.g., "invalid-key-12345"). 2. Click "🔌 接続テスト". |
| **Expected Result** | Red error banner appears: "APIキーが無効です。設定画面で正しいキーを再入力してください。" |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the error message for an invalid API key._

---

### TC-04: API Key — Delete

| Item | Details |
|---|---|
| **Precondition** | API key saved |
| **Steps** | 1. Open settings. 2. Click "削除" (Delete). |
| **Expected Result** | Toast "APIキーを削除しました" appears. Status changes to "未設定" with gray dot. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot showing the key was deleted._

---

### TC-05: File Selection — Valid Audio File

| Item | Details |
|---|---|
| **Precondition** | App is open |
| **Steps** | 1. Click the file upload area. 2. Select a valid MP3 file (< 15MB). |
| **Expected Result** | File info displayed (name, size in MB, MIME type). Execute button becomes enabled. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the file info display after selecting a valid file._

---

### TC-06: File Validation — Oversized File (> 15MB)

| Item | Details |
|---|---|
| **Precondition** | App is open |
| **Steps** | 1. Select an audio file larger than 15MB. |
| **Expected Result** | Red error: "ファイルサイズが大きすぎます（XX.X MB）。上限は15MBです。..." File input is cleared. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the file size validation error._

---

### TC-07: File Validation — Unsupported Format

| Item | Details |
|---|---|
| **Precondition** | App is open |
| **Steps** | 1. Select a non-audio file (e.g., `.txt`, `.pdf`). |
| **Expected Result** | Red error: "対応していないファイル形式です。..." File input is cleared. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the format validation error._

---

### TC-08: Transcription — Successful Processing

| Item | Details |
|---|---|
| **Precondition** | Valid API key saved, valid audio file selected |
| **Steps** | 1. Enter a lecture name (optional). 2. Select a short audio file (10–30 sec, < 1MB). 3. Click "AIで処理を実行". |
| **Expected Result** | 1. Spinner appears with status messages. 2. After processing, 3-tab results appear: "📝 全文", "📋 要約", "💡 要点". 3. Each tab contains meaningful content from the audio. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshots of: (1) the processing spinner, (2) the transcript tab, (3) the summary tab, (4) the keypoints tab._

---

### TC-09: Transcription — No API Key Set

| Item | Details |
|---|---|
| **Precondition** | No API key in localStorage, file selected |
| **Steps** | 1. Click "AIで処理を実行". |
| **Expected Result** | Error: "APIキーが設定されていません。..." Settings modal auto-opens. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the error with auto-opening settings modal._

---

### TC-10: Results — Copy to Clipboard

| Item | Details |
|---|---|
| **Precondition** | Successful transcription result displayed |
| **Steps** | 1. Switch to any tab. 2. Click "📋 コピー". |
| **Expected Result** | Button text changes to "✅ コピーしました" for 1.5 seconds. Pasting into a text editor shows the correct content. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the "✅ コピーしました" button state._

---

### TC-11: Results — Download as .txt

| Item | Details |
|---|---|
| **Precondition** | Successful transcription result displayed |
| **Steps** | 1. Enter lecture name "テスト講義". 2. Click "📥 ダウンロード". |
| **Expected Result** | File `テスト講義_YYYYMMDD.txt` is downloaded. Contents include all 3 sections (transcript, summary, keypoints) with proper formatting. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of: (1) the download toast, (2) the downloaded file contents._

---

### TC-12: Results — Download Without Lecture Name

| Item | Details |
|---|---|
| **Precondition** | Successful transcription, lecture name field is empty |
| **Steps** | 1. Leave lecture name empty. 2. Click "📥 ダウンロード". |
| **Expected Result** | File `ノート_YYYYMMDD_HHMM.txt` is downloaded. Lecture name in content shows "未設定". |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the downloaded file with auto-generated filename._

---

### TC-13: UI — Tab Switching

| Item | Details |
|---|---|
| **Precondition** | Successful transcription result displayed |
| **Steps** | 1. Click "📋 要約" tab. 2. Click "💡 要点" tab. 3. Click "📝 全文" tab. |
| **Expected Result** | Each tab highlights with blue underline. Content changes smoothly. Only one tab's content is visible at a time. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of each tab in active state._

---

### TC-14: UI — Mobile Responsiveness

| Item | Details |
|---|---|
| **Precondition** | App loaded on mobile device or browser dev tools (320px–768px) |
| **Steps** | 1. Open the app on a mobile browser. 2. Navigate through all features. |
| **Expected Result** | All elements are properly sized and accessible. No horizontal scrolling. Settings modal slides up from bottom. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the app on a mobile viewport._

---

### TC-15: API Error — Rate Limiting (HTTP 429)

| Item | Details |
|---|---|
| **Precondition** | Valid API key, rapid successive requests |
| **Steps** | 1. Send multiple requests in quick succession. |
| **Expected Result** | Red error with detailed message: "APIの利用制限に達しました。... (detailed API message)". The error includes the API's specific reason. |
| **Status** | ⬜ Not tested |

#### Screenshot Placeholder
> _Attach screenshot of the 429 error with detail message (if reproducible)._

---

## 3. Test Summary

| Category | Total | Passed | Failed | Not Tested |
|---|---|---|---|---|
| API Key Management | 4 | — | — | 4 |
| File Validation | 3 | — | — | 3 |
| Transcription | 2 | — | — | 2 |
| Results (Copy/DL) | 3 | — | — | 3 |
| UI/UX | 2 | — | — | 2 |
| Error Handling | 1 | — | — | 1 |
| **Total** | **15** | **—** | **—** | **15** |

---

## 4. Known Issues / Notes

- `gemini-2.0-flash` was deprecated and caused HTTP 429 errors. Resolved by migrating to `gemini-2.5-flash`.
- File size limit is 15MB due to Base64 inline data encoding (20MB API limit ÷ 1.33 encoding overhead).
- API key is stored in `localStorage` and visible via browser dev tools. Not suitable for shared devices.
