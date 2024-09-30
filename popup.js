function addDebugMessage(message) {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML += message + '<br>';
    console.log(message);  // Also log to console for easier debugging
}

function checkJQuery() {
    if (typeof jQuery === 'undefined') {
        addDebugMessage("Error: jQuery is not defined");
        return false;
    }
    addDebugMessage("jQuery version: " + jQuery.fn.jquery);
    return true;
}

function checkJsTree() {
    if (typeof jQuery.fn.jstree === 'undefined') {
        addDebugMessage("Error: jsTree is not defined");
        return false;
    }
    addDebugMessage("jsTree is defined");
    return true;
}

function initializeJsTree() {
    addDebugMessage("Attempting to initialize jsTree");
    
    if (!checkJQuery() || !checkJsTree()) {
        return;
    }

    try {
        jQuery('#jstree').jstree({
            'core': {
                'data': [
                    { "text" : "Root node", "children" : [
                        { "text" : "Child node 1" },
                        { "text" : "Child node 2" }
                    ]}
                ]
            }
        });

        jQuery('#jstree').on("changed.jstree", function (e, data) {
            console.log('Node selected:', data.selected);
        });

        addDebugMessage("jsTree initialized successfully");
    } catch (error) {
        addDebugMessage("Error initializing jsTree: " + error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    addDebugMessage("DOM content loaded");
    addDebugMessage("Checking script loading:");
    addDebugMessage("jQuery script: " + (document.querySelector('script[src*="jquery"]') ? "Found" : "Not found"));
    addDebugMessage("jsTree script: " + (document.querySelector('script[src*="jstree"]') ? "Found" : "Not found"));
    setTimeout(initializeJsTree, 100);  // Short delay to ensure scripts are loaded
});