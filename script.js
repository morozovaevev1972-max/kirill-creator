const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
const mobileClose = document.querySelector('.mobile-close');
const mobileLinks = [...mobileMenu.querySelectorAll('a')];
const navigationLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-menu nav a')];
const portrait = document.querySelector('.hero-portrait');
const portraitImage = portrait.querySelector('img');
const heroSection = document.querySelector('.hero');
const revealElements = [...document.querySelectorAll('.reveal')];
const projectVideos = [...document.querySelectorAll('.project-video')];
const projectCards = [...document.querySelectorAll('.project-card')];
const loopPreviewEntries = projectCards
  .map((card) => ({ card, video: card.querySelector('.project-video'), inViewport: false }))
  .filter(({ video }) => hasPortfolioVideoSource(video));
const loopPreviewVideos = new Set(loopPreviewEntries.map(({ video }) => video));
const filterButtons = [...document.querySelectorAll('.works-filter button')];
const allProjectsGrid = document.querySelector('.all-projects-grid');
const featuredStage = document.querySelector('#featured-stage');
const featuredVideo = featuredStage.querySelector('.featured-stage__video');
const featuredCategory = featuredStage.querySelector('[data-featured-category]');
const featuredDescription = featuredStage.querySelector('[data-featured-description]');
const featuredIndex = featuredStage.querySelector('[data-featured-index]');
const projectViewer = document.querySelector('#project-viewer');
const viewerDialog = projectViewer.querySelector('.project-viewer__dialog');
const viewerClose = projectViewer.querySelector('.project-viewer__close');
const viewerVideo = projectViewer.querySelector('.project-viewer__video');
const viewerTitle = projectViewer.querySelector('#viewer-title');
const viewerCategory = projectViewer.querySelector('#viewer-category');
const viewerDescription = projectViewer.querySelector('#viewer-description');
const portfolioFullscreen = document.querySelector('#portfolio-fullscreen');
const portfolioFullscreenStage = portfolioFullscreen.querySelector('[data-portfolio-fullscreen-stage]');
const portfolioFullscreenClose = portfolioFullscreen.querySelector('[data-portfolio-fullscreen-close]');
const portfolioFullscreenTriggers = [...document.querySelectorAll('[data-portfolio-fullscreen-trigger]')];
const portfolioManagedVideos = [featuredVideo, viewerVideo];
const toolsSection = document.querySelector('.tools-section');
const toolsEyeFrame = toolsSection.querySelector('.tools-eye-frame');
const toolCards = [...toolsSection.querySelectorAll('.tool-card')];
const eyeToolIcons = [...toolsSection.querySelectorAll('.eye-tool-icon')];
const whyGlassModules = [...document.querySelectorAll('.why-glass')];
const aboutSection = document.querySelector('.about-section');
const aboutMedia = aboutSection.querySelector('.about-media');
const contactSection = document.querySelector('.contact-section');
const contactRevealElements = [...contactSection.querySelectorAll('[data-reveal]')];
const globalAmbientLight = document.querySelector('.global-ambient-light');
const cursorAmbientLight = document.querySelector('.cursor-ambient-light');
const cinematicDepthLayer = document.querySelector('.cinematic-depth-layer');
const cinematicDepthPlanes = [...cinematicDepthLayer.querySelectorAll('[data-depth-plane]')];
const cinematicSections = [...document.querySelectorAll('.hero, .selected-works, .tools-section, .services-section, .why-section, #pricing, #about, #contact')];
const motionSections = [...document.querySelectorAll('.selected-works, .tools-section, .services-section, .why-section, #pricing, #about, #contact')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopPointer = window.matchMedia('(min-width: 1025px) and (pointer: fine)');
const previewHover = window.matchMedia('(hover: hover) and (pointer: fine)');

let lastFocusedElement = null;
let lastViewerFocus = null;
let selectedWorksMode = 'all';
let portfolioPreviewLoopTimer = 0;
let portfolioFullscreenSession = null;
let portfolioFullscreenClosing = false;
let portfolioNativeFullscreenRedirecting = false;
const PORTFOLIO_PREVIEW_DURATION = 7;

const cinematicFocusPoints = {
  top: [76, 52],
  work: [52, 56],
  tools: [31, 52],
  services: [55, 55],
  'why-me': [44, 47],
  pricing: [58, 55],
  about: [30, 52],
  contact: [50, 50]
};
let cinematicSectionMetrics = [];

function measureCinematicSections() {
  cinematicSectionMetrics = cinematicSections.map((section) => {
    const rect = section.getBoundingClientRect();
    return {
      section,
      documentTop: rect.top + window.scrollY,
      height: rect.height
    };
  });
}

function seededParticleValue(index, salt) {
  const value = Math.sin((index + 1) * (12.9898 + salt * 4.1414)) * 43758.5453;
  return value - Math.floor(value);
}

cinematicDepthPlanes.forEach((plane, planeIndex) => {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 8; index += 1) {
    const particle = document.createElement('i');
    const particleIndex = planeIndex * 8 + index;
    particle.className = 'depth-particle';
    particle.style.setProperty('--particle-x', `${(5 + seededParticleValue(particleIndex, 1) * 90).toFixed(2)}%`);
    particle.style.setProperty('--particle-y', `${(4 + seededParticleValue(particleIndex, 2) * 92).toFixed(2)}%`);
    particle.style.setProperty('--particle-size', `${(1 + seededParticleValue(particleIndex, 3) * 1.8).toFixed(2)}px`);
    particle.style.setProperty('--particle-opacity', `${(.11 + seededParticleValue(particleIndex, 4) * .25).toFixed(3)}`);
    fragment.append(particle);
  }

  plane.append(fragment);
});

measureCinematicSections();

