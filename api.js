const API = {
  token: () => (JSON.parse(localStorage.getItem('websuite-session') || 'null') || {}).token,
  async req(path, opt = {}) {
    const headers = { Authorization: 'Bearer ' + API.token(), ...(opt.json ? { 'Content-Type': 'application/json' } : {}) };
    const r = await fetch('/api' + path, { method: opt.method, headers, body: opt.json ? JSON.stringify(opt.json) : opt.body });
    if (r.status === 401) { localStorage.removeItem('websuite-session'); location.href = 'login.html'; throw new Error('Sesi berakhir'); }
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Terjadi kesalahan');
    return r;
  },
  async json(path, opt) { return (await API.req(path, opt)).json(); },
  async download(path, name) {
    const b = await (await API.req(path)).blob(), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }
};
