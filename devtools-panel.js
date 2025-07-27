document.addEventListener('DOMContentLoaded', function () {
  const getPageInfoBtn = document.getElementById('getPageInfo');
  const getStorageBtn = document.getElementById('getStorage');
  const incrementActionBtn = document.getElementById('incrementAction');
  const clearStorageBtn = document.getElementById('clearStorage');
  const pageInfoDiv = document.getElementById('pageInfo');
  const actionResultDiv = document.getElementById('actionResult');
  const debugInfoDiv = document.getElementById('debugInfo');

  // Get page information
  getPageInfoBtn.addEventListener('click', function () {
    chrome.devtools.inspectedWindow.eval(
      `({
                title: document.title,
                url: window.location.href,
                links: document.querySelectorAll('a').length,
                images: document.querySelectorAll('img').length,
                timestamp: new Date().toISOString()
            })`,
      function (result, isException) {
        if (isException) {
          pageInfoDiv.textContent = 'Error: ' + isException.value;
        } else {
          pageInfoDiv.textContent = JSON.stringify(result, null, 2);
        }
        pageInfoDiv.style.display = 'block';
      }
    );
  });

  // Get storage data
  getStorageBtn.addEventListener('click', function () {
    // Send message to background script to get storage
    chrome.runtime.sendMessage({ action: 'getStats' }, function (response) {
      if (response) {
        pageInfoDiv.textContent = JSON.stringify(response, null, 2);
        pageInfoDiv.style.display = 'block';
      } else {
        pageInfoDiv.textContent = 'No storage data found';
        pageInfoDiv.style.display = 'block';
      }
    });
  });

  // Increment action count
  incrementActionBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage(
      { action: 'incrementAction' },
      function (response) {
        if (response && response.success) {
          actionResultDiv.textContent = `Action count incremented! New count: ${response.newCount}`;
          actionResultDiv.style.display = 'block';

          debugInfoDiv.textContent = `Last action: ${new Date().toLocaleTimeString()}\nAction count: ${
            response.newCount
          }`;
        } else {
          actionResultDiv.textContent = 'Failed to increment action count';
          actionResultDiv.style.display = 'block';
        }
      }
    );
  });

  // Clear storage
  clearStorageBtn.addEventListener('click', function () {
    chrome.storage.local.clear(function () {
      actionResultDiv.textContent = 'Storage cleared successfully!';
      actionResultDiv.style.display = 'block';

      debugInfoDiv.textContent = `Storage cleared at: ${new Date().toLocaleTimeString()}`;
    });
  });

  // Listen for panel shown/hidden events
  window.addEventListener('message', function (event) {
    if (event.data.type === 'panelShown') {
      console.log('Panel is now visible');
      debugInfoDiv.textContent +=
        '\nPanel shown at: ' + new Date().toLocaleTimeString();
    }
  });

  // Initialize debug info
  debugInfoDiv.textContent = `Panel loaded at: ${new Date().toLocaleTimeString()}\nUse the buttons above to interact with the extension.`;
});
