function getNodeStructure(element, path = '') {
    let children = [];
    let selector = path;
    
    if (element.id) {
        selector += '#' + element.id;
    } else if (element.className && typeof element.className === 'string') {
        selector += '.' + element.className.split(' ').join('.');
    } else {
        selector += '>' + element.tagName.toLowerCase();
    }

    Array.from(element.children).forEach((child) => {
        children.push(getNodeStructure(child, selector));
    });

    return {
        text: element.tagName.toLowerCase() + (element.id ? '#' + element.id : '') + (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ').join('.') : ''),
        children: children,
        selector: selector
    };
}

function highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.outline = '2px solid red';
        element.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
}

function clearHighlight() {
    const highlighted = document.querySelector('[style*="outline: 2px solid red"]');
    if (highlighted) {
        highlighted.style.outline = '';
    }
}

function getVisibleText(selector) {
    const element = document.querySelector(selector);
    if (element) {
        return element.innerText;
    }
    return '';
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getDOMStructure") {
        sendResponse(getNodeStructure(document.body));
    } else if (request.action === "highlightElement") {
        clearHighlight();
        highlightElement(request.selector);
    } else if (request.action === "copyText") {
        const text = getVisibleText(request.selector);
        clearHighlight();
        sendResponse({text: text});
    }
});
