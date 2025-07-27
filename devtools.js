// DevTools script that creates the Quibble overlay panel
chrome.devtools.panels.create(
  'Quibble Overlay', // Panel display name
  null, // Icon path (null for default)
  'devtools-panel.html', // Panel HTML file
  function (panel) {
    // // Panel created callback
    // console.log('Quibble Overlay panel created');
    // // You can add panel-specific logic here
    // panel.onShown.addListener(function (window) {
    //   console.log('Quibble Overlay panel shown');
    //   // Send message to the panel when it's shown
    //   window.postMessage({ type: 'panelShown' }, '*');
    // });
    // panel.onHidden.addListener(function (window) {
    //   console.log('Quibble Overlay panel hidden');
    // });
  }
);
