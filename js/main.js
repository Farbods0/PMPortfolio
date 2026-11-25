if (typeof AOS !== 'undefined') {
  AOS.init({ once: true });
}

const body = document.body;
const toggleBtn = document.querySelector('.navbar-toggler');
const closeMenu = document.querySelector('.closeIcon');
const collapseMenu = document.querySelector('.navbar-collapse');

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    body.style.overflow = 'hidden';
  });
}

if (closeMenu && collapseMenu) {
  closeMenu.addEventListener('click', () => {
    body.style.overflow = 'auto';
    collapseMenu.classList.remove('show');
  });
}

if (typeof simpleParallax === 'function' && document.querySelector('.parallex')) {
  simpleParallax('.parallex', 6);
}

const loadingEl = document.querySelector('#loading');
if (loadingEl) {
  loadingEl.style.visibility = 'hidden';
}

const topBtn = document.querySelector('.top-btn');
if (topBtn) {
  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function handleScroll() {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  if (topBtn) {
    topBtn.style.opacity = y > 500 ? 1 : 0;
    topBtn.style.pointerEvents = y > 500 ? 'auto' : 'none';
  }
  if (y > 32) {
    body.classList.add('sticky-header');
  } else {
    body.classList.remove('sticky-header');
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();
