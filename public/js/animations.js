// Reveal elements on scroll
function reveal() {
  const reveals = document.querySelectorAll(".reveal");

  reveals.forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 50;

    if (elementTop < windowHeight - elementVisible) {
      element.classList.add("active");
    }
  });
}

window.addEventListener("scroll", reveal);
reveal(); // Initial check

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Modified scroll position handling
if (history.scrollRestoration) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  const savedScrollData = JSON.parse(sessionStorage.getItem("scrollPos"));
  if (savedScrollData && savedScrollData.path === window.location.pathname) {
    window.scrollTo({
      top: parseInt(savedScrollData.position),
      behavior: "smooth",
    });
  }
});

// Store scroll position before unload
window.addEventListener("beforeunload", () => {
  const scrollData = {
    path: window.location.pathname,
    position: window.scrollY,
  };
  sessionStorage.setItem("scrollPos", JSON.stringify(scrollData));
});

// Counter animation
const counters = document.querySelectorAll(".counter");

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
    };
  } else {
    // Regular count up for other counters
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
    };
  }

  updateCount();
};

const observerCallback = (entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      runCounter(entry.target);
    }
  });
};

const observer = new IntersectionObserver(observerCallback);
counters.forEach((counter) => observer.observe(counter));

document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  
  // Add null checks to prevent errors
  if (btn && menu) {
    const hamburger = btn.querySelector(".hamburger-menu");

    btn.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      menu.classList.toggle("active");
      menu.classList.toggle("hidden"); // Add back the hidden toggle

      if (menu.classList.contains("active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    // Update menu item click handlers
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        menu.classList.remove("active");
        document.body.style.overflow = "";
      });
    });

    // Update escape key handler
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("active")) {
        hamburger.classList.remove("active");
        menu.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
});

// Variable to track last scroll position
let lastScroll = 0;

// Function to handle navbar visibility
function handleNavbarVisibility() {
  const navbar = document.getElementById("navbar");
  const currentScroll = window.pageYOffset;

  // Only show navbar when at the very top
  if (currentScroll <= 0) {
    navbar.classList.remove("hidden-nav");
    navbar.classList.add("visible-nav");
  } else {
    navbar.classList.remove("visible-nav");
    navbar.classList.add("hidden-nav");
  }

  lastScroll = currentScroll;
}

// Add scroll event listener for navbar
window.addEventListener("scroll", handleNavbarVisibility);
// Initial check
handleNavbarVisibility();

