document.addEventListener('DOMContentLoaded', function() {
  const renameTabDiv = document.getElementById('renameTabDiv');
  const renameRulesDiv = document.getElementById('renameRulesDiv');
  const newTabTitleInput = document.getElementById('newTabTitle');
  const renameTabButton = document.getElementById('renameTab');
  const autoAddHostRuleCheckbox = document.getElementById('autoAddHostRule');

  const newRuleNameInput = document.getElementById('newRuleName');
  const newRuleMatchType = document.getElementById('newRuleMatchType');
  const newRuleUrlPatternInput = document.getElementById('newRuleUrlPattern');
  const newRuleNewTitleInput = document.getElementById('newRuleNewTitle');
  const addRuleButton = document.getElementById('addRuleButton');
  const rulesListDiv = document.getElementById('rulesList');
  const rulesTableBody = rulesListDiv.querySelector('tbody');
  const noRulesMessage = rulesListDiv.querySelector('p');

  const editRuleDiv = document.getElementById('editRuleDiv');
  const editRuleIndexInput = document.getElementById('editRuleIndex');
  const editRuleNameInput = document.getElementById('editRuleName');
  const editRuleMatchTypeSelect = document.getElementById('editRuleMatchType');
  const editRuleUrlPatternInput = document.getElementById('editRuleUrlPattern');
  const editRuleNewTitleInput = document.getElementById('editRuleNewTitle');
  const saveRuleButton = document.getElementById('saveRuleButton');
  const cancelEditButton = document.getElementById('cancelEditButton');

  async function getRenameRules() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['renameRules'], function(result) {
        resolve(result.renameRules || []);
      });
    });
  }

  async function saveRenameRules(rules) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ renameRules: rules }, function() {
        resolve(true);
      });
    });
  }

  function populateEditForm(rule, index) {
    editRuleIndexInput.value = index;
    editRuleNameInput.value = rule.name;
    editRuleMatchTypeSelect.value = rule.matchType;
    editRuleUrlPatternInput.value = rule.urlPattern;
    editRuleNewTitleInput.value = rule.newTitle;
    editRuleDiv.classList.remove('hidden');
    editRuleDiv.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll to the edit form
  }

  async function displayRules() {
    const rules = await getRenameRules();
    rulesTableBody.innerHTML = '';
    if (rules && rules.length > 0) {
      noRulesMessage.classList.add('hidden');
      rules.forEach((rule, index) => {
        const row = rulesTableBody.insertRow();
        const nameCell = row.insertCell();
        const matchTypeCell = row.insertCell();
        const urlPatternCell = row.insertCell();
        const newTitleCell = row.insertCell();
        const actionsCell = row.insertCell();

        // 名称列
        nameCell.textContent = rule.name ? rule.name : '未命名规则';
        nameCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'single-line');
        nameCell.title = rule.name ? rule.name : '未命名规则';

        // 匹配类型列
        matchTypeCell.textContent = rule.matchType === 'host' ? 'Host' : 'Regex';
        matchTypeCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'text-center', 'single-line');

        // URL模式列 - 允许换行
        urlPatternCell.textContent = rule.urlPattern;
        urlPatternCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'wrap-url');

        // 新标题列
        newTitleCell.textContent = rule.newTitle;
        newTitleCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'single-line');
        newTitleCell.title = rule.newTitle;

        // 操作列
        actionsCell.classList.add('px-5', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'text-center', 'single-line');
        const editButton = document.createElement('button');
        editButton.textContent = '编辑';
        editButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'mr-1');
        editButton.addEventListener('click', () => {
          populateEditForm(rule, index);
        });
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.classList.add('bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded');
        deleteButton.addEventListener('click', async () => {
          const currentRules = await getRenameRules();
          currentRules.splice(index, 1);
          const saved = await saveRenameRules(currentRules);
          if (saved) {
            displayRules();
          } else {
            alert('删除重命名规则失败。');
          }
        });
        actionsCell.appendChild(deleteButton);
      });
    } else {
      noRulesMessage.classList.remove('hidden');
    }
  }

  async function initializePopup() {
    renameTabDiv.classList.remove('hidden');
    renameRulesDiv.classList.remove('hidden');
    displayRules();
  }

  initializePopup();

  renameTabButton.addEventListener('click', async function() {
    const newTitle = newTabTitleInput.value;
    if (!newTitle) {
      alert('请填写新的标签页标题。');
      return;
    }
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
      const currentTab = tabs[0];
      if (currentTab) {
        const message = {
          action: "renameTab",
          tabId: currentTab.id,
          newTitle: newTitle
        };
        console.log("发送重命名消息:", message);
        chrome.runtime.sendMessage(message);

        if (autoAddHostRuleCheckbox.checked) {
          const ruleName = newTitle;
          const matchType = 'host';
          const urlPattern = (new URL(currentTab.url)).hostname;
          const newTitlePattern = newTitle;

          const currentRules = await getRenameRules();
          currentRules.push({ name: ruleName, matchType: matchType, urlPattern: urlPattern, newTitle: newTitlePattern });
          const saved = await saveRenameRules(currentRules);
          if (saved) {
            displayRules();
          } else {
            alert('保存重命名规则失败。');
          }
        }

        newTabTitleInput.value = '';
      }
    });
  });

  newTabTitleInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
      renameTabButton.click();
    }
  });

  addRuleButton.addEventListener('click', async function() {
    const ruleName = newRuleNameInput.value;
    const matchType = newRuleMatchType.value;
    const urlPattern = newRuleUrlPatternInput.value;
    const newTitle = newRuleNewTitleInput.value;

    if (urlPattern && newTitle) {
      const currentRules = await getRenameRules();
      currentRules.push({ name: ruleName, matchType: matchType, urlPattern: urlPattern, newTitle: newTitle });
      const saved = await saveRenameRules(currentRules);
      if (saved) {
        newRuleNameInput.value = '';
        newRuleMatchType.value = 'regex';
        newRuleUrlPatternInput.value = '';
        newRuleNewTitleInput.value = '';
        displayRules();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      } else {
        alert('保存重命名规则失败。');
      }
    } else {
      alert('请填写 URL 或 Host 模式和新的标签页标题。');
    }
  });

  saveRuleButton.addEventListener('click', async function() {
    const index = parseInt(editRuleIndexInput.value);
    const ruleName = editRuleNameInput.value;
    const matchType = editRuleMatchTypeSelect.value;
    const urlPattern = editRuleUrlPatternInput.value;
    const newTitle = editRuleNewTitleInput.value;

    if (!isNaN(index) && urlPattern && newTitle) {
      const currentRules = await getRenameRules();
      if (index >= 0 && index < currentRules.length) {
        currentRules[index] = { name: ruleName, matchType: matchType, urlPattern: urlPattern, newTitle: newTitle };
        const saved = await saveRenameRules(currentRules);
        if (saved) {
          editRuleDiv.classList.add('hidden');
          displayRules();
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              chrome.tabs.reload(tabs[0].id);
            }
          });
        } else {
          alert('保存重命名规则失败。');
        }
      } else {
        alert('无效的规则索引。');
      }
    } else {
      alert('请填写 URL 或 Host 模式和新的标签页标题。');
    }
  });

  cancelEditButton.addEventListener('click', function() {
    editRuleDiv.classList.add('hidden');
  });
});