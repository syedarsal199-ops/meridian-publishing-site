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
    memoir:[['The Long Road Home','Renee Alston','#4 in Memoirs'],['Rooted','The Alvarez Family','Featured on NPR'],
            ['Salt and Smoke','Mary Okonjo','12,000+ copies'],['The Year of Quiet','Dana Reyes','#9 in Memoirs'],
            ['Letters I Never Sent','Paul Brandt','4.8★ average'],['Crossing the Divide','Imani Clarke','7,400+ copies']],
    business:[['Built to Scale','David Chen','50,000+ copies'],["The Founder's Playbook",'Priya Nathan','Inc. recommended'],
            ['Quiet Leverage','Marcus Hale','#1 New Releases'],['The Margin Habit','Sofia Petrov','22,000+ copies'],
            ['Hire Slow, Fire Kind','Dan Whitmore','#3 in Management'],['Signal Over Noise','Ayo Adeyemi','4.7★ average']],
    selfhelp:[['Quiet Confidence','Sofia Marquez','#3 in Self-Help'],['Letting Go, Moving On','Grace Whitfield','12,000+ copies'],
            ['The Small Hours','Noor Rahimi','#6 in Mindfulness'],['Begin Again, Slowly','Tom Castellan','9,100+ copies'],
            ['Permission Granted','Elise Dufour','4.9★ average'],['The Honest Inventory','Ray Mbeki','#8 in Personal Growth']],
    fantasy:[['Ashes of Eldermoor','J.R. Colton','#7 in Epic Fantasy'],['The Hollow Crown','Vera Lindqvist','31,000+ copies'],
            ['Saltbound','Ines Vargas','#2 in Dark Fantasy'],['The Last Cartographer','Owen Reeve','4.6★ average'],
            ['Thornfield Rising','Kit Abara','18,500+ copies'],['Wyrmsong','Hal Petersen','#5 in Fantasy']],
    thriller:[['The Last Signal','Marcus Webb','40,000+ copies'],['Nine Days in Riga','Lena Kovac','#4 in Espionage'],
            ['The Quiet Room','Dev Anand','26,000+ copies'],['Cold Open','Ruth Delany','#1 in Techno-Thriller'],
            ['The Understudy','Sam Oyelaran','4.7★ average'],['Blackwater Exit','Nora Feld','14,000+ copies']],
    romance:[['The Second Letter','Amara Boyd','#2 in Contemporary'],['Marigold Season','Thea Nilsen','28,000+ copies'],
            ['Borrowed Summers','Luca Rossi','#6 in Romance'],['The Understanding','Nia Thompson','4.8★ average'],
            ['Two Weeks in Lisbon','Pia Moreau','19,000+ copies'],['Late to the Party','Jess Carrow','#9 in Romcom']],
    children:[['The Boy Who Counted Stars','Omar Haddad','#3 in Picture Books'],['Mabel and the Moon Fox','Sara Quinn','21,000+ copies'],
            ['Where the Kites Go','Lin Zhao','4.9★ average'],['The Bravest Small Thing','Tess Oduya','#5 in Early Readers'],
            ['One More Sleep','Abby Fenn','16,000+ copies'],['The Lighthouse Cat','Rory Vance','#7 in Children']],
    nonfic:[['The Bread Archive','Hana Sato','#4 in Food History'],['Recipes From Home','The Hoang Family','8,000+ copies'],
            ['Concrete and Memory','Felix Braun','4.6★ average'],['A Short History of Doubt','Ruth Amari','#8 in Philosophy'],
            ['The Tide Tables','Gwen Pryce','11,000+ copies'],['Hand, Tool, Object','Jonas Beck','#2 in Craft']]
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