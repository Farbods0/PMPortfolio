(() => {
    /* Appetizers */
    const foodImageList1 = [
        'assets/optimized/Bruscetta.webp',
        'assets/optimized/artisanbreaddutch.webp',
        'assets/Food/BloominOnion.jpeg',
        'assets/optimized/bread.webp',
        'assets/optimized/brussel.webp',
        'assets/optimized/crispy-salt-and-pepper-smashed-potatoes-3.webp',
    ];
    /* Entree */
    const foodImageList2 = [
        'assets/Food/spaghetti.jpg',
        'assets/optimized/burrito.webp',
        'assets/Food/birriaQuesaTacos.jpeg',
        'assets/optimized/ashReshteh.webp',
        'assets/optimized/Popeyes.webp',
        'assets/optimized/tonkotsu.webp',
    ];
    /* Dessert */
    const foodImageList3 = [
        'assets/optimized/pumpkinBread.webp',
        'assets/optimized/rasberry.webp',
        'assets/optimized/croissants.webp',
        'assets/optimized/churros.webp',
    ];

    function setupDynamicImage(id, borderId, interval, delay, images, direction) {
        const image = document.getElementById(id);
        const border = document.getElementById(borderId);
        if (!image || !border || !images.length) return;

        const inClass = direction === 'left' ? 'fade-in-left' : 'fade-in-right';
        const outClass = direction === 'left' ? 'fade-out-left' : 'fade-out-right';
        let index = 0;

        setTimeout(() => {
            setTimeout(() => {
                image.classList.remove(inClass);
                image.classList.add(outClass);
                border.classList.remove(inClass);
                border.classList.add(outClass);
            }, interval - 1500);

            setInterval(() => {
                index = (index + 1) % images.length;
                image.src = images[index];
                image.classList.remove(outClass);
                image.classList.add(inClass);
                border.classList.remove(outClass);
                border.classList.add(inClass);

                setTimeout(() => {
                    image.classList.remove(inClass);
                    image.classList.add(outClass);
                    border.classList.remove(inClass);
                    border.classList.add(outClass);
                }, interval - 1500);
            }, interval);
        }, delay);
    }

    setupDynamicImage('dynamic-image-1', 'dynamic-border-1', 5000, 0, foodImageList1, 'right');
    setupDynamicImage('dynamic-image-2', 'dynamic-border-2', 5000, 1000, foodImageList2, 'left');
    setupDynamicImage('dynamic-image-3', 'dynamic-border-3', 5000, 500, foodImageList3, 'right');
})();
