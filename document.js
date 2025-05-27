document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings
  const stored = await chrome.storage.sync.get('userSettings');
  const settings = stored.userSettings || {
    enabled: true,
    frequency: 30,
    showOnDomains: 'all'
  };
  
  // Populate form
  document.getElementById('enabled').checked = settings.enabled;
  document.getElementById('frequency').value = settings.frequency;
  document.getElementById('domains').value = settings.showOnDomains;
  
  // Save settings on change
  document.getElementById('enabled').addEventListener('change', saveSettings);
  document.getElementById('frequency').addEventListener('change', saveSettings);
  document.getElementById('domains').addEventListener('change', saveSettings);
  
  // Test notification
  document.getElementById('test').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'testNotification' });
    window.close();
  });
  
  // Open options
  document.getElementById('options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});

async function saveSettings() {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    frequency: parseInt(document.getElementById('frequency').value),
    showOnDomains: document.getElementById('domains').value
  };
  
  await chrome.storage.sync.set({ userSettings: settings });
  chrome.runtime.sendMessage({ action: 'updateSettings', settings });
}