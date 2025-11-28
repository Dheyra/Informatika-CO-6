// home.js — animations and small interactions (cleaned)

document.addEventListener('DOMContentLoaded', function () {
  // NAV TOGGLE
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // SMOOTH SCROLL for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({behavior: 'smooth', block: 'start'});
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // HERO ENTRANCE
  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) requestAnimationFrame(() => setTimeout(() => heroCopy.classList.add('animate'), 120));

  // REVEAL ON SCROLL (IntersectionObserver)
  const revealElements = document.querySelectorAll('.card, .section, .hero-copy, footer.site-footer');
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('is-visible', 'reveal-on-scroll');
        el.style.setProperty('--delay', '0ms');
        obs.unobserve(el);
      }
    });
  }, {root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08});
  revealElements.forEach(el => { el.classList.add('reveal-on-scroll'); io.observe(el); });

  // RIPPLE EFFECT FOR BUTTONS (small)
  function createRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  }
  document.querySelectorAll('.btn').forEach(b => b.addEventListener('click', createRipple));

  // STUDENT SWIPER — simplified: keep swipe & prev/next but remove click-selection and video features
  (function initStudentSwiper() {
    const list = document.querySelector('.student-list');
    const prev = document.querySelector('.prev-btn');
    const next = document.querySelector('.next-btn');
    if (!list || !prev || !next) return;

  // capture card nodes and set center index (use index-based rotation for correct directions)
  const cards = Array.from(list.querySelectorAll('.student-card'));
  const n = cards.length;
  let centerIndex = cards.findIndex(c => c.classList.contains('center'));
  if (centerIndex < 0) centerIndex = Math.floor(n / 2);

  const viewBtn = document.getElementById('view-profile-btn');
  const selectedInfo = document.getElementById('selected-info');
  const profilePanel = document.getElementById('student-profile');
  const positionIndicator = document.getElementById('position-indicator');

    let animLock = false; // prevent rapid repeated rotations

    function applyLayout() {
      // ensure centerIndex wraps
      if (centerIndex < 0) centerIndex = (centerIndex % n + n) % n;
      if (centerIndex >= n) centerIndex = centerIndex % n;
      // remove any transient pop class first to avoid stacking
      cards.forEach(c => c.classList.remove('pop'));

      cards.forEach((card, i) => {
        card.classList.remove('center', 'shrink', 'hidden', 'selected');
        // compute shortest circular distance
        let offset = i - centerIndex;
        if (Math.abs(offset) > n / 2) {
          offset = offset > 0 ? offset - n : offset + n;
        }

        if (offset === 0) card.classList.add('center', 'selected');
        else if (Math.abs(offset) === 1) card.classList.add('shrink');
        else card.classList.add('hidden');

        const spacing = 140;
        const x = offset * spacing;
        const scale = offset === 0 ? 1.12 : Math.max(0.8, 1 - Math.abs(offset) * 0.08);
        card.style.transform = `translateX(${x}px) scale(${scale})`;
        card.style.zIndex = 100 - Math.abs(offset);
      });

      // small pop effect for center card (toggle briefly)
      setTimeout(() => {
        cards.forEach(c => c.classList.remove('pop'));
        const centerCard = cards[centerIndex];
        if (centerCard) centerCard.classList.add('pop');
      }, 60);

      // update selected info, position indicator and view button
      const centerEl = cards[centerIndex];
      if (centerEl) {
        const name = centerEl.dataset.name || (centerEl.querySelector('.name') && centerEl.querySelector('.name').textContent) || 'Siswa';
        selectedInfo.textContent = `Terpilih: ${name}`;
        if (viewBtn) viewBtn.classList.remove('visually-hidden');
        if (positionIndicator) {
          positionIndicator.textContent = `${centerIndex + 1} / ${n}`;
          positionIndicator.classList.remove('visually-hidden');
        }
      } else {
        if (selectedInfo) selectedInfo.textContent = 'Geser untuk melihat siswa lainnya';
        if (viewBtn) viewBtn.classList.add('visually-hidden');
        if (positionIndicator) positionIndicator.classList.add('visually-hidden');
      }
    }

    function rotatePrev() {
      if (animLock) return;
      animLock = true;
      centerIndex = (centerIndex - 1 + n) % n;
      applyLayout();
      setTimeout(() => { animLock = false; }, 300);
    }
    function rotateNext() {
      if (animLock) return;
      animLock = true;
      centerIndex = (centerIndex + 1) % n;
      applyLayout();
      setTimeout(() => { animLock = false; }, 300);
    }

    // touch swipe
    let startX = 0;
    let dragging = false;
    list.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dragging = true; });
    list.addEventListener('touchmove', e => {
      if (!dragging) return;
      const cur = e.touches[0].clientX; const diff = startX - cur;
      if (Math.abs(diff) > 50) {
        if (diff > 0) rotateNext(); else rotatePrev();
        dragging = false;
      }
    }, {passive:true});
    list.addEventListener('touchend', () => dragging = false);

    prev.addEventListener('click', rotatePrev);
    next.addEventListener('click', rotateNext);
    document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') rotatePrev(); if (e.key === 'ArrowRight') rotateNext(); });

    // initial layout
    applyLayout();

    // click to select (bring clicked card to center)
    list.addEventListener('click', (e) => {
      if (animLock) return; // prevent clicks during animation
      const card = e.target.closest('.student-card');
      if (!card) return;
      const idx = cards.indexOf(card);
      if (idx >= 0) {
        centerIndex = idx;
        applyLayout();
      }
    });

    // View profile button handler
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
  const centerEl = cards[centerIndex];
        if (!centerEl) return;
        const name = centerEl.dataset.name || centerEl.querySelector('.name')?.textContent || 'Siswa';
        const email = centerEl.dataset.email || '';
        const bio = centerEl.dataset.bio || '';
        const avatarImg = centerEl.querySelector('img') ? centerEl.querySelector('img').src : null;

        // populate profile panel
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const bioEl = document.getElementById('profile-bio');
        const avatarEl = document.querySelector('#student-profile .profile-avatar');
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
        if (bioEl) bioEl.textContent = bio;
        if (avatarEl) {
          if (avatarImg) avatarEl.style.backgroundImage = `url(${avatarImg})`;
          else avatarEl.style.backgroundImage = 'none';
        }

        if (profilePanel) {
          profilePanel.classList.remove('visually-hidden');
          profilePanel.classList.add('open');
        }
      });

      // close profile
      const closeBtn = document.getElementById('close-profile');
      if (closeBtn) closeBtn.addEventListener('click', () => {
        if (profilePanel) {
          profilePanel.classList.remove('open');
          profilePanel.classList.add('visually-hidden');
        }
      });
    }
  })();

});
