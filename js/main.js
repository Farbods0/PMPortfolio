(() => {
    const body = document.body;
    const toggleBtn = document.querySelector('.navbar-toggler');
    const closeBtns = document.querySelectorAll('.closeIcon');
    const collapseMenu = document.querySelector('.navbar-collapse');
    const topBtn = document.querySelector('.top-btn');

    // Legacy #loading guard
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.remove();
    }

    // Mobile drawer controls (with Escape key & link-click auto-close)
    const closeMobileMenu = () => {
        if (!collapseMenu) return;
        collapseMenu.classList.remove('show');
        body.style.overflow = '';
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    };

    if (toggleBtn && collapseMenu) {
        toggleBtn.addEventListener('click', () => {
            requestAnimationFrame(() => {
                const isOpen = collapseMenu.classList.contains('show');
                body.style.overflow = isOpen ? 'hidden' : '';
            });
        });
    }

    closeBtns.forEach((btn) => {
        btn.addEventListener('click', closeMobileMenu);
    });

    if (collapseMenu) {
        collapseMenu.querySelectorAll('a:not([data-bs-toggle="dropdown"])').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992) closeMobileMenu();
            });
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && collapseMenu && collapseMenu.classList.contains('show')) {
            closeMobileMenu();
        }
    });

    // Scroll-to-top button & sticky header state
    if (topBtn) {
        topBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Top reading progress bar (GPU scaleX)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let progressBar = null;
    if (!prefersReducedMotion) {
        progressBar = document.createElement('div');
        progressBar.className = 'fj-scroll-progress';
        progressBar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(progressBar);
    }

    const handleScroll = () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        if (topBtn) {
            const showTop = y > 420;
            topBtn.classList.toggle('is-visible', showTop);
            topBtn.style.opacity = showTop ? '1' : '0';
            topBtn.style.pointerEvents = showTop ? 'auto' : 'none';
        }
        if (progressBar) {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const ratio = Math.min(1, Math.max(0, y / maxScroll));
            progressBar.style.transform = `scaleX(${ratio})`;
        }
        body.classList.toggle('sticky-header', y > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Animated stat count-up ([data-countup])
    const countupEls = document.querySelectorAll('[data-countup]');
    if (countupEls.length > 0 && !prefersReducedMotion && 'IntersectionObserver' in window) {
        const animateCounter = (el) => {
            const target = parseFloat(el.dataset.countup);
            if (!Number.isFinite(target)) return;
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const duration = 850;
            const start = performance.now();

            const tick = (now) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                const current = Math.round(target * eased);
                el.textContent = `${prefix}${current}${suffix}`;
                if (t < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = `${prefix}${target}${suffix}`;
                }
            };
            requestAnimationFrame(tick);
        };

        const countObserver = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.25 }
        );
        countupEls.forEach((el) => countObserver.observe(el));
    }

    // Lightweight GPU scroll-reveal ([data-reveal])
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (revealEls.length > 0) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !('IntersectionObserver' in window)) {
            revealEls.forEach((el) => el.classList.add('is-revealed'));
        } else {
            const revealObserver = new IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const delay = entry.target.dataset.revealDelay;
                            if (delay) {
                                entry.target.style.setProperty('--reveal-delay', `${delay}ms`);
                            }
                            entry.target.classList.add('is-revealed');
                            obs.unobserve(entry.target);
                        }
                    });
                },
                { rootMargin: '0px 0px -32px 0px', threshold: 0.01 }
            );
            revealEls.forEach((el) => revealObserver.observe(el));
        }
    }

    // Smart background video controller (desktop-only, reduced-motion-aware, pauses offscreen)
    const smartVideos = document.querySelectorAll('video[data-smart-video]');
    if (smartVideos.length > 0) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const saveData = Boolean(conn && (conn.saveData || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '')));

        if (!prefersReduced && !saveData && window.innerWidth >= 768) {
            smartVideos.forEach((video) => {
                if (video.dataset.src && !video.getAttribute('src')) {
                    video.src = video.dataset.src;
                    video.load();
                }
                video.play().catch(() => {});

                if ('IntersectionObserver' in window) {
                    const vidObserver = new IntersectionObserver(
                        (entries) => {
                            entries.forEach((entry) => {
                                if (entry.isIntersecting) {
                                    video.play().catch(() => {});
                                } else {
                                    video.pause();
                                }
                            });
                        },
                        { threshold: 0.05 }
                    );
                    vidObserver.observe(video);
                }
            });
        }
    }

    // Shared copy-to-clipboard helper for [data-copy-text] buttons
    document.querySelectorAll('[data-copy-text]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const text = btn.dataset.copyText;
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const tmp = document.createElement('input');
                tmp.value = text;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
            }
            const labelEl = btn.querySelector('[data-copy-label]');
            const prev = labelEl ? labelEl.textContent : '';
            btn.classList.add('is-copied');
            if (labelEl && btn.dataset.copiedText) {
                labelEl.textContent = btn.dataset.copiedText;
            } else if (labelEl) {
                labelEl.textContent = 'Copied!';
            }
            setTimeout(() => {
                btn.classList.remove('is-copied');
                if (labelEl) labelEl.textContent = prev;
            }, 2000);
        });
    });
})();
