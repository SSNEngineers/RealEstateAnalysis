// ==================== PAGE-SPECIFIC ANIMATIONS ====================
// Shared animations for About, Who We Are, and Contact pages

document.addEventListener("DOMContentLoaded", function () {
  // ==================== COUNTER ANIMATION ====================

  function animateCounter(element) {
    const target = parseInt(element.getAttribute("data-counter"));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    updateCounter();
  }

  // Observe counter elements
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll("[data-counter]").forEach((element) => {
    counterObserver.observe(element);
  });

  // ==================== PARALLAX SCROLL EFFECTS ====================

  window.addEventListener("scroll", function () {
    const scrolled = window.pageYOffset;

    // Parallax for hero sections
    const heroOverlay = document.querySelector(".hero-overlay");
    if (heroOverlay) {
      heroOverlay.style.transform = `translateY(${scrolled * 0.5}px)`;
    }

    // Parallax for particles
    document.querySelectorAll(".particle").forEach((particle, index) => {
      const speed = 0.05 + index * 0.02;
      particle.style.transform = `translateY(calc(-100vh + ${
        scrolled * speed
      }px))`;
    });

    // Parallax for floating icons
    document.querySelectorAll(".hero-float-icon").forEach((icon, index) => {
      const speed = 0.1 + index * 0.05;
      icon.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });

  // ==================== IMAGE HOVER EFFECTS ====================

  // 3D tilt effect on hover for cards (ONLY for about-card, NOT contact boxes)
  document.querySelectorAll(".about-card").forEach((card) => {
    card.addEventListener("mousemove", function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", function () {
      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
    });
  });

  // ==================== FORM VALIDATION & ENHANCEMENTS ====================

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    const inputs = contactForm.querySelectorAll("input, textarea");

    // Add floating label effect
    inputs.forEach((input) => {
      input.addEventListener("focus", function () {
        this.parentElement.classList.add("focused");
      });

      input.addEventListener("blur", function () {
        if (this.value === "") {
          this.parentElement.classList.remove("focused");
        }
      });

      // Add input animation
      input.addEventListener("input", function () {
        if (this.value.length > 0) {
          this.style.borderColor = "#28a745";
        } else {
          this.style.borderColor = "#e0e0e0";
        }
      });
    });

    // Real-time email validation
    const emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.addEventListener("input", function () {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(this.value)) {
          this.style.borderColor = "#28a745";
        } else if (this.value.length > 0) {
          this.style.borderColor = "#dc3545";
        }
      });
    }
  }

  // ==================== SCROLL REVEAL ANIMATIONS ====================

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  // Apply reveal animation to sections
  document
    .querySelectorAll(
      ".content-section, .values-section, .stats-section, .tech-section"
    )
    .forEach((section) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(50px)";
      section.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";

      revealObserver.observe(section);
    });

  // Add revealed state
  const style = document.createElement("style");
  style.textContent = `
        .revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
  document.head.appendChild(style);

  // ==================== INTERACTIVE FEATURE LISTS ====================

  document.querySelectorAll(".feature-list li").forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`;
    item.style.animation = "slideInLeft 0.5s ease forwards";
  });

  // Add animation keyframes
  const keyframes = document.createElement("style");
  keyframes.textContent = `
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
  document.head.appendChild(keyframes);

  // ==================== VALUE ITEMS STAGGER ANIMATION ====================

  const valueObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".value-item");
          items.forEach((item, index) => {
            setTimeout(() => {
              item.style.opacity = "1";
              item.style.transform = "translateY(0)";
            }, index * 150);
          });
          valueObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  const valuesGrid = document.querySelector(".values-grid");
  if (valuesGrid) {
    valuesGrid.querySelectorAll(".value-item").forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(50px)";
      item.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    });
    valueObserver.observe(valuesGrid);
  }

  // ==================== TECH ITEMS ROTATION ====================

  document.querySelectorAll(".tech-item").forEach((item, index) => {
    item.style.animationDelay = `${index * 0.15}s`;

    item.addEventListener("mouseenter", function () {
      const icon = this.querySelector(".tech-icon");
      icon.style.transform = "rotate(360deg) scale(1.1)";
    });

    item.addEventListener("mouseleave", function () {
      const icon = this.querySelector(".tech-icon");
      icon.style.transform = "rotate(0deg) scale(1)";
    });
  });

  // ==================== SMOOTH PAGE LOAD ====================

  window.addEventListener("load", function () {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 100);
  });

  // ==================== FLOATING BADGES ANIMATION ====================

  document.querySelectorAll(".floating-badge").forEach((badge, index) => {
    badge.style.animationDelay = `${index * 0.5}s`;
  });

  // ==================== CONTACT ITEMS SEQUENTIAL REVEAL ====================

  const contactItemsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".contact-item");
          items.forEach((item, index) => {
            setTimeout(() => {
              item.style.opacity = "1";
              item.style.transform = "translateX(0)";
            }, index * 200);
          });
          contactItemsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  const infoContent = document.querySelector(".info-content");
  if (infoContent) {
    infoContent.querySelectorAll(".contact-item").forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateX(-50px)";
      item.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    });
    contactItemsObserver.observe(infoContent);
  }

  // ==================== QUICK OPTIONS HOVER EFFECT ====================

  document.querySelectorAll(".quick-option").forEach((option) => {
    option.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-10px) scale(1.05)";
    });

    option.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });

  // ==================== SCROLL PROGRESS INDICATOR ====================

  // Create progress bar for page scroll
  const progressBar = document.createElement("div");
  progressBar.style.cssText = `
        position: fixed;
        top: 60px;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #8B0000, #A52A2A);
        z-index: 9999;
        transition: width 0.2s ease;
        width: 0;
        box-shadow: 0 2px 10px rgba(139, 0, 0, 0.5);
    `;
  document.body.appendChild(progressBar);

  window.addEventListener("scroll", () => {
    const windowHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    progressBar.style.width = scrolled + "%";
  });

  // ==================== NAVBAR BACKGROUND ON SCROLL ====================

  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      navbar.style.background =
        "linear-gradient(135deg, rgba(139, 0, 0, 0.95) 0%, rgba(165, 42, 42, 0.95) 100%)";
      navbar.style.backdropFilter = "blur(10px)";
    } else {
      navbar.style.background =
        "linear-gradient(135deg, #8B0000 0%, #A52A2A 100%)";
      navbar.style.backdropFilter = "none";
    }
  });

  console.log("✅ Page animations initialized");
});
