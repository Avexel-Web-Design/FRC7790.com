let lastScrollTop = 0;
const navbar = document.getElementById('navbar');
const scrollThreshold = 50; // Adjust this value to set how soon the navbar disappears

window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
    // Scroll down and past the threshold
    navbar.style.top = '-100px'; // Adjust as needed
  } else if (scrollTop < lastScrollTop && scrollTop <= scrollThreshold) {
    // Scroll up and within the threshold
    navbar.style.top = '5%'; // Adjust to match your CSS
  }
  lastScrollTop = scrollTop;
});