// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', loadSettings);

// Load settings from storage
async function loadSettings() {
  const stored = await chrome.storage.sync.get('userSettings');
  const settings = stored.userSettings || getDefaultSettings();
  
  // Populate form
  document.getElementById('enabled').checked = settings.enabled;
  document.getElementById('frequency').value = settings.frequency;
  document.getElementById('domainMode').value = settings.showOnDomains;
  document.getElementById('specificDomains').value = (settings.specificDomains || []).join('\n');
  document.getElementById('excludeDomains').value = (settings.excludeDomains || []).join('\n');
  document.getElementById('enableChatGPT').checked = settings.enableChatGPT !== false;
  document.getElementById('enableClaude').checked = settings.enableClaude !== false;
  document.getElementById('enableGemini').checked = settings.enableGemini !== false;
  document.getElementById('weatherApiKey').value = settings.weatherApiKey || '';
  document.getElementById('productHuntApiKey').value = settings.productHuntApiKey || '';
  document.getElementById('openaiApiKey').value = settings.openaiApiKey || '';
  
  // Show/hide domain sections based on mode
  toggleDomainSections();
}

// Toggle visibility of domain sections based on selected mode
function toggleDomainSections() {
  const mode = document.getElementById('domainMode').value;
  document.getElementById('specificDomainsSection').style.display = 
    mode === 'specific' ? 'block' : 'none';
  document.getElementById('excludeDomainsSection').style.display = 
    mode === 'exclude' ? 'block' : 'none';
}

// Save settings to storage
async function saveOptions() {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    frequency: parseInt(document.getElementById('frequency').value) || 30,
    showOnDomains: document.getElementById('domainMode').value,
    specificDomains: document.getElementById('specificDomains').value
      .split('\n')
      .map(d => d.trim())
      .filter(d => d),
    excludeDomains: document.getElementById('excludeDomains').value
      .split('\n')
      .map(d => d.trim())
      .filter(d => d),
    enableChatGPT: document.getElementById('enableChatGPT').checked,
    enableClaude: document.getElementById('enableClaude').checked,
    enableGemini: document.getElementById('enableGemini').checked,
    weatherApiKey: document.getElementById('weatherApiKey').value.trim(),
    productHuntApiKey: document.getElementById('productHuntApiKey').value.trim(),
    openaiApiKey: document.getElementById('openaiApiKey').value.trim()
  };
  
  await chrome.storage.sync.set({ userSettings: settings });
  
  // Show saved message
  const status = document.getElementById('status');
  status.textContent = 'Settings saved!';
  status.className = 'success';
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 3000);
}

// Reset settings to defaults
async function resetSettings() {
  const settings = getDefaultSettings();
  await chrome.storage.sync.set({ userSettings: settings });
  loadSettings();
  
  // Show reset message
  const status = document.getElementById('status');
  status.textContent = 'Settings reset to defaults!';
  status.className = 'success';
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 3000);
}

// Default settings
function getDefaultSettings() {
  return {
    enabled: true,
    frequency: 30,
    showOnDomains: 'all',
    specificDomains: ['gmail.com', 'docs.google.com', 'notion.so'],
    excludeDomains: ['youtube.com', 'netflix.com'],
    enableChatGPT: true,
    enableClaude: true,
    enableGemini: true,
    weatherApiKey: '',
    productHuntApiKey: '',
    openaiApiKey: ''
  };
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load initial settings
  loadSettings();
  
  // Add change handler for domain mode
  document.getElementById('domainMode').addEventListener('change', toggleDomainSections);
  
  // Add click handlers for buttons
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('reset').addEventListener('click', resetSettings);
});