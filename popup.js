let currentHighlight = null;

function addDebugMessage(message) {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML += message + '<br>';
    console.log(message);  // Also logging to console for extra visibility
}

function generateTreeData() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            addDebugMessage("Sending message to content script to get DOM structure");
            chrome.tabs.sendMessage(tabs[0].id, {action: "getDOMStructure"}, function(response) {
                if (response) {
                    addDebugMessage("Received DOM structure");
                    resolve(response);
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
            addDebugMessage("Tree data received");
            $('#jstree').jstree({
                'core': {
                    'data': treeData,
                    'themes': {
                        'name': 'default',
                        'dots': false,
                        'icons': false
                    }
                }
            }).on('changed.jstree', function (e, data) {
                if(data.selected.length) {
                    addDebugMessage("Node selected, sending highlight message");
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "highlightElement",
                            selector: data.instance.get_node(data.selected[0]).original.selector
                        });
                    });
                    currentHighlight = data.instance.get_node(data.selected[0]).original.selector;
                }
            });
        } else {
            addDebugMessage("No tree data found");
        }
    }).catch(error => {
        addDebugMessage("Error in tree data generation: " + error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    addDebugMessage("DOM content loaded");
    initializeJsTree();

    document.getElementById('copyButton').addEventListener('click', function() {
        if (currentHighlight) {
            addDebugMessage("Copy button clicked, sending message to copy text");
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
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
