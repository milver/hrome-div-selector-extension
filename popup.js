let currentHighlight = null;

function addDebugMessage(message) {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML += message + '<br>';
    console.log(message);
}

function generateTreeData() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getDOMStructure"}, function(response) {
                resolve(response);
            });
        });
    });
}

function initializeJsTree() {
    addDebugMessage("Initializing jsTree");
    
    generateTreeData().then((treeData) => {
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
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "highlightElement",
                        selector: data.instance.get_node(data.selected[0]).original.selector
                    });
                });
                currentHighlight = data.instance.get_node(data.selected[0]).original.selector;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    addDebugMessage("DOM content loaded");
    initializeJsTree();

    document.getElementById('copyButton').addEventListener('click', function() {
        if (currentHighlight) {
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
                    }
                });
            });
        } else {
            addDebugMessage("No element selected");
        }
    });
});