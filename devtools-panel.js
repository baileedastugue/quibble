document.addEventListener('DOMContentLoaded', function () {
  const getPageInfoBtn = document.getElementById('getPageInfo');
  const getStorageBtn = document.getElementById('getStorage');
  const pageInfoDiv = document.getElementById('pageInfo');
  const debugInfoDiv = document.getElementById('debugInfo');

  // Image uploader elements
  const imageUpload = document.getElementById('imageUpload');
  const uploadButton = document.getElementById('uploadButton');
  const clearImageBtn = document.getElementById('clearImage');
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
        // Get image dimensions
        const img = new Image();
        img.onload = function () {
          // Create new image object
          const newImage = {
            id: Date.now().toString(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            width: img.width,
            height: img.height,
            timestamp: new Date().toISOString(),
          };

          // Get existing images and add new one
          chrome.storage.local.get(['uploadedImages'], function (result) {
            const images = result.uploadedImages || [];
            images.push(newImage);

            // Store updated images array
            chrome.storage.local.set(
              {
                uploadedImages: images,
                currentImageId: newImage.id, // Set as current image
              },
              function () {
                uploadResult.textContent = `Image uploaded successfully! (${images.length} total)`;
                uploadResult.classList.remove('hidden');

                debugInfoDiv.textContent += `\nImage uploaded: ${
                  newImage.name
                } at ${new Date().toLocaleTimeString()}`;

                // Update image list display
                updateImageList();
              }
            );
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  clearImageBtn.addEventListener('click', function () {
    imageUpload.value = '';

    // Clear all stored images
    chrome.storage.local.remove(
      ['uploadedImages', 'currentImageId'],
      function () {
        uploadResult.textContent = 'All images cleared successfully!';
        uploadResult.classList.remove('hidden');

        debugInfoDiv.textContent += `\nAll images cleared at ${new Date().toLocaleTimeString()}`;

        // Clear image list
        updateImageList();
      }
    );
  });

  // Function to update image list display
  function updateImageList() {
    chrome.storage.local.get(
      ['uploadedImages', 'currentImageId'],
      function (result) {
        const images = result.uploadedImages || [];
        const currentId = result.currentImageId;

        // Update image list in the panel
        const imageListContainer = document.getElementById('imageList');
        if (imageListContainer) {
          if (images.length === 0) {
            imageListContainer.innerHTML = '<p>No images uploaded yet.</p>';
          } else {
            let listHTML = '<h4>Uploaded Images:</h4>';
            images.forEach((image, index) => {
              const isCurrent = image.id === currentId;
              listHTML += `
              <div class="image-item ${isCurrent ? 'current' : ''}">
                <span class="image-name">${image.name}</span>
                <span class="image-size">${(image.size / 1024).toFixed(
                  1
                )} KB</span>
                <button class="select-btn" data-id="${image.id}">${
                isCurrent ? 'Current' : 'Select'
              }</button>
                <button class="delete-btn" data-id="${image.id}">Delete</button>
              </div>
            `;
            });
            imageListContainer.innerHTML = listHTML;

            // Add event listeners for select and delete buttons
            addImageListEventListeners();
          }
        }
      }
    );
  }

  // Function to add event listeners to image list buttons
  function addImageListEventListeners() {
    // Select buttons
    document.querySelectorAll('.select-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const imageId = this.getAttribute('data-id');
        chrome.storage.local.set({ currentImageId: imageId }, function () {
          updateImageList();
          uploadResult.textContent = 'Image selected successfully!';
          uploadResult.classList.remove('hidden');
        });
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const imageId = this.getAttribute('data-id');
        chrome.storage.local.get(
          ['uploadedImages', 'currentImageId'],
          function (result) {
            const images = result.uploadedImages || [];
            const currentId = result.currentImageId;

            // Remove the image
            const updatedImages = images.filter((img) => img.id !== imageId);

            // If we deleted the current image, set a new current image
            let newCurrentId = currentId;
            if (imageId === currentId && updatedImages.length > 0) {
              newCurrentId = updatedImages[updatedImages.length - 1].id; // Set to most recent
            }

            chrome.storage.local.set(
              {
                uploadedImages: updatedImages,
                currentImageId: newCurrentId,
              },
              function () {
                updateImageList();
                uploadResult.textContent = 'Image deleted successfully!';
                uploadResult.classList.remove('hidden');
              }
            );
          }
        );
      });
    });
  }

  // Load existing images on panel load
  chrome.storage.local.get(
    ['uploadedImages', 'currentImageId'],
    function (result) {
      const images = result.uploadedImages || [];
      const currentId = result.currentImageId;

      // Update image list
      updateImageList();
    }
  );

  // Initialize debug info
  debugInfoDiv.textContent = `Panel loaded at: ${new Date().toLocaleTimeString()}\nUse the buttons above to interact with the extension.`;
});
