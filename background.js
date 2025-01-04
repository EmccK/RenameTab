// background.js

// 从 storage 加载重命名规则
async function loadRenameRules() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['renameRules'], function(result) {
      const rules = result.renameRules || [];
      console.log("已加载重命名规则:", rules);
      resolve(rules);
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

// 设置标签页标题并监控变化的函数
function setupTitleObserver(desiredTitle) {
  // 如果已经有观察者，先断开连接
  if (window._titleObserver) {
    window._titleObserver.disconnect();
  }

  // 设置初始标题
  document.title = desiredTitle;

  // 创建新的观察者
  window._titleObserver = new MutationObserver(function(mutations) {
    const currentTitle = document.title;
    if (currentTitle !== desiredTitle) {
      document.title = desiredTitle;
    }
  });

  // 开始观察标题变化
  window._titleObserver.observe(
    document.querySelector('title') || document.head || document.documentElement,
    {
      subtree: true,
      childList: true,
      characterData: true
    }
  );

  // 存储期望的标题，用于页面重新加载时恢复
  window._desiredTitle = desiredTitle;
}

// 应用重命名规则
async function applyRenameRules(tab) {
  // 首先检查是否有存储的标题
  const storedTitle = await getStoredTabTitle(tab.id);
  if (storedTitle) {
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: setupTitleObserver,
      args: [storedTitle]
    });
    return;
  }

  const rules = await loadRenameRules();
  if (rules && tab.url) {
    for (const rule of rules) {
      if (rule.matchType === 'regex') {
        const regex = new RegExp(rule.urlPattern);
        if (regex.test(tab.url)) {
          const newTitle = rule.newTitle.replace('${title}', tab.title);
          chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: setupTitleObserver,
            args: [newTitle]
          });
          await saveTabTitle(tab.id, newTitle);
          console.log(`标签页 ${tab.id} 重命名为: ${newTitle} (Regex)`);
          return;
        }
      } else if (rule.matchType === 'host') {
        try {
          const url = new URL(tab.url);
          if (url.hostname === rule.urlPattern) {
            const newTitle = rule.newTitle.replace('${title}', tab.title);
            chrome.scripting.executeScript({
              target: {tabId: tab.id},
              function: setupTitleObserver,
              args: [newTitle]
            });
            await saveTabTitle(tab.id, newTitle);
            console.log(`标签页 ${tab.id} 重命名为: ${newTitle} (Host)`);
            return;
          }
        } catch (e) {
          console.error("解析 URL 失败:", tab.url, e);
        }
      }
    }
  }
}

// 清理已关闭标签页的存储数据
function cleanupTabStorage(tabId) {
  const key = `tab_title_${tabId}`;
  chrome.storage.local.remove(key);
}

// 监听标签页创建事件
chrome.tabs.onCreated.addListener(function(tab) {
  console.log("标签页已创建:", tab);
  setTimeout(() => applyRenameRules(tab), 500); // 添加延迟确保页面加载
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    console.log("标签页已更新:", tab);
    setTimeout(() => applyRenameRules(tab), 500); // 添加延迟确保页面加载
  }
});

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener(function(tabId) {
  cleanupTabStorage(tabId);
});

// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "renameTab") {
      console.log("收到重命名消息:", request);
      chrome.scripting.executeScript({
        target: {tabId: request.tabId},
        function: setupTitleObserver,
        args: [request.newTitle]
      }, async () => {
        if (chrome.runtime.lastError) {
          console.error("重命名操作失败:", chrome.runtime.lastError);
        } else {
          await saveTabTitle(request.tabId, request.newTitle);
          console.log(`标签页 ${request.tabId} 重命名为: ${request.newTitle}`);
        }
      });
    } else if (request.action === "deleteRule") {
      const indexToDelete = request.index;
      loadRenameRules().then(rules => {
        if (indexToDelete >= 0 && indexToDelete < rules.length) {
          rules.splice(indexToDelete, 1);
          chrome.storage.sync.set({ renameRules: rules }, () => {
            console.log("规则已删除，索引:", indexToDelete);
          });
        }
      });
    }
  }
);

// 在扩展程序安装或更新时加载规则
chrome.runtime.onInstalled.addListener(function() {
  loadRenameRules();
});