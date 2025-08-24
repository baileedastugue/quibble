const priorityOptions = ['1', '2', '3', '4', '5'];
const DELETE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"> <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
const EDIT_ICON = `<svg width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.46v3.04c0 .28.22.5.5.5h3.04c.13 0 .26-.05.35-.15L17.81 9.94l-3.75-3.75L3.15 17.1q-.15.15-.15.36M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"></path></svg>`;
const CHECK_ICON = `<svg width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17 5.53 12.7a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71c.39-.39.39-1.02 0-1.41a.996.996 0 0 0-1.41 0z"></path></svg>`;
const CLOSE_ICON = `<svg width="20" height="20" focusable="false" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4"></path></svg>`;

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
    'image-name-container',
    'gap-sm'
  );
  imageNameContainer.setAttribute('data-id', image.id);

  const imageName = document.createElement('p');
  imageName.classList.add('flex-1');
  imageName.textContent = image.name;

  const editButton = document.createElement('button');
  editButton.classList.add('btn-icon', 'btn-primary--icon');
  editButton.innerHTML = EDIT_ICON;
  editButton.title = 'Edit image name';

  editButton.addEventListener('click', function () {
    startImageNameEdit(imageNameContainer, image, sectionId);
  });

  imageNameContainer.appendChild(imageName);
  imageNameContainer.appendChild(editButton);

  return imageNameContainer;
}

function createImageThumbnail(image, sectionId, isCurrImg) {
  const imageThumbnail = document.createElement('div');
  imageThumbnail.classList.add('image-thumbnail', 'full-width');

  const selectBtn = document.createElement('button');
  selectBtn.classList.add('btn-img');
  selectBtn.setAttribute('data-id', image.id);
  selectBtn.setAttribute('data-section-id', sectionId);
  selectBtn.classList.add(isCurrImg && 'btn-current');

  const img = document.createElement('img');
  img.src = image.data;
  img.alt = image.name;
  selectBtn.appendChild(img);
  imageThumbnail.appendChild(selectBtn);

  selectBtn.addEventListener('click', function () {
    chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
      const { sections, currSectionId } = result;
      sections[currSectionId].currImageId = image.id;

      chrome.storage.local.set({ sections }, function () {
        updateImageOverlay(currSectionId, image);
      });
    });
  });

  return imageThumbnail;
}

const createImageDeleteButton = (image, sectionId) => {
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('btn-danger--icon', 'btn-icon');
  deleteBtn.setAttribute('data-id', image.id);
  deleteBtn.setAttribute('data-section-id', sectionId);
  deleteBtn.innerHTML = DELETE_ICON;
  deleteBtn.title = 'Delete image';
  deleteBtn.addEventListener('click', function () {
    deleteSectionImage(sectionId, image.id);
  });

  return deleteBtn;
};

const createImagePriorityDropdown = (image, sectionId) => {
  const priorityDropdown = document.createElement('select');
  priorityDropdown.setAttribute('data-id', image.id);
  priorityDropdown.setAttribute('data-section-id', sectionId);

  priorityOptions.forEach((priority) => {
    const option = document.createElement('option');
    option.value = priority;
    option.textContent = priority;
    if (parseInt(image.priority) === parseInt(priority)) {
      option.selected = true;
    }
    priorityDropdown.appendChild(option);
  });

  priorityDropdown.addEventListener('change', function () {
    updateSectionImagePriority(sectionId, image.id, this.value);
  });
};

function createImageElement(image, sectionId, isCurrImg) {
  const imageItem = document.createElement('div');
  imageItem.classList.add('image-item', 'flex-col', 'gap-md', 'flex-row--md');

  const imageThumbnail = createImageThumbnail(image, sectionId, isCurrImg);

  const imageDetails = document.createElement('div');
  imageDetails.classList.add('image-details', 'full-width');

  const imageName = createImageNameElement(image, sectionId);

  const imageSizeAndDelete = document.createElement('div');
  imageSizeAndDelete.classList.add(
    'image-management',
    'flex-row',
    'gap-md',
    'justify-space-between',
    'align-items-center',
    'full-width'
  );
  const imageSize = document.createElement('p');
  imageSize.textContent = `${image.width}px`;
  const deleteBtn = createImageDeleteButton(image, sectionId);
  imageSizeAndDelete.appendChild(imageSize);
  imageSizeAndDelete.appendChild(deleteBtn);

  imageDetails.appendChild(imageName);
  imageDetails.appendChild(imageSizeAndDelete);

  imageItem.appendChild(imageThumbnail);
  imageItem.appendChild(imageDetails);
  return imageItem;
}

function startImageNameEdit(container, image, sectionId) {
  const currentName = image.name;
  const editForm = document.createElement('div');
  editForm.classList.add('image-name-edit-form', 'flex-col');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.classList.add('image-name-input', 'full-width');

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('edit-buttons', 'flex-row', 'gap-xs');

  const confirmBtn = document.createElement('button');
  confirmBtn.classList.add('btn-icon', 'btn-primary--icon', 'btn-icon--sm');
  confirmBtn.innerHTML = CHECK_ICON;
  confirmBtn.title = 'Confirm changes';

  const cancelBtn = document.createElement('button');
  cancelBtn.classList.add('btn-icon', 'btn-danger--icon', 'btn-icon--sm');
  cancelBtn.innerHTML = CLOSE_ICON;
  cancelBtn.title = 'Cancel changes';

  buttonContainer.appendChild(confirmBtn);
  buttonContainer.appendChild(cancelBtn);

  editForm.appendChild(input);
  editForm.appendChild(buttonContainer);

  container.innerHTML = '';
  container.appendChild(editForm);

  input.focus();
  input.select();

  confirmBtn.addEventListener('click', function () {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      image.name = newName;

      updateImageName(sectionId, image.id, newName);
    }

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

  container.innerHTML = '';

  while (newImageNameElement.firstChild) {
    container.appendChild(newImageNameElement.firstChild);
  }
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
      imageList.classList.add('flex-col', 'gap-lg');
      const sortedImageIds = Object.keys(images).sort((a, b) => {
        return images[a].width - images[b].width;
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
    const sortedImageIds = Object.keys(images).sort((a, b) => {
      return images[a].width - images[b].width;
    });
    let image = null;
    let matchFound = false;
    sortedImageIds.forEach((key) => {
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
      updateSectionImageList(currSectionId);
    }
  });
}

function updateImageOverlay(sectionId, image) {
  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    sections[sectionId].currImageId = image.id;
    chrome.storage.local.set({ sections }, function () {
      updateSectionImageList(sectionId);
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
