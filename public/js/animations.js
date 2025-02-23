// Reveal elements on scroll
function reveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
        }
    });
}

window.addEventListener('scroll', reveal);
reveal(); // Initial check

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Modified scroll position handling
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
    const savedScrollData = JSON.parse(sessionStorage.getItem('scrollPos'));
    if (savedScrollData && savedScrollData.path === window.location.pathname) {
        window.scrollTo({
            top: parseInt(savedScrollData.position),
            behavior: 'smooth'
        });
    }
});

// Store scroll position before unload
window.addEventListener('beforeunload', () => {
    const scrollData = {
        path: window.location.pathname,
        position: window.scrollY
    };
    sessionStorage.setItem('scrollPos', JSON.stringify(scrollData));
});

// Counter animation
const counters = document.querySelectorAll('.counter');

const runCounter = (counter) => {
    // Parse the target as float; default to 0 if invalid
    const target = parseFloat(counter.dataset.target) || 0;
    let updateCount;

    // If target is less than 50, let's animate downward from 100.
    if (target < 50) {
        let count = 100;
        const decrement = (100 - target) / 100;

        updateCount = () => {
            if (count > target) {
                count -= decrement;
                counter.innerText = Math.floor(count);
                setTimeout(updateCount, 10);
            } else {
                counter.innerText = target;
            }
        }
    } else { // Regular count up for other counters
        let count = 0;
        const increment = target / 100;

        updateCount = () => {
            if (count < target) {
                count += increment;
                counter.innerText = Math.ceil(count);
                setTimeout(updateCount, 10);
            } else {
                counter.innerText = target;
            }
        }
    }

    updateCount();
}

const observerCallback = (entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            runCounter(entry.target);
        }
    });
}

const observer = new IntersectionObserver(observerCallback);
counters.forEach(counter => observer.observe(counter));

document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');
    const hamburger = btn.querySelector('.hamburger-menu');
    
    btn.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
        menu.classList.toggle('hidden');  // Add back the hidden toggle
        
        if (menu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Update menu item click handlers
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Update escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Custom cursor implementation - simplified version
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        // Create a trail element
        const trail = document.createElement('div');
        trail.classList.add('cursor-trail');
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        document.body.appendChild(trail);
        setTimeout(() => {
            trail.remove();
        }, 500);
    });

    // Add navbar scroll behavior
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > lastScrollY) { // Scrolling down
            navbar.classList.add('hide');
        } else { // Scrolling up
            navbar.classList.remove('hide');
        }
        lastScrollY = window.scrollY;
    });
});