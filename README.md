# Quibble Chrome Extension

## Features

- Modern popup interface with gradient design
- Background service worker for extension logic
- Content script for webpage interaction
- Local storage for data persistence
- Message passing between components

## Files Structure

```
quibble/
├── manifest.json      # Extension configuration
├── popup.html         # Popup interface
├── popup.js          # Popup functionality
├── background.js     # Background service worker
├── content.js        # Content script for web pages
├── styles.css        # Popup styling
└── README.md         # This file
```

## Installation

1. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `quibble` folder

2. **Test the extension:**
   - Click the extension icon in the toolbar
   - The popup will show a button
   - Click the button to interact with the current webpage

## How it Works

- **manifest.json**: Defines the extension structure, permissions, and components
- **popup.html/js**: User interface that appears when clicking the extension icon
- **background.js**: Service worker that runs in the background
- **content.js**: Script that runs on web pages to interact with page content
- **styles.css**: Modern styling for the popup interface

## Development

- The extension uses Manifest V3 (latest Chrome extension standard)
- All communication between components uses Chrome's message passing API
- Data persistence is handled through `chrome.storage.local`