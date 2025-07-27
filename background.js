// Background script (service worker) for the Chrome extension
chrome.runtime.onInstalled.addListener(function () {
  console.log('Quibble Extension installed');
  // Initialize extension data
  chrome.storage.local.set({
    installDate: new Date().toISOString(),
    actionCount: 0,
  });
});

// Listen for messages from DevTools panel or content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getStats') {
    chrome.storage.local.get(['actionCount'], function (result) {
      sendResponse({
        actionCount: result.actionCount || 0,
      });
    });
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'incrementAction') {
    chrome.storage.local.get(['actionCount'], function (result) {
      const newCount = (result.actionCount || 0) + 1;
      chrome.storage.local.set({ actionCount: newCount });
      sendResponse({ success: true, newCount: newCount });
    });
    return true;
  }
});
