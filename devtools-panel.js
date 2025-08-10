document.addEventListener('DOMContentLoaded', function () {
  const addSectionBtn = document.getElementById('addSection');

  addSectionBtn.addEventListener('click', addSection);

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
      toggleIcon.textContent = '▼';
    }
  }

  function closeSectionAccordion(sectionId) {
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
      sectionContent.classList.add('collapsed');
      toggleIcon.textContent = '▶';
    }
  }

  function addSection() {
    const sectionName = document.getElementById('sectionName').value.trim();
    const sectionURL = document.getElementById('sectionURL').value.trim();

    clearSectionErrors();

    let hasErrors = false;
    if (!sectionName) {
      hasErrors = true;
      showSectionError('sectionName', 'Section name is required');
    }
    if (!sectionURL) {
      hasErrors = true;
      showSectionError('sectionURL', 'Section URL is required');
    }
    if (hasErrors) {
      return;
    }

    chrome.storage.local.get(['sections', 'currSectionId'], function (result) {
      const { sections, currSectionId } = result;
      let currentSections = sections || {};
      const isCurrSection = currSectionId === null;
      const id = Date.now().toString();
      const newSection = {
        id,
        name: sectionName,
        url: sectionURL,
        images: {},
        currImageId: null,
      };
      currentSections[id] = newSection;

      const sectionListContainer = document.getElementById('sectionList');
      const sectionElement = createSectionAccordion(newSection);
      sectionListContainer.appendChild(sectionElement);

      // Check if any section URL matches current page and open it
      chrome.devtools.inspectedWindow.eval(
        'window.location.href',
        function (result, isException) {
          if (!isException && result) {
            checkAndOpenMatchingSection(result);
          }
        }
      );

      chrome.storage.local.set({
        sections: currentSections,
        currSectionId: isCurrSection ? newSection.id : currSectionId,
      });
    });

    // Clear form inputs
    document.getElementById('sectionName').value = '';
    document.getElementById('sectionURL').value = '';
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
    chrome.storage.local.get(['sections'], function (result) {
      const { sections } = result;
      delete sections[sectionId];

      // TODO: update currSectionId if it was the deleted section

      chrome.storage.local.set(
        {
          sections,
        },
        () => {
          const element = document.querySelector(
            `[data-section-id="${sectionId}"].section-item`
          );
          if (element) {
            element.remove();
          }
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

      // Check if any section URL matches current page and open it
      chrome.devtools.inspectedWindow.eval(
        'window.location.href',
        function (result, isException) {
          if (!isException && result) {
            checkAndOpenMatchingSection(result);
          }
        }
      );
    });
  }

  function createSectionAccordion(section) {
    const sectionItem = document.createElement('div');
    sectionItem.classList.add('section-item', 'accordion');
    sectionItem.setAttribute('data-section-id', section.id);

    // Section header (clickable for accordion)
    const sectionHeader = document.createElement('div');
    sectionHeader.classList.add('section-header', 'accordion-header');
    sectionHeader.setAttribute('data-section-id', section.id);

    const sectionName = document.createElement('span');
    sectionName.classList.add('section-name');
    sectionName.textContent = section.name;

    const sectionUrl = document.createElement('span');
    sectionUrl.classList.add('section-url');
    sectionUrl.textContent = section.url;

    const toggleIcon = document.createElement('span');
    toggleIcon.classList.add('accordion-toggle');
    toggleIcon.textContent = '▶';

    sectionHeader.appendChild(sectionName);
    sectionHeader.appendChild(sectionUrl);
    sectionHeader.appendChild(toggleIcon);

    // Section content (collapsible)
    const sectionContent = document.createElement('div');
    sectionContent.classList.add(
      'section-content',
      'accordion-content',
      'collapsed'
    );
    sectionContent.setAttribute('data-section-id', section.id);

    // Section image upload
    const sectionImageUpload = document.createElement('div');
    sectionImageUpload.classList.add('section-image-upload');

    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'image/*';
    uploadInput.classList.add('hidden');
    uploadInput.setAttribute('data-section-id', section.id);

    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = 'Upload Image';
    uploadBtn.classList.add('upload-btn');
    uploadBtn.setAttribute('data-section-id', section.id);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Images';
    clearBtn.classList.add('clear-btn');
    clearBtn.setAttribute('data-section-id', section.id);

    const deleteSectionBtn = document.createElement('button');
    deleteSectionBtn.textContent = 'Delete Section';
    deleteSectionBtn.classList.add('delete-section-btn');
    deleteSectionBtn.setAttribute('data-section-id', section.id);

    const uploadResult = document.createElement('div');
    uploadResult.classList.add('upload-result', 'hidden');
    uploadResult.setAttribute('data-section-id', section.id);

    const imageList = document.createElement('div');
    imageList.classList.add('section-image-list');
    imageList.setAttribute('data-section-id', section.id);

    sectionImageUpload.appendChild(uploadInput);
    sectionImageUpload.appendChild(uploadBtn);
    sectionImageUpload.appendChild(clearBtn);
    sectionImageUpload.appendChild(deleteSectionBtn);
    sectionImageUpload.appendChild(uploadResult);
    sectionImageUpload.appendChild(imageList);

    // Add event listeners
    uploadBtn.addEventListener('click', function () {
      uploadInput.click();
    });

    uploadInput.addEventListener('change', function (event) {
      handleSectionImageUpload(event, section.id);
    });

    clearBtn.addEventListener('click', function () {
      clearSectionImages(section.id);
    });

    deleteSectionBtn.addEventListener('click', function () {
      deleteSection(section.id);
    });

    // Accordion toggle functionality
    sectionHeader.addEventListener('click', function () {
      const content = this.nextElementSibling;

      if (content.classList.contains('collapsed')) {
        openSectionAccordion(section.id);
      } else {
        closeSectionAccordion(section.id);
      }
    });

    sectionContent.appendChild(sectionImageUpload);
    sectionItem.appendChild(sectionHeader);
    sectionItem.appendChild(sectionContent);

    return sectionItem;
  }

  chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
      if (port.name === '_quibble') {
        checkAndOpenMatchingSection(msg.pageURL);
      }
    });
    return true;
  });

  refreshSectionList();
});
