document.addEventListener('DOMContentLoaded', function() {
  // DOM 元素引用
  const elements = {
    renameTabDiv: document.getElementById('renameTabDiv'),
    renameRulesDiv: document.getElementById('renameRulesDiv'),
    newTabTitleInput: document.getElementById('newTabTitle'),
    renameTabButton: document.getElementById('renameTab'),
    autoAddHostRuleCheckbox: document.getElementById('autoAddHostRule'),
    newRuleNameInput: document.getElementById('newRuleName'),
    newRuleMatchType: document.getElementById('newRuleMatchType'),
    newRuleUrlPatternInput: document.getElementById('newRuleUrlPattern'),
    newRuleNewTitleInput: document.getElementById('newRuleNewTitle'),
    addRuleButton: document.getElementById('addRuleButton'),
    rulesListDiv: document.getElementById('rulesList'),
    editRuleDiv: document.getElementById('editRuleDiv'),
    editRuleIndexInput: document.getElementById('editRuleIndex'),
    editRuleNameInput: document.getElementById('editRuleName'),
    editRuleMatchTypeSelect: document.getElementById('editRuleMatchType'),
    editRuleUrlPatternInput: document.getElementById('editRuleUrlPattern'),
    editRuleNewTitleInput: document.getElementById('editRuleNewTitle'),
    saveRuleButton: document.getElementById('saveRuleButton'),
    cancelEditButton: document.getElementById('cancelEditButton')
  };

  const rulesTableBody = elements.rulesListDiv.querySelector('tbody');
  const noRulesMessage = elements.rulesListDiv.querySelector('p');

  // Storage 操作
  async function getRenameRules() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['renameRules'], (result) => {
        resolve(result.renameRules || []);
      });
    });
  }

  async function saveRenameRules(rules) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ renameRules: rules }, () => resolve(true));
    });
  }

  // 验证正则表达式
  function isValidRegex(pattern) {
    try {
      new RegExp(pattern);
      return true;
    } catch (e) {
      return false;
    }
  }

  // 显示提示信息
  function showMessage(message, isError = false) {
    alert(message);
  }

  // 刷新当前标签页
  function reloadCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  }

  // 填充编辑表单
  function populateEditForm(rule, index) {
    elements.editRuleIndexInput.value = index;
    elements.editRuleNameInput.value = rule.name || '';
    elements.editRuleMatchTypeSelect.value = rule.matchType;
    elements.editRuleUrlPatternInput.value = rule.urlPattern;
    elements.editRuleNewTitleInput.value = rule.newTitle;
    elements.editRuleDiv.classList.remove('hidden');
    elements.editRuleDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 创建规则行
  function createRuleRow(rule, index) {
    const row = rulesTableBody.insertRow();

    // 名称列
    const nameCell = row.insertCell();
    nameCell.textContent = rule.name || '未命名规则';
    nameCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'single-line');
    nameCell.title = rule.name || '未命名规则';

    // 匹配类型列
    const matchTypeCell = row.insertCell();
    matchTypeCell.textContent = rule.matchType === 'host' ? 'Host' : 'Regex';
    matchTypeCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'text-center', 'single-line');

    // URL模式列
    const urlPatternCell = row.insertCell();
    urlPatternCell.textContent = rule.urlPattern;
    urlPatternCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'wrap-url');

    // 新标题列
    const newTitleCell = row.insertCell();
    newTitleCell.textContent = rule.newTitle;
    newTitleCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'single-line');
    newTitleCell.title = rule.newTitle;

    // 操作列
    const actionsCell = row.insertCell();
    actionsCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'text-center', 'single-line');

    // 编辑按钮
    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'mr-1');
    editButton.addEventListener('click', () => populateEditForm(rule, index));
    actionsCell.appendChild(editButton);

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.classList.add('bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded');
    deleteButton.addEventListener('click', () => deleteRule(index, rule.name));
    actionsCell.appendChild(deleteButton);
  }

  // 删除规则（带确认）
  async function deleteRule(index, ruleName) {
    const confirmMessage = `确定要删除规则 "${ruleName || '未命名规则'}" 吗？`;
    if (!confirm(confirmMessage)) return;

    const currentRules = await getRenameRules();
    currentRules.splice(index, 1);
    const saved = await saveRenameRules(currentRules);
    if (saved) {
      displayRules();
    } else {
      showMessage('删除重命名规则失败。', true);
    }
  }

  // 显示规则列表
  async function displayRules() {
    const rules = await getRenameRules();
    rulesTableBody.innerHTML = '';

    if (rules && rules.length > 0) {
      noRulesMessage.classList.add('hidden');
      rules.forEach((rule, index) => createRuleRow(rule, index));
    } else {
      noRulesMessage.classList.remove('hidden');
    }
  }

  // 验证规则输入
  function validateRuleInput(matchType, urlPattern, newTitle) {
    if (!urlPattern || !newTitle) {
      showMessage('请填写 URL 或 Host 模式和新的标签页标题。', true);
      return false;
    }

    if (matchType === 'regex' && !isValidRegex(urlPattern)) {
      showMessage('正则表达式格式无效，请检查。', true);
      return false;
    }

    return true;
  }

  // 添加规则
  async function addRule(ruleName, matchType, urlPattern, newTitle) {
    if (!validateRuleInput(matchType, urlPattern, newTitle)) return false;

    const currentRules = await getRenameRules();
    currentRules.push({ name: ruleName, matchType, urlPattern, newTitle });
    const saved = await saveRenameRules(currentRules);

    if (saved) {
      displayRules();
      reloadCurrentTab();
      return true;
    } else {
      showMessage('保存重命名规则失败。', true);
      return false;
    }
  }

  // 初始化
  function initializePopup() {
    elements.renameTabDiv.classList.remove('hidden');
    elements.renameRulesDiv.classList.remove('hidden');
    displayRules();
  }

  initializePopup();

  // 事件监听：重命名按钮
  elements.renameTabButton.addEventListener('click', async function() {
    const newTitle = elements.newTabTitleInput.value.trim();
    if (!newTitle) {
      showMessage('请填写新的标签页标题。', true);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab) return;

      // 发送重命名消息
      chrome.runtime.sendMessage({
        action: "renameTab",
        tabId: currentTab.id,
        newTitle: newTitle
      });

      // 自动添加 Host 规则
      if (elements.autoAddHostRuleCheckbox.checked) {
        try {
          const hostname = new URL(currentTab.url).hostname;
          await addRule(newTitle, 'host', hostname, newTitle);
        } catch (e) {
          console.error("获取 hostname 失败:", e);
        }
      }

      elements.newTabTitleInput.value = '';
    });
  });

  // 事件监听：回车键重命名
  elements.newTabTitleInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      elements.renameTabButton.click();
    }
  });

  // 事件监听：添加规则按钮
  elements.addRuleButton.addEventListener('click', async function() {
    const ruleName = elements.newRuleNameInput.value.trim();
    const matchType = elements.newRuleMatchType.value;
    const urlPattern = elements.newRuleUrlPatternInput.value.trim();
    const newTitle = elements.newRuleNewTitleInput.value.trim();

    const success = await addRule(ruleName, matchType, urlPattern, newTitle);
    if (success) {
      // 清空输入框
      elements.newRuleNameInput.value = '';
      elements.newRuleMatchType.value = 'host';
      elements.newRuleUrlPatternInput.value = '';
      elements.newRuleNewTitleInput.value = '';
    }
  });

  // 事件监听：保存编辑按钮
  elements.saveRuleButton.addEventListener('click', async function() {
    const index = parseInt(elements.editRuleIndexInput.value);
    const ruleName = elements.editRuleNameInput.value.trim();
    const matchType = elements.editRuleMatchTypeSelect.value;
    const urlPattern = elements.editRuleUrlPatternInput.value.trim();
    const newTitle = elements.editRuleNewTitleInput.value.trim();

    if (!validateRuleInput(matchType, urlPattern, newTitle)) return;

    const currentRules = await getRenameRules();
    if (isNaN(index) || index < 0 || index >= currentRules.length) {
      showMessage('无效的规则索引。', true);
      return;
    }

    currentRules[index] = { name: ruleName, matchType, urlPattern, newTitle };
    const saved = await saveRenameRules(currentRules);

    if (saved) {
      elements.editRuleDiv.classList.add('hidden');
      displayRules();
      reloadCurrentTab();
    } else {
      showMessage('保存重命名规则失败。', true);
    }
  });

  // 事件监听：取消编辑按钮
  elements.cancelEditButton.addEventListener('click', function() {
    elements.editRuleDiv.classList.add('hidden');
  });
});
