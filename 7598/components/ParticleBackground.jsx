import React, { useEffect, useRef } from "react";

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const particlesRef = useRef([]);
  const ripplesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup canvas with device pixel ratio handling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    contextRef.current = ctx;

    const initParticles = () => {
      const particleCount = Math.min(window.innerWidth / 10, 120);
      particlesRef.current = Array.from({ length: particleCount }, () =>
        createParticle()
      );
    };

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() * 60 - 30, // Color variation
      depth: Math.random() * 0.5 + 0.5, // Parallax effect strength
    });

    const createRipple = (x, y) => {
      ripplesRef.current.push({
        x,
        y,
        size: 0,
        opacity: 0.5,
        maxSize: 100,
        speed: 2,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.size += ripple.speed;
        ripple.opacity *= 0.95;

        if (ripple.opacity > 0.01) {
          const gradient = ctx.createRadialGradient(
            ripple.x,
            ripple.y,
            0,
            ripple.x,
            ripple.y,
            ripple.size
          );
          gradient.addColorStop(0, `rgba(71, 26, 103, 0)`);
          gradient.addColorStop(
            0.5,
            `rgba(71, 26, 103, ${ripple.opacity * 0.2})`
          );
          gradient.addColorStop(1, `rgba(71, 26, 103, 0)`);

          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(ripple.x, ripple.y, ripple.size, 0, Math.PI * 2);
          ctx.fill();
          return true;
        }
        return false;
      });

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Mouse interaction
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouseRef.current.radius) {
            const force = (1 - distance / mouseRef.current.radius) * 0.2;
            particle.x -= dx * force * particle.depth;
            particle.y -= dy * force * particle.depth;
          }
        }

        // Boundary check with smooth transition
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow effect
        const baseColor = `hsla(${190 + particle.hue}, 100%, 65%, ${
          particle.opacity
        })`;
        const glowSize = particle.size * 2;

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          glowSize
        );
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, "rgba(71, 26, 103, 0)");

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      ctx.beginPath();
      particlesRef.current.forEach((p1, i) => {
        particlesRef.current.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.15;
            ctx.strokeStyle = `rgba(71, 26, 103, ${opacity})`;
            ctx.lineWidth = Math.min(p1.depth, p2.depth);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        });
      });
      ctx.stroke();

      rafRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 150,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null, radius: 150 };
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      createRipple(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    // Initialize
    initParticles();
    animate();

    // Event listeners
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full bg-black"
      style={{ 
        WebkitBackdropFilter: "blur(2px)", 
        backdropFilter: "blur(2px)",
        margin: 0,
        padding: 0,
        border: "none",
        outline: "none"
      }}
    />
  );
};

export default ParticleBackground;
