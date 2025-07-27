document.addEventListener('DOMContentLoaded', function () {
  const getPageInfoBtn = document.getElementById('getPageInfo');
  const getStorageBtn = document.getElementById('getStorage');
  const incrementActionBtn = document.getElementById('incrementAction');
  const clearStorageBtn = document.getElementById('clearStorage');
  const pageInfoDiv = document.getElementById('pageInfo');
  const actionResultDiv = document.getElementById('actionResult');
  const debugInfoDiv = document.getElementById('debugInfo');

  // Image uploader elements
  const imageUpload = document.getElementById('imageUpload');
  const uploadButton = document.getElementById('uploadButton');
  const clearImageBtn = document.getElementById('clearImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const imageInfo = document.getElementById('imageInfo');
  const uploadResult = document.getElementById('uploadResult');

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
        pageInfoDiv.classList.remove('hidden');
      }
    );
  });

  // Get storage data
  getStorageBtn.addEventListener('click', function () {
    // Send message to background script to get storage
    chrome.runtime.sendMessage({ action: 'getStats' }, function (response) {
      if (response) {
        pageInfoDiv.textContent = JSON.stringify(response, null, 2);
        pageInfoDiv.classList.remove('hidden');
      } else {
        pageInfoDiv.textContent = 'No storage data found';
        pageInfoDiv.classList.remove('hidden');
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
          actionResultDiv.classList.remove('hidden');

          debugInfoDiv.textContent = `Last action: ${new Date().toLocaleTimeString()}\nAction count: ${
            response.newCount
          }`;
        } else {
          actionResultDiv.textContent = 'Failed to increment action count';
          actionResultDiv.classList.remove('hidden');
        }
      }
    );
  });

  // Clear storage
  clearStorageBtn.addEventListener('click', function () {
    chrome.storage.local.clear(function () {
      actionResultDiv.textContent = 'Storage cleared successfully!';
      actionResultDiv.classList.remove('hidden');

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

  // Image uploader functionality
  uploadButton.addEventListener('click', function () {
    console.log('Upload button clicked');
    imageUpload.click();
  });

  imageUpload.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        uploadResult.textContent = 'Please select a valid image file.';
        uploadResult.classList.remove('hidden');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        uploadResult.textContent = 'Image size must be less than 5MB.';
        uploadResult.classList.remove('hidden');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        // Display preview
        previewImg.src = e.target.result;
        imagePreview.classList.remove('hidden');

        // Show image info
        imageInfo.innerHTML = `
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Size:</strong> ${(file.size / 1024).toFixed(
                      2
                    )} KB<br>
                    <strong>Dimensions:</strong> Loading...
                `;

        // Get image dimensions
        const img = new Image();
        img.onload = function () {
          imageInfo.innerHTML = `
                        <strong>File:</strong> ${file.name}<br>
                        <strong>Size:</strong> ${(file.size / 1024).toFixed(
                          2
                        )} KB<br>
                        <strong>Dimensions:</strong> ${img.width} × ${
            img.height
          }px
                    `;
        };
        img.src = e.target.result;

        // Store image data in extension storage
        chrome.storage.local.set(
          {
            uploadedImage: {
              name: file.name,
              type: file.type,
              size: file.size,
              data: e.target.result,
              timestamp: new Date().toISOString(),
            },
          },
          function () {
            uploadResult.textContent =
              'Image uploaded and stored successfully!';
            uploadResult.classList.remove('hidden');

            debugInfoDiv.textContent += `\nImage uploaded: ${
              file.name
            } at ${new Date().toLocaleTimeString()}`;
          }
        );
      };
      reader.readAsDataURL(file);
    }
  });

  clearImageBtn.addEventListener('click', function () {
    imageUpload.value = '';

    imagePreview.classList.add('hidden');

    // Clear stored image
    chrome.storage.local.remove(['uploadedImage'], function () {
      uploadResult.textContent = 'Image cleared successfully!';
      uploadResult.classList.remove('hidden');

      debugInfoDiv.textContent += `\nImage cleared at ${new Date().toLocaleTimeString()}`;
    });
  });

  // Load existing image on panel load
  chrome.storage.local.get(['uploadedImage'], function (result) {
    if (result.uploadedImage) {
      previewImg.src = result.uploadedImage.data;
      imagePreview.classList.remove('hidden');
      imageInfo.innerHTML = `
                <strong>File:</strong> ${result.uploadedImage.name}<br>
                <strong>Size:</strong> ${(
                  result.uploadedImage.size / 1024
                ).toFixed(2)} KB<br>
                <strong>Type:</strong> ${result.uploadedImage.type}<br>
                <strong>Uploaded:</strong> ${new Date(
                  result.uploadedImage.timestamp
                ).toLocaleString()}
            `;
    }
  });

  // Initialize debug info
  debugInfoDiv.textContent = `Panel loaded at: ${new Date().toLocaleTimeString()}\nUse the buttons above to interact with the extension.`;
});
