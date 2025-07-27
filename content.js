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

  // Check for uploaded image in storage
  chrome.storage.local.get(['uploadedImage'], function (result) {
    if (result.uploadedImage && result.uploadedImage.data) {
      // Create overlay container
      const overlay = document.createElement('div');
      overlay.id = 'quibble-image-overlay';

      // Create image element
      const img = document.createElement('img');
      img.src = result.uploadedImage.data;
      img.alt = result.uploadedImage.name;

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×'; // TODO: add an icon here and update the styling
      closeBtn.className = 'close-btn';
      closeBtn.onclick = () => overlay.remove();

      // Assemble overlay
      overlay.appendChild(closeBtn);
      overlay.appendChild(img);

      // Add to page
      document.body.appendChild(overlay);

      // Create transparency slider
      createTransparencySlider(overlay);
    }
  });
}

// Function to create transparency slider
function createTransparencySlider(overlay) {
  const sliderContainer = document.createElement('div');
  sliderContainer.id = 'quibble-transparency-slider';

  // Create label
  const label = document.createElement('div');
  label.textContent = 'Image Transparency';
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

  // Assemble slider
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
  if (namespace === 'local' && changes.uploadedImage) {
    displayUploadedImage();
  }
});
