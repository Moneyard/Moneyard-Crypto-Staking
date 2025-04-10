document.addEventListener("DOMContentLoaded", () => {
  // Set global warm orange background
  document.body.style.backgroundColor = '#FFA94D';

  // Only attempt to load the user summary if the user is logged in
  if (isUserLoggedIn()) {
    loadUserSummary();
  } else {
    console.log('User is not logged in. Skipping user summary load.');
  }

  // Observer animation for sections
  const sections = document.querySelectorAll('.animated-section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'growth-tracker') {
          animateCounters();
        }
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(section => observer.observe(section));

  // Counter animation
  const counters = document.querySelectorAll('.counter');

  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const current = +counter.innerText;
      const increment = target / 100;

      if (current < target) {
        counter.innerText = Math.ceil(current + increment);
        setTimeout(updateCount, 30);
      } else {
        counter.innerText = target;
      }
    };

    const counterObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        updateCount();
        counterObserver.disconnect(); // Run only once
      }
    });

    counterObserver.observe(counter);
  });
});
