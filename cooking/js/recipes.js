(() => {
    // Load background hero video only on desktop & when reduced motion is not requested
    const heroVideo = document.getElementById('video-slider');
    if (heroVideo && heroVideo.dataset.src) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced && window.innerWidth >= 768) {
            heroVideo.src = heroVideo.dataset.src;
            heroVideo.load();
            heroVideo.play().catch(() => {});
        }
    }

    const swiperWrapper = document.getElementById('recipes-swiper');
    const searchInput = document.getElementById('recipes-search-input');
    const clearBtn = document.getElementById('recipes-search-clear');
    const filterPills = Array.from(document.querySelectorAll('.filter-pill'));
    const countEl = document.getElementById('recipes-count');
    const emptyStateEl = document.getElementById('recipes-empty-state');
    const sliderWrapperEl = document.getElementById('recipes-slider-wrapper');
    const resetBtn = document.getElementById('recipes-reset-btn');

    if (!swiperWrapper) return;

    let allRecipes = [];
    let swiperInstance = null;
    let activeCategory = 'All';
    let searchQuery = '';

    const escapeHtml = (str) =>
        String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const normalizeSlug = (str) =>
        String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const debounce = (fn, timeout = 200) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), timeout);
        };
    };

    const getSwiperConfig = (count) => {
        const useTwoRows = count > 3;
        return {
            observer: true,
            observeParents: true,
            spaceBetween: 0,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                300: {
                    grid: { fill: 'row', rows: 1 },
                    slidesPerView: 1,
                    slidesPerGroup: 1,
                    spaceBetween: 0,
                },
                768: {
                    grid: { fill: 'row', rows: 1 },
                    slidesPerView: 2,
                    slidesPerGroup: 2,
                    spaceBetween: 0,
                },
                992: {
                    grid: { fill: 'row', rows: useTwoRows ? 2 : 1 },
                    slidesPerView: 3,
                    slidesPerGroup: 3,
                    spaceBetween: 0,
                },
            },
        };
    };

    const buildCardHtml = (recipe) => {
        const href = `./${encodeURIComponent(recipe.slug)}/`;
        return `
            <div class="swiper-slide" data-slug="${escapeHtml(recipe.slug)}">
                <a class="card-food card-food-link" href="${href}">
                    <div class="imgTitle">
                        <div class="img-wrapper">
                            <img src="./${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.title)}" loading="lazy">
                            <span class="card-cat-badge">${escapeHtml(recipe.category)}</span>
                        </div>
                    </div>
                    <div class="cardBody">
                        <h4 class="title">${escapeHtml(recipe.title)}</h4>
                        <p class="card-desc">${escapeHtml(recipe.description)}</p>
                        <div class="card-meta-footer">
                            <span class="card-time">
                                <iconify-icon icon="ic:outline-watch-later"></iconify-icon>
                                ${escapeHtml(recipe.totalTime || recipe.prepTime)}
                            </span>
                            <span class="btn-read">View Recipe →</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    };

    const syncUrlParams = () => {
        const url = new URL(window.location.href);
        if (searchQuery) {
            url.searchParams.set('q', searchQuery);
        } else {
            url.searchParams.delete('q');
        }
        if (activeCategory && activeCategory !== 'All') {
            url.searchParams.set('category', activeCategory);
        } else {
            url.searchParams.delete('category');
        }
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    };

    const renderFiltered = () => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = allRecipes.filter((r) => {
            if (activeCategory !== 'All' && r.category !== activeCategory) {
                return false;
            }
            if (!q) return true;
            return r._searchIndex.includes(q);
        });

        if (clearBtn) {
            clearBtn.hidden = !searchQuery;
        }

        if (countEl) {
            if (!q && activeCategory === 'All') {
                countEl.textContent = `Showing all ${filtered.length} recipes`;
            } else {
                countEl.textContent = `Showing ${filtered.length} of ${allRecipes.length} recipes`;
            }
        }

        if (filtered.length === 0) {
            if (emptyStateEl) emptyStateEl.hidden = false;
            if (sliderWrapperEl) sliderWrapperEl.hidden = true;
            if (swiperInstance) {
                swiperInstance.destroy(true, true);
                swiperInstance = null;
            }
            swiperWrapper.innerHTML = '';
            return;
        }

        if (emptyStateEl) emptyStateEl.hidden = true;
        if (sliderWrapperEl) sliderWrapperEl.hidden = false;

        if (swiperInstance) {
            swiperInstance.destroy(true, true);
            swiperInstance = null;
        }

        swiperWrapper.innerHTML = filtered.map(buildCardHtml).join('');

        if (typeof Swiper !== 'undefined') {
            swiperInstance = new Swiper('.mySwiper', getSwiperConfig(filtered.length));
        }
    };

    const checkDirectRecipeParam = (recipes) => {
        const params = new URLSearchParams(window.location.search);
        const directParam = params.get('recipe') || (window.location.hash && window.location.hash !== '#cooking' ? window.location.hash.slice(1) : '');
        if (!directParam) return false;

        const target = normalizeSlug(directParam);
        const match = recipes.find((r) => {
            const candidates = [r.slug, r.legacySlug, ...(r.aliases || []), r.title];
            return candidates.some((c) => normalizeSlug(c) === target);
        });

        if (match) {
            window.location.replace(`./${match.slug}/`);
            return true;
        }
        return false;
    };

    const init = async () => {
        try {
            const res = await fetch('./data/recipes.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (checkDirectRecipeParam(data)) return;

            allRecipes = data.map((r) => {
                const ingredientsText = (r.ingredientGroups || [])
                    .flatMap((g) => [g.title || '', ...(g.items || [])])
                    .join(' ');
                return {
                    ...r,
                    _searchIndex: [
                        r.title,
                        r.description,
                        r.category,
                        r.slug,
                        ...(r.aliases || []),
                        ingredientsText,
                    ]
                        .join(' ')
                        .toLowerCase(),
                };
            });

            // Restore query/category from URL if present
            const params = new URLSearchParams(window.location.search);
            const initialQ = params.get('q');
            const initialCat = params.get('category');
            if (initialQ && searchInput) {
                searchQuery = initialQ;
                searchInput.value = initialQ;
            }
            if (initialCat && ['All', 'Appetizer', 'Entree', 'Dessert'].includes(initialCat)) {
                activeCategory = initialCat;
                filterPills.forEach((p) => {
                    const active = p.dataset.category === activeCategory;
                    p.classList.toggle('is-active', active);
                    p.setAttribute('aria-selected', String(active));
                });
            }

            renderFiltered();
        } catch (err) {
            console.error('Failed to load recipes:', err);
            if (countEl) {
                countEl.textContent = 'Unable to load recipes right now.';
            }
        }
    };

    if (searchInput) {
        searchInput.addEventListener(
            'input',
            debounce((e) => {
                searchQuery = e.target.value;
                syncUrlParams();
                renderFiltered();
            }, 180)
        );
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchQuery = '';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            syncUrlParams();
            renderFiltered();
        });
    }

    filterPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            activeCategory = pill.dataset.category || 'All';
            filterPills.forEach((p) => {
                const active = p === pill;
                p.classList.toggle('is-active', active);
                p.setAttribute('aria-selected', String(active));
            });
            syncUrlParams();
            renderFiltered();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchQuery = '';
            activeCategory = 'All';
            if (searchInput) searchInput.value = '';
            filterPills.forEach((p) => {
                const active = p.dataset.category === 'All';
                p.classList.toggle('is-active', active);
                p.setAttribute('aria-selected', String(active));
            });
            syncUrlParams();
            renderFiltered();
        });
    }

    init();
})();
