const real_estate_image_list = [
    "real-estate.jpg",
    "real-estate-2.jpg",
    "real-estate-3.jpg",
    "real-estate-4.jpg",
    "real-estate-5.jpg",
    "real-estate-7.jpg",
    "real-estate-8.jpg",
    "real-estate-9.jpg",
    "real-estate-10.jpg",
    "real-estate-11.jpg"
]
/* Appetizers */
const food_image_list1 = [
    "assets/Food/Bruscetta.jpg",
    "assets/Food/artisanbreaddutch.png",
    "assets/Food/BloominOnion.jpeg",
    "assets/Food/bread.png",
    "assets/Food/brussel.jpg",
    "assets/Food/crispy-salt-and-pepper-smashed-potatoes-3.jpeg",
]
/* Entree */
const food_image_list2 = [
    "assets/Food/burrito.png",
    "assets/Food/birriaQuesaTacos.jpeg",
    "assets/Food/ashReshteh.jpg",
    "assets/Food/Popeyes.png",
    "assets/Food/spaghetti.jpg",
    "assets/Food/tonkotsu.jpg"
    
]
/* Dessert */
const food_image_list3 = [
    "assets/Food/rasberry.png",
    "assets/Food/croissants.jpeg",
    "assets/Food/churros.png",
    "assets/Food/artisanbreaddutch.png"
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



dynamicImage("dynamic-image-1", "dynamic-border-1", 5000, 0, food_image_list1)
dynamicImage_left("dynamic-image-2", "dynamic-border-2", 5000, 1000, food_image_list2)
dynamicImage("dynamic-image-3", "dynamic-border-3", 5000, 500, food_image_list3)