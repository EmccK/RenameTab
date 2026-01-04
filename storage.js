// storage.js - 共享的存储操作模块

// 从 storage 加载重命名规则
async function loadRenameRules() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['renameRules'], function(result) {
      resolve(result.renameRules || []);
    });
  });
}

// 保存重命名规则
async function saveRenameRules(rules) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ renameRules: rules }, function() {
      resolve(true);
    });
  });
}

// 存储已重命名的标签页标题
async function saveTabTitle(tabId, title) {
  const key = `tab_title_${tabId}`;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: title }, function() {
      resolve(true);
    });
  });
}

// 获取已存储的标签页标题
async function getStoredTabTitle(tabId) {
  const key = `tab_title_${tabId}`;
  return new Promise((resolve) => {
    chrome.storage.local.get([key], function(result) {
      resolve(result[key]);
    });
  });
}

// 清理已关闭标签页的存储数据
function cleanupTabStorage(tabId) {
  const key = `tab_title_${tabId}`;
  chrome.storage.local.remove(key);
}

// 验证正则表达式是否有效
function isValidRegex(pattern) {
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}
