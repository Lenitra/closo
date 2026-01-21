/**
 * Closo Landing Page - JavaScript
 * Handles animations, mobile menu, form submission, and scroll effects
 */

(function () {
    'use strict';

    // ==========================================================================
    // DOM Elements
    // ==========================================================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('.nav');
    const ctaForm = document.querySelector('.cta-form');
    const fadeInUpElements = document.querySelectorAll('.fade-in-up');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');

    // ==========================================================================
    // Mobile Menu
    // ==========================================================================
    function toggleMobileMenu() {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';

        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileMenuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        mobileMenu.setAttribute('aria-hidden', isExpanded);

        // Prevent body scroll when menu is open
        document.body.style.overflow = !isExpanded ? 'hidden' : '';
    }

    function closeMobileMenu() {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Close menu when clicking a link
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // ==========================================================================
    // Navigation Scroll Effect
    // ==========================================================================
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNav() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            nav.style.boxShadow = 'none';
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateNav);
            ticking = true;
        }
    });

    // ==========================================================================
    // Intersection Observer for Scroll Animations
    // ==========================================================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeInUpElements.forEach(el => {
        observer.observe(el);
    });

    // ==========================================================================
    // Form Submission
    // ==========================================================================
    if (ctaForm) {
        ctaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = ctaForm.querySelector('input[type="email"]');
            const submitBtn = ctaForm.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();

            if (!email) return;

            // Disable form during submission
            emailInput.disabled = true;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Inscription...
            `;

            // Simulate API call (replace with actual API endpoint)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success state
            submitBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Inscrit !
            `;
            submitBtn.style.background = '#10b981';
            emailInput.value = '';

            // Show success message
            const hint = ctaForm.querySelector('.form-hint');
            if (hint) {
                hint.textContent = 'Merci ! Vous recevrez bientôt des nouvelles.';
                hint.style.color = '#10b981';
            }

            // Reset after delay
            setTimeout(() => {
                emailInput.disabled = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    Rejoindre
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                submitBtn.style.background = '';
                if (hint) {
                    hint.textContent = 'Nous respectons votre vie privée. Pas de spam, promis.';
                    hint.style.color = '';
                }
            }, 5000);
        });
    }

    // ==========================================================================
    // Smooth Scroll for Anchor Links
    // ==========================================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = nav.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================================================
    // Add Spinner Animation Style
    // ==========================================================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spinner {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // ==========================================================================
    // Parallax Effect for Hero (subtle)
    // ==========================================================================
    const heroMockup = document.querySelector('.hero-mockup');

    if (heroMockup && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrolled = window.scrollY;
                    if (scrolled < window.innerHeight) {
                        heroMockup.style.transform = `translateY(${scrolled * 0.1}px)`;
                    }
                });
            }
        });
    }

    // ==========================================================================
    // Initial Page Load Animation
    // ==========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('loaded');
    });

})();
