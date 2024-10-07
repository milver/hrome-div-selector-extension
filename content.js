chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getDOMStructure") {
        console.log("Received request for DOM structure");
        sendResponse(getNodeStructure(document.body));
    } else if (request.action === "highlightElement") {
        console.log("Highlighting element:", request.selector);
        clearHighlight();  
        highlightElement(request.selector);  
    } else if (request.action === "copyText") {
        console.log("Copying text from element:", request.selector);
        const text = getVisibleText(request.selector);
        clearHighlight();
        sendResponse({ text: text });
    }
    return true;
});

function getNodeStructure(element, path = '', depth = 0, maxDepth = 20) { 
    let children = [];
    let selector = path;

    if (element.id) {
        selector += '#' + element.id;  
    } else if (element.className && typeof element.className === 'string') {
        const className = element.className.split(' ').filter(Boolean)[0];  
        if (className) {
            selector += '.' + className;
        } else {
            selector += '>' + element.tagName.toLowerCase();  
        }
    } else {
        selector += '>' + element.tagName.toLowerCase();  
    }

    if (depth >= maxDepth) {
        return {
            text: element.tagName.toLowerCase() + 
                  (element.id ? '#' + element.id : '') + 
                  (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ')[0] : ''),
            children: false,
            selector: selector
        };
    }

    Array.from(element.children).forEach((child) => {
        children.push(getNodeStructure(child, selector + ' > ', depth + 1, maxDepth));  
    });

    return {
        text: element.tagName.toLowerCase() + 
              (element.id ? '#' + element.id : '') + 
              (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ')[0] : ''),
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
            .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
            .trim();
    }
    return '';
}

function highlightElement(selector) {
    clearHighlight();  
    const element = document.querySelector(selector);  
    if (element) {
        var myDomOutline = DomOutline({ onClick: function() {}, filter: '*' });
        myDomOutline.start(element);  
        console.log('Element found and outlined for selector: ', selector);  
    } else {
        console.log('Element not found for selector: ', selector);  
    }
}

function clearHighlight() {
    const existingHighlight = document.querySelector('.highlight-overlay');
    if (existingHighlight) {
        existingHighlight.remove();
    }

    const outlineElements = document.querySelectorAll('.DomOutline, .DomOutline_label');
    outlineElements.forEach(element => element.remove());
}