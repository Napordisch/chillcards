// Prevent multiple initializations
if (typeof window.flashcardMakerInitialized === 'undefined') {
  window.flashcardMakerInitialized = true;

  let isCollectingFront = true;
  let currentCard = {};

  // Function to convert an image to data URL
  async function imageToDataURL(img) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    });
  }

  // Function to process HTML content and convert images
  async function processContent(element) {
    const images = element.getElementsByTagName('img');
    for (let img of images) {
      try {
        const dataUrl = await imageToDataURL(img);
        img.src = dataUrl;
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }
    return element.innerHTML;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelection") {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

      // Process the content and respond
      processContent(tempDiv).then(processedHTML => {
        if (isCollectingFront) {
          currentCard.front = processedHTML;
          isCollectingFront = false;
          sendResponse({ message: "Front side collected. Now select the back side." });
        } else {
          currentCard.back = processedHTML;
          isCollectingFront = true;
          sendResponse({ card: currentCard });
          currentCard = {};
        }
      });

      return true; // Keep the message channel open for async response
    }
  });
} 