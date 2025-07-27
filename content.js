// Content script that runs in the context of web pages
console.log('Quibble Extension content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'performAction') {
    const pageTitle = document.title;
    const pageUrl = window.location.href;

    const links = document.querySelectorAll('a');
    const linkCount = links.length;

    // Send response back to popup
    sendResponse({
      success: true,
      pageTitle: pageTitle,
      pageUrl: pageUrl,
      linkCount: linkCount,
      timestamp: new Date().toISOString(),
    });

    // Notify background script to increment action count
    chrome.runtime.sendMessage({ action: 'incrementAction' });

    return true;
  }
});
