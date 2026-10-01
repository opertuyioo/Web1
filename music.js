const $ = id => document.getElementById(id);
let songs = [], filtered = [], current = -1, playing = false, timer, ctx, osc, gain, progress = 0;

async function init() { songs = await API.json('/songs'); renderSongs(); }

function renderSongs() {
  const q = $('search').value.toLowerCase(), g = $('genre').value;
  filtered = songs.filter(s => (!q || (s.title + ' ' + s.artist).toLowerCase().includes(q)) && (!g || s.genre === g));
  $('counter').textContent = filtered.length.toLocaleString('id-ID') + ' lagu';
  $('songList').innerHTML = filtered.slice(0, 50).map(s => `<div class="song">
    <div class="cover">${['🎵','🎧','🎸','🎹','🎷'][s.id % 5]}</div>
    <div><div class="song-title">${s.title}</div><div class="song-artist">${s.artist}</div></div>
    <div class="song-genre">${s.genre}</div><div class="song-duration">${s.duration}</div>
    <div class="song-actions">
      <button class="like ${s.favorite ? 'active' : ''}" onclick="favorite(${s.id})">${s.favorite ? '♥' : '♡'}</button>
      <button class="play-btn" onclick="playSong(${s.id})">▶</button></div></div>`).join('');
}

async function favorite(id) {
  const s = songs.find(x => x.id === id);
  s.favorite = s.favorite ? 0 : 1; renderSongs();
  try { await API.req(`/songs/${id}/favorite`, { method: 'POST' }); }
  catch (e) { s.favorite = s.favorite ? 0 : 1; renderSongs(); alert(e.message); }
}

function stopAudio() { try { osc && osc.stop(); } catch {} osc = null; clearInterval(timer); }

function playSong(id) {
  current = songs.findIndex(s => s.id === id);
  const s = songs[current];
  $('nowTitle').textContent = s.title; $('nowArtist').textContent = `${s.artist} • ${s.genre}`;
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  stopAudio();
  osc = ctx.createOscillator(); gain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = 220 + (s.id % 12) * 25; gain.gain.value = .06;
  osc.connect(gain); gain.connect(ctx.destination); osc.start();
  playing = true; $('mainPlay').textContent = '❚❚'; startProgress();
}

function togglePlay() {
  if (current === -1) return playSong(songs[0].id);
  if (playing) { playing = false; stopAudio(); $('mainPlay').textContent = '▶'; }
  else playSong(songs[current].id);
}
function next() { playSong(songs[(current + 1) % songs.length].id); }
function previous() { playSong(songs[(current - 1 + songs.length) % songs.length].id); }
function shuffle() { playSong(songs[Math.floor(Math.random() * songs.length)].id); }

function startProgress() {
  clearInterval(timer); progress = 0;
  timer = setInterval(() => {
    $('progress').style.width = ++progress + '%';
    if (progress >= 100) { clearInterval(timer); next(); }
  }, 500);
}
function seek(e) {
  const r = e.currentTarget.getBoundingClientRect();
  progress = (e.clientX - r.left) / r.width * 100; $('progress').style.width = progress + '%';
}
function setVolume(v) { if (gain) gain.gain.value = Number(v) * .12; }
init();
