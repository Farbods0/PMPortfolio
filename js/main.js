


const toggleBtn = document.querySelector('.navbar-toggler');
const closeMenu = document.querySelector('.closeIcon');
const colaspeMenu = document.querySelector('.navbar-collapse');

toggleBtn.addEventListener('click',() => {
  body.style.overflow = "hidden"
})

closeMenu.addEventListener('click',() => {
  body.style.overflow = "auto"
  colaspeMenu.classList.remove('show')
})



simpleParallax('.parallex', 6);



document.onreadystatechange = function() {
  if (document.readyState !== "complete") {
      document.querySelector("body").style.visibility = "hidden";
      document.querySelector("#loading").style.visibility = "hidden";
  } else {
      document.querySelector("#loading").style.visibility = "hidden";
      document.querySelector("body").style.visibility = "visible";
  }
};

// Get the element
let topBtn = document.querySelector(".top-btn");
topBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
window.onscroll = () => window.scrollY > 500 ? topBtn.style.opacity = 1 : topBtn.style.opacity = 0

AOS.init();



const body = document.body;
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
  if (document.body.scrollTop > 32 || document.documentElement.scrollTop > 32) {
    body.classList.add('sticky-header');
  } else {
    body.classList.remove('sticky-header');
  }
}