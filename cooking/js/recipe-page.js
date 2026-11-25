(() => {
    // Copy Link button
    const copyBtn = document.getElementById('copy-link-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const url = copyBtn.dataset.url || window.location.href;
            try {
                await navigator.clipboard.writeText(url);
            } catch {
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }
            const label = copyBtn.querySelector('.btn-label');
            const prev = label ? label.textContent : '';
            if (label) label.textContent = 'Copied!';
            copyBtn.classList.add('is-active');
            setTimeout(() => {
                if (label) label.textContent = prev;
                copyBtn.classList.remove('is-active');
            }, 2000);
        });
    }

    // Print button
    const printBtn = document.getElementById('print-recipe-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }

    // Screen Wake Lock ("Cook Mode")
    const wakeBtn = document.getElementById('wake-lock-btn');
    let wakeLock = null;
    if (wakeBtn) {
        if (!('wakeLock' in navigator)) {
            wakeBtn.style.display = 'none';
        } else {
            const setWakeState = (active) => {
                wakeBtn.classList.toggle('is-active', active);
                wakeBtn.setAttribute('aria-pressed', String(active));
                const label = wakeBtn.querySelector('.btn-label');
                if (label) label.textContent = active ? 'Screen Awake' : 'Keep Awake';
            };

            wakeBtn.addEventListener('click', async () => {
                if (wakeLock) {
                    try { await wakeLock.release(); } catch {}
                    wakeLock = null;
                    setWakeState(false);
                    return;
                }
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    setWakeState(true);
                    wakeLock.addEventListener('release', () => {
                        wakeLock = null;
                        setWakeState(false);
                    });
                } catch {
                    setWakeState(false);
                }
            });

            document.addEventListener('visibilitychange', async () => {
                if (wakeLock !== null && document.visibilityState === 'visible') {
                    try {
                        wakeLock = await navigator.wakeLock.request('screen');
                    } catch {}
                }
            });
        }
    }

    // Progress & reset helper
    const resetChecksBtn = document.getElementById('reset-checks-btn');
    const updateResetVisibility = () => {
        if (!resetChecksBtn) return;
        const checkedIngredients = document.querySelectorAll('.ingredient-check:checked').length;
        const doneSteps = document.querySelectorAll('.recipe-step-item.is-done').length;
        const total = checkedIngredients + doneSteps;
        resetChecksBtn.hidden = total === 0;
    };

    if (resetChecksBtn) {
        resetChecksBtn.addEventListener('click', () => {
            document.querySelectorAll('.ingredient-item').forEach((item) => {
                const cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = false;
                item.classList.remove('is-checked');
            });
            document.querySelectorAll('.recipe-step-item.is-done').forEach((step) => {
                step.classList.remove('is-done');
            });
            updateResetVisibility();
        });
    }

    // Interactive ingredient checkboxes
    document.querySelectorAll('.ingredient-item').forEach((item) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (!checkbox) return;

        const syncChecked = () => {
            item.classList.toggle('is-checked', checkbox.checked);
            updateResetVisibility();
        };

        checkbox.addEventListener('change', syncChecked);

        item.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return;
            if (e.target === checkbox || e.target.closest('label')) return;
            checkbox.checked = !checkbox.checked;
            syncChecked();
        });
    });

    // Interactive instruction steps
    document.querySelectorAll('.recipe-step-item').forEach((step) => {
        step.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'IMG') return;
            step.classList.toggle('is-done');
            updateResetVisibility();
        });
    });
})();