//Timeline logic
document.addEventListener('DOMContentLoaded', function() {
  // Define event dates (start and end)
  const events = [
    {
      id: 'event1',
      name: 'Lake City Regional',
      start: new Date('2025-02-28'),
      end: new Date('2025-03-02')
    },
    {
      id: 'event2',
      name: 'Traverse City Regional',
      start: new Date('2025-03-13'),
      end: new Date('2025-03-15')
    },
    {
      id: 'event3',
      name: 'FIM District Championship',
      start: new Date('2025-04-03'),
      end: new Date('2025-04-05')
    },
    {
      id: 'event4',
      name: 'FIRST Championship',
      start: new Date('2025-04-16'),
      end: new Date('2025-04-19')
    }
  ];
  
  console.log('Looking for timeline dots...');
  
  // Collect all the dots in the timeline
  const dots = document.querySelectorAll('.w-8.h-8.bg-baywatch-orange.rounded-full');
  console.log(`Found ${dots.length} dots total`);
  
  // If we don't have any dots, just skip the timeline logic - this happens on pages like team.html
  if (dots.length === 0) {
    console.log('No timeline dots found on this page - skipping timeline logic');
    return;
  }

  // Clear existing timeline-dot classes and data attributes to avoid confusion
  dots.forEach(dot => {
    dot.classList.remove('timeline-dot');
    delete dot.dataset.eventId;
  });
  
  // CORRECTED DOT MAPPING:
  // dots[0] is the start dot (before any events)
  // dots[1] is AFTER Lake City & BEFORE Traverse City
  // dots[2] is AFTER Traverse City & BEFORE FIM District
  // dots[3] is AFTER FIM District & BEFORE FIRST Championship
  if (dots.length >= 5) {
    // Start dot - before any events
    dots[0].classList.add('timeline-dot');
    dots[0].dataset.position = 'start';
    
    // Between event dots - each represents the time between events
    dots[1].classList.add('timeline-dot');
    dots[1].dataset.position = 'between-1-2'; // Between Lake City and Traverse City
    
    dots[2].classList.add('timeline-dot');
    dots[2].dataset.position = 'between-2-3'; // Between Traverse City and FIM District
    
    dots[3].classList.add('timeline-dot');
    dots[3].dataset.position = 'between-3-4'; // Between FIM District and FIRST Championship
    
    // Note: There may be a 5th dot at the end of the timeline
    if (dots[4]) {
      dots[4].classList.add('timeline-dot');
      dots[4].dataset.position = 'end';
    }
    
    console.log('Mapped all dots to their positions between events');
  } else if (dots.length > 0) {
    console.log(`Found ${dots.length} dots, but expected at least 5. Will work with what we have.`);
    // Map whatever dots we have
    dots.forEach((dot, index) => {
      dot.classList.add('timeline-dot');
      dot.dataset.position = `dot-${index}`;
    });
  }
  
  // Get the current date
  const today = new Date();
  console.log(`Current date for timeline check: ${today.toDateString()}`);
  
  // Rest of timeline code only executes if we have dots
  if (dots.length === 0) return;
  
  // Define time periods including between events
  const timePeriods = [
    {
      name: 'Before all events',
      start: new Date('2000-01-01'), // Any date in the past
      end: events[0].start,
      dotIndex: 0, // Starting dot
      isEvent: false
    },
    {
      name: events[0].name,
      start: events[0].start,
      end: events[0].end,
      dotIndex: 0, // During Lake City, highlight the starting dot
      isEvent: true,
      eventIndex: 0
    },
    {
      name: `Between ${events[0].name} and ${events[1].name}`,
      start: new Date(events[0].end.getTime() + 1), // 1ms after the end of Lake City
      end: new Date(events[1].start.getTime() - 1), // 1ms before the start of Traverse City
      dotIndex: 1, // Dot between Lake City and Traverse City
      isEvent: false
    },
    {
      name: events[1].name,
      start: events[1].start,
      end: events[1].end,
      dotIndex: 1, // During Traverse City, highlight the same dot as "between Lake City and Traverse City"
      isEvent: true,
      eventIndex: 1
    },
    {
      name: `Between ${events[1].name} and ${events[2].name}`,
      start: new Date(events[1].end.getTime() + 1),
      end: new Date(events[2].start.getTime() - 1),
      dotIndex: 2, // Dot between Traverse City and FIM District
      isEvent: false
    },
    {
      name: events[2].name,
      start: events[2].start,
      end: events[2].end,
      dotIndex: 2, // During FIM District, highlight the same dot as "between Traverse City and FIM District"
      isEvent: true,
      eventIndex: 2
    },
    {
      name: `Between ${events[2].name} and ${events[3].name}`,
      start: new Date(events[2].end.getTime() + 1),
      end: new Date(events[3].start.getTime() - 1),
      dotIndex: 3, // Dot between FIM District and FIRST Championship
      isEvent: false
    },
    {
      name: events[3].name,
      start: events[3].start,
      end: events[3].end,
      dotIndex: 3, // During FIRST Championship, highlight the same dot as "between FIM District and FIRST Championship"
      isEvent: true,
      eventIndex: 3
    },
    {
      name: 'After all events',
      start: new Date(events[3].end.getTime() + 1),
      end: new Date('2100-01-01'), // Any date in the future
      dotIndex: dots.length > 4 ? 4 : (dots.length - 1 > 0 ? dots.length - 1 : 0), // End dot or last dot available
      isEvent: false
    }
  ];
  
  // Determine current time period
  let currentPeriod = null;
  for (const period of timePeriods) {
    if (today >= period.start && today <= period.end) {
      currentPeriod = period;
      console.log(`Current period: ${period.name}`);
      break;
    }
  }
  
  if (currentPeriod && dots.length > currentPeriod.dotIndex) {
    const dotToHighlight = dots[currentPeriod.dotIndex];
    if (dotToHighlight) {
      console.log(`Highlighting dot at index ${currentPeriod.dotIndex}`);
      
      // Only add pulse effect if we're NOT during an event
      if (!currentPeriod.isEvent) {
        dotToHighlight.classList.add('dot-pulse');
      }
      
      // Add appropriate indicator
      const indicator = document.createElement('span');
      
      if (currentPeriod.isEvent) {
        // Also update the "Live Updates" section for the current event
        const eventCode = getEventCode(events[currentPeriod.eventIndex].name);
        const eventElement = document.querySelector(`[href="event.html?event=${eventCode}"]`);
        if (eventElement) {
          const liveUpdates = eventElement.querySelector('#live-updates');
          const countdownSection = eventElement.querySelector('#countdown-section');
          
          if (liveUpdates && countdownSection) {
            liveUpdates.classList.remove('hidden');
            countdownSection.classList.add('hidden');
          }
        }
      }
      
      const dotParent = dotToHighlight.parentNode;
      if (dotParent) {
        dotParent.style.position = 'relative';
        dotParent.appendChild(indicator);
      }
    }
  }
  
  // Helper function to map event names to event codes
  function getEventCode(eventName) {
    const mapping = {
      'Lake City Regional': '2025milac',
      'Traverse City Regional': '2025mitvc',
      'FIM District Championship': '2025micmp',
      'FIRST Championship': '2025cmptx'
    };
    return mapping[eventName] || '';
  }
});

