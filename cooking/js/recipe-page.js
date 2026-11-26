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

    // Screen Wake Lock ("Keep Screen On" / Cook Mode) with automatic re-acquire & fallback
    const wakeBtns = Array.from(document.querySelectorAll('[data-wake-lock-toggle]'));
    let wakeLock = null;
    let wantWakeLock = false;
    let fallbackVideo = null;

    const setWakeUI = (active) => {
        wakeBtns.forEach((btn) => {
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', String(active));
            const label = btn.querySelector('.btn-label');
            if (label) label.textContent = active ? 'Screen On' : 'Keep Screen On';
        });
    };

    const startFallbackVideo = async () => {
        if (!fallbackVideo) {
            fallbackVideo = document.createElement('video');
            fallbackVideo.setAttribute('playsinline', '');
            fallbackVideo.setAttribute('muted', '');
            fallbackVideo.muted = true;
            fallbackVideo.loop = true;
            fallbackVideo.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0.001;pointer-events:none;bottom:0;left:0;';
            // Minimal valid silent MP4 clip for browsers without Screen Wake Lock API
            fallbackVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjY0MyA1YzY1NzA0IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlyaWdodCAyMDAzLTIwMTUgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz0xIGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNSBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAW5kYXQAAABqZW1zZw==';
            document.body.appendChild(fallbackVideo);
        }
        try {
            await fallbackVideo.play();
            return true;
        } catch {
            return false;
        }
    };

    const stopFallbackVideo = () => {
        if (fallbackVideo) {
            fallbackVideo.pause();
        }
    };

    const acquireWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    wakeLock = null;
                    if (!wantWakeLock) {
                        setWakeUI(false);
                    }
                });
                setWakeUI(true);
                return true;
            } catch {
                // Fall through to silent video fallback
            }
        }
        const ok = await startFallbackVideo();
        setWakeUI(ok);
        return ok;
    };

    const releaseWakeLock = async () => {
        wantWakeLock = false;
        if (wakeLock) {
            try { await wakeLock.release(); } catch {}
            wakeLock = null;
        }
        stopFallbackVideo();
        setWakeUI(false);
    };

    if (wakeBtns.length > 0) {
        wakeBtns.forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (wantWakeLock) {
                    await releaseWakeLock();
                } else {
                    wantWakeLock = true;
                    const acquired = await acquireWakeLock();
                    if (!acquired) {
                        wantWakeLock = false;
                    }
                }
            });
        });

        document.addEventListener('visibilitychange', async () => {
            if (wantWakeLock && document.visibilityState === 'visible') {
                await acquireWakeLock();
            }
        });
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
        const rangeMatch = raw.match(/^(\d+(?:\.\d+)?)\s*[-]\s*(\d+(?:\.\d+)?)(.*)$/);
        if (rangeMatch) {
            const a = parseQtyToken(rangeMatch[1]);
            const b = parseQtyToken(rangeMatch[2]);
            if (a !== null && b !== null) {
                return `${formatQty(a * factor)}-${formatQty(b * factor)}${rangeMatch[3]}`;
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
