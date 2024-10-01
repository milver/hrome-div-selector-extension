let currentHighlight = null;

function addDebugMessage(message) {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML += message + '<br>';
}

function nodeHasMeaningfulText(node) {
    const text = node.text.trim();

    // Exclude specific tag types that are not relevant
    const excludedTags = ['script', 'style', 'svg', 'img', 'noscript'];
    if (excludedTags.some(tag => node.text.toLowerCase().startsWith(tag))) {
        addDebugMessage(`Filtering out node: ${node.text}`);
        return false;
    }

    // Ensure the node is not empty and doesn't only contain comments or whitespace
    const hasMeaningfulText = text !== '' && !node.text.startsWith('<!---->') && 
           (node.text.includes('visually-hidden') || node.text.includes('aria-hidden') || 
           (node.children && node.children.some(child => nodeHasMeaningfulText(child))));
    
    if (hasMeaningfulText) {
        addDebugMessage(`Keeping node: ${node.text}`);
    } else {
        addDebugMessage(`Filtering out node: ${node.text}`);
    }
    return hasMeaningfulText;
}

function filterTreeData(node) {
    if (!node) return null;

    let filteredChildren = node.children ? node.children.map(filterTreeData).filter(Boolean) : [];

    if (nodeHasMeaningfulText(node) || filteredChildren.length > 0) {
        return {
            text: node.text,
            children: filteredChildren.length > 0 ? filteredChildren : false,
            selector: node.selector
        };
    }

    return null;
}

function generateTreeData() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            addDebugMessage("Sending message to content script to get DOM structure");
            chrome.tabs.sendMessage(tabs[0].id, { action: "getDOMStructure" }, function(response) {
                if (response) {
                    addDebugMessage("Received DOM structure");
                    const filteredData = filterTreeData(response);
                    if (filteredData) {
                        addDebugMessage("Filtered tree data generated");
                        resolve(filteredData);
                    } else {
                        addDebugMessage("No meaningful data to display in tree");
                        resolve(null);
                    }
                } else {
                    addDebugMessage("No response from content script");
                    resolve(null);
                }
            });
        });
    });
}

function initializeJsTree() {
    addDebugMessage("Initializing jsTree");

    generateTreeData().then((treeData) => {
        if (treeData) {
            addDebugMessage("Tree data received, initializing jstree");
            $('#jstree').jstree({
                'core': {
                    'data': treeData,
                    'themes': {
                        'name': 'default',
                        'dots': false,
                        'icons': true
                    }
                },
                'types': {
                    'default': {
                        'icon': 'fas fa-folder'
                    },
                    'file': {
                        'icon': 'fas fa-file'
                    }
                },
                'plugins': ['types', 'state']
            }).on('open_node.jstree', function (e, data) {
                data.instance.set_icon(data.node, "fas fa-folder-open");
            }).on('close_node.jstree', function (e, data) {
                data.instance.set_icon(data.node, "fas fa-folder");
            }).on('changed.jstree', function (e, data) {
                if (data.selected.length) {
                    const nodeData = data.instance.get_node(data.selected[0]).original;
                    addDebugMessage(`Node selected, sending highlight message for ${nodeData.selector}`);
                    
                    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "highlightElement",
                            selector: nodeData.selector
                        });
                    });
                }
            });
        } else {
            addDebugMessage("No tree data found to initialize");
        }
    }).catch(error => {
        addDebugMessage("Error in tree data generation: " + error);
    });
}

// DomOutline Integration
function initializeDomOutline() {
    var myClickHandler = function(element) {
        addDebugMessage('Clicked element: ' + element);
    };

    var myDomOutline = DomOutline({ onClick: myClickHandler, filter: 'div' });

    // Start DomOutline when the DOM content loads
    myDomOutline.start();

    // Stop outline when needed (you can call myDomOutline.stop() from somewhere else if needed)
}

document.addEventListener('DOMContentLoaded', function() {
    addDebugMessage("DOM content loaded");
    initializeJsTree();
    initializeDomOutline();  // Initialize DomOutline for element selection

    document.getElementById('copyButton').addEventListener('click', function() {
        if (currentHighlight) {
            addDebugMessage("Copy button clicked, sending message to copy text");
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "copyText",
                    selector: currentHighlight
                }, function(response) {
                    if (response && response.text) {
                        navigator.clipboard.writeText(response.text).then(() => {
                            addDebugMessage("Text copied to clipboard");
                        }).catch(err => {
                            addDebugMessage("Failed to copy text: " + err);
                        });
                    } else {
                        addDebugMessage("No text received to copy");
                    }
                });
            });
        } else {
            addDebugMessage("No element selected");
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "contentScriptLoaded") {
        addDebugMessage("Content script loaded successfully");
    }
});
