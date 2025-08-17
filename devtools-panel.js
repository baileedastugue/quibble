const TOGGLE_ICON = `<svg focusable="false" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path d="M15.88 9.29 12 13.17 8.12 9.29a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41-.39-.38-1.03-.39-1.42 0"></path></svg>`;

document.addEventListener('DOMContentLoaded', function () {
  const addSectionBtn = document.getElementById('addSection');
  const toggleOverlayBtn = document.getElementById('toggleOverlay');
  const transparencySlider = document.getElementById('transparencySlider');

  addSectionBtn.addEventListener('click', addSection);
  toggleOverlayBtn.addEventListener('click', toggleImageOverlay);
  transparencySlider.addEventListener('input', handleTransparencyChange);

  updateOverlayButtonState();
  initializeTransparency();

  refreshUI();

  requestScreenWidth();

  // Listen for storage changes to update UI
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local' && (changes.sections || changes.currSectionId)) {
      refreshUI();
    }
  });
});

function initializeTransparency() {
  chrome.storage.local.get(['overlayTransparency'], function (result) {
    const slider = document.getElementById('transparencySlider');
    const valueDisplay = document.getElementById('transparencyValue');
    const transparency =
      result.overlayTransparency !== undefined
        ? Math.max(20, Math.min(100, result.overlayTransparency))
        : 100;

    if (slider && valueDisplay) {
      slider.value = transparency;
      valueDisplay.textContent = `${transparency}%`;
    }
  });
}

function handleTransparencyChange() {
  const slider = document.getElementById('transparencySlider');
  const valueDisplay = document.getElementById('transparencyValue');
  const transparency = slider.value;

  if (valueDisplay) {
    valueDisplay.textContent = `${transparency}%`;
  }

  chrome.storage.local.set({ overlayTransparency: parseInt(transparency) });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateTransparency',
        transparency: parseInt(transparency),
      });
    }
  });
}

// Function to check if any section URL matches current page and open it
function checkAndOpenMatchingSection(currentURL) {
  chrome.storage.local.get(['sections'], function (result) {
    const sections = result.sections || {};
    Object.keys(sections).forEach((sectionId) => {
      const section = sections[sectionId];
      const normalizedCurrent = normalizeURL(currentURL);
      const normalizedSection = normalizeURL(section.url);
      if (normalizedCurrent === normalizedSection) {
        openSectionAccordion(section.id);
      } else {
        closeSectionAccordion(section.id);
      }
    });
  });
}

// Function to normalize URLs for comparison
function normalizeURL(url) {
  if (!url) return '';

  // Remove protocol, trailing slash, www. prefix
  let normalized = url.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/\/$/, '');
  normalized = normalized.replace(/^www\./, '');

  return normalized.toLowerCase();
}

// Function to open a specific section accordion
function openSectionAccordion(sectionId) {
  chrome.storage.local.get(['currSectionId'], function (result) {
    const { currSectionId } = result;
    if (currSectionId && currSectionId !== sectionId) {
      closeSectionAccordion(currSectionId);
    }
  });

  chrome.storage.local.set({ currSectionId: sectionId });
  const sectionHeader = document.querySelector(
    `[data-section-id="${sectionId}"].accordion-header`
  );
  const sectionContent = document.querySelector(
    `[data-section-id="${sectionId}"].accordion-content`
  );
  const toggleIcon = document.querySelector(
    `[data-section-id="${sectionId}"].accordion-header .accordion-toggle`
  );

  if (sectionContent && sectionHeader && toggleIcon) {
    sectionContent.classList.remove('collapsed');
    toggleIcon.classList.remove('collapsed');
  }
}

function closeSectionAccordion(sectionId) {
  const sectionContent = document.querySelector(
    `[data-section-id="${sectionId}"].accordion-content`
  );
  const toggleIcon = document.querySelector(
    `[data-section-id="${sectionId}"].accordion-header .accordion-toggle`
  );

  if (sectionContent && toggleIcon) {
    sectionContent.classList.add('collapsed');
    toggleIcon.classList.add('collapsed');
  }

  chrome.storage.local.get(['currSectionId'], function (result) {
    const { currSectionId } = result;
    if (currSectionId === sectionId) {
      chrome.storage.local.remove(['currSectionId']);
    }
  });
}

