// Content script that runs in the context of web pages
console.log('Quibble Extension content script loaded');

// Listen for messages from the DevTools panel
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'performAction') {
    const pageTitle = document.title;
    const pageUrl = window.location.href;

    const links = document.querySelectorAll('a');
    const linkCount = links.length;

    // Send response back to DevTools panel
    sendResponse({
      success: true,
      pageTitle: pageTitle,
      pageUrl: pageUrl,
      linkCount: linkCount,
      timestamp: new Date().toISOString(),
    });

    return true;
  }
});

// Function to display uploaded image overlay
function displayUploadedImage() {
  // Remove any existing image overlay
  const existingOverlay = document.getElementById('quibble-image-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Remove any existing transparency slider
  const existingSlider = document.getElementById('quibble-transparency-slider');
  if (existingSlider) {
    existingSlider.remove();
  }

  // Check for uploaded images in storage
  chrome.storage.local.get(
    ['uploadedImages', 'currentImageId'],
    function (result) {
      const images = result.uploadedImages || [];
      let currentId = result.currentImageId;

      if (images.length > 0) {
        // If no current image is set, set it to the last uploaded image
        if (!currentId) {
          currentId = images[images.length - 1].id;
          chrome.storage.local.set({ currentImageId: currentId });
        }

        // Find current image or use the most recent one
        const currentImage =
          images.find((img) => img.id === currentId) ||
          images[images.length - 1];
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'quibble-image-overlay';

        // Create image element
        const img = document.createElement('img');
        img.src = currentImage.data;
        img.alt = currentImage.name;

        // Add double-click event for focus state
        img.addEventListener('dblclick', function () {
          this.classList.toggle('focused');
        });

        // Add drag functionality
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        overlay.addEventListener('mousedown', function (e) {
          if (img.classList.contains('focused')) {
            isDragging = true;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            e.preventDefault();
          }
        });

        document.addEventListener('mousemove', function (e) {
          if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;

            overlay.style.transform = `translateX(-50%) translate(${currentX}px, ${currentY}px)`;
            document.body.classList.add('dragging');
          }
        });

        document.addEventListener('mouseup', function () {
          isDragging = false;
          document.body.classList.remove('dragging');

          // Remove focus state
          img.classList.remove('focused');
        });

        // Assemble overlay
        overlay.appendChild(img);

        // Add to page
        document.body.appendChild(overlay);

        // Create toggle button and transparency slider
        createTransparencySlider(overlay);
        createImageToggle(overlay);
      }
    }
  );
}

// Function to create image toggle button
function createImageToggle(overlay) {
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Hide image';
  toggleButton.className = 'toggle-btn';

  let isVisible = true;

  toggleButton.addEventListener('click', function () {
    if (isVisible) {
      overlay.classList.add('hidden');
      toggleButton.textContent = 'Show image';
      isVisible = false;
    } else {
      overlay.classList.remove('hidden');
      toggleButton.textContent = 'Hide image';
      isVisible = true;
    }
  });

  return toggleButton;
}

// Function to create transparency slider
function createTransparencySlider(overlay) {
  const sliderContainer = document.createElement('div');
  sliderContainer.id = 'quibble-transparency-slider';

  // Create label
  const label = document.createElement('div');
  label.textContent = 'Image transparency';
  label.className = 'slider-label';

  // Create slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '25';
  slider.max = '100';
  slider.value = '100';

  // Create value display
  const valueDisplay = document.createElement('div');
  valueDisplay.textContent = '100%';
  valueDisplay.className = 'slider-value';

  // Add event listener for slider changes
  slider.addEventListener('input', function () {
    const opacity = this.value / 100;
    const img = overlay.querySelector('img');
    if (img) {
      img.style.opacity = opacity;
    }
    valueDisplay.textContent = this.value + '%';
  });

  // Create toggle button
  const toggleButton = createImageToggle(overlay);

  // Assemble slider
  sliderContainer.appendChild(toggleButton);
  sliderContainer.appendChild(label);
  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(valueDisplay);

  // Add to page
  document.body.appendChild(sliderContainer);
}

// Display image when page loads
displayUploadedImage();

// Listen for storage changes to update image display
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (
    namespace === 'local' &&
    (changes.uploadedImages || changes.currentImageId)
  ) {
    displayUploadedImage();
  }
});
