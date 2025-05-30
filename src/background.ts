// 記事抽出状態を管理する変数
let isArticleExtracted = false;

// コンテキストメニューの作成
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// コンテキストメニューの作成関数
function createContextMenu() {
  // 既存のメニューを削除
  chrome.contextMenus.removeAll();

  if (isArticleExtracted) {
    // 記事が抽出できた場合のメニュー
    chrome.contextMenus.create({
      id: 'chatgpt',
      title: 'ChatGPT',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'gemini',
      title: 'Gemini',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'claude',
      title: 'Claude',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'grok',
      title: 'Grok',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'deepseek',
      title: 'Deepseek',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'divider1',
      type: 'separator',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'settings',
      title: 'Settings',
      contexts: ['page'],
    });
  } else {
    // 記事が抽出できなかった場合のメニュー
    chrome.contextMenus.create({
      id: 'not-available',
      title: 'Not Available',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'divider2',
      type: 'separator',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'settings',
      title: 'Settings',
      contexts: ['page'],
    });
  }
}

// コンテキストメニューのクリックイベントハンドラ
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case 'chatgpt':
      // ChatGPTでの要約処理
      break;
    case 'gemini':
      // Geminiでの要約処理
      break;
    case 'claude':
      // Claudeでの要約処理
      break;
    case 'grok':
      // Grokでの要約処理
      break;
    case 'deepseek':
      // Deepseekでの要約処理
      break;
    case 'settings':
      // 設定画面を開く
      chrome.runtime.openOptionsPage();
      break;
  }
});

// 記事抽出状態を更新する関数
export function updateArticleExtractionState(extracted: boolean) {
  isArticleExtracted = extracted;
  createContextMenu();
}

updateArticleExtractionState(true);
