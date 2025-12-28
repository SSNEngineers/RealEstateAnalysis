// ==================== SCROLL ANIMATIONS ====================

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add delay based on data-delay attribute
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, delay);
                
                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(element => {
        observer.observe(element);
    });
    
    // ==================== PARALLAX EFFECTS ====================
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        // Parallax for hero image
        const heroImage = document.querySelector('.hero-image');
        if (heroImage) {
            heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
        
        // Parallax for floating icons
        document.querySelectorAll('.floating-icon').forEach((icon, index) => {
            const speed = 0.1 + (index * 0.05);
            icon.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // ==================== SMOOTH SCROLL ====================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // ==================== NAVBAR SCROLL EFFECT ====================
    
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ==================== COUNTER ANIMATION ====================
    
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }
    
    // Observe counter elements
    document.querySelectorAll('[data-counter]').forEach(element => {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(element.getAttribute('data-counter'));
                    animateCounter(element, target);
                    counterObserver.unobserve(element);
                }
            });
        }, { threshold: 0.5 });
        
        counterObserver.observe(element);
    });
    
    // ==================== CARD TILT EFFECT ====================
    
    document.querySelectorAll('.feature-card, .action-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
    
    // ==================== LOADING ANIMATION ====================
    
    window.addEventListener('load', function() {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
        
        // Trigger initial animations
        document.body.classList.add('loaded');
    });
    
    // ==================== TYPING EFFECT ====================
    
    function typeWriter(element, text, speed = 50) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }
    
    // Apply typing effect to elements with data-typing attribute
    document.querySelectorAll('[data-typing]').forEach(element => {
        const text = element.textContent;
        const typingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typeWriter(element, text);
                    typingObserver.unobserve(element);
                }
            });
        }, { threshold: 0.5 });
        
        typingObserver.observe(element);
    });
    
    // ==================== STAGGER ANIMATION ====================
    
    function staggerAnimation(elements, delay = 100) {
        elements.forEach((element, index) => {
            element.style.animationDelay = `${index * delay}ms`;
        });
    }
    
    // Apply to grid items
    const featureCards = document.querySelectorAll('.features-grid .feature-card');
    if (featureCards.length > 0) {
        staggerAnimation(featureCards, 150);
    }
    
    // ==================== PROGRESS BAR ON SCROLL ====================
    
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(90deg, #8B0000, #C41E3A);
        z-index: 10000;
        transition: width 0.2s ease;
        width: 0;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
    
    // ==================== CURSOR TRAIL EFFECT (Optional) ====================
    
    // Uncomment to enable cursor trail
    
    // const trail = [];
    // const trailLength = 20;
    
    // for (let i = 0; i < trailLength; i++) {
    //     const dot = document.createElement('div');
    //     dot.className = 'cursor-trail-dot';
    //     dot.style.cssText = `
    //         position: fixed;
    //         width: 10px;
    //         height: 10px;
    //         background: rgba(139, 0, 0, ${1 - i / trailLength});
    //         border-radius: 50%;
    //         pointer-events: none;
    //         z-index: 9999;
    //         transition: transform 0.1s ease;
    //     `;
    //     document.body.appendChild(dot);
    //     trail.push(dot);
    // }
    
    // let mouseX = 0, mouseY = 0;
    
    // document.addEventListener('mousemove', (e) => {
    //     mouseX = e.clientX;
    //     mouseY = e.clientY;
    // });
    
    // function animateTrail() {
    //     let x = mouseX;
    //     let y = mouseY;
        
    //     trail.forEach((dot, index) => {
    //         dot.style.left = x - 5 + 'px';
    //         dot.style.top = y - 5 + 'px';
    //         dot.style.transform = `scale(${1 - index / trailLength})`;
            
    //         const nextDot = trail[index + 1] || trail[0];
    //         x += (nextDot.offsetLeft - x) * 0.3;
    //         y += (nextDot.offsetTop - y) * 0.3;
    //     });
        
    //     requestAnimationFrame(animateTrail);
    // }
    
    // animateTrail();
    
    
    console.log('✅ Animations initialized');
});