# Quibble Chrome Extension

A Chrome extension designed for designers and developers to compare design mockups against the actual coded implementation. Perfect for QA testing, design reviews, and ensuring pixel-perfect implementation across different screen sizes.

## Purpose

Quibble bridges the gap between design and development by allowing you to:
- **Overlay design mockups** directly on live websites
- **Compare designs** with the actual coded implementation
- **Test responsive behavior** across different screen sizes
- **Validate design accuracy** during development and QA phases
- **Streamline design reviews** by providing visual comparisons

## Use Cases

### For Designers
- **Design Validation**: Verify that the coded version matches your design specifications
- **Responsive Testing**: Test how designs look across different device sizes
- **Design Reviews**: Present designs in context during stakeholder reviews
- **Quality Assurance**: Ensure design consistency across different pages

### For Developers
- **Implementation Verification**: Check that your code matches the design requirements
- **Cross-browser Testing**: Ensure designs render correctly across different browsers
- **Responsive Development**: Test responsive breakpoints with actual design files
- **Bug Reporting**: Provide visual context when reporting design-related issues

### For QA Teams
- **Visual Regression Testing**: Compare current implementation against approved designs
- **Cross-device Testing**: Validate designs on various screen sizes
- **Design Compliance**: Ensure the final product matches design specifications
- **Documentation**: Create visual evidence of design implementation

## Features

### 🎨 Design Overlay System
- **Mockup Overlays**: Upload design files and overlay them on live websites
- **Responsive Scaling**: Automatically scale designs to match current screen width
- **Transparency Control**: Adjust overlay opacity to see both design and implementation
- **Drag & Position**: Move overlays for precise alignment with page elements

### 📱 Multi-Device Testing
- **Screen Size Detection**: Automatically detects current viewport dimensions
- **Priority-based Selection**: Organize designs by priority and screen size
- **Responsive Breakpoints**: Test designs across different device sizes
- **Mobile Emulation**: Perfect for testing mobile designs in desktop browsers

### 🗂️ Organized Design Management
- **Section-based Organization**: Group designs by website or project
- **Priority System**: Organize designs by order they should appear (1-5 scale)
- **URL Matching**: Automatically load relevant designs for specific pages
- **Design Library**: Build a collection of design assets for easy access

### 🛠️ Developer-Friendly Tools
- **DevTools Integration**: Access all features directly in Chrome DevTools
- **Real-time Updates**: See changes immediately as you resize the browser
- **Design Comparison**: Side-by-side comparison of design vs. implementation
- **Export Capabilities**: Save design comparisons for documentation

## Access the extension

1. Open Chrome DevTools (F12 or right-click → Inspect)
2. Go to the "Quibble" tab in DevTools
3. The extension interface will appear

## How to Use

### Setting Up Design Comparisons

1. **Create a Project Section:**
   - Open Chrome DevTools and navigate to the "Quibble" tab
   - Enter a project name and the website URL
   - Click "Add Section" to create a new design project

2. **Upload Design Mockups:**
   - Click on your project section to expand it
   - Set design order (1 = first, 5 = last)
   - Click "Upload Image" and select your design file
   - Repeat for different screen sizes or design variations

3. **Organize by Screen Size:**
   - Upload designs for different breakpoints (mobile, tablet, desktop)
   - Set appropriate orders for each design
   - The extension will automatically select the best match based on current screen size

### Comparing Designs with Implementation

1. **Load the Live Website:**
   - Navigate to the website you want to compare against
   - Open Chrome DevTools and go to the "Quibble" tab
   - Your project section should automatically open if the URL matches

2. **Select a Design:**
   - Choose the appropriate design for the current screen size
   - Click "Select" to make it the active overlay
   - The design will appear overlaid on the live website

3. **Fine-tune the Comparison:**
   - **Desktop**: Double-click the overlay to enter focus mode, then drag for precise positioning
   - **Mobile**: Long press the overlay to enter focus mode, then drag
   - Adjust transparency using the slider to see both design and implementation clearly

4. **Test Responsive Behavior:**
   - Resize your browser window to test different screen sizes
   - The extension will automatically select the best design match
   - Compare how the design looks against the actual responsive behavior

### Managing Design Assets

- **Priority Management**: Use the dropdown to change design priorities
- **Design Organization**: Group related designs within the same section
- **Quick Access**: Frequently used designs can be set to higher priority
- **Cleanup**: Remove outdated designs or entire projects when no longer needed

## File Structure

```
quibble/
├── manifest.json              # Extension configuration
├── background.js              # Background service worker
├── content.js                 # Content script for design overlays
├── content.css                # Overlay styling and positioning
├── devtools-panel.html        # DevTools panel interface
├── devtools-panel.js          # DevTools panel functionality
├── devtools-panel.css         # DevTools panel styling
├── devtools-reset.css         # CSS reset for DevTools
├── image-manager.js           # Design file management logic
└── README.md                  # This file
```