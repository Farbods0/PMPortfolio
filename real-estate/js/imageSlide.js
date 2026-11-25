(() => {
    // GPU-only dual-layer architectural photo crossfades (zero layout reflow)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const imagePools = [
        [
            './assets/optimized/real-estate.webp',
            './assets/optimized/real-estate-2.webp',
            './assets/optimized/real-estate-8.webp',
            './assets/optimized/real-estate-10.webp',
        ],
        [
            './assets/optimized/real-estate-4.webp',
            './assets/optimized/real-estate-5.webp',
            './assets/optimized/real-estate-9.webp',
        ],
        [
            './assets/optimized/real-estate-3.webp',
            './assets/optimized/real-estate-7.webp',
            './assets/optimized/real-estate-11.webp',
        ],
    ];

    document.querySelectorAll('[data-re-gallery]').forEach((frame, frameIdx) => {
        const pool = imagePools[frameIdx] || imagePools[0];
        const layers = frame.querySelectorAll('.re-gallery-layer');
        if (pool.length < 2 || layers.length < 2) return;

        let activeLayer = 0;
        let idx = 0;
        let paused = false;

        frame.addEventListener('mouseenter', () => { paused = true; });
        frame.addEventListener('mouseleave', () => { paused = false; });

        const advance = () => {
            if (paused || document.hidden) return;
            const nextIdx = (idx + 1) % pool.length;
            const nextSrc = pool[nextIdx];
            const nextLayer = 1 - activeLayer;

            const preloader = new Image();
            preloader.onload = () => {
                layers[nextLayer].src = nextSrc;
                requestAnimationFrame(() => {
                    layers[nextLayer].classList.add('is-visible');
                    layers[activeLayer].classList.remove('is-visible');
                    activeLayer = nextLayer;
                    idx = nextIdx;
                });
            };
            preloader.src = nextSrc;
        };

        setTimeout(() => {
            setInterval(advance, 4800);
        }, frameIdx * 1300 + 2000);
    });
})();
