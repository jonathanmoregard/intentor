import { fuzzyMatch, fuzzyPartialMatch } from '../../components/fuzzy-matching';
import { storage } from '../../components/storage';

// Particles animation setup
const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;

if (!canvas) {
  console.error('Canvas element not found');
}

const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('Could not get 2D context from canvas');
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

interface Particle {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speedX: number;
  speedY: number;
  directionChangeTimer: number;
}

const PARTICLE_COUNT = 160;
const particles: Particle[] = [];

// Functions to generate consistent particle properties
const generateParticlePosition = () => ({
  x: Math.random() * canvas.width,
  y: (0.4 + Math.random() * 0.6) * canvas.height,
});

const generateParticleRadius = () => Math.random() * 1.8 + 1;

const generateParticleAlpha = () => Math.random() * 0.35 + 0.1; // Visible but ambient

const generateParticleSpeedX = () => (Math.random() - 0.5) * 0.15;

const generateParticleSpeedY = () => -0.05 - Math.random() * 0.05;

const generateDirectionChangeTimer = () => Math.random() * 200 + 100; // Random timer between 100-300 frames

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const position = generateParticlePosition();

  particles.push({
    x: position.x,
    y: position.y,
    r: generateParticleRadius(),
    alpha: generateParticleAlpha(),
    speedX: generateParticleSpeedX(),
    speedY: generateParticleSpeedY(),
    directionChangeTimer: generateDirectionChangeTimer(),
  });
}

function draw() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);

  for (let p of particles) {
    // Draw golden and white particles
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.r, 0, 2 * Math.PI);

    // Alternate between golden and white
    if (p.x % 2 === 0) {
      ctx!.fillStyle = `rgba(254, 227, 164, ${p.alpha})`; // Golden
    } else {
      ctx!.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // White
    }
    ctx!.fill();

    // Update direction change timer
    p.directionChangeTimer--;

    // Occasionally change horizontal direction
    if (p.directionChangeTimer <= 0) {
      p.speedX = generateParticleSpeedX(); // New random horizontal speed
      p.directionChangeTimer = generateDirectionChangeTimer();
    }

    p.x += p.speedX;
    p.y += p.speedY;

    if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
      const position = generateParticlePosition();

      p.x = position.x;
      p.y = position.y;
      p.r = generateParticleRadius();
      p.alpha = generateParticleAlpha();
      p.speedX = generateParticleSpeedX();
      p.speedY = generateParticleSpeedY();
      p.directionChangeTimer = generateDirectionChangeTimer();
    }
  }

  requestAnimationFrame(draw);
}

draw();

const query = new URLSearchParams(window.location.search);
const target = query.get('target');
const intentionId = query.get('intentionScopeId');

const phraseDisplayEl = document.getElementById(
  'phrase-display'
) as HTMLElement;
const inputEl = document.getElementById('phrase') as HTMLTextAreaElement;
const buttonEl = document.getElementById('go') as HTMLButtonElement;
const helperTextEl = document.getElementById('helper-text') as HTMLElement;

let expectedPhrase = '';

storage.get().then(({ intentions, fuzzyMatching = true }) => {
  // Use intention ID for precise lookup
  const match = intentions.find(r => r.id === intentionId);
  if (match) {
    expectedPhrase = match.phrase;
    phraseDisplayEl.textContent = expectedPhrase;

    // Unified fuzzy matching configuration
    const maxDistance = 2;

    // Function to check if input is an acceptable partial prompt
    const acceptablePartialPrompt = (input: string): boolean => {
      if (!fuzzyMatching) {
        return expectedPhrase.startsWith(input);
      } else {
        return fuzzyPartialMatch(input, expectedPhrase, maxDistance);
      }
    };

    // Function to check if input is an acceptable complete prompt
    const acceptableCompletePrompt = (input: string): boolean => {
      if (!fuzzyMatching) {
        return input === expectedPhrase;
      } else {
        return fuzzyMatch(input, expectedPhrase, maxDistance);
      }
    };

    // Set up input event listener for real-time validation
    inputEl.addEventListener('input', e => {
      // Prevent processing if this is from an Enter key press
      if (e instanceof InputEvent && e.inputType === 'insertLineBreak') {
        return;
      }

      const currentValue = inputEl.value;

      if (currentValue === '') {
        // Empty input - grey state
        phraseDisplayEl.className = 'phrase-display grey';
        inputEl.className = 'phrase-input grey';
        buttonEl.disabled = true;
        helperTextEl.classList.remove('visible');
      } else if (acceptablePartialPrompt(currentValue)) {
        // Partial match - green state (on the right track)
        phraseDisplayEl.className = 'phrase-display green';
        inputEl.className = 'phrase-input green';
        helperTextEl.classList.remove('visible');
        if (acceptableCompletePrompt(currentValue)) {
          buttonEl.disabled = false;
        } else {
          buttonEl.disabled = true;
        }
      } else {
        // Incorrect phrase - show red state immediately
        phraseDisplayEl.className = 'phrase-display red';
        inputEl.className = 'phrase-input red';
        buttonEl.disabled = true;
        helperTextEl.classList.add('visible');
      }
    });

    // Set up keydown event listener for Enter key
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent newline from being added
        if (acceptableCompletePrompt(inputEl.value)) {
          window.location.href = target!;
        }
      }
    });

    // Set up button click handler
    buttonEl.onclick = () => {
      if (!buttonEl.disabled && acceptableCompletePrompt(inputEl.value)) {
        // Add click animation
        const container = document.querySelector('.container') as HTMLElement;
        container.classList.add('clicking');

        // Navigate after animation
        setTimeout(() => {
          window.location.href = target!;
        }, 200);
      }
    };

    // Focus the input field
    inputEl.focus();
  } else {
    phraseDisplayEl.textContent = 'No phrase found for this URL';
    phraseDisplayEl.className = 'phrase-display red';
    inputEl.disabled = true;
    buttonEl.disabled = true;
  }
});
