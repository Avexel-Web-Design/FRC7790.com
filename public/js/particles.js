// Enhanced particle animation with subtle interactive effects

class ParticleBackground {
  constructor() {
    this.canvas = document.getElementById('particle-background');
    this.ctx = this.canvas.getContext('2d', { alpha: true, antialias: false });
    this.particles = [];
    this.particleCount = 140; // Increased particle count
    this.connectDistance = 170; // Increased connection distance
    this.mouse = {
      x: null,
      y: null,
      radius: 150,
      isPressed: false
    };
    this.scrollY = 0;
    this.lastScrollY = 0;
    this.targetScrollY = 0;
    this.parallaxFactor = 0.35;
    this.basePositions = [];
    this.colorOptions = [
      {r: 255, g: 127, b: 80},  // Coral
      {r: 255, g: 140, b: 0},   // Dark Orange
      {r: 255, g: 165, b: 0},   // Orange
      {r: 255, g: 107, b: 0},   // Baywatch Orange
      {r: 255, g: 180, b: 120}, // Light Orange
    ];
    this.ripples = [];
    this.lastTime = 0;
    
    this.resizeCanvas();
    this.initParticles();
    this.setupEventListeners();
    this.animate();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Set the canvas dimensions to match the display size multiplied by the device pixel ratio
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Scale the context to ensure correct drawing operations
    this.ctx.scale(dpr, dpr);
    
    // Set display size (CSS pixels)
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  initParticles() {
    // Keep existing particle initialization
    this.particles = [];
    this.basePositions = [];
    
    for (let i = 0; i < this.particleCount; i++) {
      const depthLayer = Math.random() * 0.7 + 0.3;
      
      const size = Math.random() * 4 + 1; // Increased size
      const x = Math.random() * (this.canvas.width - size * 2) + size;
      const y = Math.random() * (this.canvas.height - size * 2) + size;
      
      const directionX = (Math.random() * 0.4 - 0.2) * depthLayer;
      const directionY = (Math.random() * 0.4 - 0.2) * depthLayer;
      
      const vx = directionX;
      const vy = directionY;
      
      const opacity = Math.random() * 0.5 + 0.2 * depthLayer; // Increased opacity
      
      const colorBase = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
      const colorVariation = 30;
      
      const color = `rgba(
        ${colorBase.r + Math.random() * colorVariation - colorVariation/2}, 
        ${colorBase.g + Math.random() * colorVariation - colorVariation/2}, 
        ${colorBase.b + Math.random() * colorVariation - colorVariation/2}, 
        ${opacity})`;

      this.basePositions.push({ x, y });
      
      this.particles.push({
        x, 
        y, 
        size, 
        directionX, 
        directionY,
        vx,
        vy, 
        color,
        baseX: x, 
        baseY: y,
        depthLayer,
        brightness: 0.7 + Math.random() * 0.3,
        originalColor: color,
        mass: size * depthLayer * 3 + 1
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.initParticles();
    });

    // Simplified mouse interaction without trail
    window.addEventListener('mousemove', (event) => {
      this.mouse.x = event.x;
      this.mouse.y = event.y;
    });

    window.addEventListener('mousedown', () => {
      this.mouse.isPressed = true;
      
      // Create subtle ripple effect at mouse position
      if (this.mouse.x && this.mouse.y) {
        this.createRipple(this.mouse.x, this.mouse.y);
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isPressed = false;
    });

    window.addEventListener('mouseout', () => {
      this.mouse.x = null;
      this.mouse.y = null;
      this.mouse.isPressed = false;
    });
    
    // Simplified touch events for mobile
    this.canvas.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      this.mouse.isPressed = true;
      this.createRipple(touch.clientX, touch.clientY);
      event.preventDefault();
    });
    
    this.canvas.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      event.preventDefault();
    });
    
    this.canvas.addEventListener('touchend', () => {
      this.mouse.isPressed = false;
      setTimeout(() => {
        this.mouse.x = null;
        this.mouse.y = null;
      }, 100);
    });
    
    // Enhanced scroll event
    window.addEventListener('scroll', () => {
      this.targetScrollY = window.scrollY;
    });
    
