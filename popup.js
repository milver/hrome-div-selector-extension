document.addEventListener("DOMContentLoaded", function () {
    const divSelector = document.getElementById('divSelector');
    const highlightBtn = document.getElementById('highlightBtn');
  
    // Request divs from the content script
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: getDivs
      }, (results) => {
        const divs = results[0].result;
  
        // Populate combobox with div elements
        divs.forEach((div, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `Div ${index + 1}: ${div.text}`;
          divSelector.appendChild(option);
        });
      });
    });
  
    // Handle highlight button click
    highlightBtn.addEventListener('click', function () {
      const selectedDivIndex = divSelector.value;
      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: highlightDiv,
          args: [parseInt(selectedDivIndex)]
        });
      });
    });
  });
  
  // Function to retrieve all divs on the page
  function getDivs() {
    const divs = document.querySelectorAll('div');
    return Array.from(divs).map(div => ({
      text: div.innerText.slice(0, 50), // Limiting the text length to 50 characters for display
      html: div.innerHTML
    }));
  }
  
  // Function to highlight the selected div
  function highlightDiv(index) {
    const divs = document.querySelectorAll('div');
    const selectedDiv = divs[index];
    selectedDiv.style.backgroundColor = 'yellow'; // Highlight the div
    window.scrollTo({ top: selectedDiv.offsetTop, behavior: 'smooth' }); // Scroll to the div
  }
  