const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
const mobileClose = document.querySelector('.mobile-close');
const mobileLinks = [...mobileMenu.querySelectorAll('a')];
const navigationLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-menu nav a')];
const portrait = document.querySelector('.hero-portrait');
const portraitImage = portrait.querySelector('img');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopPointer = window.matchMedia('(min-width: 1025px) and (pointer: fine)');

let lastFocusedElement = null;

function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileMenu.setAttribute('aria-hidden', String(!open));
  mobileMenu.toggleAttribute('inert', !open);
  mobileMenu.classList.toggle('is-open', open);
  body.classList.toggle('menu-open', open);

  if (open) {
    lastFocusedElement = document.activeElement;
    window.setTimeout(() => mobileClose.focus(), reduceMotion.matches ? 0 : 180);
  } else if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

menuToggle.addEventListener('click', () => setMenu(true));
mobileClose.addEventListener('click', () => setMenu(false));
mobileLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

function setActiveNavigation(href) {
  navigationLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === href;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => setActiveNavigation(link.getAttribute('href')));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
    setMenu(false);
  }

  if (event.key !== 'Tab' || !mobileMenu.classList.contains('is-open')) return;

  const focusable = [mobileClose, ...mobileLinks];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function showPortrait() {
  portrait.classList.remove('is-placeholder');
}

function showPortraitFallback() {
  portrait.classList.add('is-placeholder');
}

portraitImage.addEventListener('load', showPortrait);
portraitImage.addEventListener('error', showPortraitFallback);

if (portraitImage.complete) {
  portraitImage.naturalWidth > 0 ? showPortrait() : showPortraitFallback();
}

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
let frameId = 0;

function renderParallax() {
  currentX += (targetX - currentX) * 0.075;
  currentY += (targetY - currentY) * 0.075;

  document.documentElement.style.setProperty('--glow-x', `${currentX * 10}px`);
  document.documentElement.style.setProperty('--glow-y', `${currentY * 8}px`);
  document.documentElement.style.setProperty('--portrait-x', `${currentX * -6}px`);
  document.documentElement.style.setProperty('--portrait-y', `${currentY * -5}px`);
  document.documentElement.style.setProperty('--ghost-x', `${currentX * 3}px`);
  document.documentElement.style.setProperty('--ghost-y', `${currentY * 3}px`);

  if (Math.abs(targetX - currentX) > .001 || Math.abs(targetY - currentY) > .001) {
    frameId = window.requestAnimationFrame(renderParallax);
  } else {
    frameId = 0;
  }
}

function updatePointer(event) {
  if (!desktopPointer.matches || reduceMotion.matches) return;

  targetX = (event.clientX / window.innerWidth - .5) * 2;
  targetY = (event.clientY / window.innerHeight - .5) * 2;

  if (!frameId) frameId = window.requestAnimationFrame(renderParallax);
}

function resetPointer() {
  targetX = 0;
  targetY = 0;
  if (!frameId) frameId = window.requestAnimationFrame(renderParallax);
}

window.addEventListener('pointermove', updatePointer, { passive: true });
document.documentElement.addEventListener('mouseleave', resetPointer);

desktopPointer.addEventListener('change', resetPointer);
reduceMotion.addEventListener('change', resetPointer);

window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && mobileMenu.classList.contains('is-open')) {
    setMenu(false);
  }
}, { passive: true });
