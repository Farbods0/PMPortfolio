(() => {
    const gridEl = document.getElementById('all-recipes-grid');
    const searchInput = document.getElementById('dir-search-input');
    const clearBtn = document.getElementById('dir-search-clear');
    const categoryPills = Array.from(document.querySelectorAll('.dir-cat-pill'));
    const timeSelect = document.getElementById('dir-time-filter');
    const sortSelect = document.getElementById('dir-sort-select');
    const countEl = document.getElementById('dir-recipes-count');
    const emptyEl = document.getElementById('dir-empty-state');
    const resetBtn = document.getElementById('dir-reset-btn');

    if (!gridEl) return;

    let allRecipes = [];
    let activeCategory = 'All';
    let activeTime = 'all';
    let activeSort = 'featured';
    let searchQuery = '';

    const escapeHtml = (str) =>
        String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    const parseMinutes = (text) => {
        if (!text) return 9999;
        const t = text.toLowerCase();
        const days = t.match(/(\d+(?:\.\d+)?)\s*day/);
        const hours = t.match(/(\d+(?:\.\d+)?)\s*h(?:our|r)/);
        const mins = t.match(/(\d+(?:\.\d+)?)\s*min/);
        let total = 0;
        if (days) total += parseFloat(days[1]) * 1440;
        if (hours) total += parseFloat(hours[1]) * 60;
        if (mins) total += parseFloat(mins[1]);
        return total || 9999;
    };

    const debounce = (fn, timeout = 150) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), timeout);
        };
    };

    const syncUrl = () => {
        const url = new URL(window.location.href);
        if (searchQuery) url.searchParams.set('q', searchQuery);
        else url.searchParams.delete('q');

        if (activeCategory !== 'All') url.searchParams.set('category', activeCategory);
        else url.searchParams.delete('category');

        if (activeTime !== 'all') url.searchParams.set('time', activeTime);
        else url.searchParams.delete('time');

        if (activeSort !== 'featured') url.searchParams.set('sort', activeSort);
        else url.searchParams.delete('sort');

        window.history.replaceState(null, '', url.pathname + url.search);
    };

    const buildCard = (r) => `
        <div class="col-md-6 col-lg-4">
            <a class="card-food card-food-link dir-card" href="../${encodeURIComponent(r.slug)}/">
                <div class="imgTitle">
                    <div class="img-wrapper">
                        <img src="../${escapeHtml(r.image)}" alt="${escapeHtml(r.title)}" loading="lazy">
                        <span class="card-cat-badge">${escapeHtml(r.category)}</span>
                    </div>
                </div>
                <div class="cardBody">
                    <h2 class="title">${escapeHtml(r.title)}</h2>
                    <p class="card-desc">${escapeHtml(r.description)}</p>
                    <div class="card-meta-footer">
                        <span class="card-time">
                            <iconify-icon icon="ic:outline-watch-later"></iconify-icon>
                            ${escapeHtml(r.totalTime || r.prepTime)}
                        </span>
                        <span class="btn-read">View Recipe →</span>
                    </div>
                </div>
            </a>
        </div>
    `;

    const matchesTime = (mins) => {
        if (activeTime === 'all') return true;
        if (activeTime === 'quick') return mins <= 45;
        if (activeTime === 'medium') return mins > 45 && mins <= 180;
        if (activeTime === 'long') return mins > 180;
        return true;
    };

    const render = () => {
        const q = searchQuery.trim().toLowerCase();
        let filtered = allRecipes.filter((r) => {
            if (activeCategory !== 'All' && r.category !== activeCategory) return false;
            if (!matchesTime(r._totalMinutes)) return false;
            if (q && !r._searchIndex.includes(q)) return false;
            return true;
        });

        if (activeSort === 'alpha') {
            filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        } else if (activeSort === 'quickest') {
            filtered = [...filtered].sort((a, b) => a._totalMinutes - b._totalMinutes);
        }

        if (clearBtn) clearBtn.hidden = !searchQuery;

        if (countEl) {
            const hasFilters = q || activeCategory !== 'All' || activeTime !== 'all';
            countEl.textContent = hasFilters
                ? `Showing ${filtered.length} of ${allRecipes.length} recipes`
                : `Showing all ${filtered.length} recipes`;
        }

        if (filtered.length === 0) {
            gridEl.innerHTML = '';
            if (emptyEl) emptyEl.hidden = false;
            return;
        }

        if (emptyEl) emptyEl.hidden = true;
        gridEl.innerHTML = filtered.map(buildCard).join('');
    };

    const applyCategoryUI = () => {
        categoryPills.forEach((p) => {
            const active = p.dataset.category === activeCategory;
            p.classList.toggle('is-active', active);
            p.setAttribute('aria-selected', String(active));
        });
    };

    const init = async () => {
        try {
            const res = await fetch('../data/recipes.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            allRecipes = data.map((r) => {
                const ingredientsText = (r.ingredientGroups || [])
                    .flatMap((g) => [g.title || '', ...(g.items || [])])
                    .join(' ');
                return {
                    ...r,
                    _totalMinutes: parseMinutes(r.totalTime || r.prepTime),
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

            // Populate category counts on pills
            const counts = { All: allRecipes.length, Appetizer: 0, Entree: 0, Dessert: 0, Drinks: 0 };
            allRecipes.forEach((r) => {
                if (counts[r.category] !== undefined) counts[r.category] += 1;
            });
            categoryPills.forEach((pill) => {
                const cat = pill.dataset.category;
                const badge = pill.querySelector('.pill-count');
                if (badge && counts[cat] !== undefined) {
                    badge.textContent = counts[cat];
                }
            });

            // Restore URL filters
            const params = new URLSearchParams(window.location.search);
            if (params.get('q') && searchInput) {
                searchQuery = params.get('q');
                searchInput.value = searchQuery;
            }
            if (params.get('category') && counts[params.get('category')] !== undefined) {
                activeCategory = params.get('category');
                applyCategoryUI();
            }
            if (params.get('time') && timeSelect && ['all', 'quick', 'medium', 'long'].includes(params.get('time'))) {
                activeTime = params.get('time');
                timeSelect.value = activeTime;
            }
            if (params.get('sort') && sortSelect && ['featured', 'alpha', 'quickest'].includes(params.get('sort'))) {
                activeSort = params.get('sort');
                sortSelect.value = activeSort;
            }

            render();
        } catch (err) {
            console.error('Failed to load recipes:', err);
            if (countEl) countEl.textContent = 'Unable to load recipes right now.';
        }
    };

    if (searchInput) {
        searchInput.addEventListener(
            'input',
            debounce((e) => {
                searchQuery = e.target.value;
                syncUrl();
                render();
            }, 150)
        );
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchQuery = '';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            syncUrl();
            render();
        });
    }

    categoryPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            activeCategory = pill.dataset.category || 'All';
            applyCategoryUI();
            syncUrl();
            render();
        });
    });

    if (timeSelect) {
        timeSelect.addEventListener('change', (e) => {
            activeTime = e.target.value;
            syncUrl();
            render();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeSort = e.target.value;
            syncUrl();
            render();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchQuery = '';
            activeCategory = 'All';
            activeTime = 'all';
            activeSort = 'featured';
            if (searchInput) searchInput.value = '';
            if (timeSelect) timeSelect.value = 'all';
            if (sortSelect) sortSelect.value = 'featured';
            applyCategoryUI();
            syncUrl();
            render();
        });
    }

    init();
})();
