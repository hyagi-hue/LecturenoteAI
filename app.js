/**
 * 講義音声ノートAI — メインアプリケーションロジック
 * Phase 3: API接続 & 文字起こし実装
 */

// ============================================================
// Constants
// ============================================================
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = [
  'audio/wav', 'audio/x-wav',
  'audio/mp3', 'audio/mpeg',
  'audio/aiff', 'audio/x-aiff',
  'audio/aac', 'audio/x-aac',
  'audio/ogg',
  'audio/flac', 'audio/x-flac',
  'audio/mp4', 'audio/x-m4a',
];
const STORAGE_KEY = 'gemini_api_key';
const GEMINI_MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ============================================================
// State
// ============================================================
const state = {
  selectedFile: null,
  currentTab: 'transcript',
  isProcessing: false,
  result: null, // { transcript, summary, keypoints, category }
  lectureDate: '',
  sessionNumber: '',
};

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  updateApiKeyStatus();
  setupDragAndDrop();

  // Attach settings button listener
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  // Set default date to today
  const dateInput = document.getElementById('input-date');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Auto-show settings if no API key
  if (!getApiKey()) {
    setTimeout(() => openSettings(), 600);
  }
});

// ============================================================
// Gemini API Module
// ============================================================

/**
 * ステップ①: テキストでの開通確認（Hello World）
 * ブラウザのコンソールから testApiConnection() で実行可能。
 * 設定画面の「接続テスト」ボタンからも呼び出される。
 */
async function testApiConnection() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[API Test] APIキーが未設定です');
    showError('APIキーが設定されていません。');
    return;
  }

  console.log('[API Test] 開通確認を開始...');
  console.log(`[API Test] モデル: ${GEMINI_MODEL}`);

  try {
    const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const body = {
      contents: [{
        parts: [{ text: 'こんにちは。「API接続成功」と返答してください。' }]
      }]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = handleApiError(res.status, errData);
      console.error(`[API Test] 失敗 (HTTP ${res.status}):`, msg);
      showError(msg);
      return;
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '(空の応答)';
    console.log('[API Test] ✅ 成功！応答:', reply);
    showToast(`API接続成功 ✅: ${reply.slice(0, 50)}`);
    return reply;
  } catch (err) {
    console.error('[API Test] ネットワークエラー:', err);
    showError('通信エラーが発生しました。インターネット接続を確認してください。');
  }
}

/**
 * ステップ②: 音声ファイルを Base64 で送信し文字起こしを取得
 */
