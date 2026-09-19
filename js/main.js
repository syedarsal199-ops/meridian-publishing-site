// Meridian Publishing House — Site Scripts

document.addEventListener('DOMContentLoaded', function () {

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('mobile-open');
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (i) {
        if (i !== item) i.classList.remove('open');
      });
      item.classList.toggle('open', !wasOpen);
    });
  });

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // Contact / quote form — submits to Web3Forms (https://web3forms.com), free, no backend required.
  // To activate: get a free access key at https://web3forms.com and paste it into the hidden
  // "access_key" input in contact.html (search for YOUR_WEB3FORMS_ACCESS_KEY).
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var success = document.getElementById('form-success');
      var error = document.getElementById('form-error');
      var submitBtn = form.querySelector('button[type="submit"]');
      var accessKeyField = form.querySelector('input[name="access_key"]');
      var keyIsSet = accessKeyField && accessKeyField.value && accessKeyField.value.indexOf('YOUR_') !== 0;

      if (error) error.style.display = 'none';

      if (!keyIsSet) {
        // No Web3Forms key configured yet — fall back to a local demo confirmation
        // so the page still feels functional while you add your key.
        console.warn('Meridian contact form: add your Web3Forms access_key in contact.html to send real emails.');
        if (success) {
          success.style.display = 'block';
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.reset();
        return;
      }

      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            if (success) {
              success.style.display = 'block';
              success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            form.reset();
          } else {
            throw new Error(data.message || 'Submission failed');
          }
        })
        .catch(function () {
          if (error) error.style.display = 'block';
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        });
    });
  }

  // Portfolio genre filter
  var filterBtns = document.querySelectorAll('.filter-btn');
  var portfolioItems = document.querySelectorAll('.portfolio-item[data-genre]');
  if (filterBtns.length && portfolioItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var genre = btn.getAttribute('data-filter');
        portfolioItems.forEach(function (item) {
          var match = genre === 'all' || item.getAttribute('data-genre') === genre;
          item.classList.toggle('hide', !match);
        });
      });
    });
  }

  // Header shrink-on-scroll shadow
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(26,26,46,0.08)' : 'none';
    });
  }
});