function addSection() {
  const sectionName = document.getElementById('sectionName').value.trim();
  const sectionURL = document.getElementById('sectionURL').value.trim();

  clearSectionErrors();

  chrome.storage.local.get(['sections'], function (result) {
    const { sections } = result;
    let currentSections = sections || {};

    const hasLimitErrors = validateSectionLimit(currentSections);
    if (hasLimitErrors) {
      return;
    }

    const hasNameErrors = validateSectionName(sectionName, currentSections);
    const hasURLErrors = validateSectionURL(sectionURL, currentSections);

    if (hasNameErrors || hasURLErrors) {
      return;
    }

    const id = Date.now().toString();
    const newSection = {
      id,
      name: sectionName,
      url: normalizeURL(sectionURL),
      images: {},
      currImageId: null,
    };
    currentSections[id] = newSection;

    chrome.storage.local.set(
      {
        sections: currentSections,
        currSectionId: id,
      },
      function () {
        const sectionListContainer = document.getElementById('sectionList');
        const sectionElement = createSectionAccordion(newSection);
        sectionListContainer.appendChild(sectionElement);
        openSectionAccordion(id);
      }
    );

    document.getElementById('sectionName').value = '';
    document.getElementById('sectionURL').value = '';
  });
}

function validateSectionName(sectionName, existingSections) {
  let hasNameErrors = false;

  if (!sectionName) {
    showSectionError('sectionName', 'Section name is required');
    hasNameErrors = true;
  }

  if (!hasNameErrors) {
    const existingSectionWithName = Object.values(existingSections).find(
      (section) => section.name.toLowerCase() === sectionName.toLowerCase()
    );

    if (existingSectionWithName) {
      showSectionError('sectionName', 'Section name already exists');
      hasNameErrors = true;
    }
  }

  return hasNameErrors;
}

function validateSectionURL(sectionURL, existingSections) {
  let hasURLErrors = false;

  if (!sectionURL) {
    showSectionError('sectionURL', 'Section URL is required');
    hasURLErrors = true;
  }

  if (!hasURLErrors) {
    const existingSectionWithURL = Object.values(existingSections).find(
      (section) => section.url.toLowerCase() === sectionURL.toLowerCase()
    );

    if (existingSectionWithURL) {
      showSectionError('sectionURL', 'Section URL already exists');
      hasURLErrors = true;
    }
  }

  return hasURLErrors;
}

function validateSectionLimit(existingSections) {
  const maxSections = 5;
  const currentSectionCount = Object.keys(existingSections).length;

  if (currentSectionCount >= maxSections) {
    showSectionLimitBanner();
    return true;
  }
  return false;
}

function showSectionLimitError() {
  const sectionNameError = document.getElementById('sectionNameError');
  const sectionNameInput = document.getElementById('sectionName');

  if (sectionNameError) {
    sectionNameError.textContent =
      'Maximum of 5 sections allowed. Please delete a section before adding a new one.';
    sectionNameError.classList.remove('hidden');
  }

  if (sectionNameInput) {
    sectionNameInput.classList.add('error');
  }
}

function showSectionError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + 'Error');
  const inputElement = document.getElementById(fieldId);

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }

  if (inputElement) {
    inputElement.classList.add('error');
  }
}

function clearSectionErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  const inputElements = document.querySelectorAll('input[type="text"]');

  errorElements.forEach((element) => {
    element.classList.add('hidden');
  });

  inputElements.forEach((element) => {
    element.classList.remove('error');
  });
}

function deleteSection(sectionId) {
  chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
    const { sections, currSectionId } = result;
    delete sections[sectionId];

    chrome.storage.local.set(
      {
        sections,
        currSectionId: currSectionId === sectionId ? null : currSectionId,
      },
      () => {
        const element = document.querySelector(
          `[data-section-id="${sectionId}"].section-item`
        );
        if (element) {
          element.remove();
        }
        removeSectionLimitBanner();
      }
    );
  });
}

function refreshSectionList() {
  chrome.storage.local.get(['sections'], function (result) {
    let { sections } = result;
    sections = sections || {};
    const sectionListContainer = document.getElementById('sectionList');

    Object.keys(sections).forEach((sectionId) => {
      const section = sections[sectionId];
      const sectionElement = createSectionAccordion(section);
      sectionListContainer.appendChild(sectionElement);
      updateSectionImageList(section.id);
    });
  });
}

