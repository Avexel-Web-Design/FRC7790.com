document.addEventListener("DOMContentLoaded", () => {
    const animatedElements = document.querySelectorAll(".animate"); // Grab all elements with the .animate class

    // Create an Intersection Observer
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible"); // Add the "visible" class when the element is in view
                }
            });
        },
        { threshold: 0.5 } // Trigger animation when 20% of the element is visible
    );

    // Assign observer to each animated element
    animatedElements.forEach((element) => observer.observe(element));
});