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
    rulesListDiv.innerHTML = '';
    if (rules && rules.length > 0) {
      const ul = document.createElement('ul');
      rules.forEach((rule, index) => {
        const li = document.createElement('li');
        const ruleText = document.createElement('span');
        const matchTypeLabel = rule.matchType === 'host' ? '[Host]' : '[Regex]';
        ruleText.textContent = `${rule.name ? rule.name + ': ' : ''}${matchTypeLabel} ${rule.urlPattern} => ${rule.newTitle}`;
        li.appendChild(ruleText);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.classList.add('bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2');
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
        li.appendChild(deleteButton);
        ul.appendChild(li);
      });
      rulesListDiv.appendChild(ul);
    } else {
      rulesListDiv.textContent = '没有已保存的重命名规则。';
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