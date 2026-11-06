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

    /* ---------- Sticky process: scroll-driven rail + progressive reveal ---------- */
    var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
    if (steps.length) {
      var railFill = document.getElementById('stepsFill');
      var railEl2  = document.querySelector('.steps-rail');
      var curEl    = document.getElementById('stepCur');

      if (reduced) {
        steps.forEach(function (s) { s.classList.add('lit'); });
        if (railFill) railFill.style.height = '100%';
      } else {
        var ticking = false;
        var lastIdx = -1;

        function paint() {
          ticking = false;
          var focus = window.innerHeight * 0.46;
          var active = -1;

          /* the last step whose dot has risen above the focus line */
          for (var i = 0; i < steps.length; i++) {
            var r = steps[i].getBoundingClientRect();
            if (r.top + 52 <= focus) active = i; else break;
          }
          /* before the first dot crosses, treat step one as active once it is on screen */
          if (active < 0 && steps[0].getBoundingClientRect().top < window.innerHeight * 0.85) active = 0;

          for (var j = 0; j < steps.length; j++) {
            steps[j].classList.toggle('lit', j === active);
            steps[j].classList.toggle('seen', j < active);
          }

          if (railFill && railEl2 && active >= 0) {
            var railTop = railEl2.getBoundingClientRect().top;
            var dotY = steps[active].getBoundingClientRect().top + 52;
            var h = Math.max(0, Math.min(railEl2.offsetHeight, dotY - railTop));
            railFill.style.height = h + 'px';
          } else if (railFill) {
            railFill.style.height = '0px';
          }

          if (curEl && active >= 0 && active !== lastIdx) {
            lastIdx = active;
            curEl.textContent = ('0' + (active + 1)).slice(-2);
          }
        }

        function onScroll() {
          if (!ticking) { ticking = true; requestAnimationFrame(paint); }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        paint();
      }
    }

    /* ---------- Book cost calculator ---------- */
    (function () {
      var wc = document.getElementById('wc');
      if (!wc) return;
      var genre = document.getElementById('genre'),
          start = document.getElementById('start'),
          opts  = Array.prototype.slice.call(document.querySelectorAll('.copt input')),
          lowEl = document.getElementById('low'),
          highEl= document.getElementById('high'),
          wcOut = document.getElementById('wcOut'),
          hint  = document.getElementById('wcHint'),
          sub   = document.getElementById('calcSub'),
          weeks = document.getElementById('weeks'),
          lines = document.getElementById('lines');

      var RATE = 0.125;          /* base per-word ghostwriting rate */
      var SPREAD = 0.28;         /* upper end of the range */

      function money(n) {
        n = Math.round(n / 100) * 100;
        return '$' + n.toLocaleString('en-US');
      }
      function pages(w) { return Math.round(w / 250); }

      function hintFor(w) {
        if (w <= 20000) return 'A short guide or lead magnet \u2014 around ' + pages(w) + ' printed pages.';
        if (w <= 45000) return 'A short book or novella \u2014 around ' + pages(w) + ' printed pages.';
        if (w <= 75000) return 'A typical memoir or business book \u2014 around ' + pages(w) + ' printed pages.';
        return 'A substantial book \u2014 around ' + pages(w) + ' printed pages.';
      }

      function calc() {
        var w  = +wc.value,
            g  = +genre.value,
            st = +start.value;

        var writing = w * RATE * g * st;
        if (writing < 1200) writing = 1200;      /* editing-only floor */

        var extras = 0, extraNames = [];
        opts.forEach(function (o) {
          if (o.checked) {
            extras += +o.dataset.add;
            extraNames.push(o.parentNode.querySelector('span').textContent);
          }
        });

        var low  = writing + extras;
        var high = low * (1 + SPREAD);

        lowEl.textContent  = money(low);
        highEl.textContent = money(high);
        wcOut.textContent  = w.toLocaleString('en-US') + ' words';
        hint.textContent   = hintFor(w);

        sub.textContent = st <= 0.4
          ? 'Editing, design and publishing \u2014 no ghostwriting'
          : 'Ghostwriting, editing and production';

        /* timeline scales with words and how much exists already */
        var base = Math.round((w / 5000) * (st <= 0.4 ? 0.45 : 1) * g);
        if (base < 4) base = 4;
        weeks.textContent = base + '\u2013' + (base + 4) + ' weeks';

        var rows = '<li><span>' + (st <= 0.4 ? 'Editing &amp; revision' : 'Writing &amp; editing')
                 + '</span><b>' + money(writing) + '</b></li>';
        if (extraNames.length) {
          rows += '<li><span>' + extraNames.join(', ') + '</span><b>' + money(extras) + '</b></li>';
        }
        lines.innerHTML = rows;
      }

      [wc, genre, start].forEach(function (el) {
        el.addEventListener('input', calc);
        el.addEventListener('change', calc);
      });
      opts.forEach(function (o) { o.addEventListener('change', calc); });
      calc();
    })();

    /* ---------- Book title generator ---------- */
    (function () {
      var go = document.getElementById('tgGo');
      if (!go) return;
      var subjEl = document.getElementById('tgSubject'),
          genEl  = document.getElementById('tgGenre'),
          list   = document.getElementById('tgList'),
          empty  = document.getElementById('tgEmpty');

      /* {s} = subject as given, {S} = Title Case, {p} = plural-ish */
      var P = {
        memoir: ['The Year of {s}', 'Everything but {S}', 'Leaving {S}', 'The Last Summer of {s}',
                 'What {S} Taught Me', 'Notes on {s}', 'A Map of {s}', 'The Long Way Through {s}',
                 'After {S}', 'Letters About {s}', 'The Shape of {s}', 'Somewhere Past {S}'],
        business: ['The {S} Advantage', 'Built on {s}', 'The {S} Playbook', 'Beyond {s}',
                   'The {S} Engine', 'Scaling {s}', 'The Quiet Power of {s}', 'Rethinking {s}',
                   'The {S} Method', 'From {S} to Scale', 'Unreasonable {s}', 'The {S} Standard'],
        selfhelp: ['The Art of {s}', 'Permission to {s}', 'Begin with {s}', 'Unlearning {s}',
                   'The {S} Habit', 'Softer Than {s}', 'Making Peace with {s}', 'Small Acts of {s}',
                   'You Are Allowed {s}', 'The Other Side of {s}', 'Choosing {s}', 'Quietly {S}'],
        howto: ['The Complete Guide to {s}', '{S}, Simplified', 'How to {s} Without Losing Your Mind',
                'The {S} Handbook', 'Start Here: {S}', '{S} in Ninety Days', 'The Practical {S} Guide',
                'Everything You Need for {s}', 'Master {S} Faster', 'The {S} Blueprint'],
        fiction: ['The {S} House', 'A Season of {s}', 'The Weight of {s}', 'Where the {S} Goes',
                  'All That {S}', 'The Memory of {s}', 'Salt and {S}', 'The Quiet {S}',
                  'Before the {S}', 'Our Share of {s}', 'The {S} Hours', 'Small {S}'],
        thriller: ['The {S} Protocol', 'Nine Days of {s}', 'Cold {S}', 'The Last {S}',
                   'Nothing but {S}', 'The {S} Room', 'Burn {S}', 'The {S} Witness',
                   'Dead {S}', 'The {S} Exit', 'No Trace of {s}', 'The {S} Hour'],
        fantasy: ['The {S} Crown', 'Ashes of {s}', '{S}bound', 'The Last {S} of the North',
                  'A Court of {s}', 'The {S} Throne', 'Blood and {S}', 'The {S} Gate',
                  'Daughter of {s}', 'The {S} Rising', 'Empire of {s}', 'The {S} Oath'],
        children: ['The Boy Who Loved {s}', 'Where {S} Goes', '{S} and the Very Big Day',
                   'The Littlest {S}', 'Goodnight, {S}', 'One More {S}', 'The Bravest {S}',
                   '{S} Finds a Friend', 'Ten Little {S}', 'The Day {S} Came to Stay']
      };

      function titleCase(t) {
        var small = ['a','an','the','of','and','or','but','for','to','in','on','at','by','with'];
        return t.split(' ').map(function (w, i) {
          if (!w) return w;
          if (i > 0 && small.indexOf(w.toLowerCase()) > -1) return w.toLowerCase();
          return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(' ');
      }

      function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      }

      function run() {
        var subj = (subjEl.value || '').trim().replace(/\s+/g, ' ');
        if (!subj) {
          empty.textContent = 'Tell us what the book is about first.';
          empty.style.display = 'block';
          list.innerHTML = '';
          subjEl.focus();
          return;
        }
        var pats = shuffle(P[genEl.value] || P.memoir).slice(0, 9);
        var S = titleCase(subj);
        list.innerHTML = pats.map(function (t) {
          var out = t.replace(/\{s\}/g, S).replace(/\{S\}/g, S);
          return '<li><span>' + out + '</span></li>';
        }).join('');
        empty.style.display = 'none';
      }

      go.addEventListener('click', run);
      subjEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); run(); }
      });
      genEl.addEventListener('change', function () { if (subjEl.value.trim()) run(); });
    })();

    /* ---------- Client reviews ----------
       REPLACE the sample entries below with real reviews, then this section can go live.
       Each entry: [ name, review text, meta line, stars ]
       -------------------------------------------------------------------- */
    var REVIEWS = [
      ['Reviewer name',   'The review text goes here, word for word as the client wrote it. Keep it exactly as written \u2014 edited reviews read as invented ones.', 'Memoir \u00b7 March 2026', 5],
      ['Reviewer name',   'A second review. Shorter ones carry just as well in this layout as long ones.', 'Business book \u00b7 April 2026', 5],
      ['Reviewer name',   'A third review. Three to ten works well here; past ten, the section gets long.', 'Repeat client \u00b7 May 2026', 5]
    ];

    (function () {
      var list = document.getElementById('revList');
      if (!list) return;

      var avgEl = document.getElementById('revAvg'),
          wordEl = document.getElementById('revCountWord');

      var WORDS = ['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
                   'Eleven','Twelve'];

      function esc(t) {
        return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      list.innerHTML = REVIEWS.map(function (r) {
        return '<li class="rev-item">'
             +   '<div class="rev-body">'
             +     '<div class="rev-name">' + esc(r[0]) + '</div>'
             +     '<p class="rev-quote">' + esc(r[1]) + '</p>'
             +     '<p class="rev-meta">' + esc(r[2]) + '</p>'
             +   '</div>'
             +   '<span class="rev-stars" role="img" aria-label="' + (r[3] || 5) + ' out of 5 stars"></span>'
             + '</li>';
      }).join('');

      if (avgEl) {
        var sum = REVIEWS.reduce(function (t, r) { return t + (r[3] || 5); }, 0);
        avgEl.textContent = (sum / REVIEWS.length).toFixed(1);
      }
      if (wordEl) {
        wordEl.textContent = WORDS[REVIEWS.length] || REVIEWS.length;
      }

      var items = list.querySelectorAll('.rev-item');
      if (reduced || !('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('in'); });
      } else {
        var rio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e, i) {
            if (e.isIntersecting) {
              var el = e.target;
              setTimeout(function () { el.classList.add('in'); }, i * 90);
              rio.unobserve(el);
            }
          });
        }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
        items.forEach(function (el) { rio.observe(el); });
      }
    })();

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

