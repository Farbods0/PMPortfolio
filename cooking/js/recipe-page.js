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

    // Batch Scaler (0.5x / 1x / 2x) for ingredient quantities & yield
    const scaleBtns = document.querySelectorAll('.scale-pill[data-scale]');
    const yieldEl = document.getElementById('recipe-yield-val');
    const ingLabels = document.querySelectorAll('.ingredient-item label[data-raw-text]');

    const parseQtyToken = (str) => {
        const clean = str.trim();
        // Mixed fraction: "1 1/2"
        const mixed = clean.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
        // Simple fraction: "3/4"
        const frac = clean.match(/^(\d+)\/(\d+)$/);
        if (frac) return Number(frac[1]) / Number(frac[2]);
        // Decimal or integer
        const num = Number(clean);
        return Number.isFinite(num) ? num : null;
    };

    const formatQty = (val) => {
        if (val <= 0) return '0';
        const whole = Math.floor(val + 1e-6);
        const rem = val - whole;
        const fracs = [
            [1 / 8, '1/8'],
            [1 / 4, '1/4'],
            [1 / 3, '1/3'],
            [1 / 2, '1/2'],
            [2 / 3, '2/3'],
            [3 / 4, '3/4'],
        ];
        for (const [fVal, fStr] of fracs) {
            if (Math.abs(rem - fVal) < 0.04) {
                return whole > 0 ? `${whole} ${fStr}` : fStr;
            }
        }
        const rounded = Math.round(val * 100) / 100;
        return String(rounded);
    };

    const scaleLeadingQuantity = (raw, factor) => {
        if (factor === 1 || !raw) return raw;
        // Do not scale step-like notes such as "6 minutes cook boiling water..."
        if (/^\d+\s*(?:min|minute|minutes|hr|hour|hours|sec|second|inch|in\b)/i.test(raw.trim())) {
            return raw;
        }
        // Range at start: "4-5 cloves" or "1 - 2 lb"
        const rangeMatch = raw.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)(.*)$/);
        if (rangeMatch) {
            const a = parseQtyToken(rangeMatch[1]);
            const b = parseQtyToken(rangeMatch[2]);
            if (a !== null && b !== null) {
                return `${formatQty(a * factor)}–${formatQty(b * factor)}${rangeMatch[3]}`;
            }
        }
        // Mixed fraction, fraction, or number at start
        const qtyMatch = raw.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(.*)$/);
        if (qtyMatch) {
            const parsed = parseQtyToken(qtyMatch[1]);
            if (parsed !== null) {
                return `${formatQty(parsed * factor)}${qtyMatch[2]}`;
            }
        }
        return raw;
    };

    if (scaleBtns.length > 0) {
        scaleBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const factor = Number(btn.dataset.scale) || 1;
                scaleBtns.forEach((b) => b.classList.toggle('is-active', b === btn));

                ingLabels.forEach((lbl) => {
                    lbl.textContent = scaleLeadingQuantity(lbl.dataset.rawText || '', factor);
                });

                if (yieldEl && yieldEl.dataset.baseYield) {
                    yieldEl.textContent = scaleLeadingQuantity(yieldEl.dataset.baseYield, factor);
                }
            });
        });
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
