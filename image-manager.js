const priorityOptions = ['1', '2', '3', '4', '5'];

function handleSectionImageUpload(event, sectionId, priority = 1) {
  const file = event.target.files[0];
  if (!file.type.startsWith('image/')) {
    showSectionUploadResult(sectionId, 'Please select a valid image file.');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showSectionUploadResult(sectionId, 'Image size must be less than 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const newImage = {
        id: Date.now().toString(),
        sectionId: sectionId,
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
        priority: parseInt(priority),
        width: img.width,
        height: img.height,
        timestamp: new Date().toISOString(),
      };
      const sectionSuccessfullyUpdated = addImageToSection(sectionId, newImage);
      if (!sectionSuccessfullyUpdated) {
        return;
      }
      updateSectionImageList(sectionId);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function addImageToSection(sectionId, image) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    sections[sectionId].images = {
      ...sections[sectionId].images,
      [image.id]: image,
    };

    chrome.storage.local.set({ sections }, function () {
      showSectionUploadResult(
        sectionId,
        `Image uploaded successfully! (${
          Object.keys(sections[sectionId].images).length
        } total)`
      );
      updateSectionImageList(sectionId);
      return true;
    });
  });
  return false;
}

function createImageNameElement(image, sectionId) {
  const imageNameContainer = document.createElement('div');
  imageNameContainer.classList.add(
    'flex-row',
    'justify-space-between',
    'align-items-center',
    'image-name-container'
  );
  imageNameContainer.setAttribute('data-id', image.id);

  const imageName = document.createElement('p');
  imageName.classList.add('flex-1');
  imageName.textContent = image.name;

  const editButton = document.createElement('button');
  editButton.classList.add('btn-primary--icon', 'btn-sm');
  editButton.innerHTML = '✏️';
  editButton.title = 'Edit image name';

  editButton.addEventListener('click', function () {
    startImageNameEdit(imageNameContainer, image, sectionId);
  });

  imageNameContainer.appendChild(imageName);
  imageNameContainer.appendChild(editButton);

  return imageNameContainer;
}

function createImageElement(image, sectionId, isCurrImg) {
  const imageItem = document.createElement('div');
  imageItem.classList.add('image-item');

  const imageThumbnail = document.createElement('div');
  imageThumbnail.classList.add('image-thumbnail');

  const img = document.createElement('img');
  img.src = image.data;
  img.alt = image.name;

  const imageDetails = document.createElement('div');
  imageDetails.classList.add('image-details');

  const imageNameContainer = createImageNameElement(image, sectionId);

  const imageSize = document.createElement('p');
  imageSize.classList.add('image-size');
  imageSize.textContent = `${image.width}px`;

  const imageManagement = document.createElement('div');
  imageManagement.classList.add('image-management');

  const selectBtn = document.createElement('button');
  selectBtn.classList.add('btn-sm');
  selectBtn.setAttribute('data-id', image.id);
  selectBtn.setAttribute('data-section-id', sectionId);
  selectBtn.textContent = isCurrImg ? 'Current image' : 'Select image';
  selectBtn.classList.add(isCurrImg && 'btn-current');

  selectBtn.addEventListener('click', function () {
    chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
      const { sections, currSectionId } = result;
      sections[currSectionId].currImageId = image.id;

      chrome.storage.local.set({ sections }, function () {
        updateImageOverlay(currSectionId, image);
      });
    });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('btn-danger--secondary', 'btn-sm');
  deleteBtn.setAttribute('data-id', image.id);
  deleteBtn.setAttribute('data-section-id', sectionId);
  deleteBtn.textContent = 'Delete image';
  deleteBtn.addEventListener('click', function () {
    deleteSectionImage(sectionId, image.id);
  });

  const sizeDropdown = document.createElement('select');
  sizeDropdown.setAttribute('data-id', image.id);
  sizeDropdown.setAttribute('data-section-id', sectionId);

  // Add priority options
  priorityOptions.forEach((priority) => {
    const option = document.createElement('option');
    option.value = priority;
    option.textContent = priority;
    if (parseInt(image.priority) === parseInt(priority)) {
      option.selected = true;
    }
    sizeDropdown.appendChild(option);
  });

  sizeDropdown.addEventListener('change', function () {
    updateSectionImagePriority(sectionId, image.id, this.value);
  });

  imageManagement.appendChild(selectBtn);
  imageManagement.appendChild(deleteBtn);
  imageManagement.appendChild(sizeDropdown);

  imageThumbnail.appendChild(img);
  imageDetails.appendChild(imageNameContainer);
  imageDetails.appendChild(imageSize);
  imageDetails.appendChild(imageManagement);

  imageItem.appendChild(imageThumbnail);
  imageItem.appendChild(imageDetails);
  return imageItem;
}

