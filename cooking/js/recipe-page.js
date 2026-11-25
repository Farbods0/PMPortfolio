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

    // Interactive ingredient checkboxes
    document.querySelectorAll('.ingredient-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return;
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            if (checkbox) {
                item.classList.toggle('is-checked', checkbox.checked);
            }
        });
    });

    // Interactive instruction steps
    document.querySelectorAll('.recipe-step-item').forEach((step) => {
        step.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'IMG') return;
            step.classList.toggle('is-done');
        });
    });
})();