if ('ResizeObserver' in window) {
  const cinematicLayoutObserver = new ResizeObserver(() => {
    measureCinematicSections();
    queueScrollParallax();
  });

  cinematicSections.forEach((section) => cinematicLayoutObserver.observe(section));
}

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
  if (portfolioFullscreenSession) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePortfolioFullscreen();
    }
    return;
  }

  if (projectViewer.classList.contains('is-open')) {
    if (event.key === 'Escape') {
      closeProjectViewer();
      return;
    }

    if (event.key === 'Tab') {
      const viewerFocusable = [...viewerDialog.querySelectorAll('button, video[controls], [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => window.getComputedStyle(element).display !== 'none');
      const viewerFirst = viewerFocusable[0];
      const viewerLast = viewerFocusable[viewerFocusable.length - 1];

      if (event.shiftKey && document.activeElement === viewerFirst) {
        event.preventDefault();
        viewerLast.focus();
      } else if (!event.shiftKey && document.activeElement === viewerLast) {
        event.preventDefault();
        viewerFirst.focus();
      }
    }

    return;
  }

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
let scrollFrameId = 0;
let mobileCinematicStatic = false;
let eyeFrameId = 0;
let eyeTargetX = 0;
let eyeTargetY = 0;
let eyeCurrentX = 0;
let eyeCurrentY = 0;
let glassLightFrameId = 0;
let pendingGlassModule = null;
let pendingGlassX = 50;
let pendingGlassY = 50;
let orbitSlowTimer = 0;
let cursorTargetX = window.innerWidth / 2;
let cursorTargetY = window.innerHeight / 2;
let cursorCurrentX = cursorTargetX;
let cursorCurrentY = cursorTargetY;
let ambientTargetX = 42;
let ambientTargetY = 52;
let ambientCurrentX = ambientTargetX;
let ambientCurrentY = ambientTargetY;
let ambientFrameId = 0;

function configureRevealSystem() {
  const mobileReveal = window.innerWidth <= 768;
  const revealDelayStep = mobileReveal ? 60 : 80;
  const revealDelayLimit = mobileReveal ? 300 : 480;

  document.querySelectorAll('.works-kicker, .tools-kicker, .services-kicker, .why-kicker, .pricing-kicker, .about-kicker')
    .forEach((element) => element.classList.add('motion-label'));

  document.querySelectorAll('.works-header h2, .tools-header h2, .services-header h2, .why-header h2, .pricing-header h2, .about-title')
    .forEach((element) => element.classList.add('motion-heading'));

  document.querySelectorAll('.works-header > p:last-child, .tools-subtitle, .services-subtitle, .why-subtitle, .pricing-subtitle, .about-copy')
    .forEach((element) => element.classList.add('motion-description'));

  document.querySelectorAll('.project-showcase, .tools-list, .services-grid, .why-grid, .pricing-grid').forEach((container) => {
    [...container.children].filter((element) => element.classList.contains('reveal')).forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * revealDelayStep, revealDelayLimit)}ms`);
    });
  });

  document.querySelector('.pricing-custom')?.style.setProperty('--reveal-delay', mobileReveal ? '120ms' : '240ms');
  document.querySelector('.about-title')?.style.setProperty('--reveal-delay', '80ms');
  document.querySelector('.about-media')?.style.setProperty('--reveal-delay', '230ms');
  document.querySelector('.about-copy')?.style.setProperty('--reveal-delay', '310ms');
  document.querySelector('.contact-title')?.style.setProperty('--reveal-delay', '80ms');
  document.querySelector('.contact-description')?.style.setProperty('--reveal-delay', '170ms');
  document.querySelector('.contact-cta')?.style.setProperty('--reveal-delay', '250ms');
  document.querySelector('.contact-footer')?.style.setProperty('--reveal-delay', '330ms');
}

configureRevealSystem();

const mobileCardMediaQuery = window.matchMedia('(max-width: 768px)');
const aboutPhoto = aboutMedia?.querySelector('img');

function ensureAboutPhotoVisible() {
  aboutMedia?.classList.add('is-visible');
}

if (aboutPhoto && mobileCardMediaQuery.matches) {
  aboutPhoto.loading = 'eager';

  const showAboutPhoto = () => {
    aboutPhoto.classList.remove('is-media-pending');
    aboutPhoto.classList.add('is-media-loaded');
    ensureAboutPhotoVisible();
  };

  const releaseAboutPhotoFallback = () => {
    aboutPhoto.classList.remove('is-media-pending');
    ensureAboutPhotoVisible();
  };

  aboutPhoto.addEventListener('load', showAboutPhoto, { once: true });
  aboutPhoto.addEventListener('error', releaseAboutPhotoFallback, { once: true });

  if (aboutPhoto.complete && aboutPhoto.naturalWidth > 0) {
    window.requestAnimationFrame(showAboutPhoto);
  } else {
    aboutPhoto.classList.add('is-media-pending');
    window.setTimeout(() => {
      if (aboutPhoto.complete && aboutPhoto.naturalWidth > 0) showAboutPhoto();
      else releaseAboutPhotoFallback();
    }, 2400);
  }
}

function initializeMobileCardImages() {
  if (!mobileCardMediaQuery.matches) return;

  const cardImages = [...document.querySelectorAll([
    '.service-card__visual img',
    '.advantage-card__media img',
    '.pricing-workspace img',
    '.pricing-card__visual img',
    '.pricing-custom__visual img'
  ].join(','))];

  if (!cardImages.length) return;

  const preloadCallbacks = new WeakMap();
  const preloadObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        preloadCallbacks.get(entry.target)?.();
        preloadCallbacks.delete(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '300px 0px',
      threshold: 0
    })
    : null;

  cardImages.forEach((image) => {
    let loadStateSettled = false;
    let preloadStarted = false;

    const showImage = () => {
      if (loadStateSettled) return;
      loadStateSettled = true;
      preloadObserver?.unobserve(image);
      image.classList.remove('is-media-pending');
      image.classList.add('is-media-loaded');
    };

    const releaseImageFallback = () => {
      preloadObserver?.unobserve(image);
      image.classList.remove('is-media-pending');
    };

    const showImageAfterDecode = () => {
      if (loadStateSettled) return;
      if (typeof image.decode !== 'function') {
        showImage();
        return;
      }

      image.decode().catch(() => {}).then(showImage);
    };

    image.decoding = 'async';
    image.addEventListener('load', showImageAfterDecode, { once: true });
    image.addEventListener('error', releaseImageFallback, { once: true });

    const beginPreload = () => {
      if (preloadStarted || loadStateSettled) return;
      preloadStarted = true;
      image.classList.add('is-media-pending');
      image.loading = 'eager';

      window.setTimeout(() => {
        if (image.complete && image.naturalWidth > 0) showImageAfterDecode();
        else releaseImageFallback();
      }, 8000);
    };

    if (image.complete && image.naturalWidth > 0) {
      showImage();
    } else {
      if (preloadObserver) {
        preloadCallbacks.set(image, beginPreload);
        preloadObserver.observe(image);
      } else {
        beginPreload();
      }
    }
  });
}

initializeMobileCardImages();

function renderParallax() {
  currentX += (targetX - currentX) * 0.075;
  currentY += (targetY - currentY) * 0.075;
  cursorCurrentX += (cursorTargetX - cursorCurrentX) * .065;
  cursorCurrentY += (cursorTargetY - cursorCurrentY) * .065;

  document.documentElement.style.setProperty('--glow-x', `${currentX * 10}px`);
  document.documentElement.style.setProperty('--glow-y', `${currentY * 8}px`);
  document.documentElement.style.setProperty('--portrait-x', `${currentX * -6}px`);
  document.documentElement.style.setProperty('--portrait-y', `${currentY * -5}px`);
  document.documentElement.style.setProperty('--ghost-x', `${currentX * 3}px`);
  document.documentElement.style.setProperty('--ghost-y', `${currentY * 3}px`);
  aboutSection.style.setProperty('--about-image-x', `${(currentX * 5).toFixed(2)}px`);
  aboutSection.style.setProperty('--about-image-y', `${(currentY * 4).toFixed(2)}px`);
  cursorAmbientLight.style.setProperty('--cursor-light-x', `${cursorCurrentX.toFixed(2)}px`);
  cursorAmbientLight.style.setProperty('--cursor-light-y', `${cursorCurrentY.toFixed(2)}px`);

  if (
    Math.abs(targetX - currentX) > .001 ||
    Math.abs(targetY - currentY) > .001 ||
    Math.abs(cursorTargetX - cursorCurrentX) > .15 ||
    Math.abs(cursorTargetY - cursorCurrentY) > .15
  ) {
    frameId = window.requestAnimationFrame(renderParallax);
  } else {
    frameId = 0;
  }
}

function updatePointer(event) {
  if (!desktopPointer.matches || reduceMotion.matches) return;

  targetX = (event.clientX / window.innerWidth - .5) * 2;
  targetY = (event.clientY / window.innerHeight - .5) * 2;
  cursorTargetX = event.clientX;
  cursorTargetY = event.clientY;

  if (!frameId) frameId = window.requestAnimationFrame(renderParallax);
}

function resetPointer() {
  targetX = 0;
  targetY = 0;
  cursorTargetX = window.innerWidth / 2;
  cursorTargetY = window.innerHeight / 2;
  if (!frameId) frameId = window.requestAnimationFrame(renderParallax);
}

window.addEventListener('pointermove', updatePointer, { passive: true });
document.documentElement.addEventListener('mouseleave', resetPointer);

function clampCinematic(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeCinematic(value) {
  const progress = clampCinematic(value);
  return progress * progress * (3 - 2 * progress);
}

function resetCinematicJourney() {
  const depthStyle = cinematicDepthLayer.style;
  depthStyle.setProperty('--cinematic-trail-opacity', '0');
  depthStyle.setProperty('--cinematic-haze-opacity', '0');
  depthStyle.setProperty('--cinematic-far-opacity', '0');
  depthStyle.setProperty('--cinematic-middle-opacity', '0');
  depthStyle.setProperty('--cinematic-near-opacity', '0');
  depthStyle.setProperty('--cinematic-camera-scale', '1');
}

function setMobileCinematicIdle() {
  const depthStyle = cinematicDepthLayer.style;
  depthStyle.setProperty('--cinematic-far-y', '0px');
  depthStyle.setProperty('--cinematic-middle-y', '0px');
  depthStyle.setProperty('--cinematic-near-y', '0px');
  depthStyle.setProperty('--cinematic-grid-shift', '0px');
  depthStyle.setProperty('--cinematic-trail-shift', '0px');
  depthStyle.setProperty('--cinematic-trail-opacity', '0');
  depthStyle.setProperty('--cinematic-haze-opacity', '.045');
  depthStyle.setProperty('--cinematic-far-opacity', '.2');
  depthStyle.setProperty('--cinematic-middle-opacity', '.27');
  depthStyle.setProperty('--cinematic-near-opacity', '.34');
  depthStyle.setProperty('--cinematic-camera-scale', '1');
}

function updateCinematicFocus(viewportHeight, sectionFrames) {
  const viewportDocumentCenter = window.scrollY + viewportHeight / 2;
  const focusSections = sectionFrames.map(({ section, documentTop, height }) => ({
    section,
    center: documentTop + height / 2,
    focus: cinematicFocusPoints[section.id] || [50, 50]
  }));

  let start = focusSections[0];
  let end = focusSections[focusSections.length - 1];

  for (let index = 0; index < focusSections.length - 1; index += 1) {
    if (viewportDocumentCenter >= focusSections[index].center && viewportDocumentCenter <= focusSections[index + 1].center) {
      start = focusSections[index];
      end = focusSections[index + 1];
      break;
    }

    if (viewportDocumentCenter < focusSections[0].center) {
      start = focusSections[0];
      end = focusSections[0];
      break;
    }
  }

  if (viewportDocumentCenter > focusSections[focusSections.length - 1].center) {
    start = focusSections[focusSections.length - 1];
    end = start;
  }

  const span = Math.max(end.center - start.center, 1);
  const progress = easeCinematic((viewportDocumentCenter - start.center) / span);
  const focusX = start.focus[0] + (end.focus[0] - start.focus[0]) * progress;
  const focusY = start.focus[1] + (end.focus[1] - start.focus[1]) * progress;

  const focusXPx = `${(window.innerWidth * focusX / 100).toFixed(2)}px`;
  const focusYPx = `${(viewportHeight * focusY / 100).toFixed(2)}px`;

  ambientTargetX = focusX;
  ambientTargetY = focusY;
  ambientCurrentX = focusX;
  ambientCurrentY = focusY;
  globalAmbientLight.style.setProperty('--ambient-section-x-px', focusXPx);
  globalAmbientLight.style.setProperty('--ambient-section-y-px', focusYPx);
  cinematicDepthLayer.style.setProperty('--cinematic-haze-x-px', focusXPx);
  cinematicDepthLayer.style.setProperty('--cinematic-haze-y-px', focusYPx);
}

function renderCinematicJourney() {
  const viewportHeight = Math.max(window.innerHeight, 1);
  const mobile = window.innerWidth <= 768;
  const scrollPosition = window.scrollY;
  const sectionFrames = cinematicSectionMetrics.map(({ section, documentTop, height }) => {
    const top = documentTop - scrollPosition;
    return { section, documentTop, height, top, bottom: top + height };
  });
  let transitionIntensity = 0;

  sectionFrames.forEach(({ section, top, bottom }) => {
    if (scrollPosition < 2 || bottom < -viewportHeight * .12 || top > viewportHeight * 1.12) return;

    if (section === heroSection) {
      const heroProgress = easeCinematic(scrollPosition / (viewportHeight * .9));
      transitionIntensity = Math.max(transitionIntensity, Math.sin(Math.PI * clampCinematic(heroProgress)));
    } else if (top >= viewportHeight * .42 && top <= viewportHeight * 1.08) {
      const rawProgress = clampCinematic((viewportHeight * 1.08 - top) / (viewportHeight * .66));
      transitionIntensity = Math.max(transitionIntensity, Math.sin(Math.PI * rawProgress));
    } else if (bottom >= -viewportHeight * .08 && bottom <= viewportHeight * .52) {
      const rawProgress = clampCinematic((viewportHeight * .52 - bottom) / (viewportHeight * .6));
      transitionIntensity = Math.max(transitionIntensity, Math.sin(Math.PI * rawProgress));
    }
  });

  transitionIntensity *= clampCinematic(scrollPosition / 80);
  const depthStyle = cinematicDepthLayer.style;
  depthStyle.setProperty('--cinematic-far-y', `${(Math.sin(scrollPosition * .0007) * 12).toFixed(2)}px`);
  depthStyle.setProperty('--cinematic-middle-y', `${(Math.sin(scrollPosition * .0009 + .9) * 18).toFixed(2)}px`);
  depthStyle.setProperty('--cinematic-near-y', `${(Math.sin(scrollPosition * .0011 + 1.8) * 24).toFixed(2)}px`);
  depthStyle.setProperty('--cinematic-grid-shift', `${(Math.sin(scrollPosition * .00055) * 14).toFixed(2)}px`);
  depthStyle.setProperty('--cinematic-trail-shift', `${(Math.sin(scrollPosition * .0014) * 22).toFixed(2)}px`);
  depthStyle.setProperty('--cinematic-trail-opacity', `${(transitionIntensity * (mobile ? .22 : .42)).toFixed(3)}`);
  depthStyle.setProperty('--cinematic-haze-opacity', `${(.04 + transitionIntensity * (mobile ? .018 : .036)).toFixed(3)}`);
  depthStyle.setProperty('--cinematic-far-opacity', `${(.2 + transitionIntensity * .06).toFixed(3)}`);
  depthStyle.setProperty('--cinematic-middle-opacity', `${(.3 + transitionIntensity * .09).toFixed(3)}`);
  depthStyle.setProperty('--cinematic-near-opacity', `${(.38 + transitionIntensity * .12).toFixed(3)}`);
  depthStyle.setProperty('--cinematic-camera-scale', `${(1 + transitionIntensity * (mobile ? .004 : .009)).toFixed(4)}`);

  updateCinematicFocus(viewportHeight, sectionFrames);
}

function ensureAboutMediaReveal() {
  if (aboutMedia.classList.contains('is-visible')) return;

  const aboutFrame = cinematicSectionMetrics.find(({ section }) => section === aboutSection);
  if (!aboutFrame) {
    aboutMedia.classList.add('is-visible');
    return;
  }

  const top = aboutFrame.documentTop - window.scrollY;
  const bottom = top + aboutFrame.height;

  if (top <= window.innerHeight * .9 && bottom >= 0) {
    aboutMedia.classList.add('is-visible');
  }
}

function ensureContactReveal() {
  if (contactRevealElements.every((element) => element.classList.contains('is-visible'))) return;

  const contactFrame = cinematicSectionMetrics.find(({ section }) => section === contactSection);
  if (!contactFrame) {
    contactRevealElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const top = contactFrame.documentTop - window.scrollY;
  const bottom = top + contactFrame.height;

  if (top <= window.innerHeight * .92 && bottom >= 0) {
    contactRevealElements.forEach((element) => element.classList.add('is-visible'));
  }
}

function renderScrollParallax() {
  scrollFrameId = 0;

  if (reduceMotion.matches) {
    portrait.style.setProperty('--portrait-scroll-y', '0px');
    projectCards.forEach((card) => card.style.setProperty('--media-shift', '0%'));
    toolsEyeFrame.style.setProperty('--eye-scroll', '0px');
    aboutSection.style.setProperty('--about-scroll-y', '0px');
    resetCinematicJourney();
    return;
  }

  const heroHeight = Math.max(heroSection.offsetHeight, window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
  body.classList.toggle('is-hero-active', progress < .55);
  portrait.style.setProperty('--portrait-scroll-y', `${(progress * 8).toFixed(2)}px`);

  ensureAboutMediaReveal();
  ensureContactReveal();

  if (window.innerWidth <= 768) {
    if (!mobileCinematicStatic) {
      setMobileCinematicIdle();
      mobileCinematicStatic = true;
    }
  } else {
    mobileCinematicStatic = false;
    renderCinematicJourney();
  }
}

function queueScrollParallax() {
  if (!scrollFrameId) scrollFrameId = window.requestAnimationFrame(renderScrollParallax);
}

window.addEventListener('scroll', queueScrollParallax, { passive: true });

const ambientPositions = {
  work: [42, 54],
  tools: [31, 52],
  services: [68, 54],
  'why-me': [48, 48],
  pricing: [62, 55],
  about: [31, 52],
  contact: [52, 50]
};

const sectionNavigationTargets = {
  work: '#work',
  tools: '#work',
  services: '#services',
  'why-me': '#services',
  pricing: '#pricing',
  about: '#about',
  contact: '#contact'
};

function renderAmbientLight() {
  ambientCurrentX += (ambientTargetX - ambientCurrentX) * .035;
  ambientCurrentY += (ambientTargetY - ambientCurrentY) * .035;
  document.documentElement.style.setProperty('--ambient-section-x', `${ambientCurrentX.toFixed(2)}%`);
  document.documentElement.style.setProperty('--ambient-section-y', `${ambientCurrentY.toFixed(2)}%`);

  if (Math.abs(ambientTargetX - ambientCurrentX) > .02 || Math.abs(ambientTargetY - ambientCurrentY) > .02) {
    ambientFrameId = window.requestAnimationFrame(renderAmbientLight);
  } else {
    ambientFrameId = 0;
  }
}

function setAmbientSection(section) {
  if (!section || reduceMotion.matches) return;
  if (cinematicDepthLayer) return;
  const position = ambientPositions[section.id];
  if (!position) return;
  [ambientTargetX, ambientTargetY] = position;
  if (!ambientFrameId) ambientFrameId = window.requestAnimationFrame(renderAmbientLight);
}

function revealAll() {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  revealAll();
  motionSections.forEach((section) => section.classList.add('is-motion-active'));
} else {
  const mobileRevealObserver = window.matchMedia('(max-width: 768px)').matches;
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: mobileRevealObserver ? '0px 0px -3% 0px' : '0px 0px -10% 0px',
    threshold: mobileRevealObserver ? .01 : .12
  });

  revealElements.forEach((element) => revealObserver.observe(element));
  document.documentElement.classList.add('reveal-observer-active');

  const sectionRatios = new Map();
  const sectionMotionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      sectionRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      if (entry.isIntersecting) {
        entry.target.classList.add('is-motion-active');
        if (entry.target.id === 'contact') {
          entry.target.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
        }
      }
    });

    const activeSection = [...sectionRatios.entries()]
      .sort((a, b) => b[1] - a[1])
      .find(([, ratio]) => ratio > 0)?.[0];

    setAmbientSection(activeSection);
    const activeNavigationHref = sectionNavigationTargets[activeSection?.id];
    if (activeNavigationHref) setActiveNavigation(activeNavigationHref);
  }, { threshold: [0, .12, .28, .46, .64] });

  motionSections.forEach((section) => sectionMotionObserver.observe(section));
}

function getPortfolioVideoSources(video) {
  if (!video) return [];

  const directSource = video.getAttribute('src');
  if (directSource) {
    return [{
      src: directSource,
      type: directSource.toLowerCase().split(/[?#]/, 1)[0].endsWith('.webm') ? 'video/webm' : 'video/mp4'
    }];
  }

  const nestedSources = [...video.querySelectorAll('source')]
    .map((source) => ({ src: source.getAttribute('src') || '', type: source.type || '' }))
    .filter(({ src }) => src);
  if (nestedSources.length) return nestedSources;

  return [
    { src: video.dataset.webm || '', type: 'video/webm' },
    { src: video.dataset.mp4 || '', type: 'video/mp4' }
  ].filter(({ src }) => src);
}

function getPortfolioVideoSource(video) {
  return getPortfolioVideoSources(video)[0] || null;
}

function hasPortfolioVideoSource(video) {
  return Boolean(getPortfolioVideoSource(video));
}

function clearPortfolioVideoSource(video) {
  video.pause();
  video.removeAttribute('src');
  video.replaceChildren();
  delete video.dataset.hydrated;
}

function hydrateVideo(video) {
  const source = getPortfolioVideoSource(video);
  if (!source) return false;

  video.dataset.hydrated = 'true';
  if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
  return true;
}

function pauseProjectVideos(except = null) {
  [...projectVideos, featuredVideo].forEach((video) => {
    if (video !== except && !video.paused) video.pause();
  });
}

function playProjectVideo(video) {
  if (!hydrateVideo(video)) return;
  pauseProjectVideos(video);
  video.play().catch((error) => {
    console.warn('Portfolio video playback was prevented:', error);
  });
}

function shouldPlayLoopPreview(entry) {
  return selectedWorksMode === 'all'
    && entry.inViewport
    && !allProjectsGrid.hidden
    && !entry.card.hidden
    && !projectViewer.classList.contains('is-open')
    && !document.hidden;
}

function playLoopPreview(entry) {
  const { video } = entry;
  if (!hydrateVideo(video)) return;

  video.controls = false;
  video.muted = true;
  video.defaultMuted = true;
  if (video.ended || video.currentTime >= PORTFOLIO_PREVIEW_DURATION) video.currentTime = 0;
  video.play().catch((error) => {
    console.warn('Portfolio card preview could not start:', error);
  });
}

function syncLoopPreviewPlayback() {
  let hasActivePreview = false;

  loopPreviewEntries.forEach((entry) => {
    const { video } = entry;
    if (!shouldPlayLoopPreview(entry)) {
      video.pause();
      return;
    }

    hasActivePreview = true;
    if (video.ended || video.currentTime >= PORTFOLIO_PREVIEW_DURATION) video.currentTime = 0;
    if (video.paused) playLoopPreview(entry);
  });

  if (!hasActivePreview) {
    window.clearInterval(portfolioPreviewLoopTimer);
    portfolioPreviewLoopTimer = 0;
    return;
  }

  if (!portfolioPreviewLoopTimer) {
    portfolioPreviewLoopTimer = window.setInterval(() => {
      let stillActive = false;

      loopPreviewEntries.forEach((entry) => {
        if (!shouldPlayLoopPreview(entry)) return;
        stillActive = true;

        const { video } = entry;
        if (video.ended || video.currentTime >= PORTFOLIO_PREVIEW_DURATION) {
          video.currentTime = 0;
          video.play().catch((error) => {
            console.warn('Portfolio card preview could not resume:', error);
          });
        }
      });

      if (!stillActive) syncLoopPreviewPlayback();
    }, 250);
  }
}

document.addEventListener('visibilitychange', syncLoopPreviewPlayback);

projectVideos.forEach((video) => {
  const card = video.closest('.project-card');
  const showProjectVideo = () => {
    card.classList.remove('has-video-error');
    card.classList.add('has-video');
    if (loopPreviewVideos.has(video)) syncLoopPreviewPlayback();
  };

  video.addEventListener('error', () => {
    const mediaError = video.error;
    card.classList.remove('has-video');
    card.classList.add('has-video-error');
    const failedSource = video.currentSrc || getPortfolioVideoSource(video)?.src || '';
    console.error(`Portfolio video failed: ${failedSource}`, {
      code: mediaError?.code || null,
      message: mediaError?.message || 'Unknown media error'
    });
  });

  video.addEventListener('loadedmetadata', () => {
    card.classList.remove('has-video-error');
  });
  video.addEventListener('loadeddata', showProjectVideo);
  video.addEventListener('canplay', showProjectVideo);
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showProjectVideo();

  card.addEventListener('mouseenter', () => {
    if (!previewHover.matches) return;
    if (loopPreviewVideos.has(video)) syncLoopPreviewPlayback();
    else playProjectVideo(video);
  });
  card.addEventListener('mouseleave', () => {
    if (!previewHover.matches) return;
    if (!loopPreviewVideos.has(video)) video.pause();
    syncLoopPreviewPlayback();
  });
  card.addEventListener('focusin', () => {
    if (!previewHover.matches) return;
    if (loopPreviewVideos.has(video)) syncLoopPreviewPlayback();
    else playProjectVideo(video);
  });
  card.addEventListener('focusout', () => {
    if (!previewHover.matches) return;
    if (!loopPreviewVideos.has(video)) video.pause();
    syncLoopPreviewPlayback();
  });
});

featuredVideo.addEventListener('error', () => {
  const mediaError = featuredVideo.error;
  const failedSource = featuredVideo.currentSrc || getPortfolioVideoSource(featuredVideo)?.src || '';
  featuredStage.classList.remove('has-video');
  featuredStage.classList.add('has-video-error');
  console.error(`Portfolio video failed: ${failedSource}`, {
    code: mediaError?.code || null,
    message: mediaError?.message || 'Unknown media error'
  });
});

if ('IntersectionObserver' in window) {
  const mobileVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.project-video');
      if (entry.isIntersecting) hydrateVideo(video);
      const loopPreviewEntry = loopPreviewEntries.find(({ card }) => card === entry.target);
      if (loopPreviewEntry) loopPreviewEntry.inViewport = entry.isIntersecting && entry.intersectionRatio >= .15;
    });

    if (!previewHover.matches && !projectViewer.classList.contains('is-open')) {
      projectVideos.forEach((video) => {
        if (!loopPreviewVideos.has(video)) video.pause();
      });
    }

    syncLoopPreviewPlayback();
  }, { threshold: [0, .15, .35, .62, .8] });

  projectCards.forEach((card) => mobileVideoObserver.observe(card));
} else {
  loopPreviewEntries.forEach((entry) => { entry.inViewport = true; });
  syncLoopPreviewPlayback();
}

let filterRevision = 0;
let featuredRevision = 0;
let featuredProjectCard = projectCards[0];
let featuredInViewport = false;

function resetFeaturedVideo(card, revision) {
  clearPortfolioVideoSource(featuredVideo);
  featuredStage.classList.remove('has-video', 'has-video-error');

  const sourceVideo = card.querySelector('.project-video');
  const source = getPortfolioVideoSource(sourceVideo);
  const requiresManualPlayback = Boolean(source);
  featuredVideo.controls = requiresManualPlayback;
  featuredVideo.muted = !requiresManualPlayback;
  featuredVideo.defaultMuted = !requiresManualPlayback;
  featuredVideo.volume = 1;
  featuredVideo.loop = !requiresManualPlayback;

  const showVideo = () => {
    if (revision !== featuredRevision) return;
    featuredStage.classList.remove('has-video-error');
    featuredStage.classList.add('has-video');
    if (!requiresManualPlayback && featuredInViewport && !projectViewer.classList.contains('is-open')) {
      playProjectVideo(featuredVideo);
    }
  };

  if (!source) return;

  featuredVideo.addEventListener('loadeddata', showVideo, { once: true });
  featuredVideo.addEventListener('canplay', showVideo, { once: true });
  featuredVideo.src = source.src;
  featuredVideo.dataset.hydrated = 'true';
  featuredVideo.load();
  if (featuredVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showVideo();
}

function renderFeaturedProject(card, revision) {
  const category = card.querySelector('.project-card__meta span:first-child').textContent.trim();
  const index = card.querySelector('.project-card__meta span:last-child').textContent.trim();
  const title = card.querySelector('h3').textContent.trim();
  featuredProjectCard = card;
  featuredStage.dataset.category = card.dataset.category;
  featuredCategory.textContent = category;
  featuredDescription.textContent = card.dataset.description;
  featuredIndex.textContent = index;
  featuredStage.setAttribute('aria-label', `Открыть избранный проект ${title}`);
  resetFeaturedVideo(card, revision);
}

function updateFeaturedProject(card, immediate = false) {
  if (!card) return;
  if (!immediate && card === featuredProjectCard && featuredCategory.textContent) return;

  featuredRevision += 1;
  const revision = featuredRevision;
  const shouldAnimate = !immediate && !reduceMotion.matches && card !== featuredProjectCard;

  featuredVideo.pause();

  if (!shouldAnimate) {
    featuredStage.classList.remove('is-leaving', 'is-entering');
    renderFeaturedProject(card, revision);
    return;
  }

  featuredStage.classList.remove('is-entering');
  featuredStage.classList.add('is-leaving');

  window.setTimeout(() => {
    if (revision !== featuredRevision) return;
    renderFeaturedProject(card, revision);
    featuredStage.classList.remove('is-leaving');
    featuredStage.classList.add('is-entering');

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (revision === featuredRevision) featuredStage.classList.remove('is-entering');
      });
    });
  }, 260);
}

function cancelWorksAnimations() {
  [allProjectsGrid, featuredStage, ...projectCards].forEach((element) => {
    element.getAnimations().forEach((animation) => animation.cancel());
  });
}

function waitForWorksAnimation(element, keyframes, options) {
  const animation = element.animate(keyframes, options);
  return animation.finished.catch(() => {});
}

function waitForWorksFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

async function showAllProjects(revision, duration) {
  featuredRevision += 1;
  featuredStage.classList.remove('is-leaving', 'is-entering');
  featuredVideo.pause();
  featuredInViewport = false;

  if (!featuredStage.hidden) {
    await waitForWorksAnimation(featuredStage, [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(12px) scale(1)' }
    ], { duration, easing: 'cubic-bezier(.22, 1, .36, 1)' });

    if (revision !== filterRevision) return;
    featuredStage.hidden = true;
  }

  if (revision !== filterRevision) return;

  projectVideos.forEach((video) => video.pause());
  projectCards.forEach((card) => { card.hidden = false; });
  allProjectsGrid.hidden = false;
  await waitForWorksFrame();

  if (revision !== filterRevision) return;

  projectCards.forEach((card, index) => {
    card.animate([
      { opacity: 0, transform: 'translateY(16px) scale(1)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], {
      duration,
      delay: reduceMotion.matches ? 0 : index * 70,
      easing: 'cubic-bezier(.22, 1, .36, 1)',
      fill: 'backwards'
    });
  });

  syncLoopPreviewPlayback();
}

async function showFeaturedProject(card, revision, duration) {
  projectVideos.forEach((video) => video.pause());

  if (!allProjectsGrid.hidden) {
    await Promise.all(projectCards.map((projectCard, index) => waitForWorksAnimation(projectCard, [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(12px) scale(1)' }
    ], {
      duration,
      delay: reduceMotion.matches ? 0 : index * 24,
      easing: 'cubic-bezier(.22, 1, .36, 1)'
    })));

    if (revision !== filterRevision) return;
    allProjectsGrid.hidden = true;
  }

  if (revision !== filterRevision) return;

  if (!featuredStage.hidden) {
    updateFeaturedProject(card);
    return;
  }

  updateFeaturedProject(card, true);
  featuredStage.hidden = false;
  await waitForWorksFrame();

  if (revision !== filterRevision) return;

  featuredStage.animate([
    { opacity: 0, transform: 'translateY(18px) scale(.985)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ], {
    duration,
    easing: 'cubic-bezier(.22, 1, .36, 1)',
    fill: 'backwards'
  });
}

function filterProjects(filter) {
  filterRevision += 1;
  const revision = filterRevision;
  const duration = reduceMotion.matches ? 1 : 520;
  const nextMode = filter === 'all' ? 'all' : 'featured';
  const modeChanged = nextMode !== selectedWorksMode;
  selectedWorksMode = nextMode;
  syncLoopPreviewPlayback();

  cancelWorksAnimations();

  filterButtons.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (filter === 'all') {
    if (!modeChanged && featuredStage.hidden && !allProjectsGrid.hidden) return;
    showAllProjects(revision, duration);
    return;
  }

  const selectedProject = projectCards.find((card) => card.dataset.category === filter);
  showFeaturedProject(selectedProject, revision, duration);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => filterProjects(button.dataset.filter));
});

updateFeaturedProject(projectCards[0], true);

if ('IntersectionObserver' in window) {
  const featuredObserver = new IntersectionObserver(([entry]) => {
    featuredInViewport = entry.isIntersecting && entry.intersectionRatio >= .35;

    const sourceVideo = featuredProjectCard.querySelector('.project-video');
    const requiresManualPlayback = hasPortfolioVideoSource(sourceVideo);
    if (featuredInViewport && !requiresManualPlayback && !projectViewer.classList.contains('is-open')) {
      playProjectVideo(featuredVideo);
    } else if (!featuredInViewport) {
      featuredVideo.pause();
    }
  }, { threshold: [0, .35, .65] });

  featuredObserver.observe(featuredStage);
} else {
  featuredInViewport = true;
}

function setViewerVideo(card) {
  clearPortfolioVideoSource(viewerVideo);
  projectViewer.classList.remove('has-video');

  const sourceVideo = card.querySelector('.project-video');
  const source = getPortfolioVideoSource(sourceVideo);
  if (!source) return;

  const showViewerVideo = () => projectViewer.classList.add('has-video');
  viewerVideo.addEventListener('loadeddata', showViewerVideo, { once: true });
  viewerVideo.addEventListener('canplay', showViewerVideo, { once: true });
  viewerVideo.src = source.src;
  viewerVideo.dataset.hydrated = 'true';
  viewerVideo.load();
  if (viewerVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showViewerVideo();
}

function openProjectViewer(card) {
  lastViewerFocus = document.activeElement;
  pauseProjectVideos();
  setViewerVideo(card);

  viewerTitle.textContent = card.querySelector('h3').textContent;
  viewerCategory.textContent = card.querySelector('.project-card__meta span').textContent;
  viewerDescription.textContent = card.dataset.description;
  projectViewer.classList.toggle('is-wide', card.classList.contains('project-card--wide'));
  projectViewer.removeAttribute('inert');
  projectViewer.setAttribute('aria-hidden', 'false');
  projectViewer.classList.add('is-open');
  body.classList.add('viewer-open');

  window.setTimeout(() => viewerClose.focus(), reduceMotion.matches ? 0 : 180);
}

function closeProjectViewer() {
  if (!projectViewer.classList.contains('is-open')) return;
  viewerVideo.pause();
  projectViewer.classList.remove('is-open');
  projectViewer.setAttribute('aria-hidden', 'true');
  projectViewer.setAttribute('inert', '');
  body.classList.remove('viewer-open');

  window.setTimeout(() => {
    clearPortfolioVideoSource(viewerVideo);
    projectViewer.classList.remove('has-video', 'is-wide');
    const sourceVideo = featuredProjectCard.querySelector('.project-video');
    const requiresManualPlayback = hasPortfolioVideoSource(sourceVideo);
    if (featuredInViewport && !requiresManualPlayback) {
      playProjectVideo(featuredVideo);
    }
  }, reduceMotion.matches ? 0 : 420);

  if (lastViewerFocus) lastViewerFocus.focus();
}

function getActiveFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestFullscreenElement(element) {
  const request = element.requestFullscreen || element.webkitRequestFullscreen;
  if (!request) return;

  try {
    const result = request.call(element, { navigationUI: 'hide' });
    if (result?.catch) result.catch(() => {});
  } catch (error) {
    console.warn('Native fullscreen is unavailable; using the fixed portfolio viewer.', error);
  }
}

function exitNativeFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!exit) return Promise.resolve();

  try {
    return Promise.resolve(exit.call(document)).catch(() => {});
  } catch (error) {
    console.warn('Could not exit native fullscreen cleanly.', error);
    return Promise.resolve();
  }
}

function resumePortfolioVideo(video, shouldPlay) {
  if (!shouldPlay) return;
  video.play().catch((error) => {
    console.warn('Portfolio video could not resume after fullscreen transition.', error);
  });
}

function openPortfolioFullscreen(video, trigger, useNativeFullscreen = true) {
  if (!video || !video.currentSrc || portfolioFullscreenSession) return;

  const currentTime = video.currentTime;
  const wasPlaying = !video.paused;
  const originalParent = video.parentNode;
  const originalNextSibling = video.nextSibling;

  portfolioFullscreenSession = {
    video,
    trigger,
    originalParent,
    originalNextSibling,
    originalControls: video.controls,
    originalControlsList: video.getAttribute('controlslist')
  };

  video.pause();
  video.controls = true;
  video.setAttribute('controlslist', 'nofullscreen');
  portfolioFullscreen.hidden = false;
  portfolioFullscreen.setAttribute('aria-hidden', 'false');
  body.classList.add('portfolio-fullscreen-open');
  portfolioFullscreenStage.append(video);

  if (Number.isFinite(currentTime)) video.currentTime = currentTime;
  resumePortfolioVideo(video, wasPlaying);
  portfolioFullscreenClose.focus({ preventScroll: true });

  if (useNativeFullscreen) requestFullscreenElement(portfolioFullscreen);
}

function restorePortfolioFullscreen() {
  const session = portfolioFullscreenSession;
  if (!session) return;

  portfolioFullscreenSession = null;
  const { video, originalParent, originalNextSibling, originalControls, originalControlsList, trigger } = session;
  const currentTime = video.currentTime;
  const wasPlaying = !video.paused;

  video.pause();
  if (originalNextSibling?.parentNode === originalParent) {
    originalParent.insertBefore(video, originalNextSibling);
  } else {
    originalParent.append(video);
  }

  video.controls = originalControls;
  if (originalControlsList === null) video.removeAttribute('controlslist');
  else video.setAttribute('controlslist', originalControlsList);
  if (Number.isFinite(currentTime)) video.currentTime = currentTime;

  portfolioFullscreen.hidden = true;
  portfolioFullscreen.setAttribute('aria-hidden', 'true');
  body.classList.remove('portfolio-fullscreen-open');
  resumePortfolioVideo(video, wasPlaying);
  trigger?.focus({ preventScroll: true });
}

function closePortfolioFullscreen() {
  if (!portfolioFullscreenSession || portfolioFullscreenClosing) return;

  if (getActiveFullscreenElement() === portfolioFullscreen) {
    portfolioFullscreenClosing = true;
    exitNativeFullscreen().finally(() => {
      restorePortfolioFullscreen();
      portfolioFullscreenClosing = false;
    });
    return;
  }

  restorePortfolioFullscreen();
}

portfolioFullscreenTriggers.forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const media = trigger.closest('.featured-stage__media, .project-viewer__media');
    const video = media?.querySelector('.portfolio-managed-video');
    openPortfolioFullscreen(video, trigger);
  });
});

portfolioFullscreenClose.addEventListener('click', closePortfolioFullscreen);

function handlePortfolioFullscreenChange() {
  const fullscreenElement = getActiveFullscreenElement();

  if (portfolioFullscreenSession) {
    if (!fullscreenElement && !portfolioFullscreenClosing) restorePortfolioFullscreen();
    return;
  }

  if (portfolioNativeFullscreenRedirecting
    || !(fullscreenElement instanceof HTMLVideoElement)
    || !portfolioManagedVideos.includes(fullscreenElement)) return;

  const video = fullscreenElement;
  const trigger = video.parentElement?.querySelector('[data-portfolio-fullscreen-trigger]') || null;
  portfolioNativeFullscreenRedirecting = true;
  exitNativeFullscreen().finally(() => {
    openPortfolioFullscreen(video, trigger, false);
    portfolioNativeFullscreenRedirecting = false;
  });
}

document.addEventListener('fullscreenchange', handlePortfolioFullscreenChange);
document.addEventListener('webkitfullscreenchange', handlePortfolioFullscreenChange);

projectCards.forEach((card) => {
  const openCardProject = () => {
    const sourceVideo = card.querySelector('.project-video');
    if (hasPortfolioVideoSource(sourceVideo)) {
      filterProjects(card.dataset.category);
      return;
    }

    openProjectViewer(card);
  };

  card.addEventListener('click', openCardProject);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openCardProject();
  });
});

featuredStage.addEventListener('click', (event) => {
  if (event.target.closest('.featured-stage__video, [data-portfolio-fullscreen-trigger]')) return;
  openProjectViewer(featuredProjectCard);
});
featuredStage.addEventListener('keydown', (event) => {
  if (event.target.closest('.featured-stage__video, [data-portfolio-fullscreen-trigger]')) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openProjectViewer(featuredProjectCard);
});

projectViewer.querySelectorAll('[data-viewer-close]').forEach((control) => {
  control.addEventListener('click', closeProjectViewer);
});

function setActiveTool(tool) {
  toolsSection.dataset.activeTool = tool;

  toolCards.forEach((card) => {
    const active = card.dataset.tool === tool;
    card.classList.toggle('is-active', active);
  });

  eyeToolIcons.forEach((icon) => {
    icon.classList.toggle('is-active', icon.dataset.tool === tool);
  });
}

function setOrbitSlow(slow, timeout = 0) {
  window.clearTimeout(orbitSlowTimer);
  toolsSection.classList.toggle('is-orbit-slow', slow && !reduceMotion.matches);

  if (slow && timeout) {
    orbitSlowTimer = window.setTimeout(() => {
      toolsSection.classList.remove('is-orbit-slow');
    }, timeout);
  }
}

toolCards.forEach((card) => {
  card.addEventListener('pointerenter', () => {
    if (previewHover.matches) {
      setActiveTool(card.dataset.tool);
      setOrbitSlow(true);
    }
  });
  card.addEventListener('pointerleave', () => {
    if (previewHover.matches) setOrbitSlow(false);
  });
});

function renderEyeParallax() {
  eyeCurrentX += (eyeTargetX - eyeCurrentX) * .11;
  eyeCurrentY += (eyeTargetY - eyeCurrentY) * .11;
  toolsEyeFrame.style.setProperty('--eye-x', `${eyeCurrentX.toFixed(2)}px`);
  toolsEyeFrame.style.setProperty('--eye-y', `${eyeCurrentY.toFixed(2)}px`);

  if (Math.abs(eyeTargetX - eyeCurrentX) > .01 || Math.abs(eyeTargetY - eyeCurrentY) > .01) {
    eyeFrameId = window.requestAnimationFrame(renderEyeParallax);
  } else {
    eyeFrameId = 0;
  }
}

function updateEyePointer(event) {
  if (!previewHover.matches || reduceMotion.matches) return;
  const rect = toolsEyeFrame.getBoundingClientRect();
  eyeTargetX = Math.max(-4, Math.min(4, ((event.clientX - rect.left) / rect.width - .5) * 8));
  eyeTargetY = Math.max(-4, Math.min(4, ((event.clientY - rect.top) / rect.height - .5) * 8));
  if (!eyeFrameId) eyeFrameId = window.requestAnimationFrame(renderEyeParallax);
}

function resetEyePointer() {
  eyeTargetX = 0;
  eyeTargetY = 0;
  if (!eyeFrameId) eyeFrameId = window.requestAnimationFrame(renderEyeParallax);
}

toolsSection.addEventListener('pointermove', updateEyePointer, { passive: true });
toolsSection.addEventListener('pointerleave', resetEyePointer);

function renderGlassLight() {
  glassLightFrameId = 0;
  if (!pendingGlassModule || reduceMotion.matches || !previewHover.matches) return;
  pendingGlassModule.style.setProperty('--light-x', `${pendingGlassX.toFixed(1)}%`);
  pendingGlassModule.style.setProperty('--light-y', `${pendingGlassY.toFixed(1)}%`);
}

function updateGlassLight(event) {
  if (reduceMotion.matches || !previewHover.matches) return;
  const module = event.currentTarget;
  const rect = module.getBoundingClientRect();
  pendingGlassModule = module;
  pendingGlassX = ((event.clientX - rect.left) / rect.width) * 100;
  pendingGlassY = ((event.clientY - rect.top) / rect.height) * 100;
  if (!glassLightFrameId) glassLightFrameId = window.requestAnimationFrame(renderGlassLight);
}

function resetGlassLight(event) {
  event.currentTarget.style.setProperty('--light-x', '50%');
  event.currentTarget.style.setProperty('--light-y', '50%');
  if (pendingGlassModule === event.currentTarget) pendingGlassModule = null;
}

function resetAllGlassLights() {
  whyGlassModules.forEach((module) => {
    module.style.setProperty('--light-x', '50%');
    module.style.setProperty('--light-y', '50%');
  });
  pendingGlassModule = null;
}

whyGlassModules.forEach((module) => {
  module.addEventListener('pointermove', updateGlassLight, { passive: true });
  module.addEventListener('pointerleave', resetGlassLight);
});

desktopPointer.addEventListener('change', resetPointer);
previewHover.addEventListener('change', () => {
  resetEyePointer();
  setOrbitSlow(false);
  resetAllGlassLights();
  pauseProjectVideos();
  queueScrollParallax();
});
reduceMotion.addEventListener('change', () => {
  resetPointer();
  resetEyePointer();
  setOrbitSlow(false);
  resetAllGlassLights();
  queueScrollParallax();
  if (reduceMotion.matches) {
    revealAll();
    motionSections.forEach((section) => section.classList.add('is-motion-active'));
  }
});

window.addEventListener('resize', () => {
  cursorTargetX = window.innerWidth / 2;
  cursorTargetY = window.innerHeight / 2;
  if (window.innerWidth > 768 && mobileMenu.classList.contains('is-open')) {
    setMenu(false);
  }

  measureCinematicSections();
  queueScrollParallax();
}, { passive: true });

queueScrollParallax();