async function sendAudioToGemini(file) {
  const apiKey = getApiKey();
  const url = `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // ファイルを Base64 に変換
  const base64Data = await fileToBase64(file);

  // MIME タイプの決定（file.type が空の場合は拡張子から推定）
  const mimeType = file.type || guessMimeType(file.name);

  // Gather contextual metadata for the prompt
  const lectureName = document.getElementById('input-lecture-name').value.trim();
  const lectureDate = document.getElementById('input-date').value;
  const sessionNumber = document.getElementById('input-session').value.trim();

  const contextLines = [];
  if (lectureName) contextLines.push(`講義名: ${lectureName}`);
  if (lectureDate) contextLines.push(`日付: ${lectureDate}`);
  if (sessionNumber) contextLines.push(`回数: ${sessionNumber}`);
  const contextBlock = contextLines.length > 0
    ? `\n\n以下は講義のメタ情報です。要約に自然に組み込んでください：\n${contextLines.join('\n')}\n`
    : '';

  const body = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          }
        },
        {
          text: [
            'あなたは大学の講義音声を処理する優秀なアシスタントです。',
            '以下の音声を分析し、次の4つの項目をJSON形式で出力してください。',
            contextBlock,
            '1. "transcript": 音声の全文文字起こし。フィラー（えー、あのー等）は除去し、適切に句読点を付けてください。',
            '2. "summary": 講義内容の要約（300〜500字程度）。段落分けして読みやすくしてください。',
            '3. "keypoints": 講義の要点を箇条書きリスト（5〜10項目）。各項目は1〜2文で簡潔に記述してください。',
            '4. "category": 音声の内容を分析し、以下の6つのカテゴリーから最も適切なものを1つだけ選んでください：',
            '   - "ゼミ" : ゼミや研究室でのディスカッション、発表、指導に関する内容',
            '   - "研究" : 研究活動、論文、実験、学術的な議論に関する内容',
            '   - "授業" : 大学の講義、授業、教科に関する内容',
            '   - "就活" : 就職活動、面接対策、企業説明会に関する内容',
            '   - "インターン" : インターンシップ、職業体験に関する内容',
            '   - "私生活" : 上記に当てはまらない日常生活やプライベートな内容',
            '',
            '出力は以下のJSON形式のみで返してください：',
            '{"transcript": "...", "summary": "...", "keypoints": ["...", "..."], "category": "..."}',
          ].join('\n')
        }
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(handleApiError(res.status, errData));
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('AIから空の応答が返されました。音声ファイルを確認してください。');
  }

  // JSON パース
  try {
    const parsed = JSON.parse(rawText);
    const validCategories = ['ゼミ', '研究', '授業', '就活', 'インターン', '私生活'];
    const category = validCategories.includes(parsed.category) ? parsed.category : '授業';
    return {
      transcript: parsed.transcript || '(文字起こしなし)',
      summary: parsed.summary || '(要約なし)',
      keypoints: Array.isArray(parsed.keypoints) ? parsed.keypoints : ['(要点なし)'],
      category: category,
    };
  } catch (e) {
    // JSON パースに失敗した場合、テキスト全体を transcript として扱う
    console.warn('[API] JSONパース失敗。テキストをそのまま使用:', e);
    return {
      transcript: rawText,
      summary: '(要約の生成に失敗しました。再度お試しください)',
      keypoints: ['(要点の抽出に失敗しました。再度お試しください)'],
      category: '授業',
    };
  }
}

/**
 * API エラーのステータスコード別メッセージ生成
 */
function handleApiError(status, errData) {
  const detail = errData?.error?.message || '';
  switch (status) {
    case 400:
      return `リクエストに問題がありました。音声ファイルが破損していないか確認してください。\n(${detail})`;
    case 401:
    case 403:
      return 'APIキーが無効です。設定画面で正しいキーを再入力してください。';
    case 404:
      return `モデル "${GEMINI_MODEL}" が見つかりません。モデル名を確認してください。\n(${detail})`;
    case 429:
      return `APIの利用制限に達しました。しばらく時間をおいてから再試行してください。\n(${detail || 'Rate limit exceeded'})`;
    case 500:
    case 503:
      return 'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。';
    default:
      return `APIエラーが発生しました (HTTP ${status})。\n${detail}`;
  }
}

/**
 * File → Base64 文字列（data: プレフィックスなし）
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // "data:audio/mp3;base64,XXXX" → "XXXX"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });
}

/**
 * 拡張子から MIME タイプを推定
 */
function guessMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    wav: 'audio/wav', mp3: 'audio/mp3', aiff: 'audio/aiff',
    aac: 'audio/aac', m4a: 'audio/mp4', ogg: 'audio/ogg', flac: 'audio/flac',
  };
  return map[ext] || 'audio/mpeg';
}

// ============================================================
// API Key Management
// ============================================================
function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function saveApiKey() {
  const input = document.getElementById('input-api-key');
  const key = input.value.trim();
  if (!key) {
    showError('APIキーを入力してください。');
    return;
  }
  localStorage.setItem(STORAGE_KEY, key);
  input.value = '';
  updateApiKeyStatus();
  showToast('APIキーを保存しました ✅');
}

function deleteApiKey() {
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById('input-api-key').value = '';
  updateApiKeyStatus();
  showToast('APIキーを削除しました');
}

function updateApiKeyStatus() {
  const statusEl = document.getElementById('api-key-status');
  const hasKey = !!getApiKey();
  statusEl.innerHTML = hasKey
    ? '<span class="w-2 h-2 rounded-full bg-green-400"></span><span class="text-xs text-green-600">APIキー設定済み</span>'
    : '<span class="w-2 h-2 rounded-full bg-gray-300"></span><span class="text-xs text-gray-400">未設定</span>';
}

function toggleKeyVisibility() {
  const input = document.getElementById('input-api-key');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  document.getElementById('icon-eye').textContent = isPassword ? '🙈' : '👁';
}

// ============================================================
// Settings Modal
// ============================================================
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ============================================================
// File Handling
// ============================================================
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(wav|mp3|aiff|aac|m4a|ogg|flac)$/i)) {
    showError('対応していないファイル形式です。WAV, MP3, AAC, OGG, FLAC, AIFF のいずれかを選択してください。');
    event.target.value = '';
    return;
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    showError(`ファイルサイズが大きすぎます（${sizeMB}MB）。上限は15MBです。音声を圧縮するか、短い音声ファイルをお試しください。`);
    event.target.value = '';
    return;
  }

  state.selectedFile = file;
  showFileInfo(file);
  updateExecuteButton();
}

function showFileInfo(file) {
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-info').textContent = `${sizeMB} MB · ${file.type || '不明'}`;
  document.getElementById('file-empty-state').classList.add('hidden');
  document.getElementById('file-selected-state').classList.remove('hidden');
}

function clearFile(event) {
  event.stopPropagation();
  state.selectedFile = null;
  document.getElementById('input-audio-file').value = '';
  document.getElementById('file-empty-state').classList.remove('hidden');
  document.getElementById('file-selected-state').classList.add('hidden');
  updateExecuteButton();
}

function setupDragAndDrop() {
  const zone = document.getElementById('file-drop-zone');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('input-audio-file');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileSelect({ target: input });
    }
  });
}

// ============================================================
// Execute Button
// ============================================================
function updateExecuteButton() {
  const btn = document.getElementById('btn-execute');
  btn.disabled = !state.selectedFile;
}

function handleExecute() {
  // Validation
  if (!getApiKey()) {
    showError('APIキーが設定されていません。設定画面からキーを入力してください。');
    openSettings();
    return;
  }
  if (!state.selectedFile) {
    showError('音声ファイルを選択してください。');
    return;
  }
  // Re-check file size before sending
  if (state.selectedFile.size > MAX_FILE_SIZE) {
    showError('ファイルサイズが15MBを超えています。');
    return;
  }

  startProcessing();
}

// ============================================================
// Processing — Real API Call
// ============================================================
async function startProcessing() {
  state.isProcessing = true;
  const statusEl = document.getElementById('processing-status');

  // Disable inputs
  document.getElementById('btn-execute').disabled = true;
  document.getElementById('input-lecture-name').disabled = true;
  document.getElementById('input-date').disabled = true;
  document.getElementById('input-session').disabled = true;

  // Hide results, show processing
  document.getElementById('results-section').classList.add('hidden');
  document.getElementById('processing-section').classList.remove('hidden');

  try {
    // Step 1: Read file
    statusEl.textContent = '音声ファイルを読み込み中...';

    // Step 2: Send to API (status updates inside sendAudioToGemini would be complex,
    // so we update right before the fetch)
    statusEl.textContent = 'Gemini API に送信中...（音声の長さにより数十秒かかることがあります）';

    const result = await sendAudioToGemini(state.selectedFile);

    // Step 3: Process result
    statusEl.textContent = '応答を処理中...';

    finishProcessing(result);

  } catch (err) {
    console.error('[Processing] エラー:', err);
    // Hide processing spinner
    document.getElementById('processing-section').classList.add('hidden');
    showError(err.message || '処理中にエラーが発生しました。');

    // Re-enable inputs
    state.isProcessing = false;
    document.getElementById('btn-execute').disabled = false;
    document.getElementById('input-lecture-name').disabled = false;
    document.getElementById('input-date').disabled = false;
    document.getElementById('input-session').disabled = false;
    updateExecuteButton();
  }
}

function finishProcessing(result) {
  state.isProcessing = false;
  state.result = result;

  // Capture metadata from inputs
  const lectureName = document.getElementById('input-lecture-name').value.trim();
  const lectureDate = document.getElementById('input-date').value;
  const sessionNumber = document.getElementById('input-session').value.trim();
  state.lectureDate = lectureDate;
  state.sessionNumber = sessionNumber;

  // Re-enable inputs
  document.getElementById('btn-execute').disabled = false;
  document.getElementById('input-lecture-name').disabled = false;
  document.getElementById('input-date').disabled = false;
  document.getElementById('input-session').disabled = false;
  updateExecuteButton();

  // Hide processing, show results
  document.getElementById('processing-section').classList.add('hidden');

  // Populate result content
  document.getElementById('text-transcript').textContent = result.transcript;
  document.getElementById('text-summary').textContent = result.summary;

  // Display category badge
  const categoryBadge = document.getElementById('category-badge');
  if (categoryBadge) {
    const catInfo = getCategoryInfo(result.category);
    categoryBadge.textContent = catInfo.label;
    categoryBadge.className = `category-badge ${catInfo.className}`;
    categoryBadge.classList.remove('hidden');
  }

  // Display metadata (Date, Session, Lecture)
  const metadataEl = document.getElementById('result-metadata');
  if (metadataEl) {
    const metaDate = document.getElementById('meta-date');
    const metaSession = document.getElementById('meta-session');
    const metaLecture = document.getElementById('meta-lecture');

    // Date — format as YYYY/MM/DD for display
    if (lectureDate) {
      metaDate.querySelector('.meta-value').textContent = lectureDate.replace(/-/g, '/');
      metaDate.classList.remove('hidden');
    } else {
      metaDate.classList.add('hidden');
    }

    // Session number
    if (sessionNumber) {
      metaSession.querySelector('.meta-value').textContent = sessionNumber;
      metaSession.classList.remove('hidden');
    } else {
      metaSession.classList.add('hidden');
    }

    // Lecture name
    if (lectureName) {
      metaLecture.querySelector('.meta-value').textContent = lectureName;
      metaLecture.classList.remove('hidden');
    } else {
      metaLecture.classList.add('hidden');
    }

    metadataEl.classList.remove('hidden');
  }

  const keypointsList = document.getElementById('text-keypoints');
  keypointsList.innerHTML = result.keypoints
    .map(kp => `<li class="text-sm text-gray-600 flex gap-2"><span class="text-primary-500 mt-0.5">●</span><span>${escapeHtml(kp)}</span></li>`)
    .join('');

  // Save to sessionStorage (now includes date & session)
  try {
    sessionStorage.setItem('last_result', JSON.stringify({
      lectureName: lectureName,
      lectureDate: lectureDate,
      sessionNumber: sessionNumber,
      fileName: state.selectedFile?.name || '',
      timestamp: new Date().toISOString(),
      ...result,
    }));
  } catch (e) { /* ignore quota errors */ }

  // Show results with animation
  const resultsEl = document.getElementById('results-section');
  resultsEl.classList.remove('hidden');
  resultsEl.classList.add('animate-fade-in-up');

  switchTab('transcript');
}

// ============================================================
// Tab Switching
// ============================================================
function switchTab(tab) {
  state.currentTab = tab;
  const tabs = ['transcript', 'summary', 'keypoints'];

  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab-${t}`);
    const content = document.getElementById(`content-${t}`);

    if (t === tab) {
      tabBtn.classList.add('tab-active');
      tabBtn.setAttribute('aria-selected', 'true');
      content.classList.remove('hidden');
    } else {
      tabBtn.classList.remove('tab-active');
      tabBtn.setAttribute('aria-selected', 'false');
      content.classList.add('hidden');
    }
  });
}

