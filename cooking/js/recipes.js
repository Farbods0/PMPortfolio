const recipes = [
    'tonkotsu-ramen',
    'fajita-guacamole',
    'chicken-tikka-naan',
    'birria-quesa-tacos',
    'ash-reshteh',
    'pico-de-gallo',
    'chicken-soup',
    'xiao-long-bao',
    'potato-crispy-aioli',
    'blooming-onion',
    'croissants',
    'churros',
    'macaroni-and-cheese',
    'spaghetti-meat-sauce',
    'pumpkin-bread-salted-maple-butter',
    'burrito',
    'popeyes-chicken-sandwhich',
    'masala-fries',
    'pasta-dough',
    'bread',
    'bruscetta',
    'in-n-out-burger',
    'rasberry-danish',
    'mozzarella-cheese',
    'brussel-sprouts',
];

// to add new recipe
// 1. type the name of the recipe to the array above
// 2. create a new folder inside recipes folder (note: the name of the folder should be exactly the same with the name that you add to the recipes array above)
// 3. add index.html (for the card component) and recipe-content.html (for the modal component)
// 4. go to cooking/index.html file
// 5. add the recipe content section there will be a group of something like this <div class="modal fade readMore" id="read-more-brussel-sprouts" tabindex="-1" aria-hidden="true"></div>
// 6. add the new one with the id 'read-more-{exact same name as the one before}' <div class="modal fade readMore" id="read-more-{exact same name as the one before}" tabindex="-1" aria-hidden="true"></div>

$(() => {
    recipes.forEach(recipe => {
        // Load the recipe content
        $(`.${recipe}-recipe-content`).load(`./recipes/${recipe}/recipe-content.html`);
    });
});

recipes.forEach(recipe => {
    // Create a new slide element and use jQuery's .load() method to add the fetched HTML content
    const slide = $('<div>').attr('id', recipe).addClass('swiper-slide').load(`./recipes/${recipe}`);

    // Add the new slide element to the Swiper wrapper
    $('.swiper-wrapper').append(slide);
    // Add the recipe content
    $(`#read-more-${recipe}`).addClass(`${recipe}-recipe-content`);
});