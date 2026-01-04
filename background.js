// background.js

// 导入共享模块（通过 importScripts 在 service worker 中使用）
importScripts('storage.js');

// 设置标签页标题并监控变化的函数（注入到页面中执行）
function setupTitleObserver(desiredTitle) {
  // 如果已经有观察者，先断开连接
  if (window._titleObserver) {
    window._titleObserver.disconnect();
  }

  // 设置初始标题
  document.title = desiredTitle;

  // 创建新的观察者
  window._titleObserver = new MutationObserver(function(mutations) {
    if (document.title !== desiredTitle) {
      document.title = desiredTitle;
    }
  });

  // 开始观察标题变化
  const titleElement = document.querySelector('title') || document.head || document.documentElement;
  window._titleObserver.observe(titleElement, {
    subtree: true,
    childList: true,
    characterData: true
  });

  // 存储期望的标题
  window._desiredTitle = desiredTitle;
}

// 执行脚本设置标题
async function setTabTitle(tabId, title) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: setupTitleObserver,
      args: [title]
    });
    await saveTabTitle(tabId, title);
    return true;
  } catch (e) {
    console.error("设置标题失败:", e);
    return false;
  }
}

// 应用重命名规则
async function applyRenameRules(tab) {
  // 跳过无效的 URL
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  // 首先检查是否有存储的标题
  const storedTitle = await getStoredTabTitle(tab.id);
  if (storedTitle) {
    await setTabTitle(tab.id, storedTitle);
    return;
  }

  const rules = await loadRenameRules();
  if (!rules || !rules.length) return;

  for (const rule of rules) {
    let matched = false;

    if (rule.matchType === 'regex') {
      // 验证正则表达式
      if (!isValidRegex(rule.urlPattern)) continue;
      const regex = new RegExp(rule.urlPattern);
      matched = regex.test(tab.url);
    } else if (rule.matchType === 'host') {
      try {
        const url = new URL(tab.url);
        matched = url.hostname === rule.urlPattern;
      } catch (e) {
        console.error("解析 URL 失败:", tab.url, e);
        continue;
      }
    }

    if (matched) {
      const newTitle = rule.newTitle.replace('${title}', tab.title || '');
      await setTabTitle(tab.id, newTitle);
      console.log(`标签页 ${tab.id} 重命名为: ${newTitle} (${rule.matchType})`);
      return;
    }
  }
}

// 监听标签页创建事件
chrome.tabs.onCreated.addListener(function(tab) {
  // 延迟确保页面加载
  setTimeout(() => applyRenameRules(tab), 500);
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    setTimeout(() => applyRenameRules(tab), 500);
  }
});

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener(function(tabId) {
  cleanupTabStorage(tabId);
});

// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "renameTab") {
    setTabTitle(request.tabId, request.newTitle).then(success => {
      if (success) {
        console.log(`标签页 ${request.tabId} 重命名为: ${request.newTitle}`);
      }
    });
  } else if (request.action === "deleteRule") {
    // 删除规则
    loadRenameRules().then(rules => {
      if (request.index >= 0 && request.index < rules.length) {
        rules.splice(request.index, 1);
        saveRenameRules(rules).then(() => {
          console.log("规则已删除，索引:", request.index);
        });
      }
    });
  }
});

// 在扩展程序安装或更新时初始化
chrome.runtime.onInstalled.addListener(function() {
  console.log("Rename Tab 扩展已安装/更新");
});
