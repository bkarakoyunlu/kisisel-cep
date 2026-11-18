/* Kişisel Asistan — çekirdek: veri, GitHub eşitleme, hesaplar.
   Arayüzden bağımsızdır; tüm bölümler (ana sayfa, spor, gitar, dil…) bunu kullanır. */
'use strict';

const DOSYALAR = ['hedefler', 'kayitlar', 'finans', 'kisiler', 'plan', 'icerik'];
const SALT_OKUNUR = ['plan', 'icerik'];
const LS = { cfg: 'ka_cfg', data: 'ka_data', dirty: 'ka_dirty', gun: 'ka_gun', son: 'ka_son', ui: 'ka_ui' };
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/* Her hedefin kendi rengi (Apple Activity paleti esinli) */
const RENKLER = {
  spor: '#ff2d6f', gitar: '#ff9500', okuma: '#9cff2e', ingilizce: '#19e6ff', almanca: '#ffd60a',
  sarki: '#bf5af2', hobi: '#0a84ff', lego: '#ff453a'
};
const YEDEK_RENK = ['#ff2d6f', '#9cff2e', '#19e6ff', '#ff9500', '#bf5af2', '#ffd60a', '#0a84ff', '#ff453a', '#64d2ff', '#30d158'];

/* ---------- yardımcılar ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const simdi = () => new Date().toISOString();
const yerelISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 19);
const pad = n => String(n).padStart(2, '0');
const gunStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tl = n => Math.round(+n || 0).toLocaleString('tr-TR') + ' ₺';
const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
function haftaBasi(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function gunEkle(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const canli = arr => (arr || []).filter(x => !x.silindi);
function b64enc(str) { const b = new TextEncoder().encode(str); let s = ''; b.forEach(c => s += String.fromCharCode(c)); return btoa(s); }
function b64dec(b64) { const s = atob(b64.replace(/\n/g, '')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return new TextDecoder().decode(b); }

/* ---------- birleştirme ---------- */
function birlestir(uzak, yerel) {
  if (Array.isArray(uzak) && Array.isArray(yerel)) {
    const m = new Map();
    uzak.forEach(x => x && x.id && m.set(x.id, x));
    yerel.forEach(x => { if (!x || !x.id) return; const u = m.get(x.id); if (!u || (x.guncel || '') >= (u.guncel || '')) m.set(x.id, x); });
    return [...m.values()];
  }
  if (uzak && yerel && typeof uzak === 'object' && typeof yerel === 'object' && !Array.isArray(uzak)) {
    const o = { ...uzak };
    for (const k of Object.keys(yerel)) o[k] = (k in uzak) ? birlestir(uzak[k], yerel[k]) : yerel[k];
    return o;
  }
  return yerel !== undefined ? yerel : uzak;
}

/* ---------- veri ---------- */
const VARSAYILAN = {
  hedefler: [], kayitlar: [], kisiler: [], plan: {}, icerik: {},
  finans: { maas: { tutar: 0, gun: 1 }, kategoriler: ['Kahve', 'Yemek', 'Market', 'Ulaşım', 'Eğlence', 'Müzik', 'Hobi', 'Giyim', 'Fatura', 'Diğer'], harcamalar: [], abonelikler: [], giderler: [], borclar: [], dilekler: [] }
};
let D = oku(LS.data, null) || JSON.parse(JSON.stringify(VARSAYILAN));
for (const k of DOSYALAR) if (D[k] === undefined) D[k] = JSON.parse(JSON.stringify(VARSAYILAN[k]));
let KIRLI = oku(LS.dirty, {});
let CFG = oku(LS.cfg, { owner: 'bkarakoyunlu', repo: 'kisisel-asistan', token: '' });
let SYNC_SURUYOR = false, SON_SYNC = oku(LS.son, null), SYNC_HATA = '';
const Olay = new EventTarget();   // 'veri' olayı: veri değişince arayüz yeniden çizer

function kaydet(dosya) {
  KIRLI[dosya] = true; yaz(LS.dirty, KIRLI); yaz(LS.data, D);
  Olay.dispatchEvent(new Event('veri'));
  clearTimeout(kaydet.t); kaydet.t = setTimeout(() => sync(), 1500);
}

