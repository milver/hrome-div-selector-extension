// Updated content.js to work with the DevTools panel integration

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getDOMStructure") {
        console.log("Received request for DOM structure");
        sendResponse(getNodeStructure(document.body));
    } else if (request.action === "copyText") {
        console.log("Copying text from element:", request.selector);
        let text = getVisibleText(request.selector);

        // Remove duplicate lines before sending response
        let lines = text.split('\n').map(line => line.trim());
        let uniqueLines = [];
        lines.forEach(line => {
            if (line && !uniqueLines.includes(line)) {
                uniqueLines.push(line);
            }
        });
        text = uniqueLines.join('\n');

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
        return getVisibleTextFromElement(element).trim();
    }
    return '';
}

function getVisibleTextFromElement(element) {
    let lines = [];

    element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text.length > 0) {
                lines.push(text);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const computedStyle = window.getComputedStyle(node);
            const isBlock = computedStyle.display === 'block' || computedStyle.display === 'flex' || computedStyle.display === 'grid';
            
            const childText = getVisibleTextFromElement(node);
            if (childText.length > 0) {
                if (isBlock) {
                    lines.push('\n' + childText);
                } else {
                    lines.push(childText);
                }
            }
        }
    });

    // Debugging the line passing process to see how text lines are handled
    console.log('Collected lines before deduplication:', lines);
    lines = lines.map(line => line.trim());  // Trim each line

    // Remove empty and duplicate lines, and also check for duplicate paragraph blocks
    let uniqueLines = [];
    lines.forEach(line => {
        if (line && !uniqueLines.includes(line)) {
            uniqueLines.push(line);
        }
    });

    console.log('Collected lines after deduplication:', uniqueLines);
    return uniqueLines.join('\n');
}
