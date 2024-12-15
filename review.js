let cards = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', async function() {
  const result = await chrome.storage.local.get(['flashcards']);
  cards = result.flashcards || [];
  
  const cardElement = document.getElementById('flashcard');
  const frontElement = document.querySelector('.card-front');
  const backElement = document.querySelector('.card-back');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const flipBtn = document.getElementById('flipBtn');
  const currentCardSpan = document.getElementById('currentCard');
  const totalCardsSpan = document.getElementById('totalCards');

  function updateCard() {
    if (cards.length === 0) {
      frontElement.innerHTML = '<h2>No cards available</h2>';
      backElement.innerHTML = '';
      currentCardSpan.textContent = '0';
      totalCardsSpan.textContent = '0';
      return;
    }

    const card = cards[currentIndex];
    frontElement.innerHTML = card.front;
    backElement.innerHTML = card.back;
    currentCardSpan.textContent = (currentIndex + 1).toString();
    totalCardsSpan.textContent = cards.length.toString();
    cardElement.classList.remove('is-flipped');
  }

  cardElement.addEventListener('click', () => {
    cardElement.classList.toggle('is-flipped');
  });

  flipBtn.addEventListener('click', () => {
    cardElement.classList.toggle('is-flipped');
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCard();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < cards.length - 1) {
      currentIndex++;
      updateCard();
    }
  });

  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) {
          currentIndex--;
          updateCard();
        }
        break;
      case 'ArrowRight':
        if (currentIndex < cards.length - 1) {
          currentIndex++;
          updateCard();
        }
        break;
      case ' ': // Spacebar
        cardElement.classList.toggle('is-flipped');
        e.preventDefault(); // Prevent page scrolling
        break;
    }
  });

  // Initialize
  updateCard();
}); 