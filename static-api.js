/* WebSuite versi GitHub Pages.
   Menggantikan server.js: semua permintaan fetch('/api/...') dijawab di browser,
   dengan data disimpan di localStorage. File HTML/JS lain tidak perlu diubah. */
(() => {
  const ADMIN_PASSWORD = 'admin123';          // ganti di sini jika perlu (hanya pengaman tampilan, bukan keamanan sungguhan)
  const SESSION_MS = 7 * 24 * 3600 * 1000, K = { siswa: 'ws-siswa', seq: 'ws-siswa-seq', fav: 'ws-fav', ses: 'ws-sessions' };
  const realFetch = window.fetch.bind(window);
  const ld = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const sv = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const fail = (status, error) => ({ status, body: { error } });
  const attempts = [];

  // ---- Data awal (sama dengan server.js) ----
  if (localStorage.getItem(K.siswa) === null) {
    const rows = [['Ahmad Fauzan','10001','10 IPA','ahmad@email.com',88,'Aktif'], ['Siti Aisyah','10002','10 IPS','siti@email.com',92,'Aktif'],
      ['Budi Santoso','10003','11 IPA','budi@email.com',79,'Aktif'], ['Nadia Putri','10004','11 IPS','nadia@email.com',95,'Aktif'],
      ['Rizky Ramadhan','10005','12 IPA','rizky@email.com',85,'Nonaktif']];
    sv(K.siswa, rows.map((r, i) => ({ id: i + 1, nama: r[0], nis: r[1], kelas: r[2], email: r[3], nilai: r[4], status: r[5] })));
    sv(K.seq, rows.length);
  }
  const T = ['Midnight Dreams','Golden Sky','Lost In Time','Summer Rain','Neon Lights','Ocean Eyes','Falling Stars','Beautiful Day',
    'After The Storm','City Lights','Moon River','Forever Young','Electric Heart','Silent Morning','Dancing Alone','New Beginning'];
  const A = ['Aria Nova','Raka Pratama','Luna Sky','Dimas Wave','Nadia Rose','Alden Music','Mira Senja','Reno Hart'];
  const G = ['Pop','Rock','Jazz','Electronic','Acoustic','Lo-Fi','Classical'];
  const songs = () => { const f = new Set(ld(K.fav, [])); return Array.from({ length: 1000 }, (_, i) => { const n = i + 1;
    return { id: n, title: T[n % T.length] + ' ' + Math.ceil(n / T.length), artist: A[(n * 3) % A.length], genre: G[n % G.length],
      duration: `${2 + n % 4}:${String(n % 60).padStart(2, '0')}`, favorite: f.has(n) ? 1 : 0 }; }); };

  const clean = b => ({ nama: String(b.nama || '').trim(), nis: String(b.nis || '').trim(), kelas: String(b.kelas || '').trim(),
    email: String(b.email || '').trim(), nilai: Math.min(100, Math.max(0, Number(b.nilai) || 0)), status: b.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif' });

  // ---- Excel (SheetJS dimuat saat dibutuhkan) ----
  let xl;
  const xlsx = () => xl || (xl = new Promise((ok, no) => { if (window.XLSX) return ok(window.XLSX);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => ok(window.XLSX); s.onerror = () => { xl = null; no(new Error('Library Excel gagal dimuat. Periksa koneksi internet.')); }; document.head.appendChild(s); }));
  async function xlsxFile(name, head, rows) {
    const X = await xlsx(), ws = X.utils.aoa_to_sheet([head.map(h => h[0]), ...rows.map(r => head.map(h => r[h[1]]))]);
    ws['!cols'] = head.map(() => ({ wch: 22 }));
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, name);
    return { status: 200, blob: new Blob([X.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) };
  }
  const SISWA_COLS = [['Nama','nama'],['NIS','nis'],['Kelas','kelas'],['Email','email'],['Nilai','nilai'],['Status','status']];

  async function importSiswa(buf, mirror = false) {
    let rows;
    try { const X = await xlsx(), wb = X.read(buf, { type: 'array' }); rows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); }
    catch { return fail(400, 'File Excel (.xlsx) tidak valid.'); }
    const head = {}; (rows[0] || []).forEach((c, i) => { head[String(c).trim().toLowerCase()] = i; });
    if (head.nama === undefined || head.nis === undefined) return fail(400, 'Baris pertama harus punya kolom "Nama" dan "NIS".');
    const list = ld(K.siswa, []); let seq = ld(K.seq, 0); const seen = new Set();
    rows.slice(1).forEach(r => {
      const g = k => (head[k] === undefined ? '' : String(r[head[k]] ?? '').trim());
      const d = clean({ nama: g('nama'), nis: g('nis'), kelas: g('kelas'), email: g('email'), nilai: g('nilai'), status: g('status') });
      if (!d.nama || !d.nis) return;
      const ex = list.find(s => s.nis === d.nis);
      if (ex) Object.assign(ex, d); else list.push({ id: ++seq, ...d });
      seen.add(d.nis);
    });
    sv(K.siswa, mirror ? list.filter(s => seen.has(s.nis)) : list); sv(K.seq, seq);
    return { status: 200, body: { imported: seen.size } };
  }

  // ---- Router: meniru endpoint server.js ----
  async function route(method, path, req) {
    const body = (() => { try { return JSON.parse(req.body); } catch { return {}; } })();
    if (method === 'POST' && path === '/login') {
      const now = Date.now(); while (attempts.length && now - attempts[0] > 60000) attempts.shift();
      if (attempts.length >= 5) return fail(429, 'Terlalu banyak percobaan. Coba lagi 1 menit lagi.');
      if (body.username !== 'admin' || body.password !== ADMIN_PASSWORD) { attempts.push(now); return fail(401, 'Username atau password salah.'); }
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
      const ses = ld(K.ses, {}); for (const t in ses) if (ses[t] < now - SESSION_MS) delete ses[t];
      ses[token] = now; sv(K.ses, ses);
      return { status: 200, body: { token, username: 'admin', role: 'Administrator' } };
    }
    const token = (req.headers.Authorization || req.headers.authorization || '').slice(7), ses = ld(K.ses, {});
    if (!ses[token] || ses[token] < Date.now() - SESSION_MS) return fail(401, 'Unauthorized');
    if (method === 'POST' && path === '/logout') { delete ses[token]; sv(K.ses, ses); return { status: 200, body: { ok: true } }; }

    const list = ld(K.siswa, []), m = path.match(/^\/siswa\/(\d+)$/);
    if (path === '/siswa' && method === 'GET') return { status: 200, body: list };
    if (path === '/siswa' && method === 'POST') {
      const d = clean(body); if (!d.nama || !d.nis) return fail(400, 'Nama dan NIS wajib diisi.');
      if (list.some(s => s.nis === d.nis)) return fail(400, 'NIS sudah dipakai.');
      const id = ld(K.seq, 0) + 1; list.push({ id, ...d }); sv(K.siswa, list); sv(K.seq, id);
      return { status: 200, body: { id } };
    }
    if (m && method === 'PUT') {
      const d = clean(body), id = +m[1]; if (!d.nama || !d.nis) return fail(400, 'Nama dan NIS wajib diisi.');
      if (list.some(s => s.nis === d.nis && s.id !== id)) return fail(400, 'NIS sudah dipakai.');
      const s = list.find(x => x.id === id); if (s) { Object.assign(s, d); sv(K.siswa, list); }
      return { status: 200, body: { ok: true } };
    }
    if (m && method === 'DELETE') { sv(K.siswa, list.filter(s => s.id !== +m[1])); return { status: 200, body: { ok: true } }; }
    if (path === '/siswa' && method === 'DELETE') { sv(K.siswa, []); return { status: 200, body: { ok: true } }; }
    if (path === '/siswa/export') return xlsxFile('data-siswa', SISWA_COLS, list).catch(e => fail(500, e.message));
    if (path === '/siswa/import' && method === 'POST') return importSiswa(req.body);
    if (path === '/siswa/open-excel') return openExcel();

    if (path === '/songs') return { status: 200, body: songs() };
    if (path === '/songs/export') return xlsxFile('music-library', [['ID','id'],['Judul','title'],['Artis','artist'],['Genre','genre'],['Durasi','duration'],['Favorit','fav']],
      songs().map(s => ({ ...s, fav: s.favorite ? 'Ya' : 'Tidak' }))).catch(e => fail(500, e.message));
    const f = path.match(/^\/songs\/(\d+)\/favorite$/);
    if (f && method === 'POST') { const id = +f[1], s = new Set(ld(K.fav, [])); s.has(id) ? s.delete(id) : s.add(id); sv(K.fav, [...s]); return { status: 200, body: { ok: true } }; }
    if (path === '/favorites' && method === 'DELETE') { sv(K.fav, []); return { status: 200, body: { ok: true } }; }

    if (path === '/stats') {
      const n = list.length, c = f2 => list.filter(f2).length;
      return { status: 200, body: { total: n, aktif: c(s => s.status === 'Aktif'), nonaktif: c(s => s.status === 'Nonaktif'),
        rata: n ? list.reduce((a, s) => a + s.nilai, 0) / n : 0, excellent: c(s => s.nilai >= 90), good: c(s => s.nilai >= 80 && s.nilai < 90),
        medium: c(s => s.nilai >= 70 && s.nilai < 80), favorites: ld(K.fav, []).length } };
    }
    return fail(404, 'Tidak ditemukan.');
  }

  // ---- Koneksi langsung ke file Excel (File System Access API: Chrome/Edge di komputer) ----
  const XT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', FS = !!window.showOpenFilePicker;
  let H = null, lastM = (ld('ws-xl', {}).m || 0), dirty = !!ld('ws-xl', {}).d, writing = false, fails = 0, deb, perm = true, badge;
  const keep = () => sv('ws-xl', { m: lastM, d: dirty });
  const idb = (op, v) => new Promise((ok, no) => { const r = indexedDB.open('websuite-excel', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onerror = () => no(r.error);
    r.onsuccess = () => { const s = r.result.transaction('h', op === 'get' ? 'readonly' : 'readwrite').objectStore('h'), q = op === 'get' ? s.get('h') : s.put(v, 'h');
      q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }; });
  function show(txt, tip) {
    if (!FS || !document.body || /login\.html$/.test(location.pathname)) return;
    if (!badge) { badge = document.createElement('button'); badge.onclick = reconnect; document.body.appendChild(badge);
      badge.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9999;background:#1f2937;color:#fff;border:0;border-radius:20px;padding:8px 14px;font:13px system-ui;cursor:pointer;box-shadow:0 2px 8px #0004'; }
    badge.textContent = txt; badge.title = tip;
  }
  const status = () => !H ? show('📂 Excel belum tersambung', 'Klik untuk menyambungkan file Excel') : !perm ? show('🔒 Izinkan akses ' + H.name, 'Klik untuk mengizinkan akses ke file')
    : dirty ? show('⏳ Menunggu file Excel ditutup', 'Perubahan ditulis otomatis setelah file ditutup di Excel') : show('✅ Excel: ' + H.name, 'Edit di Excel lalu Save; data web ikut berubah. Klik untuk ganti file.');

  async function writeExcel() {                 // web -> Excel
    if (!H || writing) return; writing = true;
    try {
      const X = await xlsx(), list = ld(K.siswa, []), wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([SISWA_COLS.map(c => c[0]), ...list.map(r => SISWA_COLS.map(c => r[c[1]]))]), 'Data Siswa');
      const w = await H.createWritable(); await w.write(X.write(wb, { type: 'array', bookType: 'xlsx' })); await w.close();
      lastM = (await H.getFile()).lastModified; dirty = false;
    } catch { dirty = true; }                  // file sedang terbuka/terkunci di Excel: dicoba lagi otomatis
    finally { writing = false; keep(); status(); }
  }
  const scheduleWrite = () => { if (!H) return; dirty = true; keep(); clearTimeout(deb); deb = setTimeout(writeExcel, 500); };

  async function poll() {                       // Excel -> web (saat file di-Save)
    if (!H) return;
    try {
      if (await H.queryPermission({ mode: 'readwrite' }) !== 'granted') { if (perm) { perm = false; status(); } return; }
      if (!perm) { perm = true; status(); }
      const f = await H.getFile();
      if (f.lastModified !== lastM && !writing) {
        lastM = f.lastModified;
        const r = f.size ? await importSiswa(await f.arrayBuffer(), true) : { status: 400 };
        if (r.status === 200) { fails = 0; dirty = false; keep(); status(); } else if (++fails < 3) lastM = 0; else fails = 0;
      } else if (dirty && !writing) writeExcel();
    } catch { /* file terkunci atau hilang: coba lagi nanti */ }
  }
  setInterval(poll, 1500);

  async function attach(mode) {
    try {
      const o = { types: [{ description: 'Excel', accept: { [XT]: ['.xlsx'] } }] };
      const h = mode === 'open' ? (await showOpenFilePicker({ ...o, mode: 'readwrite' }))[0] : await showSaveFilePicker({ ...o, suggestedName: 'data-siswa.xlsx' });
      if (await h.requestPermission({ mode: 'readwrite' }) !== 'granted') return false;
      H = h; perm = true; lastM = 0; dirty = false; fails = 0; try { await idb('put', h); } catch {}
      if (mode === 'new') await writeExcel(); else await poll();
      status(); return true;
    } catch { return false; }                   // dibatalkan
  }
  function chooser() {
    return new Promise(ok => {
      const o = document.createElement('div');
      o.style.cssText = 'position:fixed;inset:0;background:#0007;z-index:10000;display:grid;place-items:center';
      o.innerHTML = '<div style="background:#fff;color:#111;border-radius:12px;padding:22px;max-width:360px;font:14px system-ui"><b>Sambungkan ke Excel</b><p>Pilih file .xlsx yang sudah ada, atau buat file baru dari data saat ini. Setelah tersambung: edit di Excel, Save, dan data di web ikut berubah.</p><p style="display:grid;gap:8px"><button data-a="open">Pilih file yang sudah ada</button><button data-a="new">Buat file baru</button><button data-a="no">Batal</button></p></div>';
      o.onclick = async e => { const a = e.target.dataset && e.target.dataset.a; if (!a) return; o.remove(); ok(a === 'no' ? false : await attach(a)); };
      document.body.appendChild(o);
    });
  }
  async function reconnect() {
    if (H && !perm) { try { if (await H.requestPermission({ mode: 'readwrite' }) === 'granted') { perm = true; poll(); } } catch {} status(); } else chooser();
  }
  async function openExcel() {
    if (!FS) return fail(400, 'Browser ini belum mendukung koneksi langsung ke Excel. Pakai Chrome atau Edge di komputer, atau gunakan Import/Export Excel.');
    await chooser(); return { status: 200, body: { ok: true } };
  }
  const initXl = async () => { if (!FS) return; try { H = (await idb('get')) || null; } catch {} await poll(); status(); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', initXl) : initXl();

  window.fetch = async (url, opt = {}) => {
    const u = typeof url === 'string' ? url : url.url, i = u.indexOf('/api/');
    if (i === -1 || /^https?:\/\//.test(u) && !u.startsWith(location.origin)) return realFetch(url, opt);
    const method = (opt.method || 'GET').toUpperCase(), path = u.slice(i + 4).split('?')[0];
    const r = await route(method, path, { body: opt.body, headers: opt.headers || {} });
    if (r.status === 200 && method !== 'GET' && path.startsWith('/siswa') && path !== '/siswa/open-excel') scheduleWrite();
    return r.blob ? new Response(r.blob, { status: r.status }) : new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };
})();
