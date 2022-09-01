var trackDiv = document.querySelector( '#latest-music-tracks' )
const mixcloudUrl = 'https://api.mixcloud.com/farbodjahan/cloudcasts/'
//change this number to load more music
const count = 3

fetch( mixcloudUrl ).then( res => {
    return res.json()
} ).then( data => {
    //clear the loader
    trackDiv.innerHTML = ""
    //insert embedded iframes
    for ( var i = 0; i < count; i++ ) {
        trackDiv.innerHTML += generateIframe( data.data[ i ].key, i )
    }
} )

//this function generates a embedded link
function generateEmbeddedUrl( key ) {
    return `https://api.mixcloud.com${key}embed-html/?&height=120.`
}

function myFunction( element ) {
    console.log( element );
    console.log( element.contentWindow.document.getElementByClassName( "widget-controls" ) )
}

//generates the iframe
function generateIframe( key, i ) {
    return `<iframe src="${generateEmbeddedUrl( key )}" class="track-item" style="width: 100%; height: 230px" frameborder="0" id=${'iframe' + i} onload="myFunction(this)"></iframe>`
}



