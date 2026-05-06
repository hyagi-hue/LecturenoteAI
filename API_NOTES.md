# 🔑 API Technical Notes — Gemini API

> **対象プロジェクト**: 講義音声ノートAI（研修課題6）
>
> **最終更新**: 2026-05-06

---

## 1. 使用モデル

| 項目 | 詳細 |
|---|---|
| **モデル名** | `gemini-2.5-flash` |
| **提供元** | Google（Gemini API） |
| **選定理由** | 高速な応答速度、音声データの直接処理対応、無料枠の利用可能性 |

### 選定の背景

本プロジェクトでは、講義音声（最大15MB）をリアルタイムに近い速度で処理する必要があるため、**推論速度に優れた Flash 系モデル**を採用しました。Flash モデルは Pro モデルと比較してレイテンシが低く、Base64 エンコードされた音声データのインライン送信にも対応しています。

> ⚠️ **開発メモ**: 当初 `gemini-2.0-flash` を使用していましたが、HTTP 429（レート制限）エラーが頻発したため調査した結果、同モデルが**非推奨（deprecated）**であることが判明しました。`gemini-2.5-flash` への移行により問題は即座に解消されました。

---

## 2. エンドポイント・サービス

| 項目 | 詳細 |
|---|---|
| **サービス** | Google AI Studio（Gemini API） |
| **公式URL** | [https://aistudio.google.com/](https://aistudio.google.com/) |
| **APIキー取得** | [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **API ベースURL** | `https://generativelanguage.googleapis.com/v1beta/models` |
| **通信方式** | REST API（POST リクエスト） |
| **認証方式** | URL パラメータによる API キー認証（`?key=YOUR_KEY`） |

### リクエスト構成

```
POST /v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}
Content-Type: application/json

{
  "contents": [{
    "parts": [
      { "inlineData": { "mimeType": "audio/mp3", "data": "<Base64>" } },
      { "text": "<プロンプト>" }
    ]
  }],
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

本プロジェクトではバックエンドサーバーを使用せず、**クライアントサイドから直接 API を呼び出す**アーキテクチャを採用しています。音声ファイルは JavaScript の `FileReader` で Base64 に変換し、インラインデータとして送信します。

---

## 3. 利用制限（無料枠）

Gemini API の無料枠（Free Tier）には以下の制限が適用されます：

| 制限項目 | 上限値 | 備考 |
|---|---|---|
| **RPM**（リクエスト/分） | 約 15 リクエスト | 短時間での連続処理に注意 |
| **RPD**（リクエスト/日） | 約 1,500 リクエスト | 通常の学習利用では十分 |
| **TPM**（トークン/分） | 約 1,000,000 トークン | 音声処理では大量のトークンを消費する場合がある |

### エラーハンドリング

本アプリケーションでは、以下の HTTP ステータスコードに対して個別のエラーメッセージを表示します：

| ステータス | 意味 | アプリの対応 |
|---|---|---|
| `400` | リクエスト不正 | ファイル破損の可能性を通知 |
| `401` / `403` | 認証エラー | APIキーの再入力を促進 |
| `404` | モデル未検出 | モデル名の確認を通知 |
| `429` | レート制限超過 | 時間をおいての再試行を案内 |
| `500` / `503` | サーバーエラー | 再試行を案内 |

---

## 4. セキュリティ

### APIキーの保管方針

| 方針 | 実装 |
|---|---|
| **保管場所** | ブラウザの `localStorage` |
| **ソースコードへの埋め込み** | **一切行わない**（ハードコード禁止） |
| **送信先** | Google の API エンドポイントのみ |
| **暗号化** | `localStorage` 自体には暗号化機能なし |

### セキュリティ上の考慮事項

1. **API キーはソースコードに含めない**: キーはユーザーが設定画面から手動で入力し、`localStorage` に保存されます。GitHubリポジトリにキーが漏洩するリスクを排除しています。

2. **通信経路**: API キーは HTTPS 経由でのみ送信されます。第三者のサーバーへの送信は一切行いません。

3. **共有端末での利用リスク**: `localStorage` に保存されたキーは、ブラウザの開発者ツールからアクセス可能です。そのため、共有端末や公共のPCでの利用は**推奨しません**。アプリ内でもこの注意事項を明示しています。

4. **キーの管理機能**: 設定画面にて以下の操作が可能です：
   - **保存**: 入力されたキーを `localStorage` に保存
   - **接続テスト**: 保存済みキーの有効性を確認
   - **削除**: `localStorage` からキーを完全に削除

---

## 5. 対応音声フォーマット

| フォーマット | 拡張子 | MIME タイプ |
|---|---|---|
| WAV | `.wav` | `audio/wav` |
| MP3 | `.mp3` | `audio/mp3` / `audio/mpeg` |
| AAC | `.aac`, `.m4a` | `audio/aac` / `audio/mp4` |
| OGG Vorbis | `.ogg` | `audio/ogg` |
| FLAC | `.flac` | `audio/flac` |
| AIFF | `.aiff` | `audio/aiff` |

ファイルサイズ上限は **15MB**（Base64 変換後の API 制限 20MB を考慮）です。

---

## 6. 参考資料

- [Gemini API — Audio Understanding](https://ai.google.dev/gemini-api/docs/audio)
- [Gemini API — Models](https://ai.google.dev/gemini-api/docs/models)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API — Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