// Spider Web Cursor Effect with 3D Parallax
document.addEventListener('DOMContentLoaded', function() {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'spider';
  canvas.className = 'spider';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Mouse position tracking for cursor and parallax effects
  let mousePos = { x: width / 2, y: height / 2 };
  let prevMousePos = { x: width / 2, y: height / 2 };
  let isMouseMoving = false;
  let mouseStillTimeout;
  
  // Smooth mouse tracking for parallax effect
  let targetMouseX = width / 2;
  let targetMouseY = height / 2;
  let mouseX = width / 2;
  let mouseY = height / 2;
  
  // Web points with depth properties for parallax
  const points = [];
  const maxPoints = 60;
  const distanceThreshold = 150;
  const pointLife = 200; // Slower fading
  const movementFactor = 0.03; // How much points move with mouse parallax (lower = more subtle)
  
  // Number of depth layers to simulate 3D effect
  const maxDepth = 5; 
  
  // Colors for the web
  const webColor = '#FF6B00'; // Baywatch orange
  const webAlpha = 0.4; // Web transparency
  
  // Track if mouse is over the window
  let isMouseOnPage = false;
  
  // Counter for consistent point generation
  let frameCounter = 0;
  const spawnInterval = 6; // Higher number = more time between spawns
  
  // Handle window resize
  window.addEventListener('resize', function() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
  });
  
  // Function to check if mouse is moving
  function checkMouseMovement(e) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      // For cursor effect - check if mouse moved more than 2 pixels
      isMouseMoving = Math.abs(currentX - prevMousePos.x) > 2 || 
                      Math.abs(currentY - prevMousePos.y) > 2;
      
      if (isMouseMoving) {
          // Update mouse position
          mousePos.x = currentX;
          mousePos.y = currentY;
          
          // For parallax effect - set target position
          targetMouseX = currentX;
          targetMouseY = currentY;
          
          // Clear previous timeout and set new one
          clearTimeout(mouseStillTimeout);
          mouseStillTimeout = setTimeout(() => {
              isMouseMoving = false;
          }, 50); // Consider mouse still after 50ms of no movement
      }
      
      // Update previous position
      prevMousePos.x = currentX;
      prevMousePos.y = currentY;
      
      // Set mouse on page
      isMouseOnPage = true;
  }
  
  // Track mouse position and movement
  document.addEventListener('mousemove', checkMouseMovement);
  
  // Track mouse leaving the window
  document.addEventListener('mouseout', function(e) {
      // Check if mouse has actually left the window
      const from = e.relatedTarget || e.toElement;
      if (!from || from.nodeName === 'HTML') {
          isMouseOnPage = false;
      }
  });
  
  // Track mouse entering the window
  document.addEventListener('mouseover', function() {
      isMouseOnPage = true;
  });
  
  // Add a point to the web with depth property for parallax
  function addPoint(x, y) {
      // Add slight randomness to point position around cursor
      const randomOffset = 5;
      x += (Math.random() - 0.5) * randomOffset;
      y += (Math.random() - 0.5) * randomOffset;
      
      points.push({
          x: x,
          y: y,
          // Add random velocity - reduced for slower movement
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          life: pointLife,
          // Add depth property for parallax effect (random depth layer)
          depth: (Math.random() * 0.8) + 0.2, // Value between 0.2 and 1.0
          // Size based on depth (closer = larger)
          size: 1.5 + (Math.random() * 2.5)
      });
  }
  
  // Scroll tracking for additional effect
  let scrollY = window.scrollY || document.documentElement.scrollTop;
  window.addEventListener('scroll', function() {
      scrollY = window.scrollY || document.documentElement.scrollTop;
  });
  
  // Main animation loop
  function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Smooth mouse movement for parallax (easing)
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      
      // Calculate mouse offset from center for parallax effect
      const offsetX = (mouseX - (width / 2)) * movementFactor;
      const offsetY = (mouseY - (height / 2)) * movementFactor;
      
      // Increment frame counter for consistent spawning
      frameCounter++;
      
      // Add new points at a consistent rate when mouse is on page AND moving
      if (isMouseOnPage && isMouseMoving && points.length < maxPoints && frameCounter % spawnInterval === 0) {
          addPoint(mousePos.x, mousePos.y);
      }
      
      // Update and draw web points (regardless of whether mouse is on page or moving)
      for (let i = 0; i < points.length; i++) {
          // Calculate parallax shift based on point's depth
          const parallaxX = offsetX * points[i].depth;
          const parallaxY = offsetY * points[i].depth;
          
          // Apply movement to points
          points[i].x += points[i].vx;
          points[i].y += points[i].vy;
          points[i].life -= 0.5; // Slow fading
          
          // Remove points that have expired
          if (points[i].life <= 0) {
              points.splice(i, 1);
              i--;
              continue;
          }
          
          // Apply parallax to calculate display position
          const displayX = points[i].x + parallaxX;
          const displayY = points[i].y + parallaxY;
          
          // Draw connections between points that are close enough
          for (let j = i + 1; j < points.length; j++) {
              // Apply parallax to second point
              const parallaxX2 = offsetX * points[j].depth;
              const parallaxY2 = offsetY * points[j].depth;
              
              const displayX2 = points[j].x + parallaxX2;
              const displayY2 = points[j].y + parallaxY2;
              
              const dx = displayX - displayX2;
              const dy = displayY - displayY2;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < distanceThreshold) {
                  // Line opacity based on distance, point life, and average depth
                  const avgDepth = (points[i].depth + points[j].depth) / 2;
                  const opacity = (1 - dist / distanceThreshold) * (points[i].life / pointLife) * webAlpha * avgDepth;
                  
                  ctx.beginPath();
                  ctx.moveTo(displayX, displayY);
                  ctx.lineTo(displayX2, displayY2);
                  ctx.strokeStyle = `rgba(255, 107, 0, ${opacity})`;
                  
                  // Line width based on distance and depth (greater depth = thicker lines)
                  ctx.lineWidth = 1.5 * (1 - dist / distanceThreshold) * avgDepth;
                  ctx.stroke();
                  ctx.closePath();
              }
          }
          
          // Connect to mouse position for more interactivity (only when mouse is on page)
          if (isMouseOnPage) {
              const dx = displayX - mouseX;
              const dy = displayY - mouseY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist < distanceThreshold * 1.2) {
                  const opacity = (1 - dist / (distanceThreshold * 1.2)) * (points[i].life / pointLife) * webAlpha;
                  ctx.beginPath();
                  ctx.moveTo(displayX, displayY);
                  ctx.lineTo(mouseX, mouseY);
                  ctx.strokeStyle = `rgba(255, 107, 0, ${opacity})`;
                  ctx.lineWidth = 1.5 * (1 - dist / (distanceThreshold * 1.2));
                  ctx.stroke();
                  ctx.closePath();
              }
          }
          
          // Draw point with size based on depth
          const pointOpacity = (points[i].life / pointLife) * 0.8 * points[i].depth;
          ctx.beginPath();
          ctx.arc(displayX, displayY, points[i].size * points[i].depth, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 107, 0, ${pointOpacity})`;
          ctx.fill();
          
          // Add glow effect for larger particles
          if (points[i].size * points[i].depth > 2.5) {
              ctx.beginPath();
              ctx.arc(displayX, displayY, points[i].size * points[i].depth * 1.5, 0, Math.PI * 2);
              
              // Glow with gradient
              const gradient = ctx.createRadialGradient(
                  displayX, displayY, points[i].size * points[i].depth * 0.5,
                  displayX, displayY, points[i].size * points[i].depth * 2
              );
              gradient.addColorStop(0, `rgba(255, 107, 0, ${pointOpacity * 0.5})`);
              gradient.addColorStop(1, 'rgba(255, 107, 0, 0)');
              
              ctx.fillStyle = gradient;
              ctx.fill();
          }
      }
      
      requestAnimationFrame(animate);
  }
  
  // Start animation
  animate();
});

// Optional: Add scroll effect to spider web particles
window.addEventListener('scroll', function() {
  const scrollFactor = window.scrollY * 0.001;
  const canvas = document.getElementById('spider');
  if (canvas) {
    canvas.style.transform = `translateY(${scrollFactor * 50}px)`;
  }
});