/* ---------- GitHub eşitleme ---------- */
function gh(yol, ops = {}) {
  return fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${yol}`, {
    ...ops, cache: 'no-store',
    headers: { Authorization: 'Bearer ' + CFG.token, Accept: 'application/vnd.github+json', ...(ops.headers || {}) }
  });
}
async function dosyaCek(ad) {
  const r = await gh(`data/${ad}.json?t=${Date.now()}`);
  if (r.status === 404) return { veri: undefined, sha: null };
  if (!r.ok) throw new Error(`${ad}: ${r.status}`);
  const j = await r.json();
  return { veri: JSON.parse(b64dec(j.content) || 'null'), sha: j.sha };
}
async function dosyaYaz(ad, veri, sha) {
  const body = { message: `telefon: ${ad} güncellendi`, content: b64enc(JSON.stringify(veri, null, 1)) };
  if (sha) body.sha = sha;
  const r = await gh(`data/${ad}.json`, { method: 'PUT', body: JSON.stringify(body) });
  if (!r.ok) { const e = new Error(`${ad} yazılamadı: ${r.status}`); e.status = r.status; throw e; }
}
async function sync(elle) {
  if (!CFG.token || SYNC_SURUYOR || !navigator.onLine) { Olay.dispatchEvent(new Event('durum')); return; }
  SYNC_SURUYOR = true; SYNC_HATA = ''; Olay.dispatchEvent(new Event('durum'));
  try {
    for (const ad of DOSYALAR) {
      for (let deneme = 0; deneme < 3; deneme++) {
        const { veri, sha } = await dosyaCek(ad);
        if (KIRLI[ad] && !SALT_OKUNUR.includes(ad)) {
          const birlesik = veri === undefined ? D[ad] : birlestir(veri, D[ad]);
          try { await dosyaYaz(ad, birlesik, sha); D[ad] = birlesik; delete KIRLI[ad]; break; }
          catch (e) { if (e.status === 409 || e.status === 422) continue; throw e; }
        } else { if (veri !== undefined) D[ad] = veri; break; }
      }
    }
    SON_SYNC = simdi(); yaz(LS.son, SON_SYNC); yaz(LS.data, D); yaz(LS.dirty, KIRLI);
    if (elle) toast('Eşitlendi ✓');
  } catch (e) { SYNC_HATA = e.message; if (elle) toast('Eşitleme hatası: ' + e.message); }
  SYNC_SURUYOR = false;
  Olay.dispatchEvent(new Event('durum')); Olay.dispatchEvent(new Event('veri'));
}

/* ---------- hesaplar ---------- */
const hedefler = () => canli(D.hedefler).filter(h => h.aktif !== false);
const hedefBul = id => (D.hedefler || []).find(h => h.id === id);
function renk(h) { if (!h) return '#888'; if (h.renk) return h.renk; if (RENKLER[h.id]) return RENKLER[h.id]; const i = (D.hedefler || []).indexOf(h); return YEDEK_RENK[(i < 0 ? 0 : i) % YEDEK_RENK.length]; }
const seanslar = () => canli(D.kayitlar).filter(k => k.tip === 'seans' && k.tarih);
function aralikSeans(bas, gunSayisi, hid) {
  const b = gunStr(bas), s = gunStr(gunEkle(bas, gunSayisi));
  return seanslar().filter(k => (!hid || k.hedefId === hid) && k.tarih.slice(0, 10) >= b && k.tarih.slice(0, 10) < s);
}
const haftaSeans = (hid, bas = haftaBasi()) => aralikSeans(bas, 7, hid);
function haftaOran(h) { return h.haftalikSeans ? haftaSeans(h.id).length / h.haftalikSeans : 0; }
function gunDakika() { const m = {}; seanslar().forEach(k => { const g = k.tarih.slice(0, 10); m[g] = (m[g] || 0) + (+k.dk || 0); }); return m; }
function seri() {
  const gunler = new Set(seanslar().map(k => k.tarih.slice(0, 10)));
  let n = 0, d = new Date(); if (!gunler.has(gunStr(d))) d = gunEkle(d, -1);
  while (gunler.has(gunStr(d))) { n++; d = gunEkle(d, -1); }
  return n;
}
function enUzunSeri() {
  const g = [...new Set(seanslar().map(k => k.tarih.slice(0, 10)))].sort(); let best = 0, cur = 0, prev = null;
  for (const s of g) { const d = new Date(s + 'T12:00:00'); cur = prev && Math.round((d - prev) / 864e5) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }
  return best;
}
function yaklasanGunler(gunIcinde = 30) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0); const out = [];
  for (const k of canli(D.kisiler)) for (const o of (k.ozelGunler || []).concat(k.dogumGunu ? [{ ad: 'Doğum günü', tarih: k.dogumGunu }] : [])) {
    if (!o.tarih) continue;
    const [ay, gun] = o.tarih.slice(-5).split('-').map(Number);
    let d = new Date(bugun.getFullYear(), ay - 1, gun); if (d < bugun) d = new Date(bugun.getFullYear() + 1, ay - 1, gun);
    const kalan = Math.round((d - bugun) / 864e5);
    if (kalan <= gunIcinde) out.push({ kisi: k, ad: o.ad, tarih: d, kalan });
  }
  return out.sort((a, b) => a.kalan - b.kalan);
}
function paraOzet() {
  const f = D.finans || {}; const ay = gunStr().slice(0, 7);
  const harc = canli(f.harcamalar).filter(h => (h.tarih || '').slice(0, 7) === ay);
  const harcama = harc.reduce((s, x) => s + (+x.tutar || 0), 0);
  const sabit = canli(f.abonelikler).concat(canli(f.giderler)).reduce((s, x) => s + (+x.tutar || 0), 0) + canli(f.borclar).reduce((s, x) => s + (+x.taksit || 0), 0);
  const maas = +(f.maas && f.maas.tutar) || 0;
  const kat = {}; harc.forEach(x => kat[x.kategori || 'Diğer'] = (kat[x.kategori || 'Diğer'] || 0) + (+x.tutar || 0));
  return { maas, harcama, sabit, kalan: maas - harcama - sabit, kat, son: harc.sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''))[0] };
}
function kapasite(t = gunStr()) { const g = oku(LS.gun, {})[t]; return (g && g.kapasite) || 'normal'; }
function bugunPlani() {
  const kalanGun = 7 - ((new Date().getDay() + 6) % 7); const bs = gunStr();
  const plan = D.plan && D.plan.gunler && D.plan.gunler[bs];
  const yapildi = new Set(seanslar().filter(k => k.tarih.slice(0, 10) === bs).map(k => k.hedefId));
  const l = hedefler().filter(h => h.haftalikSeans > 0).map(h => {
    const yapilan = haftaSeans(h.id).length, kalan = Math.max(0, h.haftalikSeans - yapilan);
    const pc = plan && plan.find(p => p.hedefId === h.id);
    return { h, yapilan, kalan, puan: kalan / kalanGun + (pc ? .5 : 0), dk: (pc && pc.dk) || h.seansDk || 20, neden: pc && pc.neden };
  }).filter(x => x.kalan > 0 && !yapildi.has(x.h.id)).sort((a, b) => b.puan - a.puan);
  return { liste: l.slice(0, { yogun: 1, normal: 3, bos: 6 }[kapasite()] || 3), yapildi };
}

/* ---------- ortak eylemler ---------- */
function seansEkle(hid, dk, not = '', tarih = yerelISO(), kaynak = 'telefon') {
  D.kayitlar.push({ id: uid(), tip: 'seans', hedefId: hid, dk: +dk || 0, not, tarih, kaynak, guncel: simdi() }); kaydet('kayitlar');
}
function harcamaEkle(tutar, kategori, not = '', odeme = 'Kredi kartı') {
  (D.finans.harcamalar = D.finans.harcamalar || []).push({ id: uid(), tutar, kategori, not, odeme, tarih: yerelISO(), guncel: simdi() }); kaydet('finans');
}
function sil(yol, id) {
  const [dosya, alan] = yol.split('.'); const arr = alan ? D[dosya][alan] : D[dosya];
  const o = arr.find(x => x.id === id); if (!o) return; o.silindi = true; o.guncel = simdi(); kaydet(dosya);
}
function toast(m) { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
