var trackDiv = document.querySelector('#latest-music-tracks');
// Change the soundtrackid if you want to update the list
// 1. click share on your selected track at soundcloud 
// 2. open the embed tab
// 3. on the code section there will be something like this
//    <iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1459944949&color=%23ff5500
// 4. at the src after /tracks/ there will be your track id
// 5. copy that id and paste it to the array below
const soundCloudTrackIds = ['1501945009', '1459944949', '1438807573'];

for (var i = 0; i < soundCloudTrackIds.length; i++) {
    trackDiv.innerHTML += generateIframe(soundCloudTrackIds[i], i)
}

//this function generates a embedded link
function generateEmbeddedUrl(key) {
    return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${key}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
}

function myFunction(element) {
    console.log(element);
    console.log(element.contentWindow.document.getElementByClassName("widget-controls"));
}

//generates the iframe
function generateIframe(key, i) {
    return `<iframe src="${generateEmbeddedUrl(key)}" class="track-item" style="width: 100%; height: 150px" frameborder="0" id=${'iframe' + i} onload="myFunction(this)"></iframe>`
}



