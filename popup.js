let cards = [];

// Simple HTML sanitizer function
function sanitizeHTML(html) {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  const status = document.getElementById('status');
  const cardList = document.getElementById('cardList');
  const reviewBtn = document.getElementById('reviewBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importInput = document.getElementById('importInput');

  // Load existing cards
  chrome.storage.local.get(['flashcards'], function(result) {
    if (result.flashcards) {
      cards = result.flashcards;
      displayCards();
    }
  });

  captureBtn.addEventListener('click', async () => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Ensure we have a valid tab
      if (!tab) {
        status.textContent = "Error: No active tab found";
        return;
      }

      // Send message to content script with timeout
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "getSelection" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Timeout waiting for response')), 5000);
      });

      if (response.card) {
        // We got a complete card
        cards.push(response.card);
        chrome.storage.local.set({ flashcards: cards });
        displayCards();
        status.textContent = "Карточка добавлена";
      } else if (response.message) {
        // We got the front side
        status.textContent = response.message;
      }
    } catch (error) {
      console.error('Error:', error);
      status.textContent = "Ничего не выделено или не получилось сохранить выделение.";
    }
  });

  reviewBtn.addEventListener('click', () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('review.html'),
      type: 'popup',
      width: 800,
      height: 600
    });
  });

  exportBtn.addEventListener('click', exportCards);

  importBtn.addEventListener('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedCards = JSON.parse(e.target.result);
          
          // Validate the imported data
          if (!Array.isArray(importedCards)) {
            throw new Error('Invalid file format');
          }
          
          // Confirm before importing
          if (confirm(`Import ${importedCards.length} cards? This will add to your existing cards.`)) {
            // Add imported cards to existing cards
            cards = cards.concat(importedCards);
            
            // Save to storage
            chrome.storage.local.set({ flashcards: cards }, () => {
              displayCards();
              status.textContent = `Successfully imported ${importedCards.length} cards!`;
              // Reset the file input
              importInput.value = '';
            });
          }
        } catch (error) {
          status.textContent = 'Error: Invalid file format';
          console.error('Import error:', error);
          // Reset the file input
          importInput.value = '';
        }
      };
      reader.readAsText(file);
    }
  });

  function displayCards() {
    cardList.innerHTML = '';
    cards.forEach((card, index) => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      
      // Create card content with sanitized HTML
      const frontContent = document.createElement('div');
      frontContent.className = 'card-content';
      frontContent.innerHTML = card.front;

      const backContent = document.createElement('div');
      backContent.className = 'card-content';
      backContent.innerHTML = card.back;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Удалить';
      deleteBtn.addEventListener('click', () => deleteCard(index));

      cardElement.innerHTML = `
        <div class="card-side">
          <strong>Наружняя сторона:</strong>
        </div>
        <div class="card-side">
          <strong>Внутренняя сторона:</strong>
        </div>
      `;

      // Insert content safely
      cardElement.querySelector('.card-side:first-child').appendChild(frontContent);
      cardElement.querySelector('.card-side:last-of-type').appendChild(backContent);
      cardElement.appendChild(deleteBtn);
      
      cardList.appendChild(cardElement);
    });
  }

  function deleteCard(index) {
    cards.splice(index, 1);
    chrome.storage.local.set({ flashcards: cards });
    displayCards();
  }

  function exportCards() {
    const dataStr = JSON.stringify(cards, null, 2);
    
    // Create a Blob containing the data
    const blob = new Blob([dataStr], {type: 'application/json'});
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flashcards.json';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}); 