function createSectionAccordion(section) {
  const sectionItem = document.createElement('div');
  sectionItem.classList.add('section-item', 'accordion', 'card');
  sectionItem.setAttribute('data-section-id', section.id);

  const sectionHeader = createSectionHeader(section);
  const sectionContent = createSectionContent(section);

  const urlAndDeleteContainer = document.createElement('div');
  urlAndDeleteContainer.classList.add(
    'flex-row',
    'justify-space-between',
    'align-items-center',
    'gap-sm'
  );
  const sectionUrl = createSectionUrl(section);
  const deleteSectionBtn = createDeleteSectionButton(section);
  urlAndDeleteContainer.appendChild(sectionUrl);
  urlAndDeleteContainer.appendChild(deleteSectionBtn);
  sectionContent.appendChild(urlAndDeleteContainer);

  const uploadAndClearContainer = document.createElement('div');
  uploadAndClearContainer.classList.add(
    'flex-row',
    'justify-space-between',
    'gap-sm'
  );
  // const clearBtn = createClearImagesButton(section);
  const { uploadInput, uploadBtn } = createUploadFunctionality(section);
  // uploadAndClearContainer.appendChild(clearBtn);
  uploadAndClearContainer.appendChild(uploadInput);
  uploadAndClearContainer.appendChild(uploadBtn);
  sectionContent.appendChild(uploadAndClearContainer);

  const imageList = createImageList(section);

  // const uploadResult = createUploadResult(section);

  uploadInput.addEventListener('change', function (event) {
    // const selectedPriority = prioritySelect.value;
    handleSectionImageUpload(event, section.id);
  });

  sectionContent.appendChild(imageList);
  sectionItem.appendChild(sectionHeader);
  sectionItem.appendChild(sectionContent);

  return sectionItem;
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    if (port.name === '_quibble') {
      if (msg.pageURL) {
        checkAndOpenMatchingSection(msg.pageURL);
      }
      if (msg.width) {
        updateImageFromScreenWidth(msg.width);
      }
    }
  });
  return true;
});

refreshSectionList();

function toggleImageOverlay() {
  chrome.storage.local.get(['overlayVisible'], function (result) {
    const isOverlayVisible = result.overlayVisible !== false; // Default to true if not set

    chrome.storage.local.set({ overlayVisible: !isOverlayVisible });

    updateOverlayButtonState();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleOverlay',
          visible: !isOverlayVisible,
        });
      }
    });
  });
}

function updateOverlayButtonState() {
  chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
    const { sections, currSectionId } = result;
    const toggleBtn = document.getElementById('toggleOverlay');

    if (!sections || !currSectionId || !sections[currSectionId]) {
      toggleBtn.disabled = true;
      toggleBtn.classList.add('disabled');
      return;
    }

    const currentSection = sections[currSectionId];
    const hasImages =
      currentSection.images && Object.keys(currentSection.images).length > 0;

    toggleBtn.disabled = false;
    toggleBtn.classList.remove('disabled');

    chrome.storage.local.get(['overlayVisible'], function (overlayResult) {
      updateOverlayButtonText(overlayResult.overlayVisible, hasImages);
    });
  });
}

const updateOverlayButtonText = (isOverlayVisible, imagesAvailable) => {
  const toggleBtn = document.getElementById('toggleOverlay');
  toggleBtn.classList.add('full-width', 'btn-sm', 'auto-width--md');

  if (!isOverlayVisible) {
    toggleBtn.textContent = 'Show overlay';
    toggleBtn.classList.add('overlay-hidden');
  } else {
    toggleBtn.textContent = 'Hide overlay';
    toggleBtn.classList.remove('overlay-hidden');
  }

  if (!imagesAvailable) {
    toggleBtn.disabled = true;
    toggleBtn.classList.add('disabled');
  }
};

function refreshUI() {
  updateOverlayButtonState();
}

function showSectionLimitBanner() {
  const sectionManagementSection = document.querySelector('.section');
  if (!sectionManagementSection) return;

  removeSectionLimitBanner();

  const banner = document.createElement('div');
  banner.classList.add('section-limit-banner');
  banner.innerHTML = `
    <div class="banner-content">
      <span class="banner-icon">⚠️</span>
      <span class="banner-text">Maximum of 5 sections reached. Please delete a section before adding a new one.</span>
    </div>
  `;

  sectionManagementSection.insertBefore(
    banner,
    sectionManagementSection.firstChild
  );
}

function removeSectionLimitBanner() {
  const existingBanner = document.querySelector('.section-limit-banner');
  if (existingBanner) {
    existingBanner.remove();
  }
}

function requestScreenWidth() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getScreenWidth',
      });
    }
  });
}

