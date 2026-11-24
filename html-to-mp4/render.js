#!/usr/bin/env node
/* ============================================================================
   render.js  —  Xuất MỘT trang web chạy theo thời gian (slideshow/animation) thành file MP4.

   Cách hoạt động: mở trang bằng Chromium (Playwright), TUA đến từng thời điểm t = i/fps,
   chụp từng khung hình, đẩy vào ffmpeg; âm thanh được trộn riêng bằng ffmpeg rồi ghép vào.
   => Video luôn đúng fps, không giật dù máy chậm (khác với quay màn hình).

   Cần: Node 18+, ffmpeg (>= 4.4) có trong PATH, và:  npm i  &&  npx playwright install chromium

   Dùng:   node render.js <thư-mục-project> [tuỳ chọn]
   Ví dụ:  node render.js ../wedding-slide -o wedding.mp4
           node render.js ../wedding-slide --range 30-45 -o test.mp4      (render thử 15 giây)
   Xem đầy đủ tuỳ chọn:  node render.js --help
   ============================================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');

/* ---------- tham số ---------- */
const HELP = `
node render.js <thư-mục-project> [tuỳ chọn]

  -o, --out <file>        file xuất ra                          (mặc định: output.mp4)
  --page <file>           trang cần render, tính từ thư mục project   (mặc định: index.html)
  --fps <n>               khung hình/giây                       (mặc định: 30)
  --width <px> --height <px>   kích thước video                 (mặc định: 1920 1080)
  --scale <n>             devicePixelRatio (2 = nét hơn, video to gấp đôi)   (mặc định: 1)
  --duration <giây>       ép thời lượng (mặc định lấy từ trang: window.__renderInfo().duration)
  --tail <giây>           giữ thêm khung cuối bấy nhiêu giây    (mặc định: 3)
  --range <a-b>           chỉ render đoạn từ giây a đến b (để xem thử), vd --range 30-45
  --workers <n>           số tab chụp song song                 (mặc định: tự chọn, tối đa 4)
  --mode <auto|seek|anim|clock>
        auto  : có window.__seek(t) thì dùng 'seek', không thì 'anim'
        seek  : trang tự khai báo window.__seek(t)  (chính xác nhất)
        anim  : tua mọi CSS animation / Web Animations bằng document.getAnimations()
        clock : giả lập đồng hồ trình duyệt (setTimeout/requestAnimationFrame/Date) rồi chạy từng bước
  --audio "<file>@<giây bắt đầu>[,vol=0.8][,from=0]"   thêm âm thanh (dùng được nhiều lần)
  --no-audio              không lấy âm thanh khai báo trong trang
  --png                   chụp PNG (nét hơn nhưng chậm hơn; mặc định JPEG chất lượng 95)
  --crf <n>               chất lượng H.264, nhỏ = đẹp hơn        (mặc định: 18)
  --preset <tên>          preset x264: ultrafast…veryslow       (mặc định: medium)
  --ready-timeout <giây>  tối đa chờ trang tải xong             (mặc định: 60)
  --keep-open             hiện cửa sổ trình duyệt (gỡ lỗi)
  --ffmpeg <đường dẫn>    chỉ định ffmpeg
  -h, --help

Trang có thể khai báo (tuỳ chọn):
  window.__ready = true                     báo đã tải xong
  window.__seek(t)                          tua đến giây t (đồng bộ)
  window.__renderInfo() -> { duration, audio:[{src,start,volume,from,fadeIn,fadeFrom,fadeFromEntry}] }
`;
function parseArgs(argv) {
  const o = { root: null, out: 'output.mp4', page: 'index.html', fps: 30, width: 1920, height: 1080, scale: 1,
    duration: null, tail: 3, range: null, workers: null, mode: 'auto', audio: [], noAudio: false, png: false,
    crf: 18, preset: 'medium', readyTimeout: 60, keepOpen: false, ffmpeg: 'ffmpeg' };
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const k = a[i], nx = () => { if (i + 1 >= a.length) die(`Thiếu giá trị cho ${k}`); return a[++i]; };
    switch (k) {
      case '-h': case '--help': console.log(HELP); process.exit(0);
      case '-o': case '--out': o.out = nx(); break;
      case '--page': o.page = nx(); break;
      case '--fps': o.fps = +nx(); break;
      case '--width': o.width = +nx(); break;
      case '--height': o.height = +nx(); break;
      case '--scale': o.scale = +nx(); break;
      case '--duration': o.duration = +nx(); break;
      case '--tail': o.tail = +nx(); break;
      case '--range': { const m = nx().match(/^([\d.]+)-([\d.]+)$/); if (!m) die('--range dạng a-b, vd 30-45'); o.range = [+m[1], +m[2]]; break; }
      case '--workers': o.workers = +nx(); break;
      case '--mode': o.mode = nx(); break;
      case '--audio': o.audio.push(nx()); break;
      case '--no-audio': o.noAudio = true; break;
      case '--png': o.png = true; break;
      case '--crf': o.crf = +nx(); break;
      case '--preset': o.preset = nx(); break;
      case '--ready-timeout': o.readyTimeout = +nx(); break;
      case '--keep-open': o.keepOpen = true; break;
      case '--ffmpeg': o.ffmpeg = nx(); break;
      default:
        if (k.startsWith('-')) die(`Không hiểu tuỳ chọn ${k}  (xem --help)`);
        if (o.root) die('Chỉ nhận một thư mục project'); o.root = k;
    }
  }
  if (!o.root) { console.log(HELP); process.exit(1); }
  return o;
}
function die(m) { console.error('✗ ' + m); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmtT = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ---------- máy chủ tĩnh (để tải font/ảnh/âm thanh như khi deploy) ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
function serve(root) {
  const srv = http.createServer((req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let f = path.normalize(path.join(root, p));
      if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

/* ---------- âm thanh ---------- */
function probeDuration(ff, file) {
  const probe = ff.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  try {
    return parseFloat(execFileSync(probe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
  } catch (e) { return 0; }
}
function resolveAudio(list, root, ff) {
  const out = [];
  list.forEach((a) => {
    if (!a.src) return;
    if (/^https?:\/\//.test(a.src)) { console.warn('! Bỏ qua âm thanh từ URL (hãy tải về thư mục project):', a.src); return; }
    const file = path.resolve(root, a.src.split('?')[0].replace(/^\//, ''));
    if (!fs.existsSync(file)) { console.warn('! Không thấy file âm thanh, bỏ qua:', a.src); return; }
    out.push({ ...a, file, _idx: out.length });
  });
  // fadeFromEntry trỏ tới chỉ số trong danh sách GỐC → ánh xạ sang file đã tìm thấy
  return out;
}
function buildAudio(entriesRaw, root, o, durationOut, rangeStart) {
  const entries = [];
  entriesRaw.forEach((a, i) => { const r = resolveAudio([a], root, o.ffmpeg)[0]; entries.push(r ? { ...r, origIdx: i } : null); });
  const live = entries.filter(Boolean);
  if (!live.length) return null;
  const inputs = [], filters = [];
  live.forEach((a, k) => {
    let fadeIn = a.fadeIn || 0;
    if (a.fadeFromEntry != null) { const t = entries[a.fadeFromEntry]; if (t) fadeIn = probeDuration(o.ffmpeg, t.file); }
    const start = (a.start || 0) - rangeStart;                      // so với đầu đoạn render
    const from = a.from || 0;
    let skip = from, delay = start;
    if (delay < 0) { skip += -delay; delay = 0; }                   // đoạn render bắt đầu giữa chừng
    inputs.push('-ss', String(skip), '-i', a.file);
    const vol = a.volume != null ? a.volume : 1;
    let v;
    if (fadeIn > 0) {
      const S = (a.start || 0) - rangeStart, f0 = a.fadeFrom || 0;
      const k01 = `clip((t-${S.toFixed(3)})/${fadeIn.toFixed(3)},0,1)`;
      v = `volume='${vol}*(${f0}+(1-${f0})*${k01}*${k01}*(3-2*${k01}))':eval=frame`;   // smoothstep như trong trang
    } else v = `volume=${vol}`;
    const ms = Math.round(delay * 1000);
    filters.push(`[${k + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms},${v}[a${k}]`);
  });
  const mix = live.length > 1
    ? `${live.map((_, k) => `[a${k}]`).join('')}amix=inputs=${live.length}:normalize=0:dropout_transition=0,alimiter=limit=0.97[aout]`
    : `[a0]alimiter=limit=0.97[aout]`;
  filters.push(mix);
  return { inputs, filter: filters.join(';\n'), count: live.length };
}

/* ---------- chính ---------- */
(async () => {
  const o = parseArgs(process.argv);
  const root = path.resolve(o.root);
  if (!fs.existsSync(path.join(root, o.page))) die(`Không thấy ${o.page} trong ${root}`);
  try { execFileSync(o.ffmpeg, ['-version'], { stdio: 'ignore' }); } catch (e) { die('Không chạy được ffmpeg. Cài ffmpeg (>=4.4) hoặc dùng --ffmpeg <đường dẫn>'); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { die('Chưa cài playwright. Chạy:  npm i  &&  npx playwright install chromium'); }

  const srv = await serve(root);
  const url = `http://127.0.0.1:${srv.address().port}/${o.page.replace(/^\//, '')}`;
  const workers = Math.max(1, o.mode === 'clock' ? 1 : (o.workers || Math.min(4, Math.max(1, Math.floor(os.cpus().length / 2)))));
  const browser = await chromium.launch({ headless: !o.keepOpen, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--force-color-profile=srgb'] });

  async function openPage() {
    const ctx = await browser.newContext({ viewport: { width: o.width, height: o.height }, deviceScaleFactor: o.scale });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.warn('! Lỗi JS trong trang:', e.message));
    if (o.mode === 'clock') await page.clock.install({ time: 0 });
    await page.goto(url, { waitUntil: 'load' });
    // chờ font, ảnh, và cờ __ready (nếu có)
    await page.waitForFunction(() => document.fonts ? document.fonts.status === 'loaded' : true, null, { timeout: o.readyTimeout * 1000 }).catch(() => {});
    await page.waitForFunction(() => (window.__ready === undefined || window.__ready === true), null, { timeout: o.readyTimeout * 1000 })
      .catch(() => console.warn('! Hết thời gian chờ window.__ready, vẫn tiếp tục'));
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode ? i.decode().catch(() => {}) : 0)));
    await page.waitForTimeout(400);
    return page;
  }

  console.log('→ Mở trang:', url);
  const first = await openPage();
  let mode = o.mode;
  const hasSeek = await first.evaluate(() => typeof window.__seek === 'function');
  if (mode === 'auto') mode = hasSeek ? 'seek' : 'anim';
  if (mode === 'seek' && !hasSeek) die('Trang không có window.__seek(t). Dùng --mode anim hoặc clock.');
  const info = await first.evaluate(() => (typeof window.__renderInfo === 'function' ? window.__renderInfo() : null)).catch(() => null);

  let duration = o.duration != null ? o.duration : (info && info.duration);
  if (!duration) die('Không biết thời lượng. Dùng --duration <giây> hoặc để trang khai báo window.__renderInfo().duration');
  duration += o.tail;
  let t0 = 0, t1 = duration;
  if (o.range) { t0 = Math.max(0, o.range[0]); t1 = Math.min(duration, o.range[1]); if (t1 <= t0) die('--range không hợp lệ'); }
  const f0 = Math.round(t0 * o.fps), f1 = Math.round(t1 * o.fps), nFrames = f1 - f0;

  // âm thanh
  let rawAudio = [];
  if (!o.noAudio && info && info.audio) rawAudio = info.audio.slice();
  o.audio.forEach((s) => {
    const m = s.match(/^(.*?)@([\d.]+)((?:,[a-z]+=[\d.]+)*)$/);
    if (!m) die(`--audio sai cú pháp: ${s}   (đúng: file@giây[,vol=0.8][,from=0])`);
    const e = { src: m[1], start: +m[2] };
    m[3].split(',').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); if (k === 'vol') e.volume = +v; else if (k === 'from') e.from = +v; else if (k === 'fade') e.fadeIn = +v; });
    rawAudio.push(e);
  });
  const aud = buildAudio(rawAudio, root, o, t1 - t0, t0);

  console.log(`→ Chế độ: ${mode} · ${o.width}x${o.height}@${o.fps}fps · ${nFrames} khung (${fmtT(t0)} → ${fmtT(t1)}) · ${workers} tab · âm thanh: ${aud ? aud.count + ' nguồn' : 'không'}`);

  // ffmpeg
  const outFile = path.resolve(o.out);
  const outW = Math.round(o.width * o.scale), outH = Math.round(o.height * o.scale);
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(o.fps), '-f', 'image2pipe', '-c:v', o.png ? 'png' : 'mjpeg', '-i', '-'];
  let filterFile = null;
  if (aud) {
    args.push(...aud.inputs);
    filterFile = path.join(os.tmpdir(), `render-audio-${process.pid}.txt`);
    fs.writeFileSync(filterFile, aud.filter);
    args.push('-filter_complex_script', filterFile, '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '320k');
  }
  args.push('-vf', `scale=${outW & ~1}:${outH & ~1}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', o.preset, '-crf', String(o.crf),
    '-r', String(o.fps), '-movflags', '+faststart', '-frames:v', String(nFrames), '-t', String(t1 - t0), outFile);
  const ff = spawn(o.ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  let ffDone = new Promise((res) => ff.on('close', res));
  ff.stdin.on('error', () => {});

  // chụp khung
  const pages = [first];
  for (let i = 1; i < workers; i++) pages.push(await openPage());
  const shotOpts = o.png ? { type: 'png' } : { type: 'jpeg', quality: 95 };
  const setTime = {
    seek: (p, t) => p.evaluate((t) => { window.__seek(t); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t),
    anim: (p, t) => p.evaluate((t) => { document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t * 1000; }); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t),
  };
  let nextIdx = f0, written = f0, failed = null;
  const done = new Map();
  const tStart = Date.now();
  async function worker(page) {
    try {
      if (mode === 'clock') {
        // chạy đồng hồ giả từ 0 đến t0 rồi mỗi khung tiến 1/fps
        await page.clock.runFor(Math.round(t0 * 1000));
        for (let i = f0; i < f1; i++) {
          await page.clock.runFor(Math.round(1000 / o.fps));
          done.set(i, await page.screenshot(shotOpts)); nextIdx = i + 1;
          while (i - written > 8 && !failed) await sleep(5);
        }
        return;
      }
      while (!failed) {
        const i = nextIdx++;
        if (i >= f1) break;
        while (i - written > workers * 6 && !failed) await sleep(5);       // giới hạn bộ nhớ
        await setTime[mode](page, i / o.fps);
        done.set(i, await page.screenshot(shotOpts));
      }
    } catch (e) { failed = e; }
  }
  const jobs = pages.map(worker);
  let lastLog = 0;
  while (written < f1 && !failed) {
    if (done.has(written)) {
      const buf = done.get(written); done.delete(written);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      written++;
      const now = Date.now();
      if (now - lastLog > 1000 || written === f1) {
        lastLog = now;
        const n = written - f0, el = (now - tStart) / 1000, eta = el / n * (nFrames - n);
        process.stdout.write(`\r  ${n}/${nFrames} khung (${(100 * n / nFrames).toFixed(1)}%) · đã chạy ${fmtT(el)} · còn ~${fmtT(eta)}   `);
      }
    } else await sleep(3);
  }
  process.stdout.write('\n');
  if (failed) { ff.kill('SIGKILL'); await browser.close(); srv.close(); die('Lỗi khi chụp khung: ' + failed.message); }
  await Promise.all(jobs);
  ff.stdin.end();
  const code = await ffDone;
  await browser.close(); srv.close();
  if (filterFile) fs.rmSync(filterFile, { force: true });
  if (code !== 0) die('ffmpeg báo lỗi (mã ' + code + ')');
  const mb = (fs.statSync(outFile).size / 1048576).toFixed(1);
  console.log(`✓ Xong: ${outFile}  (${mb} MB, ${fmtT((Date.now() - tStart) / 1000)})`);
})().catch((e) => die(e && e.stack || String(e)));