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

        nameCell.textContent = rule.name ? rule.name : '未命名规则';
        nameCell.classList.add('px-5', 'py-3', 'border-b', 'border-gray-200', 'bg-white', 'text-sm');
        matchTypeCell.textContent = rule.matchType === 'host' ? 'Host' : 'Regex';
        matchTypeCell.classList.add('px-5', 'py-3', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'text-center');
        urlPatternCell.textContent = rule.urlPattern;
        urlPatternCell.classList.add('px-5', 'py-3', 'border-b', 'border-gray-200', 'bg-white', 'text-sm');
        newTitleCell.textContent = rule.newTitle;
        newTitleCell.classList.add('px-5', 'py-3', 'border-b', 'border-gray-200', 'bg-white', 'text-sm');
        actionsCell.classList.add('px-5', 'py-3', 'border-b', 'border-gray-200', 'bg-white', 'text-sm', 'text-center');

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
          // Save the manual rename as a new rule
          const ruleName = newTitle; // 使用新的标签页标题作为规则名
          const matchType = 'host';
          const urlPattern = (new URL(currentTab.url)).hostname;
          const newTitlePattern = newTitle;

          const currentRules = await getRenameRules();
          currentRules.push({ name: ruleName, matchType: matchType, urlPattern: urlPattern, newTitle: newTitlePattern });
          const saved = await saveRenameRules(currentRules);
          if (saved) {
            // Re-display the updated rules
            displayRules();
          } else {
            alert('保存重命名规则失败。');
          }
        }

        // Clear the input field
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
        // Refresh current tab to apply the new rule
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
});