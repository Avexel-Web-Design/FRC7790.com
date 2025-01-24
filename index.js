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

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.title, .subtitle, .video-container, .robot, .robot img, .footer h1, .footer h2, .footer p');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach(element => {
    if (element.classList.contains('title') || element.classList.contains('subtitle') || element.classList.contains('video-container')) {
      element.classList.add('title-animated');
    } else {
      element.classList.add('animated');
    }
    observer.observe(element);
  });
});