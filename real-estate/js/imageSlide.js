const real_estate_image_list = [
    "assets/real-estate.jpg",
    "assets/real-estate-2.jpg",
    "assets/real-estate-3.jpg",
    "assets/real-estate-4.jpg",
    "assets/real-estate-5.jpg",
    "assets/real-estate-7.jpg",
    "assets/real-estate-8.jpg",
    "assets/real-estate-9.jpg",
    "assets/real-estate-10.jpg",
    "assets/real-estate-11.jpg"
]
const food_image_list = [
    "assets/Food/food-1.jpeg",
    "assets/Food/food-2.jpeg",
    "assets/Food/food-3.jpeg",
    "assets/Food/food-4.jpeg",
    "assets/Food/food-5.jpeg",
    "assets/Food/food-6.jpeg",
    "assets/food-1.jpg",
    "assets/food-2.jpg",
    "assets/food-3.jpg",
    "assets/food-4.jpg",
    "assets/food-5.jpg",
    "assets/food-6.jpg"
]

function dynamicImage(id, borderId, interval, delay, images) {
    const image = document.getElementById(id)
    const border = document.getElementById(borderId)


    setTimeout(function() {
        setTimeout(function() {
            image.classList.remove('fade-in-right')
            image.classList.add('fade-out-right')
            border.classList.remove('fade-in-right')
            border.classList.add('fade-out-right')
        }, interval - 1500)
        var x = setInterval(function() {
            const random_int = Math.floor(Math.random() * images.length)
            image.src = images[random_int]
            image.classList.remove('fade-out-right')
            image.classList.add('fade-in-right')
            border.classList.remove('fade-out-right')
            border.classList.add('fade-in-right')

            setTimeout(function() {
                image.classList.remove('fade-in-right')
                image.classList.add('fade-out-right')
                border.classList.remove('fade-in-right')
                border.classList.add('fade-out-right')
            }, interval - 1500)
        }, interval)
    }, delay)
}

function dynamicImage_left(id, borderId, interval, delay, images) {
    const image = document.getElementById(id)
    const border = document.getElementById(borderId)


    setTimeout(function() {
        setTimeout(function() {
            image.classList.remove('fade-in-left')
            image.classList.add('fade-out-left')
            border.classList.remove('fade-in-left')
            border.classList.add('fade-out-left')
        }, interval - 1500)
        var x = setInterval(function() {
            const random_int = Math.floor(Math.random() * images.length)
            image.src = images[random_int]
            image.classList.remove('fade-out-left')
            image.classList.add('fade-in-left')
            border.classList.remove('fade-out-left')
            border.classList.add('fade-in-left')

            setTimeout(function() {
                image.classList.remove('fade-in-left')
                image.classList.add('fade-out-left')
                border.classList.remove('fade-in-left')
                border.classList.add('fade-out-left')
            }, interval - 1500)
        }, interval)
    }, delay)
}



dynamicImage("dynamic-image-1", "dynamic-border-1", 5000, 0, real_estate_image_list)
dynamicImage_left("dynamic-image-2", "dynamic-border-2", 5000, 1000, real_estate_image_list)
dynamicImage("dynamic-image-3", "dynamic-border-3", 5000, 500, real_estate_image_list)