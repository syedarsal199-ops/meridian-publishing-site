/* Kingsley Book Publishers — interaction & scroll choreography */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Header: shadow once scrolled ---------- */
    var head = document.querySelector('.site-head');
    var bar = document.querySelector('.progress');

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (head) head.classList.toggle('is-stuck', y > 8);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile drawer ---------- */
    var burger = document.querySelector('.burger');
    var drawer = document.querySelector('.drawer');
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = drawer.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      drawer.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          drawer.classList.remove('open');
          burger.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }

    /* ---------- Headline line reveal: wrap each line ---------- */
    document.querySelectorAll('.lines').forEach(function (el) {
      if (el.dataset.wrapped) return;
      var parts = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = parts.map(function (p) {
        return '<span><span>' + p.trim() + '</span></span>';
      }).join('');
      el.dataset.wrapped = '1';
    });

    /* ---------- Reveal on scroll ---------- */
    var targets = document.querySelectorAll('[data-anim], [data-stagger], .lines, .shelf');

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('seen'); });
    } else {
      // apply per-child stagger delays
      document.querySelectorAll('[data-stagger]').forEach(function (group) {
        var step = parseInt(group.dataset.stagger, 10) || 90;
        Array.prototype.forEach.call(group.children, function (child, i) {
          child.style.transitionDelay = (i * step) + 'ms';
        });
      });
      // explicit per-element delay
      document.querySelectorAll('[data-delay]').forEach(function (el) {
        el.style.transitionDelay = el.dataset.delay + 'ms';
      });

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('seen');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

      targets.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Count-up stats ---------- */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
      if (reduced || !('IntersectionObserver' in window)) {
        counters.forEach(function (el) {
          el.textContent = el.dataset.prefix || '';
          el.textContent += el.dataset.count + (el.dataset.suffix || '');
        });
      } else {
        var cio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            cio.unobserve(el);
            var end = parseFloat(el.dataset.count);
            var dec = (el.dataset.count.split('.')[1] || '').length;
            var pre = el.dataset.prefix || '';
            var suf = el.dataset.suffix || '';
            var dur = 1500, t0 = null;
            function tick(ts) {
              if (!t0) t0 = ts;
              var p = Math.min((ts - t0) / dur, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              el.textContent = pre + (end * eased).toFixed(dec) + suf;
              if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          });
        }, { threshold: 0.5 });
        counters.forEach(function (el) { cio.observe(el); });
      }
    }

    /* ---------- Sticky process: light the active step ---------- */
    var steps = document.querySelectorAll('.step');
    if (steps.length && !reduced && 'IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('lit', entry.isIntersecting);
        });
      }, { threshold: 0.55 });
      steps.forEach(function (s) { sio.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('lit'); });
    }

    /* ---------- Accordion ---------- */
    document.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var panel = item.querySelector('.faq-a');
        var isOpen = item.classList.contains('open');

        // close siblings in the same list
        var list = item.parentElement;
        list.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-a').style.height = '0px';
            other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          panel.style.height = '0px';
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          panel.style.height = panel.firstElementChild.offsetHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    // open any marked default
    document.querySelectorAll('.faq-item.open').forEach(function (item) {
      var p = item.querySelector('.faq-a');
      if (p) p.style.height = p.firstElementChild.offsetHeight + 'px';
    });

    /* ---------- Contact form (Web3Forms) ---------- */
    var form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = document.getElementById('form-ok');
        var bad = document.getElementById('form-bad');
        var btn = form.querySelector('button[type="submit"]');
        var keyField = form.querySelector('input[name="access_key"]');
        var hasKey = keyField && keyField.value && keyField.value.indexOf('YOUR_') !== 0;

        if (bad) bad.style.display = 'none';

        if (!hasKey) {
          if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          form.reset();
          return;
        }

        var label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (!d.success) throw new Error(d.message || 'failed');
            if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            form.reset();
          })
          .catch(function () { if (bad) bad.style.display = 'block'; })
          .finally(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
      });
    }

    /* ---------- Portfolio genre filter ---------- */
    var chips = document.querySelectorAll('.filter-btn');
    var items = document.querySelectorAll('.work[data-genre]');
    if (chips.length && items.length) {
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          var want = chip.dataset.filter;
          items.forEach(function (it) {
            var show = want === 'all' || it.dataset.genre === want;
            it.style.display = show ? '' : 'none';
          });
        });
      });
    }
  });
})();