/* ===== Portfolio coverflow slider (only runs where #rail exists) ===== */
(function(){
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GENRES = [
    {key:'memoir',   label:'Memoirs',     cls:'c-memoir'},
    {key:'business', label:'Business',    cls:'c-business'},
    {key:'selfhelp', label:'Self Help',   cls:'c-selfhelp'},
    {key:'fantasy',  label:'Fantasy',     cls:'c-fantasy'},
    {key:'thriller', label:'Thriller',    cls:'c-thriller'},
    {key:'romance',  label:'Romance',     cls:'c-romance'},
    {key:'children', label:'Children',    cls:'c-children'},
    {key:'nonfic',   label:'Non-Fiction', cls:'c-nonfic'}
  ];

  var BOOKS = {
    memoir:[['The Long Road Home','','Cover design'],['Rooted','','Cover &amp; interior'],
            ['Salt and Smoke','','Cover, print &amp; ebook'],['The Year of Quiet','','Cover design'],
            ['Letters I Never Sent','','Cover &amp; interior'],['Crossing the Divide','','Cover, print &amp; ebook']],
    business:[['Built to Scale','','Cover design'],["The Founder's Playbook",'','Cover &amp; interior'],
            ['Quiet Leverage','','Cover &amp; interior'],['The Margin Habit','','Cover, print &amp; ebook'],
            ['Hire Slow, Fire Kind','','Cover design'],['Signal Over Noise','','Cover &amp; interior']],
    selfhelp:[['Quiet Confidence','','Cover, print &amp; ebook'],['Letting Go, Moving On','','Cover design'],
            ['The Small Hours','','Cover &amp; interior'],['Begin Again, Slowly','','Cover, print &amp; ebook'],
            ['Permission Granted','','Cover design'],['The Honest Inventory','','Cover &amp; interior']],
    fantasy:[['Ashes of Eldermoor','','Cover, print &amp; ebook'],['The Hollow Crown','','Cover design'],
            ['Saltbound','','Cover &amp; interior'],['The Last Cartographer','','Cover, print &amp; ebook'],
            ['Thornfield Rising','','Cover design'],['Wyrmsong','','Cover &amp; interior']],
    thriller:[['The Last Signal','','Cover, print &amp; ebook'],['Nine Days in Riga','','Cover design'],
            ['The Quiet Room','','Cover &amp; interior'],['Cold Open','','Cover, print &amp; ebook'],
            ['The Understudy','','Cover design'],['Blackwater Exit','','Cover &amp; interior']],
    romance:[['The Second Letter','','Cover, print &amp; ebook'],['Marigold Season','','Cover design'],
            ['Borrowed Summers','','Cover &amp; interior'],['The Understanding','','Cover, print &amp; ebook'],
            ['Two Weeks in Lisbon','','Cover design'],['Late to the Party','','Cover &amp; interior']],
    children:[['The Boy Who Counted Stars','','Cover, print &amp; ebook'],['Mabel and the Moon Fox','','Cover design'],
            ['Where the Kites Go','','Cover &amp; interior'],['The Bravest Small Thing','','Cover, print &amp; ebook'],
            ['One More Sleep','','Cover design'],['The Lighthouse Cat','','Cover &amp; interior']],
    nonfic:[['The Bread Archive','','Cover, print &amp; ebook'],['Recipes From Home','','Cover design'],
            ['Concrete and Memory','','Cover &amp; interior'],['A Short History of Doubt','','Cover, print &amp; ebook'],
            ['The Tide Tables','','Cover design'],['Hand, Tool, Object','','Cover &amp; interior']]
  };

  var railEl   = document.getElementById('rail');
  var genresEl = document.getElementById('genres');
  var collageEl= document.getElementById('collage');
  var curEl    = document.getElementById('cur');
  var totEl    = document.getElementById('tot');
  var progEl   = document.getElementById('prog');

  /* This block only applies to the portfolio page. */
  if (!railEl || !genresEl || !collageEl) return;

  /* ---------- blurred collage behind ---------- */
  (function(){
    var all = [];
    GENRES.forEach(function(g){
      BOOKS[g.key].forEach(function(b){ all.push({t:b[0], cls:g.cls}); });
    });
    var html = '';
    for (var i=0;i<54;i++){
      var b = all[i % all.length];
      html += '<div class="'+b.cls+'"><span>Kingsley</span><b>'+b.t+'</b></div>';
    }
    collageEl.innerHTML = html;
  })();

  /* ---------- chips ---------- */
  GENRES.forEach(function(g,i){
    var b = document.createElement('button');
    b.className = 'gchip' + (i===0 ? ' on' : '');
    b.type = 'button';
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected', i===0 ? 'true':'false');
    b.dataset.key = g.key;
    b.innerHTML = '<span>'+g.label+'</span>';
    genresEl.appendChild(b);
  });

  /* ---------- build slides ---------- */
  function render(key){
    var g = GENRES.filter(function(x){return x.key===key})[0];
    var list = BOOKS[key];
    railEl.innerHTML = list.map(function(b){
      return '<article class="slide">'
        + '<div class="cover '+g.cls+(b[3]?' has-art':'')+'">'
        +   (b[3] ? '<img src="'+b[3]+'" alt="" loading="lazy">' : '')
        +   '<span class="bloom"></span>'
        +   '<span class="glyph">'+b[0].replace(/^(The|A|An)\s+/i,'').charAt(0)+'</span>'
        +   '<span class="frame"></span>'
        +   '<i>'+g.label+'</i>'
        +   '<div><span class="rule"></span><b>'+b[0]+'</b><u>'+b[1]+'</u></div>'
        + '</div>'
        + '<div class="slide-meta"><strong>'+b[0]+'</strong><span>'+b[1]+'</span><em>'+b[2]+'</em></div>'
        + '</article>';
    }).join('');
    totEl.textContent = String(list.length).padStart(2,'0');
    requestAnimationFrame(function(){
      railEl.classList.add('ready');
      Array.prototype.forEach.call(railEl.children, function(s,i){
        s.style.transitionDelay = (i*65)+'ms';
      });
      railEl.scrollLeft = 0;
      tick();
    });
  }

  function switchGenre(key, chip){
    document.querySelectorAll('.gchip').forEach(function(c){
      c.classList.toggle('on', c===chip);
      c.setAttribute('aria-selected', c===chip ? 'true':'false');
    });
    if (reduced){ railEl.classList.remove('ready'); render(key); return; }
    railEl.classList.add('leaving');
    setTimeout(function(){
      railEl.classList.remove('leaving','ready');
      render(key);
    }, 320);
  }

  genresEl.addEventListener('click', function(e){
    var chip = e.target.closest('.gchip');
    if (chip && !chip.classList.contains('on')) switchGenre(chip.dataset.key, chip);
  });

  /* ---------- 3D depth driven by scroll position ---------- */
  var raf = null;
  function tick(){
    var mid = railEl.getBoundingClientRect().left + railEl.offsetWidth/2;
    var closest = null, closestDist = Infinity, idx = 0;

    Array.prototype.forEach.call(railEl.children, function(slide,i){
      var r = slide.getBoundingClientRect();
      var c = r.left + r.width/2;
      var d = (c - mid) / (railEl.offsetWidth/2);        // -1 .. 1
      var ad = Math.min(Math.abs(d),1);

      if (!reduced){
        var cover = slide.firstElementChild;
        slide.style.transform =
          'perspective(1600px) rotateY(' + (-d*20) + 'deg)'
          + ' translateZ(' + (-ad*110) + 'px)'
          + ' scale(' + (1 - ad*0.1) + ')';
        cover.style.setProperty('--sheen', (d*90).toFixed(1)+'px');
        cover.style.filter = 'brightness(' + (1 - ad*0.3).toFixed(3) + ')';
      }

      slide.classList.toggle('focus', ad < 0.18);
      if (Math.abs(d) < closestDist){ closestDist = Math.abs(d); closest = slide; idx = i; }
    });

    curEl.textContent = String(idx+1).padStart(2,'0');
    var max = railEl.scrollWidth - railEl.clientWidth;
    progEl.style.width = (max > 0 ? (railEl.scrollLeft/max)*100 : 0) + '%';
    raf = null;
  }

  railEl.addEventListener('scroll', function(){
    if (raf === null) raf = requestAnimationFrame(tick);
  }, {passive:true});
  window.addEventListener('resize', function(){
    if (raf === null) raf = requestAnimationFrame(tick);
  });

  /* ---------- drag with momentum ---------- */
  var down=false, startX=0, startScroll=0, lastX=0, lastT=0, vel=0, moved=false;

  railEl.addEventListener('pointerdown', function(e){
    down=true; moved=false;
    startX = lastX = e.clientX;
    startScroll = railEl.scrollLeft;
    lastT = performance.now(); vel = 0;
    railEl.classList.add('dragging');
    railEl.setPointerCapture(e.pointerId);
  });
  railEl.addEventListener('pointermove', function(e){
    if(!down) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    railEl.scrollLeft = startScroll - dx;
    var now = performance.now(), dt = now - lastT;
    if (dt > 0){ vel = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = now; }
  });
  function release(){
    if(!down) return;
    down=false;
    railEl.classList.remove('dragging');
    // fling
    var target = railEl.scrollLeft - vel*320;
    railEl.scrollTo({left:target, behavior: reduced ? 'auto' : 'smooth'});
    setTimeout(snap, reduced ? 0 : 420);
  }
  railEl.addEventListener('pointerup', release);
  railEl.addEventListener('pointercancel', release);
  railEl.addEventListener('click', function(e){ if(moved) e.preventDefault(); }, true);

  function snap(){
    var mid = railEl.getBoundingClientRect().left + railEl.offsetWidth/2;
    var best=null, bestD=Infinity;
    Array.prototype.forEach.call(railEl.children, function(s){
      var r=s.getBoundingClientRect(), c=r.left+r.width/2, d=Math.abs(c-mid);
      if(d<bestD){bestD=d;best=s;}
    });
    if(best) best.scrollIntoView({behavior: reduced?'auto':'smooth', inline:'center', block:'nearest'});
  }

  /* ---------- arrows + keyboard ---------- */
  function step(dir){
    var w = railEl.children[0] ? railEl.children[0].offsetWidth + 30 : 300;
    railEl.scrollBy({left: dir*w, behavior: reduced?'auto':'smooth'});
  }
  document.getElementById('prev').addEventListener('click', function(){ step(-1); });
  document.getElementById('next').addEventListener('click', function(){ step(1); });
  railEl.addEventListener('keydown', function(e){
    if(e.key==='ArrowRight'){ e.preventDefault(); step(1); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); step(-1); }
  });

  render('memoir');
})();