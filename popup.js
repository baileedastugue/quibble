// Popup script for the Chrome extension
document.addEventListener('DOMContentLoaded', function () {
  const actionButton = document.getElementById('actionButton');
  const resultDiv = document.getElementById('result');

  actionButton.addEventListener('click', function () {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];

      // Send a message to the content script
      chrome.tabs.sendMessage(
        activeTab.id,
        { action: 'performAction' },
        function (response) {
          if (response && response.success) {
            resultDiv.textContent = 'Action completed successfully!';
            resultDiv.style.color = 'green';
            console.log('Page info:', {
              title: response.pageTitle,
              url: response.pageUrl,
              links: response.linkCount,
            });
          } else {
            resultDiv.textContent = 'Action failed or no response.';
            resultDiv.style.color = 'red';
            console.log('No response or error');
          }
        }
      );
    });
  });
});
