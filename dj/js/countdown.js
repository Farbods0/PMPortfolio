(() => {
    // Clean countdown to Thursday 8:00 PM America/Los_Angeles (no exposed client secrets or 1s API spam)
    const countdownEl = document.getElementById('toFriday');
    const titleEl = document.getElementById('live-stream-title');
    const pillEl = document.getElementById('live-status-pill');
    const pillLabelEl = document.getElementById('live-pill-label');
    const toggleBtn = document.getElementById('toggle-twitch-embed');
    const toggleLabel = document.getElementById('toggle-twitch-label');
    const embedSlot = document.getElementById('twitch-embed-slot');

    if (!countdownEl) return;

    const pad = (n) => (n < 10 ? `0${n}` : String(n));

    const getPtParts = () => {
        const now = new Date();
        const ptDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        const day = ptDate.getDay(); // 0 = Sun, 4 = Thu
        const hour = ptDate.getHours();
        const isLiveWindow = day === 4 && hour >= 20 && hour < 23;

        const target = new Date(ptDate);
        let daysAhead = (4 - day + 7) % 7;
        if (daysAhead === 0 && (hour > 20 || (hour === 20 && (ptDate.getMinutes() > 0 || ptDate.getSeconds() > 0)))) {
            daysAhead = 7;
        }
        target.setDate(target.getDate() + daysAhead);
        target.setHours(20, 0, 0, 0);

        const diffMs = Math.max(0, Math.ceil((target - ptDate) / 1000) * 1000);
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);

        return { days, hours, mins, secs, isLiveWindow };
    };

    const renderTick = () => {
        const { days, hours, mins, secs, isLiveWindow } = getPtParts();

        if (pillEl && pillLabelEl && titleEl) {
            pillEl.classList.toggle('is-live', isLiveWindow);
            pillLabelEl.textContent = isLiveWindow
                ? 'Live Stream Window Now Open'
                : 'Thursdays · 8:00 PM PT';
            titleEl.textContent = isLiveWindow
                ? 'Casa de DJ FJ: Thursday Night Session'
                : 'Next Casa de DJ FJ Livestream';
        }

        countdownEl.innerHTML = `
            <div class="cd-unit">
                <span class="cd-value">${pad(days)}</span>
                <span class="cd-label">Days</span>
            </div>
            <div class="cd-unit">
                <span class="cd-value">${pad(hours)}</span>
                <span class="cd-label">Hours</span>
            </div>
            <div class="cd-unit">
                <span class="cd-value">${pad(mins)}</span>
                <span class="cd-label">Minutes</span>
            </div>
            <div class="cd-unit">
                <span class="cd-value">${pad(secs)}</span>
                <span class="cd-label">Seconds</span>
            </div>
        `;
    };

    renderTick();
    setInterval(() => {
        if (!document.hidden) renderTick();
    }, 1000);

    // Optional on-demand Twitch player embed (loads iframe only when requested)
    if (toggleBtn && embedSlot) {
        let opened = false;
        toggleBtn.addEventListener('click', () => {
            opened = !opened;
            embedSlot.hidden = !opened;
            if (toggleLabel) {
                toggleLabel.textContent = opened ? 'Hide Live Player' : 'Preview Live Player';
            }
            if (opened && !embedSlot.querySelector('iframe')) {
                const parentHost = window.location.hostname || 'farbodjahan.com';
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.twitch.tv/?channel=fjahan&parent=${encodeURIComponent(parentHost)}&muted=false`;
                iframe.allowFullscreen = true;
                iframe.title = 'DJ FJ Twitch Livestream';
                embedSlot.appendChild(iframe);
            }
        });
    }
})();
