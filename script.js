chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'testNotification') {
    createNotification();
  }
});