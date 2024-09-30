// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "highlightElement") {
      const selector = request.elementInfo.selector;
      const element = document.querySelector(selector);
      if (element) {
        // Remove any existing highlights
        removeHighlights();
  
        // Highlight the selected element
        element.classList.add('highlighted-by-extension');
        element.style.backgroundColor = 'yellow';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
  
  // Function to remove existing highlights
  function removeHighlights() {
    const highlightedElements = document.querySelectorAll('.highlighted-by-extension');
    highlightedElements.forEach(el => {
      el.style.backgroundColor = '';
      el.classList.remove('highlighted-by-extension');
    });
  }
  