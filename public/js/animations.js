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
  } else {
    console.error(`Expected at least 5 dots but found ${dots.length}`);
  }
  
  // Get the current date
  const today = new Date();
  // For testing, uncomment one of these to simulate a specific date
  // const today = new Date('2025-03-01'); // During Lake City
  // const today = new Date('2025-03-10'); // Between Lake City and Traverse City
  // const today = new Date('2025-03-20'); // Between Traverse City and FIM District
  
  console.log(`Current date for timeline check: ${today.toDateString()}`);
  
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
      dotIndex: dots.length > 4 ? 4 : 3, // End dot or last dot available
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
  
  if (currentPeriod) {
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
      } else {
        // We're between events or before/after all events
        
        // Find next upcoming event if we're before or between events
        let nextEventIndex = -1;
        for (let i = 0; i < events.length; i++) {
          if (today < events[i].start) {
            nextEventIndex = i;
            break;
          }
        }
      }
      
      const dotParent = dotToHighlight.parentNode;
      dotParent.style.position = 'relative';
      dotParent.appendChild(indicator);
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