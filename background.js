let lastShown = 0;

// Function to inject content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content_script.js']
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['styles.css']
    });
    console.log('Content script injected successfully');
  } catch (error) {
    console.error('Error injecting content script:', error);
  }
}

// Function to check if we should show notification
async function shouldShowNotification(tab) {
  try {
    const { userSettings } = await chrome.storage.sync.get('userSettings');
    
    // If no settings or notifications disabled, don't show
    if (!userSettings || !userSettings.enabled) {
      return false;
    }

    // Check frequency
    const now = Date.now();
    const lastShown = await chrome.storage.sync.get('lastNotificationTime');
    const minInterval = (userSettings.frequency || 30) * 60 * 1000; // Convert minutes to milliseconds
    
    if (lastShown.lastNotificationTime && (now - lastShown.lastNotificationTime) < minInterval) {
      return false;
    }

    // Skip chrome:// URLs
    if (tab.url && tab.url.startsWith('chrome://')) {
      return false;
    }

    // If it's a new tab or empty tab, notification will be handled by newtab.js
    if (!tab.url || tab.url === 'about:blank') {
      return false;
    }

    try {
      const url = new URL(tab.url);
      
      // Check domain settings
      return (() => {
        switch (userSettings.showOnDomains) {
          case 'specific':
            return userSettings.specificDomains.some(domain => url.hostname.includes(domain));
          case 'exclude':
            return !userSettings.excludeDomains.some(domain => url.hostname.includes(domain));
          case 'all':
          default:
            return true;
        }
      })();
    } catch (e) {
      // If URL parsing fails, skip it
      return false;
    }
  } catch (e) {
    console.error('Error checking notification settings:', e);
    return false;
  }
}

// Handle tab updates for regular web pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && !tab.url?.startsWith('chrome://')) {
    shouldShowNotification(tab).then(should => {
      if (should) {
        // Update last shown time
        chrome.storage.sync.set({ lastNotificationTime: Date.now() });
        
        // Send message to content script
        chrome.tabs.sendMessage(tabId, { action: 'showNotification' })
          .catch(error => console.error('Error sending message:', error));
      }
    });
  }
});

function showNotification() {
  if (document.getElementById('ai-nudge-toast')) return;
  const toast = document.createElement('div');
  toast.id = 'ai-nudge-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    zIndex: 999999,
    fontFamily: 'sans-serif',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });
  toast.innerHTML = `✨ Try solving this task with AI? <button id=\"ai-nudge-btn\">Ask AI</button>`;
  document.body.appendChild(toast);
  document.getElementById('ai-nudge-btn').addEventListener('click', () => {
    window.open('https://chat.openai.com/', '_blank');
  });
  setTimeout(() => toast.remove(), 9000);
}