    // Add click event for ripple effect
    this.canvas.addEventListener('click', (event) => {
      this.createRipple(event.x, event.y);
    });
  }

  // Create subtle color pulse ripple effect
  createRipple(x, y) {
    const colors = [
      {r: 255, g: 107, b: 0},  // Baywatch Orange
      {r: 255, g: 140, b: 0},  // Dark Orange
      {r: 255, g: 165, b: 0},  // Orange
    ];
    
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    
    this.ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 300, // Larger maximum radius
      opacity: 0.6,   // Increased starting opacity
      color: selectedColor,
      speed: 1.2,     // Slower expansion speed
      decay: 0.003    // Slower fade out
    });
  }

  // Get a random particle color with specified opacity
  getRandomParticleColor(opacity = 0.5) {
    const colorBase = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
    return `rgba(${colorBase.r}, ${colorBase.g}, ${colorBase.b}, ${opacity})`;
  }

  // Update and draw subtle color pulse ripples
  updateAndDrawRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      
      // Update ripple - slower movement
      ripple.radius += ripple.speed;
      ripple.opacity -= ripple.decay;
      
      // Draw ripple as a subtle color gradient
      if (ripple.opacity > 0) {
        const gradient = this.ctx.createRadialGradient(
          ripple.x, ripple.y, 0,
          ripple.x, ripple.y, ripple.radius
        );
        
        // Enhanced color pulse with more opacity
        gradient.addColorStop(0, `rgba(${ripple.color.r}, ${ripple.color.g}, ${ripple.color.b}, ${ripple.opacity * 0.6})`);
        gradient.addColorStop(0.6, `rgba(${ripple.color.r}, ${ripple.color.g}, ${ripple.color.b}, ${ripple.opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(${ripple.color.r}, ${ripple.color.g}, ${ripple.color.b}, 0)`);
        
        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Remove completed ripples
      if (ripple.radius >= ripple.maxRadius || ripple.opacity <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  // Smoother scroll transition using easing
  updateScrollPosition() {
    const scrollDiff = this.targetScrollY - this.scrollY;
    this.scrollY += scrollDiff * 0.1;
  }

  // Apply enhanced parallax effect with depth layers
  applyParallaxEffect() {
    this.particles.forEach((particle, index) => {
      const depthEffect = particle.depthLayer * this.parallaxFactor;
      const offsetY = this.scrollY * depthEffect;
      particle.y = (this.basePositions[index].y - offsetY) % this.canvas.height;
      
      if (particle.y < -50) {
        particle.y = this.canvas.height + particle.y;
      } else if (particle.y > this.canvas.height + 50) {
        particle.y = particle.y - this.canvas.height;
      }
      
      const horizontalAmplitude = 15 * particle.depthLayer;
      const horizontalDrift = Math.sin((this.scrollY / 800) + index) * horizontalAmplitude;
      
      particle.x = this.basePositions[index].x + horizontalDrift;
    });
  }

  drawParticles() {
    // Enhanced particle drawing with stronger glow
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      
      const glow = particle.size * 3; // Increased glow size
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glow
      );
      
      const baseColor = particle.color.replace('rgba(', '').replace(')', '').split(',');
      const r = baseColor[0].trim();
      const g = baseColor[1].trim();
      const b = baseColor[2].trim();
      const a = baseColor[3].trim();
      
      // Enhanced glow effect with higher opacity
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${Math.min(1, parseFloat(a) * 1.5)})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      this.ctx.fillStyle = gradient;
      this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2); // Increased particle size multiplier
      this.ctx.fill();
      
      // Add brighter core to particles
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 0.8, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, parseFloat(a) * 2.5)})`;
      this.ctx.fill();
    });
  }

  updateParticles(deltaTime) {
    const timeSpeed = deltaTime / 16;
    
    this.particles.forEach((particle, index) => {
      const easing = 0.05 * timeSpeed;
      
      particle.vx += (particle.directionX - particle.vx) * easing;
      particle.vy += (particle.directionY - particle.vy) * easing;
      
      particle.baseX += particle.vx * timeSpeed;
      particle.baseY += particle.vy * timeSpeed;
      
      if (particle.baseX + particle.size > this.canvas.width || particle.baseX - particle.size < 0) {
        particle.directionX = -particle.directionX;
        particle.vx *= 0.6;
      }
      
      if (particle.baseY + particle.size > this.canvas.height || particle.baseY - particle.size < 0) {
        particle.directionY = -particle.directionY;
        particle.vy *= 0.6;
      }
      
      this.basePositions[index].x = particle.baseX;
      this.basePositions[index].y = particle.baseY;

      // Enhanced mouse interaction with attraction/repulsion toggle
      if (this.mouse.x && this.mouse.y) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        if (distance < this.mouse.radius) {
          // Determine force based on mouse state and distance
          const maxForce = this.mouse.isPressed ? 2.5 : -1.5;
          const force = maxForce * (1 - distance / this.mouse.radius) * particle.depthLayer;
          
          // Apply inverse square law for more realistic physics
          const forceX = Math.cos(angle) * force / (particle.mass * 0.5);
          const forceY = Math.sin(angle) * force / (particle.mass * 0.5);
          
          // More dramatic response
          particle.vx += forceX * timeSpeed * 2;
          particle.vy += forceY * timeSpeed * 2;
          
          // Add a visual effect - slightly change color when affected by mouse
          const colorEffect = this.mouse.isPressed ? 30 : -30;
          const baseColor = particle.originalColor.replace('rgba(', '').replace(')', '').split(',');
          let r = parseInt(baseColor[0].trim()) + colorEffect;
          let g = parseInt(baseColor[1].trim());
          let b = parseInt(baseColor[2].trim()) + (this.mouse.isPressed ? -20 : 20);
          const a = parseFloat(baseColor[3].trim());
          
          // Ensure color values are valid
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));
          
          particle.color = `rgba(${r}, ${g}, ${b}, ${a})`;
          
          // Gradually increase the particle size when under mouse influence
          particle.size = Math.min(particle.size * 1.01, particle.mass * 2);
        } else {
          // Reset color and size when not under mouse influence
          particle.color = particle.originalColor;
          particle.size = Math.max(particle.size * 0.99, particle.mass / 3); 
        }
      } else {
        // Reset color when mouse is off-screen
        particle.color = particle.originalColor;
      }
    });
    
    // Apply enhanced parallax effect after updating particle positions
    this.applyParallaxEffect();
  }

  connectParticles() {
    // Enhanced connection drawing with more opacity
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectDistance) {
          const opacity = Math.pow(1 - (distance / this.connectDistance), 2) * 0.4; // Increased opacity multiplier
          
          const p1 = this.particles[i];
          const p2 = this.particles[j];
          
          const p1Color = p1.color.replace('rgba(', '').replace(')', '').split(',');
          const p2Color = p2.color.replace('rgba(', '').replace(')', '').split(',');
          
          const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, `rgba(${p1Color[0]}, ${p1Color[1]}, ${p1Color[2]}, ${opacity})`);
          gradient.addColorStop(1, `rgba(${p2Color[0]}, ${p2Color[1]}, ${p2Color[2]}, ${opacity})`);
          
          this.ctx.strokeStyle = gradient;
          
          const avgSize = (p1.size + p2.size) / 2;
          this.ctx.lineWidth = Math.min(1.5, avgSize * 0.6); // Increased line width
          
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  animate(timestamp = 0) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update scroll position with smooth easing
    this.updateScrollPosition();
    
    // Draw visual effects first (behind particles)
    this.updateAndDrawRipples();
    
    // Update and draw particles and connections
    this.updateParticles(Math.min(deltaTime, 32));
    this.connectParticles();
    this.drawParticles();
    
    // Add random ripples occasionally for visual interest
    if (Math.random() < 0.02) { // 2% chance each frame
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.createRipple(x, y);
    }
    
    // Request next frame
    requestAnimationFrame(this.animate.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if the canvas element exists
  if (document.getElementById('particle-background')) {
    new ParticleBackground();
    
    // Add initial ripples for immediate visual interest
    setTimeout(() => {
      const particles = new ParticleBackground();
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.createRipple(x, y);
      }
    }, 500);
  }
});