function createSectionHeader(section) {
  const sectionHeader = document.createElement('div');
  sectionHeader.classList.add(
    'flex-row',
    'justify-space-between',
    'align-self-center',
    'accordion-header'
  );
  sectionHeader.setAttribute('data-section-id', section.id);

  const sectionName = document.createElement('h3');
  sectionName.classList.add('section-name');
  sectionName.textContent = section.name;

  const toggleIcon = document.createElement('span');
  toggleIcon.classList.add('accordion-toggle', 'collapsed');
  toggleIcon.innerHTML = TOGGLE_ICON;

  sectionHeader.appendChild(sectionName);
  sectionHeader.appendChild(toggleIcon);

  sectionHeader.addEventListener('click', function () {
    const content = this.nextElementSibling;

    if (content.classList.contains('collapsed')) {
      openSectionAccordion(section.id);
    } else {
      closeSectionAccordion(section.id);
    }
  });

  return sectionHeader;
}

function createSectionContent(section) {
  const sectionContent = document.createElement('div');
  sectionContent.classList.add(
    'section-content',
    'accordion-content',
    'collapsed',
    'flex-col',
    'gap-md'
  );

  sectionContent.setAttribute('data-section-id', section.id);

  return sectionContent;
}

function createSectionUrl(section) {
  const sectionUrl = document.createElement('p');
  sectionUrl.textContent = section.url;

  return sectionUrl;
}

function createImageList(section) {
  const imageList = document.createElement('div');
  imageList.classList.add('section-image-list');
  imageList.setAttribute('data-section-id', section.id);

  return imageList;
}

function createUploadInput(section) {
  const uploadInput = document.createElement('input');
  uploadInput.type = 'file';
  uploadInput.accept = 'image/*';
  uploadInput.classList.add('hidden');
  uploadInput.setAttribute('data-section-id', section.id);

  return uploadInput;
}

function createUploadButton(section, uploadInput) {
  const uploadBtn = document.createElement('button');
  uploadBtn.textContent = 'Add image';
  uploadBtn.classList.add('btn', 'btn-primary', 'full-width');
  uploadBtn.setAttribute('data-section-id', section.id);

  uploadBtn.addEventListener('click', function () {
    uploadInput.click();
  });

  return uploadBtn;
}

function createUploadFunctionality(section) {
  const uploadInput = createUploadInput(section);
  const uploadBtn = createUploadButton(section, uploadInput);

  return { uploadInput, uploadBtn };
}

function createImageUploadPriority(section) {
  const priorityContainer = document.createElement('div');
  priorityContainer.classList.add('flex-row', 'gap-sm');

  const priorityLabel = document.createElement('label');
  priorityLabel.textContent = 'Priority:';

  const prioritySelect = document.createElement('select');
  prioritySelect.setAttribute('data-section-id', section.id);

  const priorityOptions = ['1', '2', '3', '4', '5'];
  priorityOptions.forEach((priority) => {
    const option = document.createElement('option');
    option.value = priority;
    option.textContent = priority;
    if (priority === '1') {
      option.selected = true;
    }
    prioritySelect.appendChild(option);
  });

  priorityContainer.appendChild(priorityLabel);
  priorityContainer.appendChild(prioritySelect);

  return { priorityContainer, prioritySelect };
}

function createDeleteSectionButton(section) {
  const deleteSectionBtn = document.createElement('button');
  deleteSectionBtn.innerHTML = DELETE_ICON;
  deleteSectionBtn.title = 'Delete section';
  deleteSectionBtn.classList.add('btn-icon', 'btn-danger--icon');
  deleteSectionBtn.setAttribute('data-section-id', section.id);

  deleteSectionBtn.addEventListener('click', function () {
    deleteSection(section.id);
  });

  return deleteSectionBtn;
}

function createClearImagesButton(section) {
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear all images';
  clearBtn.classList.add(
    'btn',
    'btn-sm',
    'btn-secondary',
    'align-self-end',
    'full-width',
    'auto-width--md'
  );
  clearBtn.setAttribute('data-section-id', section.id);

  clearBtn.addEventListener('click', function () {
    clearSectionImages(section.id);
  });

  return clearBtn;
}

function createImageListHeader() {
  const imageListHeader = document.createElement('h4');
  imageListHeader.textContent = 'Images';

  return imageListHeader;
}

function createUploadResult(section) {
  const uploadResult = document.createElement('div');
  uploadResult.classList.add('upload-result', 'hidden');
  uploadResult.setAttribute('data-section-id', section.id);

  return uploadResult;
}
