// Updated devtools_panel.js to include logic for verifying generated selectors and retrying with different configurations
console.log("devtools_panel.js loaded");
chrome.devtools.panels.create(
    "Div Selector",
    "icon16.png",
    "devtools_panel.html",
    function(panel) {
        console.log("Div Selector panel created.");
    }
);

let currentHighlight = null;

function addDebugMessage(message) {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML += message + '<br>';
    console.log(message);
}

function generateTreeData() {
    return new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(
            `(function() {
                function getNodeStructure(element, depth = 0, maxDepth = 20) {
                    if (!element || depth > maxDepth) {
                        return null;
                    }

                    let children = [];
                    let selector = getValidSelector(element);

                    Array.from(element.children).forEach((child) => {
                        const childNode = getNodeStructure(child, depth + 1, maxDepth);
                        if (childNode) {
                            children.push(childNode);
                        }
                    });

                    return {
                        text: selector, // Use valid selector as node name
                        children: children.length > 0 ? children : false,
                        selector: selector
                    };
                }

                function getValidSelector(element) {
                    // Try different configurations to generate a working selector
                    const configurations = [
                        () => getElementSelectorById(element),
                        () => getElementSelectorByClass(element),
                        () => getElementSelectorByHierarchy(element)
                    ];

                    for (let getSelector of configurations) {
                        const selector = getSelector();
                        if (selector && isValidSelector(selector)) {
                            return selector;
                        }
                    }

                    // Fallback to tag name if no other valid selector found
                    return element.tagName.toLowerCase();
                }

                function getElementSelectorById(element) {
                    if (element.id) {
                        return '#' + element.id;
                    }
                    return null;
                }

                function getElementSelectorByClass(element) {
                    if (element.className && typeof element.className === 'string') {
                        const className = element.className.trim().replace(/\s+/g, '.');
                        if (className) {
                            return element.tagName.toLowerCase() + '.' + className;
                        }
                    }
                    return null;
                }

                function getElementSelectorByHierarchy(element) {
                    let path = element.tagName.toLowerCase();
                    if (element.className && typeof element.className === 'string') {
                        const className = element.className.trim().split(/\s+/)[0]; // Use only the first class
                        if (className) {
                            path += '.' + className;
                        }
                    }

                    let parent = element.parentElement;
                    while (parent && parent.tagName.toLowerCase() !== 'html') {
                        if (parent.id) {
                            path = '#' + parent.id + ' > ' + path;
                            break;
                        } else {
                            let parentPath = parent.tagName.toLowerCase();
                            if (parent.className && typeof parent.className === 'string') {
                                const parentClassName = parent.className.trim().split(/\s+/)[0]; // Use only the first class
                                if (parentClassName) {
                                    parentPath += '.' + parentClassName;
                                }
                            }
                            path = parentPath + ' > ' + path;
                        }
                        parent = parent.parentElement;
                    }

                    return path;
                }

                function isValidSelector(selector) {
                    try {
                        return document.querySelector(selector) !== null;
                    } catch (e) {
                        return false;
                    }
                }

                return getNodeStructure(document.body);
            })()`,
            (result, isException) => {
                if (isException) {
                    reject('Error in generating tree data');
                } else {
                    resolve(result);
                }
            }
        );
    });
}

function initializeJsTree() {
    addDebugMessage('Initializing jsTree');

    generateTreeData().then((treeData) => {
        if (treeData) {
            addDebugMessage('Tree data received, initializing jsTree');
            console.log('Tree Data for jsTree:', JSON.stringify(treeData, null, 2));

            $('#jstree').jstree({
                'core': {
                    'data': treeData,
                    'themes': {
                        'name': 'default',
                        'dots': false,
                        'icons': true
                    }
                },
                'plugins': ['types']
            }).on('ready.jstree', function() {
                addDebugMessage('jsTree is ready!');
            }).on('changed.jstree', function (e, data) {
                if (data.selected.length) {
                    const nodeData = data.instance.get_node(data.selected[0]).original;
                    addDebugMessage(`Node selected, sending highlight message for ${nodeData.selector}`);
                    currentHighlight = nodeData.selector;
                    highlightElement(currentHighlight);
                }
            });
        } else {
            addDebugMessage('No tree data found to initialize');
        }
    }).catch(error => {
        addDebugMessage('Error in tree data generation: ' + error);
    });
}

function highlightElement(selector) {
    chrome.devtools.inspectedWindow.eval(`
        (function() {
            try {
                const element = document.querySelector('${selector}');
                if (element) {
                    inspect(element); // Jump to Elements tab and highlight the element
                } else {
                    console.warn('Element not found for selector:', '${selector}');
                }
            } catch (e) {
                console.error('Error during highlighting:', e);
            }
        })();
    `);
    console.log('Attempting to highlight element with selector:', selector);
}

document.addEventListener('DOMContentLoaded', function() {
    addDebugMessage('DOM content loaded');
    initializeJsTree();

    document.getElementById('copyButton').addEventListener('click', function() {
        if (currentHighlight) {
            chrome.devtools.inspectedWindow.eval(`
                (function() {
                    const element = document.querySelector('${currentHighlight}');
                    if (element) {
                        return element.innerText;
                    } else {
                        return '';
                    }
                })();
            `, function(result, isException) {
                if (!isException && result) {
                    fallbackCopyToClipboard(result);
                } else {
                    addDebugMessage('Element not found or no text available to copy.');
                }
            });
        } else {
            addDebugMessage('No element selected to copy text from');
        }
    });
});

function fallbackCopyToClipboard(text) {
    // Final deduplication check before copying to clipboard
    let lines = text.split('\n').map(line => line.trim());
    let uniqueLines = [];
    lines.forEach(line => {
        if (line && !uniqueLines.includes(line)) {
            uniqueLines.push(line);
        }
    });
    text = uniqueLines.join('\n');

    // Proceed with copying the deduplicated text
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            addDebugMessage('Text copied to clipboard using fallback method');
        } else {
            addDebugMessage('Failed to copy text using fallback method, prompting user to manually copy');
            alert('Unable to automatically copy the text. Please manually copy the text from below:\n\n' + text);
        }
    } catch (err) {
        addDebugMessage('Failed to copy text using fallback method: ' + err);
        alert('Unable to automatically copy the text. Please manually copy the text from below:\n\n' + text);
    }
    document.body.removeChild(textArea);
}

