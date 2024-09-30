$(document).ready(function() {
    // Initialize jsTree after the DOM is fully loaded
    $('#jstree').jstree({
      'core': {
        'data': [
          {
            "text": "Root node 1",
            "children": [
              {"text": "Child node 1", "id": "child_node_1"},
              {"text": "Child node 2"}
            ]
          },
          {"text": "Root node 2"}
        ]
      }
    });
  
    // Bind to events triggered on the tree
    $('#jstree').on("changed.jstree", function (e, data) {
      console.log('Selected node:', data.selected);
    });
  
    // Button interaction with the tree
    $('#copyBtn').on('click', function () {
      // Programmatically select a node
      $('#jstree').jstree(true).select_node('child_node_1');
      console.log('Child node 1 selected programmatically');
    });
  });
  