// Function to start inline editing of image name
function startImageNameEdit(container, image, sectionId) {
  const currentName = image.name;
  const editForm = document.createElement('div');
  editForm.classList.add('image-name-edit-form');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.classList.add('image-name-input');

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('edit-buttons', 'flex-row', 'gap-xs');

  const confirmBtn = document.createElement('button');
  confirmBtn.classList.add('btn-success', 'btn-sm');
  confirmBtn.innerHTML = '✓';
  confirmBtn.title = 'Confirm changes';

  const cancelBtn = document.createElement('button');
  cancelBtn.classList.add('btn-danger--secondary', 'btn-sm');
  cancelBtn.innerHTML = '✕';
  cancelBtn.title = 'Cancel changes';

  buttonContainer.appendChild(confirmBtn);
  buttonContainer.appendChild(cancelBtn);

  editForm.appendChild(input);
  editForm.appendChild(buttonContainer);

  // Replace the display with edit form
  container.innerHTML = '';
  container.appendChild(editForm);

  // Focus the input
  input.focus();
  input.select();

  confirmBtn.addEventListener('click', function () {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      // Update the image object immediately for instant UI feedback
      image.name = newName;

      // Update storage in the background
      updateImageName(sectionId, image.id, newName);
    }

    // Restore display immediately
    restoreImageNameDisplay(container, image, sectionId);
  });

  cancelBtn.addEventListener('click', function () {
    restoreImageNameDisplay(container, image, sectionId);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      confirmBtn.click();
    } else if (e.key === 'Escape') {
      cancelBtn.click();
    }
  });
}

function restoreImageNameDisplay(container, image, sectionId) {
  const newImageNameElement = createImageNameElement(image, sectionId);
  container.innerHTML = newImageNameElement.innerHTML;
}

function updateImageName(sectionId, imageId, newName) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    if (sections[sectionId] && sections[sectionId].images[imageId]) {
      sections[sectionId].images[imageId].name = newName;

      chrome.storage.local.set({ sections }, function () {
        // Update the overlay if this is the current image
        chrome.storage.local.get(['currSectionId'], function (result) {
          if (result.currSectionId === sectionId) {
            updateImageOverlay(sectionId, sections[sectionId].images[imageId]);
          }
        });
      });
    }
  });
}

// Updates the images rendered in a section when an image is added, removed, or updated
function updateSectionImageList(sectionId) {
  chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
    const { sections, currSectionId } = result;

    const currSection = sections[sectionId];
    const images = currSection.images;
    const imageList = document.querySelector(
      `[data-section-id="${sectionId}"].section-image-list`
    );

    // TODO: update this to the image that is closest to the screen width
    const currImageId = currSection.currImageId;
    if (Object.keys(images).length === 0) {
      imageList.innerHTML = '<p>No images uploaded yet.</p>';
    } else {
      imageList.innerHTML = '';

      // Sort images by width first (smallest to largest), then by priority
      const sortedImageIds = Object.keys(images).sort((a, b) => {
        // First sort by width (smallest to largest)
        if (images[a].width !== images[b].width) {
          return images[a].width - images[b].width;
        }
        // If widths are equal, sort by priority (1 is highest priority)
        return images[a].priority - images[b].priority;
      });

      sortedImageIds.forEach((img) => {
        const imageElement = createImageElement(
          images[img],
          currSectionId,
          currImageId === img
        );
        imageList.appendChild(imageElement);
      });
    }
  });
}

function updateImageFromScreenWidth(width) {
  chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
    const { sections, currSectionId } = result;
    if (!sections || !currSectionId) {
      return;
    }
    const images = sections[currSectionId].images;
    let image = null;
    let matchFound = false;
    Object.keys(images).forEach((key) => {
      if (images[key].width === width) {
        image = images[key];
        matchFound = true;
      } else if (!matchFound && images[key].width < width) {
        image = images[key];
      } else if (!matchFound && images[key].width > width && image === null) {
        image = images[key];
        matchFound = true;
      }
    });
    if (image && matchFound) {
      sections[currSectionId].currImageId = image.id;
      chrome.storage.local.set({ sections });
      // updateImageList();
    }
  });
}

function updateImageOverlay(sectionId, image) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    sections[sectionId].currImageId = image.id;
    chrome.storage.local.set({ sections }, function () {
      updateSectionImageList(sectionId);
      showSectionUploadResult(sectionId, 'Image selected successfully!');
    });
  });
}

function deleteSectionImage(sectionId, imageId) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    delete sections[sectionId].images[imageId];

    chrome.storage.local.set(
      {
        sections,
      },
      function () {
        updateSectionImageList(sectionId);
      }
    );
  });
}

function updateSectionImagePriority(sectionId, imageId, newPriority) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    sections[sectionId].images[imageId].priority = newPriority;
    chrome.storage.local.set({ sections }, function () {
      showSectionUploadResult(
        sectionId,
        `Image priority updated to ${newPriority}!`
      );
      updateSectionImageList(sectionId);
    });
  });
}

// Message updates to user
function showSectionUploadResult(sectionId, message) {
  const uploadResult = document.querySelector(
    `[data-section-id="${sectionId}"] .upload-result`
  );
  if (uploadResult) {
    uploadResult.textContent = message;
    uploadResult.classList.remove('hidden');
  }
}

function clearSectionImages(sectionId) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    sections[sectionId].images = {};
    chrome.storage.local.set({ sections }, function () {
      showSectionUploadResult(sectionId, 'All images cleared successfully!');
      updateSectionImageList(sectionId);
    });
  });
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    if (port.name === '_quibble') {
      updateImageFromScreenWidth(msg.width);
    }
  });
  return true;
});
