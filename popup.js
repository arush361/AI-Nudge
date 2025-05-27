// Wait for the DOM to be fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Add click handler for the settings button
  const optionsButton = document.getElementById('openOptions');
  if (optionsButton) {
    optionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
});