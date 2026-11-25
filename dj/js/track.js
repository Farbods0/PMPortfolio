(() => {
    const trackContainer = document.getElementById('latest-music-tracks');
    if (!trackContainer) return;

    // Update SoundCloud track IDs here as new mixes drop
    const tracks = [
        { id: '2054831012', tag: 'Featured Set · 01', genre: 'House & Melodic' },
        { id: '1829599182', tag: 'Featured Set · 02', genre: 'Deep & Vocal House' },
        { id: '1438807573', tag: 'Featured Set · 03', genre: 'Club Grooves' },
    ];

    const buildEmbedUrl = (id) =>
        `https://w.soundcloud.com/player/?url=${encodeURIComponent(
            `https://api.soundcloud.com/tracks/${id}`
        )}&color=%23a855f7&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;

    trackContainer.innerHTML = tracks
        .map(
            (t, idx) => `
            <article class="dj-mix-card">
                <div class="dj-mix-meta">
                    <span class="dj-mix-tag">${t.tag}</span>
                    <span>${t.genre}</span>
                </div>
                <iframe
                    src="${buildEmbedUrl(t.id)}"
                    loading="lazy"
                    allow="autoplay; encrypted-media"
                    title="DJ FJ SoundCloud Mix ${idx + 1}">
                </iframe>
            </article>
        `
        )
        .join('');
})();
