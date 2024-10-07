let currentHighlight = null;

function addDebugMessage(message) {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML += message + '<br>';
    console.log(message);
}

function generateTreeData() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            addDebugMessage("Sending message to content script to get DOM structure");
            chrome.tabs.sendMessage(tabs[0].id, { action: "getDOMStructure" }, function(response) {
                if (response) {
                    console.log("DOM Structure received:", response);
                    addDebugMessage("Received DOM structure");
                    resolve(response);
                } else {
                    addDebugMessage("No response from content script");
                    reject(new Error("No response from content script"));
                }
            });
        });
    });
}

function initializeJsTree() {
    addDebugMessage("Initializing jsTree");

    generateTreeData().then((treeData) => {
        if (treeData) {
            addDebugMessage("Tree data received, initializing jsTree");
            console.log("Tree Data for jsTree:", JSON.stringify(treeData, null, 2));
            
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
                addDebugMessage("jsTree is ready!");
            }).on('changed.jstree', function (e, data) {
                if (data.selected.length) {
                    const nodeData = data.instance.get_node(data.selected[0]).original;
                    addDebugMessage(`Node selected, sending highlight message for ${nodeData.selector}`);
                    currentHighlight = nodeData.selector;

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

document.addEventListener('DOMContentLoaded', function() {
    addDebugMessage("DOM content loaded");
    initializeJsTree();

    document.getElementById('copyButton').addEventListener('click', function() {
        if (currentHighlight) {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "copyText",
                    selector: currentHighlight
                }, function(response) {
                    if (response && response.text) {
                        navigator.clipboard.writeText(response.text).then(function() {
                            addDebugMessage("Text copied to clipboard");
                        }, function(err) {
                            addDebugMessage("Failed to copy text: " + err);
                        });
                    } else {
                        addDebugMessage("No text received to copy");
                    }
                });
            });
        } else {
            addDebugMessage("No element selected to copy text from");
        }
    });
});