function debounce(fn, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), timeout);
    };
}

const updateSwiperOptions = (text) => {
    let newOptions;

    if (text === '') {
        newOptions = {
            observer: true,
            observeParents: true,
            spaceBetween: 0,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },

            breakpoints: {
                300: {
                    grid: {
                        fill: 'row',
                        rows: 1,
                    },
                    slidesPerView: 1,
                    spaceBetween: 0,
                },
                768: {
                    grid: {
                        fill: 'row',
                        rows: 1,
                    },
                    slidesPerView: 2,
                    spaceBetween: 0,
                },
                992: {
                    grid: {
                        fill: 'row',
                        rows: 2,
                    },
                    slidesPerView: 3,
                    spaceBetween: 0,
                },
            },
        }
    } else {
        newOptions = {
            observer: true,
            observeParents: true,
            spaceBetween: 0,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },

            breakpoints: {
                300: {
                    grid: {
                        fill: 'row',
                        rows: 1,
                    },
                    slidesPerView: 1,
                    spaceBetween: 0,
                },
                768: {
                    grid: {
                        fill: 'row',
                        rows: 1,
                    },
                    slidesPerView: 2,
                    spaceBetween: 0,
                },
                992: {
                    grid: {
                        fill: 'row',
                        rows: 1,
                    },
                    slidesPerView: 3,
                    spaceBetween: 0,
                },
            },
        }
    }

    swiper.destroy();
    swiper = new Swiper('.mySwiper', newOptions);
}

const searchRecipe = (text) => {
    updateSwiperOptions(text);

    recipes.forEach((recipe) => {
        const title = $(`#${recipe} .title`).html().replace(/&amp;/g, '&');
        if ((title.toLowerCase()).includes(text.toLowerCase())) {
            $(`#${recipe}`).css('display', '');
            swiper.update();
            swiper.updateSize();
        } else {
            $(`#${recipe}`).css('display', 'none');
            swiper.update();
            swiper.updateSize();
        }
    });


    const visibleSlides = $('.swiper-slide').filter(':visible').length;

    if (visibleSlides <= 1 && window.innerWidth < 600) {
        swiper.slideTo(0);
        $('.swiper-button-next').addClass('swiper-button-disabled');
    } else if (visibleSlides <= 2 && window.innerWidth < 768) {
        swiper.slideTo(0);
        $('.swiper-button-next').addClass('swiper-button-disabled');
    } else if (visibleSlides <= 3 && window.innerWidth > 768) {
        swiper.slideTo(0);
        $('.swiper-button-next').addClass('swiper-button-disabled');
    } else {
        $('.swiper-button-next').removeClass('swiper-button-disabled');
    }

}

$('#recipes-search-input').on('input', debounce((e) => searchRecipe(e.target.value)));