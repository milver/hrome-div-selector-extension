// JavaScript for handling DevTools panel interactions
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
            const element = document.querySelector('${selector}');
            if (element) {
                inspect(element);
            }
        })();
    `);
    console.log('Element found and highlighted for selector: ', selector);
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
                    navigator.clipboard.writeText(result).then(function() {
                        addDebugMessage('Text copied to clipboard');
                    }, function(err) {
                        addDebugMessage('Failed to copy text: ' + err);
                    });
                } else {
                    addDebugMessage('Element not found or no text available to copy.');
                }
            });
        } else {
            addDebugMessage('No element selected to copy text from');
        }
    });
});