import { storage } from '../../components/storage';

const query = new URLSearchParams(window.location.search);
const target = query.get('target');

const phraseDisplayEl = document.getElementById(
  'phrase-display'
) as HTMLElement;
const inputEl = document.getElementById('phrase') as HTMLTextAreaElement;
const buttonEl = document.getElementById('go') as HTMLButtonElement;
const customCaretEl = document.getElementById('custom-caret') as HTMLElement;

let expectedPhrase = '';

// Function to show/hide caret
const updateCaretVisibility = () => {
  if (document.activeElement === inputEl && inputEl.value === '') {
    customCaretEl.style.display = 'block';
  } else {
    customCaretEl.style.display = 'none';
  }
};

storage.get().then(({ rules }) => {
  const match = rules.find(r => target?.includes(r.url));
  if (match) {
    expectedPhrase = match.phrase;
    phraseDisplayEl.textContent = expectedPhrase;

    // Set up input event listener for real-time validation
    inputEl.addEventListener('input', () => {
      const currentValue = inputEl.value;
      updateCaretVisibility();

      if (currentValue === '') {
        // Empty input - grey state
        phraseDisplayEl.className = 'phrase-display grey';
        inputEl.className = 'phrase-input grey';
        buttonEl.classList.remove('visible');
      } else if (expectedPhrase.startsWith(currentValue)) {
        // Partial match - green state (on the right track)
        phraseDisplayEl.className = 'phrase-display green';
        inputEl.className = 'phrase-input green';
        if (currentValue === expectedPhrase) {
          buttonEl.classList.add('visible');
        } else {
          buttonEl.classList.remove('visible');
        }
      } else {
        // Incorrect phrase - red state
        phraseDisplayEl.className = 'phrase-display red';
        inputEl.className = 'phrase-input red';
        buttonEl.classList.remove('visible');
      }
    });

    // Set up focus/blur events for caret visibility
    inputEl.addEventListener('focus', updateCaretVisibility);
    inputEl.addEventListener('blur', updateCaretVisibility);

    // Set up keydown event listener for Enter key
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && inputEl.value === expectedPhrase) {
        window.location.href = target!;
      }
    });

    // Set up button click handler
    buttonEl.onclick = () => {
      if (inputEl.value === expectedPhrase) {
        window.location.href = target!;
      }
    };

    // Focus the input field
    inputEl.focus();
  } else {
    phraseDisplayEl.textContent = 'No phrase found for this URL';
    phraseDisplayEl.className = 'phrase-display red';
    inputEl.disabled = true;
    buttonEl.classList.remove('visible');
  }
});
