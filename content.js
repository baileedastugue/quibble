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
  chrome.storage.local.get(
    ['sections', 'currSectionId', 'overlayVisible', 'overlayTransparency'],
    function (result) {
      const { sections, currSectionId, overlayVisible, overlayTransparency } =
        result;
      if (!sections || !currSectionId) {
        return;
      }

      const currSection = sections[currSectionId];
      const currentImage = currSection.images[currSection.currImageId];

      if (!currentImage) {
        return;
      }

      let overlay = document.createElement('div');
      overlay.id = 'quibble-image-overlay';

      const img = document.createElement('img');
      img.src = currentImage.data;
      img.alt = currentImage.name;
      img.addEventListener('dblclick', function () {
        this.classList.toggle('focused');
      });
      img.addEventListener('touchstart', function () {
        this.classList.toggle('focused');
      });

      const opacity =
        (overlayTransparency !== undefined ? overlayTransparency : 100) / 100;
      img.style.opacity = opacity;

      overlay = imageDragFunctionality(overlay, img);
      overlay.appendChild(img);

      if (overlayVisible !== false) {
        overlay.style.display = 'flex';
      } else {
        overlay.style.display = 'none';
      }

      document.body.appendChild(overlay);
    }
  );
}

function listenForStorageChanges(changes, namespace) {
  if (namespace === 'local' && (changes.currSectionId || changes.sections)) {
    displayUploadedImage();
  }
  return true;
}

let port = null;
let isConnected = false;

function connectPort() {
  try {
    port = chrome.runtime.connect({ name: '_quibble' });
    isConnected = true;

    port.onDisconnect.addListener(function () {
      console.log('Port disconnected');
      isConnected = false;
      setTimeout(connectPort, 1000);
    });

    postWidthMessage();
  } catch (error) {
    console.log('Failed to connect port:', error);
    isConnected = false;
    setTimeout(connectPort, 2000);
  }
}

function postWidthMessage() {
  if (isConnected && port) {
    try {
      port.postMessage({
        width: window.innerWidth,
        pageURL: window.location.href,
      });
    } catch (error) {
      console.log('Error sending message, reconnecting...');
      isConnected = false;
      connectPort();
    }
  } else {
    connectPort();
  }
}

connectPort();

window.addEventListener('resize', postWidthMessage);
window.addEventListener('DOMContentLoaded', postWidthMessage);
window.addEventListener('load', postWidthMessage);
window.addEventListener('reload', postWidthMessage);

function toggleOverlay(visible) {
  const overlay = document.getElementById('quibble-image-overlay');
  if (overlay) {
    if (visible) {
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  }
}

function updateTransparency(transparency) {
  const overlay = document.getElementById('quibble-image-overlay');
  if (overlay) {
    const img = overlay.querySelector('img');
    img.style.opacity = transparency / 100;
  }
}

// Display image when page loads
displayUploadedImage();
postWidthMessage();

// Listen for storage changes to update image display
chrome.storage.onChanged.addListener((changes, namespace) => {
  listenForStorageChanges(changes, namespace);
});

chrome.runtime.onMessage.addListener(function (message) {
  const { action, visible, transparency } = message;
  if (action === 'toggleOverlay') {
    toggleOverlay(visible);
  }
  if (action === 'updateTransparency') {
    updateTransparency(transparency);
  }
  if (action === 'getScreenWidth') {
    postWidthMessage();
  }
});
