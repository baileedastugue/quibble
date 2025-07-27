// DevTools script that creates the Quibble overlay panel
chrome.devtools.panels.create(
  'Quibble', // Panel display name
  null, // Icon path (null for default)
  'devtools-panel.html', // Panel HTML file
  function (panel) {}
);
