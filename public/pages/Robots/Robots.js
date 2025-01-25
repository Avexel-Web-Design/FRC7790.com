// Animate the navbar when scrolling
let lastScrollTop = 0;
const navbar = document.getElementById('navbar');
const scrollThreshold = 10; // Adjust this value to set how soon the navbar disappears

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

// Code to affect when the different robots appear on the screen
document.addEventListener('DOMContentLoaded', () => {
  const robots = document.querySelectorAll('.riptide, .cobalt, .hungry, .footer');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.75
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  robots.forEach(robot => {
    robot.classList.add('robot');
    observer.observe(robot);
  });
});