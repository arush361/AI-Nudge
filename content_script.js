class AINotification {
  constructor() {
    this.notificationElement = null;
    this.dismissTimeout = null;
    console.log('AINotification initialized');
  }

  async show() {
    console.log('Showing notification');
    // Check if notification already exists
    if (this.notificationElement) {
      console.log('Notification already exists, skipping');
      return;
    }

    try {
      // Get user settings to determine which AI service to open
      const { userSettings } = await chrome.storage.sync.get('userSettings');
      console.log('User settings for AI service:', userSettings);
      let aiUrl = 'https://chat.openai.com';
      
      if (userSettings) {
        if (!userSettings.enableChatGPT && userSettings.enableClaude) {
          aiUrl = 'https://claude.ai';
        } else if (!userSettings.enableChatGPT && userSettings.enableGemini) {
          aiUrl = 'https://gemini.google.com';
        }
      }
      console.log('Using AI URL:', aiUrl);

      // Create notification element
      this.notificationElement = document.createElement('div');
      this.notificationElement.className = 'ai-notification';
      this.notificationElement.innerHTML = `
        <div class="ai-notification-icon">✨</div>
        <div class="ai-notification-content">
          <p class="ai-notification-message">Try solving this task with AI?</p>
        </div>
        <button class="ai-button">Ask AI</button>
      `;

      // Add click handler for the AI button
      const aiButton = this.notificationElement.querySelector('.ai-button');
      aiButton.addEventListener('click', () => {
        console.log('AI button clicked, opening:', aiUrl);
        window.open(aiUrl, '_blank');
        this.dismiss();
      });

      // Add to DOM
      document.body.appendChild(this.notificationElement);
      console.log('Notification added to DOM');

      // Set auto-dismiss timeout
      this.dismissTimeout = setTimeout(() => this.dismiss(), 8000);

      // Add click handler to dismiss on clicking anywhere outside
      document.addEventListener('click', (e) => {
        if (!this.notificationElement.contains(e.target)) {
          console.log('Clicked outside notification, dismissing');
          this.dismiss();
        }
      }, { once: true });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  dismiss() {
    console.log('Dismissing notification');
    if (!this.notificationElement) return;

    this.notificationElement.classList.add('hiding');
    clearTimeout(this.dismissTimeout);

    setTimeout(() => {
      if (this.notificationElement && this.notificationElement.parentNode) {
        this.notificationElement.parentNode.removeChild(this.notificationElement);
        this.notificationElement = null;
        console.log('Notification removed from DOM');
      }
    }, 300);
  }
}

// Create notification instance
const notification = new AINotification();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.action === 'showNotification') {
    notification.show();
  }
});
