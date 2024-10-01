chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getDOMStructure") {
        sendResponse(getNodeStructure(document.body));
    } else if (request.action === "highlightElement") {
        clearHighlight();  // Clear any existing highlights
        highlightElement(request.selector);  // Highlight the new element using DomOutline
    } else if (request.action === "copyText") {
        const text = getVisibleText(request.selector);
        clearHighlight();
        sendResponse({ text: text });
    }
});

// Function to generate the DOM structure
function getNodeStructure(element, path = '', depth = 0, maxDepth = 10) {
    let children = [];
    let selector = path;

    if (element.id) {
        selector += '#' + element.id;
    } else if (element.className && typeof element.className === 'string') {
        selector += '.' + element.className.split(' ').join('.');
    } else {
        selector += '>' + element.tagName.toLowerCase();
    }

    // Limit DOM traversal to a certain depth
    if (depth >= maxDepth) {
        return {
            text: element.tagName.toLowerCase() + 
                  (element.id ? '#' + element.id : '') + 
                  (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ').join('.') : ''),
            children: false,
            selector: selector
        };
    }

    Array.from(element.children).forEach((child) => {
        children.push(getNodeStructure(child, selector, depth + 1, maxDepth));
    });

    return {
        text: element.tagName.toLowerCase() + 
              (element.id ? '#' + element.id : '') + 
              (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ').join('.') : ''),
        children: children.length > 0 ? children : false,
        selector: selector
    };
}

function getVisibleText(selector) {
    const element = document.querySelector(selector);
    if (element) {
        return Array.from(element.querySelectorAll('*'))
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0)
            .join(' ')
            .trim();
    }
    return '';
}

// Function to highlight the element using DomOutline
function highlightElement(selector) {
    const element = document.querySelector(selector);  // Find the element using the selector
    if (element) {
        var myDomOutline = DomOutline({ onClick: function() {}, filter: 'div' });
        myDomOutline.start();  // Start DomOutline to highlight the element
    }
}

function clearHighlight() {
    const existingHighlight = document.querySelector('.highlight-overlay');
    if (existingHighlight) {
        existingHighlight.remove();
    }
}