// ============================================================
// Copy & Download
// ============================================================
function copyCurrentTab() {
  if (!state.result) return;

  let text = '';
  switch (state.currentTab) {
    case 'transcript': text = state.result.transcript; break;
    case 'summary': text = state.result.summary; break;
    case 'keypoints': text = state.result.keypoints.join('\n'); break;
  }

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ コピーしました';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  }).catch(() => {
    showError('コピーに失敗しました。ブラウザの権限を確認してください。');
  });
}

function downloadNote() {
  if (!state.result) return;

  const lectureName = document.getElementById('input-lecture-name').value.trim();
  const lectureDate = state.lectureDate || '';
  const sessionNumber = state.sessionNumber || '';
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

  const displayName = lectureName || '未設定';
  const displayDate = lectureDate ? lectureDate.replace(/-/g, '/') : '未設定';
  const displaySession = sessionNumber || '未設定';
  const fileName = lectureName
    ? `${lectureName}_${(lectureDate || dateStr).replace(/-/g,'')}.txt`
    : `ノート_${(lectureDate || dateStr).replace(/-/g,'')}_${timeStr}.txt`;

  const categoryLabel = state.result.category || '未分類';

  const content = [
    '========================================',
    '講義音声ノート',
    '========================================',
    `講義名: ${displayName}`,
    `日付: ${displayDate} | 回数: ${displaySession}`,
    `カテゴリー: ${categoryLabel}`,
    `作成日時: ${dateStr} ${timeStr.slice(0,2)}:${timeStr.slice(2)}`,
    `音声ファイル: ${state.selectedFile?.name || '不明'}`,
    '========================================',
    '',
    '【全文文字起こし】',
    state.result.transcript,
    '',
    '----------------------------------------',
    '',
    '【要約】',
    state.result.summary,
    '',
    '----------------------------------------',
    '',
    '【要点】',
    ...state.result.keypoints.map(kp => `・${kp}`),
    '',
    '========================================',
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('ダウンロードを開始しました 📥');
}

// ============================================================
// Error / Toast
// ============================================================
function showError(message) {
  const toast = document.getElementById('error-toast');
  document.getElementById('error-message').textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => hideError(), 6000);
}

function hideError() {
  document.getElementById('error-toast').classList.add('hidden');
}

function showToast(message) {
  // Reuse error toast with success styling
  const toast = document.getElementById('error-toast');
  const inner = toast.querySelector('div');
  inner.className = 'bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 shadow-lg toast';
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-message').className = 'text-sm text-green-700 flex-1';
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
    // Reset to error style
    inner.className = 'bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-lg toast';
    document.getElementById('error-message').className = 'text-sm text-red-700 flex-1';
  }, 2500);
}

// ============================================================
// Utilities
// ============================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * カテゴリーの表示情報（ラベルとCSSクラス）を返す
 */
function getCategoryInfo(category) {
  const map = {
    'ゼミ':       { label: '📖 ゼミ',       className: 'cat-seminar' },
    '研究':       { label: '🔬 研究',       className: 'cat-research' },
    '授業':       { label: '🏫 授業',       className: 'cat-class' },
    '就活':       { label: '💼 就活',       className: 'cat-jobhunt' },
    'インターン': { label: '🧑‍💻 インターン', className: 'cat-intern' },
    '私生活':     { label: '🌿 私生活',     className: 'cat-private' },
  };
  return map[category] || { label: `🏷️ ${category}`, className: 'cat-default' };
}
