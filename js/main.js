/* ============================================
   SSBD — Same Same But Different
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Sticky Navigation --- */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  }

  /* --- Mobile Menu --- */
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.nav__mobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* --- Hero Word Stagger Animation --- */
  const heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    const text = heroTitle.textContent.trim();
    heroTitle.innerHTML = text.split(' ').map((word, i) =>
      `<span class="word" style="animation-delay:${i * 0.08}s">${word}</span>`
    ).join(' ');
  }

  /* --- Scroll Reveal (Intersection Observer) --- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

      reveals.forEach((el, i) => {
        el.style.transitionDelay = `${(i % 6) * 0.1}s`;
        observer.observe(el);
      });

      // Safety net: force all reveals visible after 3s
      setTimeout(() => {
        reveals.forEach(el => el.classList.add('visible'));
      }, 3000);
    } else {
      // No IntersectionObserver support — show all immediately
      reveals.forEach(el => el.classList.add('visible'));
    }
  }

  /* --- Smooth Scroll for Anchor Links --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* --- FAQ Accordion --- */
  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      item.closest('.faq__list').querySelectorAll('.faq__item').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* --- Portfolio Filter --- */
  const filterBtns = document.querySelectorAll('.portfolio-filters button');
  const portfolioCards = document.querySelectorAll('.portfolio-grid .portfolio-card');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        portfolioCards.forEach(card => {
          card.dataset.hidden = (filter !== 'all' && card.dataset.category !== filter) ? 'true' : 'false';
        });
      });
    });
  }

  /* --- Portfolio Modal --- */
  const modal = document.querySelector('.modal');
  if (modal) {
    const modalImg = modal.querySelector('.modal__image img');
    const modalTitle = modal.querySelector('.modal__body h3');
    const modalMeta = modal.querySelector('.modal__meta');
    const modalDesc = modal.querySelector('.modal__desc');
    const modalClose = modal.querySelector('.modal__close');

    document.querySelectorAll('.portfolio-card[data-title]').forEach(card => {
      card.addEventListener('click', () => {
        if (modalImg) modalImg.src = card.querySelector('img').src;
        if (modalTitle) modalTitle.textContent = card.dataset.title;
        if (modalMeta) modalMeta.innerHTML = `<span>${card.dataset.category}</span><span>${card.dataset.location || ''}</span>`;
        if (modalDesc) modalDesc.textContent = card.dataset.desc || '';
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* --- Contact Form --- */
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const action = contactForm.getAttribute('action');

      fetch(action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).then(response => {
        if (response.ok) {
          contactForm.style.display = 'none';
          document.querySelector('.form-success').classList.add('show');
        }
      }).catch(() => {
        contactForm.style.display = 'none';
        document.querySelector('.form-success').classList.add('show');
      });
    });
  }

});
