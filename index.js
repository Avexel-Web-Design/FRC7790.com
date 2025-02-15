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

document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.animate');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.01
    });
});

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
  
  // Prevent scrolling when menu is open
  document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'initial';
});

// Close menu when clicking a link
const links = document.querySelectorAll('.nav-links a');
links.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = 'initial';
  });
});