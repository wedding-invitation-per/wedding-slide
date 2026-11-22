/* ==========================================================================
   Vũ Mạnh & Ngọc Ánh – engine + các cảnh
   - Mọi chuyển động chạy theo MỘT đồng hồ chung (t, giây) nên tua chính xác:
     ?t=33.5  (và &paused=1 để dừng tại đó).
   - Toạ độ dùng hệ 1920×1080.
   ========================================================================== */
(async function () {
  'use strict';

  const CFG = window.WEDDING_CONFIG;
  const TX = CFG.text;
  const stage = document.getElementById('stage');
  const DURATION = 75.2;   // thời lượng gốc (thời gian "nội bộ" của các cảnh)
  /* Làm chậm từ cảnh 2 trở đi: SLOW = 1.4 nghĩa là chữ gõ và mọi cảnh chạy chậm 1.4 lần.
     Cảnh 1 (giọng thoại + nhạc) giữ nguyên. Chỉnh trong config.js: playback.slow */
  const SLOW = Math.max(1, (CFG.playback && CFG.playback.slow) || 1.4);
  const SLOW_FROM = 13.0;
  const mapT = (t) => (t <= SLOW_FROM ? t : SLOW_FROM + (t - SLOW_FROM) / SLOW);
  const TOTAL = SLOW_FROM + (DURATION - SLOW_FROM) * SLOW;   // thời lượng thực tế sau khi làm chậm

  /* fonts */
  const fontJobs = [
    ['400 40px Allura', 'Lời đầu tiên ầ ẫ ơ ư Từ sâu thẳm đáy lòng'],
    ['400 40px Playball', 'Vợ anh thì Oke'],
    ['400 40px Lora', 'Chúng con rất hân hạnh được ầ ẫ'],
    ['500 40px Lora', 'Chúng con rất hân hạnh được ầ ẫ'],
    ['600 40px Lora', 'Chúng con rất hân hạnh được ầ ẫ'],
    ['700 40px Lora', 'CHÚNG CON XIN CẢM ƠN ẦẪ'],
    ['500 40px "Playfair Display"', '03.05.2027'],
    ['600 40px "Playfair Display"', 'TÙNG SƠN HẢI TÚ'],
    ['700 40px "Playfair Display"', 'NGÀY HÔM NAY LÀ MỘT NGÀY VÔ CÙNG Ý NGHĨA ĐỐI VỚI'],
    ['400 40px "Bodoni Moda"', 'SAVE the DATE THANK YOU'],
    ['500 40px "Bodoni Moda"', 'SAVE DATE'],
    ['400 40px "Alfa Slab One"', 'LOVE'],
    ['900 40px "Noto Sans SC"', '囍'],
  ];
  // Không để font lỗi/chậm làm treo slide: tối đa chờ 6 giây
  await Promise.race([
    Promise.all(fontJobs.map(([f, s]) => document.fonts.load(f, s).catch(() => {}))).then(() => document.fonts.ready),
    new Promise((r) => setTimeout(r, 6000)),
  ]);

  /* helpers */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const E = {
    out: 'cubic-bezier(.22,.8,.3,1)',
    io: 'cubic-bezier(.65,0,.35,1)',
    back: 'cubic-bezier(.34,1.56,.64,1)',
    lin: 'linear',
  };

  function el(tag, cls, style, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  }
  function box(parent, cls, x, y, w, h, extra) {
    return el('div', cls, Object.assign({ left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }, extra), parent);
  }

  /* Đường dẫn ảnh: tên file trong thư mục images/ (vd 'anh1.jpg'), đường dẫn ('img/a.png') hoặc URL https://... */
  function imgUrl(key, w) {
    const c = CFG.images[key];
    if (!c) return null;
    const v = typeof c === 'string' ? c : (c.src || c.url || c.file);
    if (!v) return null;
    if (/^(https?:)?\/\//.test(v) || /^(data:|blob:)/.test(v) || v.includes('/')) return v;
    return (CFG.imagesDir || 'images/') + v;
  }

  const LABELS = {
    collageCutout: 'ẢNH CẮT NỀN\ncô dâu + chú rể (nửa người)\nPNG trong suốt · ~750×720',
    saveCutout: 'ẢNH CẮT NỀN\ncô dâu + chú rể (toàn thân)\nPNG trong suốt · ~950×1010',
    storyBanner: 'ẢNH NGANG (banner)\n1920×520',
    storyCutout: 'ẢNH CẮT NỀN\ncô dâu + chú rể (nửa người)\nPNG trong suốt · ~650×680',
    gallery1: 'ẢNH DỌC 1\n640×840',
    gallery2: 'ẢNH DỌC 2\n640×840',
    gallery3: 'ẢNH DỌC 3\n640×840',
    finally: 'ẢNH FULL MÀN HÌNH\n1920×1080',
    pairTall: 'ẢNH DỌC\n778×960',
    pairWide: 'ẢNH NGANG\n955×597',
    gratitude: 'ẢNH DỌC\n819×1080',
    promise: 'ẢNH DỌC\n813×1080',
    thanksPhoto: 'ẢNH DỌC\n853×1080',
    love: 'ẢNH NGANG trong chữ LOVE\n1533×494',
  };

  function photoSlot(parent, key, x, y, w, h) {
    const d = box(parent, 'slot photo', x, y, w, h);
    d.dataset.slot = key;
    const url = imgUrl(key, w);
    if (url) {
      const im = new Image();
      im.alt = '';
      im.decoding = 'async';
      im.src = url;
      const c = CFG.images[key];
      if (c.focus) im.style.objectPosition = c.focus;  // chỉ dùng khi ảnh khai báo dạng { src, focus, ... }
      const sc = c.scale != null ? c.scale : 1, dx = c.dx || 0, dy = c.dy || 0;
      if (sc !== 1 || dx || dy) {
        /* thu nhỏ / dịch ảnh BÊN TRONG khung (khung giữ nguyên); phần trống được lấp bằng chính ảnh đó làm mờ */
        const bg = new Image();
        bg.alt = ''; bg.src = url; bg.className = 'bgblur';
        d.appendChild(bg);
        im.classList.add('fx');
        im.style.transform = `translate(${dx}px,${dy}px) scale(${sc})`;
      }
      d.appendChild(im);
    } else {
      d.classList.add('ph');
      el('span', 'lbl', null, d).textContent = LABELS[key] || key;
    }
    return d;
  }

  const SIL = {
    half: {
      vb: '0 0 760 730',
      d: `<path d="M40 730 L40 470 C40 360 110 290 250 270 C390 290 450 360 450 470 L450 730Z"/>
          <circle cx="250" cy="150" r="88"/>
          <path d="M330 730 L330 520 C330 400 380 330 500 310 C620 330 680 400 680 520 L680 730Z"/>
          <path d="M400 230 C400 100 450 50 520 50 C590 50 640 100 640 230 L650 330 L390 330Z"/>
          <ellipse cx="690" cy="430" rx="60" ry="85"/><rect x="676" y="480" width="28" height="250" rx="12"/>`,
    },
    full: {
      vb: '0 0 950 1010',
      d: `<path d="M20 1010 L20 520 C20 380 120 290 300 270 C480 290 560 380 560 520 L560 1010Z"/>
          <circle cx="290" cy="150" r="100"/>
          <path d="M470 1010 L470 560 C470 420 560 340 700 320 C840 340 920 420 920 560 L920 1010Z"/>
          <path d="M560 250 C560 110 630 50 720 50 C810 50 880 110 880 250 L900 360 L540 360Z"/>`,
    },
  };
  let silId = 0;
  function cutoutSlot(parent, key, x, y, w, h, shape) {
    const d = box(parent, 'cutout', x, y, w, h);
    d.dataset.slot = key;
    const url = imgUrl(key, w);
    if (url) {
      const im = new Image();
      im.alt = '';
      im.decoding = 'async';
      im.src = url;
      d.appendChild(im);
    } else {
      const s = SIL[shape || 'half'];
      const id = 'sil' + silId++;
      d.insertAdjacentHTML(
        'beforeend',
        `<svg class="sil" viewBox="${s.vb}" preserveAspectRatio="none">
           <defs><g id="${id}">${s.d}</g></defs>
           <use href="#${id}" fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round"/>
           <use href="#${id}" fill="#00b140"/>
         </svg>`
      );
      el('div', 'lbl', null, d).textContent = LABELS[key] || key;
    }
    return d;
  }

  /* animation core */
  const tracks = [];
  function anim(target, frames, start, dur, o = {}) {
    const a = target.animate(frames, {
      delay: start * 1000,
      duration: Math.max(1, dur * 1000),
      easing: o.ease || E.out,
      fill: o.fill || 'both',
      composite: o.composite || 'replace',
    });
    a.pause();
    tracks.push(a);
    return a;
  }
  const fadeIn = (e, s, d = 0.5, o) => anim(e, [{ opacity: 0 }, { opacity: 1 }], s, d, o);
  const fadeOut = (e, s, d = 0.5, o) => anim(e, [{ opacity: 1 }, { opacity: 0 }], s, d, Object.assign({}, o, { fill: 'forwards' }));
  const rise = (e, s, d = 0.6, dy = 28) =>
    anim(e, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }], s, d);
  const wipeX = (e, s, d = 0.7) =>
    anim(e, [{ clipPath: 'inset(-20% 100% -20% 0)', opacity: 0.2 }, { clipPath: 'inset(-20% 0% -20% 0)', opacity: 1 }], s, d, { ease: E.lin });
  const wipeDown = (e, s, d = 0.7, ease = E.io) =>
    anim(e, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], s, d, { ease });

  /* Lắc lư nhẹ (xoay quanh chân), cộng thêm lên các hiệu ứng vào sẵn có */
  function sway(target, start, end, o = {}) {
    const sc = CFG.cutoutSway || {};
    const deg = o.deg != null ? o.deg : (sc.deg != null ? sc.deg : 1.6);
    const per = o.period || sc.period || 1.7;
    if (!deg) return;
    const dur = end - start, step = 0.05, n = Math.ceil(dur / step);
    const ramp = Math.min(0.8, dur / 3);
    const frames = [];
    for (let i = 0; i <= n; i++) {
      const tt = i * step;
      const amp = deg * Math.min(1, tt / ramp);
      frames.push({ transform: `rotate(${(amp * Math.sin((2 * Math.PI * tt) / per)).toFixed(3)}deg)` });
    }
    target.style.transformOrigin = '50% 100%';
    anim(target, frames, start, dur, { ease: E.lin, fill: 'none', composite: 'add' });
  }

  /* Typewriter */
  const typers = [];
  function text(parent, lines, o) {
    const root = el('div', 'txt ' + (o.align || 'center'), null, parent);
    Object.assign(root.style, {
      left: o.x + 'px', top: o.y + 'px', width: o.w + 'px',
      fontSize: (o.fs || 40) + 'px', lineHeight: (o.lh || 60) + 'px',
      letterSpacing: (o.ls || 0) + 'em', color: o.color || '#fff',
      fontWeight: o.weight || 500, fontFamily: o.font || "'Lora',serif",
    });
    const chars = [];
    lines.forEach((ln) => {
      const row = el('div', 'ln', null, root);
      for (const ch of ln) {
        const s = el('span', 'ch', null, row);
        s.textContent = ch;
        chars.push(s);
      }
    });
    if (o.fitLine) {
      root.style.fontSize = '100px';
      const w0 = root.children[o.fitLine[0]].offsetWidth;
      root.style.fontSize = (100 * o.fitLine[1] / w0) + 'px';
    }
    if (o.start != null) {
      const cps = o.cps || 30;
      typers.push({ chars, start: o.start, cps, k: Math.max(1.2, cps * 0.2), state: -1, q: [] });
    }
    return root;
  }

  function fit(parent, str, o) {
    const n = el('div', 'abs fit ' + (o.cls || ''), null, parent);
    n.textContent = str;
    Object.assign(n.style, {
      color: o.color || '#fff', letterSpacing: (o.ls || 0) + 'em',
      fontWeight: o.weight || 400, fontSize: '100px',
    });
    if (o.font) n.style.fontFamily = o.font;
    const w0 = n.offsetWidth;
    const fs = 100 * o.w / w0;
    n.style.fontSize = fs + 'px';
    n.style.left = (o.cx - o.w / 2) + 'px';
    n.style.top = (o.cy - fs / 2 + (o.dy || 0) * fs) + 'px';
    return n;
  }

  const scenes = [];
  function scene(name, start, end, o = {}) {
    const e = el('section', 'scene ' + (o.cls || ''), { zIndex: o.z || scenes.length + 1 }, stage);
    e.dataset.name = name;
    scenes.push({ el: e, start, end });
    return e;
  }

  /* 囍 (Song Hỷ) – ký tự U+56CD, font sans đậm (Noto Sans SC Black), bè ngang vừa khít khung
     như logo trong video. Mặc định mờ dần phía dưới qua o.mask. */
  function xi(parent, x, y, w, h, color, o = {}) {
    const d = box(parent, 'xi', x, y, w, h);
    if (color) d.style.color = color;
    const fs = h;                       // cao = khung
    const sx = w / fs / 1.0;            // bè ngang cho vừa bề rộng khung
    d.innerHTML = `<span class="xi-glyph" style="font-size:${fs}px;transform:scaleX(${sx.toFixed(3)})">囍</span>`;
    if (o.mask) d.style.webkitMaskImage = d.style.maskImage = o.mask;
    return d;
  }

  /* CẢNH 1 · Collage (0 → 13.9s) */
  {
    const s = scene('collage', 0, 13.9, { z: 1 });
    el('div', 'bg', { background: 'var(--red-bg1)' }, s);

    const rnd = (function (seed) {
      return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })(7);
    const edge = (y0, slope, amp, step, phase) => {
      const pts = [];
      for (let x = -30; x <= 1950; x += step) {
        const y = y0 + slope * x + Math.sin(x / 190 + phase) * 16 + Math.sin(x / 57 + phase * 2) * 8 + (rnd() - 0.5) * amp;
        pts.push([x, y]);
      }
      return pts;
    };
    const poly = (top, bot) =>
      'M' + top.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') +
      'L' + bot.slice().reverse().map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
    const topW = edge(452, -0.02, 18, 12, 0.4), botW = edge(812, 0.03, 20, 12, 1.1);
    const topG = edge(428, -0.02, 28, 10, 0.9), botG = edge(862, 0.03, 30, 10, 2.0);
    const pathW = poly(topW, botW), pathG = poly(topG, botG);

    /* LỚP Z (thấp → cao):  giấy (sau) < biển/thẻ chữ < cô dâu chú rể < MÉP GIẤY RÁCH DƯỚI (trước) < bình luận
       Nhờ vậy khi thay ảnh thật, chân/thân người bị mép giấy dưới che đúng như video,
       còn mép giấy phía trên nằm sau lưng cô dâu chú rể. */
    const paper = el('div', 'paper', { zIndex: 1 }, s);
    paper.innerHTML = `
      <svg viewBox="0 0 1920 1080" width="1920" height="1080">
        <defs>
          <filter id="rough" x="-2%" y="-5%" width="104%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="t"/>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="9"/>
          </filter>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="n"/>
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .52  0 0 0 0 .52  0 0 0 0 .55  0 0 0 .5 -.12" result="g"/>
            <feComposite in="g" in2="SourceGraphic" operator="in" result="gi"/>
            <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gi"/></feMerge>
          </filter>
        </defs>
        <path d="${pathG}" fill="#c3c8cd" opacity=".95" filter="url(#rough)"/>
        <path d="${pathW}" fill="#fbfaf9" filter="url(#grain)"/>
      </svg>`;
    // lớp phía trước: chỉ phần giấy xám dưới mép trắng, chỉ vùng y ≥ 700
    const paperFront = el('div', 'paper', { zIndex: 6, clipPath: 'inset(700px 0 0 0)', pointerEvents: 'none' }, s);
    paperFront.innerHTML = `
      <svg viewBox="0 0 1920 1080" width="1920" height="1080">
        <defs>
          <filter id="rough2" x="-2%" y="-5%" width="104%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="t"/>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="9"/>
          </filter>
          <mask id="cutWhite" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <rect width="1920" height="1080" fill="#fff"/>
            <path d="${pathW}" fill="#000"/>
          </mask>
        </defs>
        <g mask="url(#cutWhite)"><path d="${pathG}" fill="#c3c8cd" opacity=".95" filter="url(#rough2)"/></g>
      </svg>`;

    const sign = el('div', 'sign', { left: '147px', top: '560px', width: '266px', height: '215px', zIndex: 3 }, s);
    sign.style.transform = 'rotate(-3deg)';
    sign.innerHTML = '<div class="board">THE<br>WEDDING</div><i class="stick"></i>';

    const spark = box(s, 'abs', 82, 462, 150, 112, { zIndex: 3 });
    spark.innerHTML = `<svg viewBox="0 0 90 70" width="150" height="112"><g stroke="#f2b632" stroke-width="7" stroke-linecap="round">
      <line x1="8" y1="62" x2="26" y2="38"/><line x1="40" y1="30" x2="44" y2="6"/><line x1="64" y1="40" x2="86" y2="24"/></g></svg>`;

    const p1 = box(s, 'pill p1', 1520, 578, 215, 54, { zIndex: 3 }); p1.textContent = '“ HÔM NAY';
    const p2 = box(s, 'pill p2', 1432, 640, 395, 76, { zIndex: 3 }); p2.textContent = 'CHÚNG MÌNH CƯỚI!!';

    /* phóng to ~1.18× quanh tâm cũ; đáy (y=861) vẫn nằm trên mép giấy xám phía trước để chân không lộ ra nền đỏ */
    const cut = cutoutSlot(s, 'collageCutout', 582, 0, 897, 861, 'half');
    cut.style.zIndex = 5;

    fadeIn(cut, 0, 0.55);
    sway(cut, 0.55, 13.9);
    anim(sign, [{ opacity: 0, transform: 'rotate(-3deg) scale(.4)' }, { opacity: 1, transform: 'rotate(-3deg) scale(1)' }], 0.85, 0.4, { ease: E.back });
    anim(p1, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], 1.0, 0.35, { ease: E.back });
    anim(p2, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], 1.08, 0.35, { ease: E.back });
    anim(spark, [{ opacity: 0, transform: 'scale(.3) rotate(-25deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)' }], 1.4, 0.35, { ease: E.back });
    anim(spark, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], 1.9, 0.5, { fill: 'none', ease: E.io });

    const C = TX.comments;
    const bubble = (str, cx, cy, w, t0, t1, o = {}) => {
      const holder = box(s, 'abs', cx, cy, 0, 0, { zIndex: 8 });
      const n = el('div', 'cm ' + (o.cls || ''), null, holder);
      n.textContent = str;
      n.style.fontFamily = o.font || "'Allura',cursive";
      n.style.fontSize = '100px';
      const w0 = n.offsetWidth;
      n.style.fontSize = (100 * w / w0) + 'px';
      n.style.left = (-w / 2) + 'px';
      n.style.top = (-parseFloat(n.style.fontSize) * 0.62) + 'px';
      anim(n, [{ opacity: 0, transform: 'scale(.35)' }, { opacity: 1, transform: 'scale(1)' }], t0, 0.28, { ease: E.back });
      anim(n, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.55)' }], t1, 0.25, { fill: 'forwards', ease: E.io });
      return holder;
    };
    bubble(C.q1, 1540, 150, 560, 2.2, 3.15);
    const a1 = bubble(C.a1, 500, 205, 330, 3.25, 4.05);
    const qi = el('div', 'qi', { left: '-300px', top: '-68px' }, a1);
    qi.innerHTML = `<svg viewBox="0 0 60 46" width="62" height="46"><g fill="#f28a1c" stroke="#fff" stroke-width="4" paint-order="stroke">
      <path d="M5 22c0-11 6-17 16-19l2 6c-6 2-8 5-8 8h8v19H5z"/><path d="M34 22c0-11 6-17 16-19l2 6c-6 2-8 5-8 8h8v19H34z"/></g></svg>`;
    anim(qi, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], 3.25, 0.28, { ease: E.back });
    anim(qi, [{ opacity: 1 }, { opacity: 0 }], 4.05, 0.2, { fill: 'forwards' });
    bubble(C.q2, 1540, 160, 520, 4.3, 5.15);
    bubble('“' + C.a2 + '”', 500, 205, 340, 5.4, 6.3);
    bubble(C.q3, 1540, 150, 480, 6.45, 7.75);
    bubble('“' + C.a3 + '”', 500, 205, 340, 8.2, 9.1);
    bubble(C.ok, 1512, 152, 328, 9.4, 10.05, { font: "'Playball',cursive", cls: 'ok' });
    bubble(C.wife1, 1560, 150, 540, 10.2, 11.35, { font: "'Playball',cursive" });
    bubble(C.wife2, 1050, 1000, 640, 11.7, 12.35, { cls: 'ok' });

    fadeOut(s, 13.1, 0.7, { ease: E.lin });
  }

  /* CẢNH 2 · SAVE THE DATE (13.0 → 20.6s) */
  {
    const s = scene('save', 13.0, 20.6, { z: 3 });
    const bg = el('div', 'bg save-bg', null, s);
    xi(s, -120, 60, 1250, 880, 'rgba(255,255,255,.055)');
    fadeIn(s, 13.0, 0.5, { ease: E.lin });

    const cut = cutoutSlot(s, 'saveCutout', 40, 70, 950, 1010, 'full');
    anim(cut, [{ opacity: 0, transform: 'translateX(-70px)' }, { opacity: 1, transform: 'translateX(0)' }], 13.15, 0.8);
    sway(cut, 13.95, 20.6);

    const date = fit(s, TX.date, { cx: 1472, cy: 118, w: 305, font: "'Lora',serif", weight: 400, ls: 0.28, color: '#f1d9cf' });
    date.style.opacity = 0;
    const save = fit(s, 'SAVE', { cx: 1473, cy: 393, w: 600, cls: 'disp', weight: 400, color: '#f5e1d8', ls: 0.01 });
    const the = fit(s, 'the', { cx: 1240, cy: 640, w: 186, cls: 'script', color: '#f5e1d8' });
    the.style.fontFamily = "'Allura',cursive"; the.style.fontStyle = 'italic';
    const dateWord = fit(s, 'DATE', { cx: 1577, cy: 625, w: 392, cls: 'disp', weight: 400, color: '#f5e1d8', ls: 0.01 });
    const hr = box(s, 'hair', 1280, 831, 293, 2);
    const names = fit(s, TX.groom + ' & ' + TX.bride, { cx: 1473, cy: 925, w: 733, cls: 'script', color: '#f1d9cf' });

    anim(date, [{ opacity: 0 }, { opacity: 1 }], 13.4, 0.5);
    rise(save, 13.5, 0.6, 30);
    rise(the, 13.9, 0.55, 24);
    rise(dateWord, 13.95, 0.55, 24);
    anim(hr, [{ opacity: 0, transform: 'scaleX(.2)' }, { opacity: 1, transform: 'scaleX(1)' }], 14.15, 0.5);
    anim(names, [{ opacity: 0, clipPath: 'inset(-20% 100% -20% 0)' }, { opacity: 1, clipPath: 'inset(-20% 0 -20% 0)' }], 14.35, 0.8, { ease: E.lin });

    fadeOut(cut, 19.35, 0.55, { ease: E.lin });
    fadeOut(save, 19.6, 0.4, { ease: E.lin });
    fadeOut(date, 19.6, 0.4, { ease: E.lin });
    fadeOut(bg, 19.7, 0.5, { ease: E.lin });
    fadeOut(the, 20.0, 0.35, { ease: E.lin });
    fadeOut(dateWord, 20.0, 0.35, { ease: E.lin });
    fadeOut(hr, 20.05, 0.3, { ease: E.lin });
    fadeOut(names, 20.1, 0.35, { ease: E.lin });
    s.querySelectorAll('.xi').forEach((x) => fadeOut(x, 19.7, 0.5, { ease: E.lin }));
  }

  /* CẢNH 3 · Lời đầu tiên (19.5 → 28.2s) */
  {
    const s = scene('first', 19.5, 28.2, { z: 2 });
    el('div', 'bg red-flat', null, s);
    const g = el('div', 'abs', { inset: '0' }, s);
    const x = xi(g, 792, 62, 301, 180, '#b01c21', { mask: 'linear-gradient(#000 55%, transparent 100%)' });
    anim(x, [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'translateY(0)' }], 20.3, 0.7);
    const title = fit(g, TX.firstWords.title, { cx: 927, cy: 313, w: 760, cls: 'script', color: '#f7e7e1' });
    wipeX(title, 20.4, 0.7);
    text(g, TX.firstWords.lines, {
      x: 0, y: 493 - 123 / 2, w: 1920, align: 'center', lh: 123, ls: 0.05, color: '#f6e6df', weight: 600,
      fitLine: [0, 1374], start: 21.0, cps: 28,
    });
    fadeOut(g, 27.2, 0.6, { ease: E.lin });
  }

  /* CẢNH 4 · Sau quãng thời gian (27.7 → 34.9s) */
  {
    const s = scene('story', 27.7, 34.9, { z: 4 });
    el('div', 'bg', { background: 'var(--red-story)' }, s);
    xi(s, 0, 200, 1000, 880, 'rgba(255,255,255,.06)');
    /* cô dâu chú rể cùng cỡ với cảnh 2 (950×1010), đáy chạm mép dưới khung; chữ dịch sang phải cho cân */
    const cut = cutoutSlot(s, 'storyCutout', 0, 70, 950, 1010, 'full');
    cut.style.zIndex = 5;
    const ttl = fit(s, TX.story.title, { cx: 1445, cy: 385, w: 640, cls: 'script', color: '#f7e7e1' });
    const body = text(s, TX.story.lines, {
      x: 990, y: 487, w: 910, align: 'left', lh: 74, ls: 0.03, color: '#f6e6df', weight: 600,
      fitLine: [2, 905], start: 28.8, cps: 34,
    });
    fadeIn(s, 27.7, 0.6, { ease: E.lin });
    anim(cut, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'translateY(0)' }], 28.25, 0.6);
    wipeX(ttl, 28.35, 0.7);
    sway(cut, 28.85, 34.9);
    fadeOut(cut, 34.2, 0.5, { ease: E.lin });
    fadeOut(ttl, 34.2, 0.45, { ease: E.lin });
    fadeOut(body, 34.45, 0.4, { ease: E.lin });
  }

  /* CẢNH 5 · Ngày hôm nay (34.4 → 39.9s) */
  {
    const s = scene('today', 34.4, 39.9, { z: 5, cls: 'cream' });
    fadeIn(s, 34.4, 0.5, { ease: E.lin });
    const p1 = photoSlot(s, 'gallery1', 0, 0, 640, 840);
    const p2 = photoSlot(s, 'gallery2', 640, 0, 640, 840);
    const p3 = photoSlot(s, 'gallery3', 1280, 0, 640, 840);
    wipeDown(p1, 34.85, 0.55, E.out);
    fadeIn(p2, 35.4, 0.6, { ease: E.lin });
    fadeIn(p3, 36.1, 0.6, { ease: E.lin });
    const l1 = box(s, 'line', 40, 920, 400, 2);
    const l2 = box(s, 'line', 1480, 920, 408, 2);
    l1.style.transformOrigin = '100% 50%'; l2.style.transformOrigin = '0% 50%';
    anim(l1, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 34.9, 0.5);
    anim(l2, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 34.9, 0.5);
    text(s, TX.today, {
      x: 0, y: 920 - 38, w: 1920, align: 'center', lh: 75, ls: 0.045, color: '#4b2527', weight: 700,
      font: "'Playfair Display',serif", fitLine: [0, 905], start: 35.15, cps: 36,
    });
  }

  /* CẢNH 6 · Finally We (38.9 → 44.2s) */
  {
    const s = scene('finally', 38.9, 44.2, { z: 6 });
    anim(s, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], 38.9, 1.0, { ease: E.io });
    const ph = photoSlot(s, 'finally', 0, 0, 1920, 1080);
    /* đã bỏ hiệu ứng phóng to chậm (scale 1→1.07) để ảnh không bị cắt thêm, thấy nhiều khung cảnh nhất */
    el('div', 'abs', { inset: '0', background: 'linear-gradient(to top,rgba(40,0,0,.35),transparent 35%)', pointerEvents: 'none' }, s);
    const fw = fit(s, TX.finally.script, { cx: 266, cy: 915, w: 430, cls: 'script', color: '#fff' });
    fw.style.textShadow = '0 2px 10px rgba(60,0,0,.35)';
    wipeX(fw, 39.7, 0.7);
    text(s, [TX.finally.small], {
      x: 100, y: 992 - 20, w: 700, align: 'left', lh: 40, fs: 27, ls: 0.2, color: '#fff', weight: 500,
      fitLine: [0, 330], start: 39.9, cps: 22,
    });
  }

  /* CẢNH 7 · Pair (43.3 → 48.5s) */
  {
    const s = scene('pair', 43.3, 48.5, { z: 7, cls: 'cream' });
    fadeIn(s, 43.3, 0.45, { ease: E.lin });
    const a = photoSlot(s, 'pairTall', 75, 75, 778, 960);
    const b = photoSlot(s, 'pairWide', 893, 75, 955, 597);
    wipeDown(a, 43.65, 0.8, E.out);
    wipeDown(b, 43.8, 0.8, E.out);
    text(s, TX.pair, {
      x: 893, y: 795 - 43, w: 955, align: 'center', lh: 85, ls: 0.03, color: '#5f1b1d', weight: 500,
      fitLine: [1, 690], start: 43.7, cps: 22,
    });
  }

  /* CẢNH 8 · Lời tri ân (47.4 → 51.9s) */
  {
    const s = scene('gratitude', 47.4, 51.9, { z: 8, cls: 'cream' });
    fadeIn(s, 47.4, 0.8, { ease: E.lin });
    const ph = photoSlot(s, 'gratitude', 1101, 0, 819, 1080);
    anim(ph, [{ opacity: 0, transform: 'translateX(60px)' }, { opacity: 1, transform: 'translateX(0)' }], 47.7, 0.6);
    const ttl = fit(s, TX.gratitude.title, { cx: 513, cy: 213, w: 493, cls: 'script', color: '#8a1a1e' });
    wipeX(ttl, 47.6, 0.6);
    text(s, TX.gratitude.lines, {
      x: 0, y: 379 - 52, w: 1080, align: 'center', lh: 104, ls: 0.02, color: '#6a1d1f', weight: 500,
      fitLine: [1, 968], start: 47.6, cps: 62,
    });
  }

  /* CẢNH 9 · Lời hứa (51.2 → 58.6s) */
  {
    const s = scene('promise', 51.2, 58.6, { z: 9, cls: 'cream' });
    fadeIn(s, 51.2, 0.5, { ease: E.lin });
    const ph = photoSlot(s, 'promise', 0, 0, 813, 1080);
    anim(ph, [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], 51.25, 0.7);
    text(s, TX.promise, {
      x: 813, y: 240 - 52, w: 1107, align: 'center', lh: 104, ls: 0.02, color: '#6a1d1f', weight: 500,
      fitLine: [1, 813], start: 51.7, cps: 35,
    });
  }

  /* CẢNH 10 · Từ sâu thẳm đáy lòng (58.0 → 65.0s) */
  {
    const s = scene('deep', 58.0, 65.0, { z: 10, cls: 'cream' });
    fadeIn(s, 58.0, 0.6, { ease: E.lin });
    const ph = photoSlot(s, 'thanksPhoto', 0, 0, 853, 1080);
    anim(ph, [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], 58.05, 0.7);
    const ttl = fit(s, TX.deep.title, { cx: 1400, cy: 240, w: 773, cls: 'script', color: '#8a1a1e' });
    wipeX(ttl, 58.2, 0.7);
    const body = text(s, TX.deep.lines, {
      x: 853, y: 395 - 51, w: 1067, align: 'center', lh: 102, ls: 0.02, color: '#6a1d1f', weight: 500,
      fitLine: [2, 760], start: 58.7, cps: 42,
    });
    fadeOut(ttl, 64.25, 0.5, { ease: E.lin });
    fadeOut(body, 64.25, 0.5, { ease: E.lin });
  }

  /* CẢNH 11 · THANK YOU (64.4 → 71.0s) */
  {
    const s = scene('thanks', 64.4, 71.0, { z: 11 });
    el('div', 'bg red-flat', null, s);
    fadeIn(s, 64.4, 0.6, { ease: E.lin });
    const x = xi(s, 792, 40, 301, 190, '#b01c21', { mask: 'linear-gradient(#000 55%, transparent 100%)' });
    anim(x, [{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'translateY(0)' }], 64.7, 0.7);
    // THANK YOU uốn vòng cung (giữa cao, hai đầu thấp, chữ nghiêng theo cung) như trong video
    const TYW = 813, TYCX = 935, TYCY = 292, SAG = 36;
    const probe = fit(s, TX.thankYou.title, { cx: TYCX, cy: TYCY, w: TYW, cls: 'disp', weight: 400, color: '#f6e1d8', ls: 0.01 });
    const tyFs = parseFloat(probe.style.fontSize);
    probe.remove();
    const SVW = 1100, SVH = 300;
    const R = (TYW * TYW / 4 + SAG * SAG) / (2 * SAG);
    const base = SVH / 2 + tyFs * 0.34;                  // baseline tại đỉnh cung
    const x1 = SVW / 2 - TYW / 2, x2 = SVW / 2 + TYW / 2;
    const ty = box(s, 'abs', TYCX - SVW / 2, TYCY - SVH / 2, SVW, SVH);
    ty.innerHTML = `<svg viewBox="0 0 ${SVW} ${SVH}" width="${SVW}" height="${SVH}" style="overflow:visible">
      <defs><path id="tyArc" d="M${x1} ${base + SAG} A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${x2} ${base + SAG}"/></defs>
      <text font-family="'Bodoni Moda','Playfair Display',serif" font-size="${tyFs}" fill="#f6e1d8" letter-spacing="${(tyFs * 0.01).toFixed(2)}">
        <textPath href="#tyArc" startOffset="50%" text-anchor="middle">${TX.thankYou.title}</textPath>
      </text></svg>`;
    wipeX(ty, 64.9, 0.8);
    text(s, TX.thankYou.lines, {
      x: 0, y: 443 - 64, w: 1920, align: 'center', lh: 128, ls: 0.06, color: '#f3e1da', weight: 600,
      fitLine: [1, 1685], start: 64.7, cps: 62,
    });
    text(s, [TX.thankYou.closing], {
      x: 0, y: 955 - 40, w: 1920, align: 'center', lh: 80, ls: 0.08, color: '#f6e6df', weight: 700,
      fitLine: [0, 480], start: 68.55, cps: 30,
    });
  }

  /* CẢNH 12 · LOVE (70.2 → hết) */
  {
    const s = scene('love', 70.2, DURATION + 99, { z: 12, cls: 'cream' });
    fadeIn(s, 70.2, 0.7, { ease: E.lin });
    // Hai tên cùng cỡ chữ, căn đối xứng quanh chữ "and": tên chú rể sát phải (x=620), tên cô dâu sát trái (x=1220)
    const n1 = fit(s, TX.groom.toUpperCase(), { cx: 425, cy: 228, w: 400, cls: 'playfair', weight: 600, color: '#7a1519', ls: 0.02 });
    const n2 = fit(s, TX.bride.toUpperCase(), { cx: 1529, cy: 228, w: 400, cls: 'playfair', weight: 600, color: '#7a1519', ls: 0.02 });
    {
      const fs = Math.min(parseFloat(n1.style.fontSize), parseFloat(n2.style.fontSize), 78);
      [n1, n2].forEach((n) => { n.style.fontSize = fs + 'px'; n.style.top = (228 - fs / 2) + 'px'; });
      n1.style.left = (620 - n1.offsetWidth) + 'px';
      n2.style.left = '1220px';
    }
    const and = fit(s, 'and', { cx: 920, cy: 213, w: 150, cls: 'script', color: '#8a3a3d' });
    const h1 = box(s, 'hair v2', 640, 232, 140, 2), h2 = box(s, 'hair v2', 1060, 232, 140, 2);
    [n1, n2, and, h1, h2].forEach((n, i) => rise(n, 70.35 + i * 0.05, 0.5, 14));

    const LW = 1533, LH = 494;
    const wrap = box(s, 'love-wrap', 192, 293, LW, LH);
    const c2 = document.createElement('canvas').getContext('2d');
    c2.font = '400 200px "Alfa Slab One"';
    const asc = c2.measureText('LOVE').actualBoundingBoxAscent || 144;
    const lfs = 200 * LH / asc;
    const url = imgUrl('love', LW);
    const fill = url
      ? `<image href="${url}" x="0" y="0" width="${LW}" height="${LH}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect width="${LW}" height="${LH}" fill="#00b140"/>
         <text x="${LW / 2}" y="${LH / 2 + 8}" text-anchor="middle" font-family="Lora" font-weight="700" font-size="28" fill="#007a2c">ẢNH NGANG trong chữ LOVE · 1533×494</text>`;
    wrap.innerHTML = `<svg viewBox="0 0 ${LW} ${LH}" width="${LW}" height="${LH}" overflow="visible">
      <defs><clipPath id="loveClip"><text x="0" y="${LH}" font-family="Alfa Slab One" font-size="${lfs}" textLength="${LW}" lengthAdjust="spacingAndGlyphs">LOVE</text></clipPath></defs>
      <g clip-path="url(#loveClip)">${fill}</g></svg>`;
    /* focus (nếu có) cho ảnh trong chữ LOVE: ảnh vẫn phủ kín chữ, chỉ chọn lấy phần nào của ảnh.
       Số thứ hai nhỏ = lấy phần trên ảnh (ảnh như dịch xuống). */
    if (url) {
      const lc = CFG.images.love, fo = (lc && lc.focus ? String(lc.focus) : '50% 50%').match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
      const fx = fo ? clamp(parseFloat(fo[1]) / 100, 0, 1) : 0.5, fy = fo ? clamp(parseFloat(fo[2]) / 100, 0, 1) : 0.5;
      const imgEl = wrap.querySelector('image'), probe = new Image();
      probe.onload = () => {
        const k = Math.max(LW / probe.naturalWidth, LH / probe.naturalHeight);
        const w = probe.naturalWidth * k, h = probe.naturalHeight * k;
        imgEl.setAttribute('preserveAspectRatio', 'none');
        imgEl.setAttribute('width', w); imgEl.setAttribute('height', h);
        imgEl.setAttribute('x', -(w - LW) * fx); imgEl.setAttribute('y', -(h - LH) * fy);
      };
      probe.src = url;
    }
    anim(wrap, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], 70.65, 0.9);

    const cap = fit(s, TX.loveCaption, { cx: 960, cy: 893, w: 1066, cls: 'script', color: '#8a1a1e' });
    const dt = fit(s, TX.date, { cx: 957, cy: 1008, w: 379, cls: 'playfair', weight: 500, color: '#5f1b1d', ls: 0.06 });
    rise(cap, 71.3, 0.6, 18);
    rise(dt, 71.5, 0.6, 18);
  }

  // chuyển cảnh 11 → 12: THANK YOU mờ dần
  {
    const th = scenes.find((x) => x.el.dataset.name === 'thanks');
    fadeOut(th.el, 70.3, 0.7, { ease: E.lin });
  }

  /* render */
  function render(tReal) {
    const t = mapT(tReal);
    for (const a of tracks) a.currentTime = t * 1000;
    for (const sc of scenes) {
      const vis = t >= sc.start - 0.02 && t <= sc.end + 0.02;
      if (vis !== sc.vis) { sc.el.style.display = vis ? '' : 'none'; sc.vis = vis; }
    }
    for (const r of typers) {
      const n = (t - r.start) * r.cps;
      const st = n >= r.chars.length + r.k ? 2 : n <= 0 ? 0 : 1;
      if (st !== 1 && st === r.state) continue;
      r.state = st;
      for (let i = 0; i < r.chars.length; i++) {
        const v = st === 2 ? 1 : st === 0 ? 0 : clamp((n - i) / r.k, 0, 1);
        const q = Math.round(v * 20) / 20;
        if (r.q[i] !== q) { r.q[i] = q; r.chars[i].style.opacity = q; }
      }
    }
  }

  /* player / UI */
  const state = { t: 0, playing: !!CFG.playback.autoplay, last: 0 };
  const params = new URLSearchParams(location.search);
  if (params.has('t')) state.t = clamp(parseFloat(params.get('t')) || 0, 0, TOTAL);
  if (params.get('paused') === '1') state.playing = false;

  const fmt = (v) => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;

  function fitStage() {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${-960 * k}px,${-540 * k}px) scale(${k})`;
  }
  addEventListener('resize', fitStage);
  fitStage();

  const PB = CFG.playback;
  let mStart = PB.musicStart != null ? PB.musicStart : 0;     // giây bắt đầu mở nhạc
  let mFade = PB.musicFadeIn != null ? PB.musicFadeIn : 0;    // nhỏ → to trong bao nhiêu giây
  const mFrom0 = PB.musicFadeFrom != null ? PB.musicFadeFrom : 0;  // âm lượng lúc mới vào (tỉ lệ so với âm lượng chuẩn)
  const mFrom = PB.musicFrom || 0;                            // bỏ qua bao nhiêu giây đầu của bài hát
  const mVol = PB.musicVolume != null ? PB.musicVolume : 1;
  const musicVol = (t) => {
    if (!mFade) return mVol;
    const k = clamp((t - mStart) / mFade, 0, 1);
    return mVol * (mFrom0 + (1 - mFrom0) * k * k * (3 - 2 * k));
  };
  let audio = null;
  if (PB.music) {
    audio = new Audio(PB.music);
    audio.preload = 'auto';
    audio.volume = 0;
  }
  const voices = (CFG.playback.voices || []).map((v) => {
    const a = new Audio(v.src);
    a.preload = 'auto';
    a.volume = v.volume != null ? v.volume : (CFG.playback.voiceVolume != null ? CFG.playback.voiceVolume : 1);
    return { a, at: v.at };
  });
  /* nhạc vào cùng lúc một giọng thoại (musicFadeWithVoice = số thứ tự trong voices, tính từ 0),
     nhỏ → to dần suốt thời lượng của giọng đó, hết giọng thì về âm lượng chuẩn */
  if (PB.musicFadeWithVoice != null && voices[PB.musicFadeWithVoice]) {
    const fv = voices[PB.musicFadeWithVoice];
    mStart = fv.at;
    const setFade = () => { if (isFinite(fv.a.duration) && fv.a.duration > 0) mFade = fv.a.duration; };
    setFade();
    fv.a.addEventListener('loadedmetadata', setFade);
  }
  const stopVoices = () => voices.forEach((v) => v.a.pause());
  const syncVoices = () => {
    stopVoices();
    if (!state.playing) return;
    voices.forEach((v) => {
      const off = state.t - v.at;
      const dur = isFinite(v.a.duration) ? v.a.duration : 3;
      if (off >= 0 && off < dur) {
        try { v.a.currentTime = off; } catch (e) {}
        v.a.play().catch(() => {});
      }
    });
  };
  const syncAudio = () => {
    syncVoices();
    if (!audio) return;
    if (state.playing && state.t >= mStart) {
      try { audio.currentTime = mFrom + state.t - mStart; } catch (e) {}
      audio.volume = musicVol(state.t);
      audio.play().catch(() => {});
    } else audio.pause();
  };

  function setPlaying(p) {
    state.playing = p;
    syncAudio();
  }
  function seekTo(t) {
    state.t = clamp(t, 0, TOTAL);
    render(state.t);
    syncAudio();
  }
  /* không còn thanh điều khiển; giữ vài phím tắt: Space tạm dừng, ← → tua 5s, R chạy lại, F toàn màn hình */
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!state.playing); }
    else if (e.code === 'ArrowRight') seekTo(state.t + 5);
    else if (e.code === 'ArrowLeft') seekTo(state.t - 5);
    else if (e.key === 'r' || e.key === 'R') { seekTo(0); setPlaying(true); }
    else if (e.key === 'f' || e.key === 'F') (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  });
  /* Trình duyệt chỉ cho phát âm thanh sau lần chạm/nhấn đầu tiên → khi đó đồng bộ lại nhạc/giọng theo thời gian hiện tại */
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
    addEventListener(ev, () => { if (state.playing) syncAudio(); }, { once: true, passive: true }));

  function frame(now) {
    const dt = Math.min(0.1, (now - state.last) / 1000);
    state.last = now;
    if (state.playing) {
      const prev = state.t;
      state.t += dt;
      if (audio) {
        if (prev < mStart && state.t >= mStart) { try { audio.currentTime = mFrom; } catch (e) {} audio.volume = musicVol(state.t); audio.play().catch(() => {}); }
        else if (state.t >= mStart) audio.volume = musicVol(state.t);
      }
      voices.forEach((v) => {
        if (prev < v.at && state.t >= v.at) { try { v.a.currentTime = 0; } catch (e) {} v.a.play().catch(() => {}); }
      });
      if (state.t >= TOTAL + (CFG.playback.loopDelay || 0)) {
        if (CFG.playback.loop) { state.t = 0; syncAudio(); }
        else { state.t = TOTAL; setPlaying(false); }
      }
    }
    render(Math.min(state.t, TOTAL));
    requestAnimationFrame(frame);
  }

  window.__seek = (t) => { setPlaying(false); seekTo(t); };
  window.__ready = true;
  document.getElementById('loading').classList.add('done');
  render(state.t);
  requestAnimationFrame((n) => { state.last = n; frame(n); });
  syncAudio();
})();