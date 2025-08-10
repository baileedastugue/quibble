// Content script that runs in the context of web pages
console.log('Quibble Extension content script loaded');

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
  checkStoredImages();
}

function imageDragFunctionality(overlay, img) {
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
    img.classList.remove('focused');
  });

  overlay.addEventListener('touchstart', function (e) {
    if (img.classList.contains('focused')) {
      isDragging = true;
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
      e.preventDefault();
    }
  });

  document.addEventListener('touchmove', function (e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;

      overlay.style.transform = `translateX(-50%) translate(${currentX}px, ${currentY}px)`;
      document.body.classList.add('dragging');
    }
  });

  document.addEventListener('touchend', function () {
    isDragging = false;
    document.body.classList.remove('dragging');
    img.classList.remove('focused');
  });

  return overlay;
}

function checkStoredImages() {
  chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
    const { sections, currSectionId } = result;
    if (!sections || !currSectionId) {
      return;
    }
    const currSection = sections[currSectionId];
    const currentImage = currSection.images[currSection.currImageId];

    let overlay = document.createElement('div');
    overlay.id = 'quibble-image-overlay';

    const img = document.createElement('img');
    img.src = currentImage.data;
    img.alt = currentImage.name;
    img.addEventListener('dblclick', function () {
      this.classList.toggle('focused');
    });

    overlay = imageDragFunctionality(overlay, img);
    overlay.appendChild(img);

    document.body.appendChild(overlay);

    const sliderContainer = createTransparencySlider(overlay);
    document.body.appendChild(sliderContainer);
  });
}

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

function createTransparencySlider(overlay) {
  const sliderContainer = document.createElement('div');
  sliderContainer.id = 'quibble-transparency-slider';

  const label = document.createElement('div');
  label.textContent = 'Image transparency';
  label.className = 'slider-label';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '25';
  slider.max = '100';
  slider.value = '100';

  const valueDisplay = document.createElement('div');
  valueDisplay.textContent = '100%';
  valueDisplay.className = 'slider-value';

  slider.addEventListener('input', function () {
    const opacity = this.value / 100;
    const img = overlay.querySelector('img');
    if (img) {
      img.style.opacity = opacity;
    }
    valueDisplay.textContent = this.value + '%';
  });

  const toggleButton = createImageToggle(overlay);

  sliderContainer.appendChild(toggleButton);
  sliderContainer.appendChild(label);
  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(valueDisplay);

  return sliderContainer;
}

function listenForStorageChanges(changes, namespace) {
  if (namespace === 'local' && (changes.currSectionId || changes.sections)) {
    displayUploadedImage();
  }
  return true;
}

var port = chrome.runtime.connect({ name: '_quibble' });
window.addEventListener('resize', postWidthMessage);
window.addEventListener('load', postWidthMessage);

function postWidthMessage() {
  port.postMessage({ width: window.innerWidth });
}

// Display image when page loads
displayUploadedImage();
postWidthMessage();

// Listen for storage changes to update image display
chrome.storage.onChanged.addListener((changes, namespace) => {
  listenForStorageChanges(changes, namespace);
});

// Clean up when content script gets disconnected
chrome.runtime.connect().onDisconnect.addListener(function () {
  chrome.storage.onChanged.removeListener(listenForStorageChanges);
  window.removeEventListener('resize', postWidthMessage);
});
