/* Kişisel Asistan — telefon sitesi (PWA)
   Veriler özel GitHub reposunda (data/*.json) durur; bu site sadece arayüzdür.
   Çevrimdışı çalışır: değişiklikler telefonda tutulur, internet varken repoya yazılır. */
'use strict';

const DOSYALAR = ['hedefler', 'kayitlar', 'finans', 'kisiler', 'plan', 'icerik'];
const SALT_OKUNUR = ['plan', 'icerik'];           // PC beyni yazar, telefon sadece okur
const LS = { cfg: 'ka_cfg', data: 'ka_data', dirty: 'ka_dirty', gun: 'ka_gun' };
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/* ---------- yardımcılar ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const simdi = () => new Date().toISOString();
const yerelISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 19); // yerel saat, Z'siz
const pad = n => String(n).padStart(2, '0');
const gunStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tl = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('tr-TR') + ' ₺';
const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
function haftaBasi(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); const g = (x.getDay() + 6) % 7; x.setDate(x.getDate() - g); return x; }
function gunEkle(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const canli = arr => (arr || []).filter(x => !x.silindi);

function b64enc(str) { const b = new TextEncoder().encode(str); let s = ''; b.forEach(c => s += String.fromCharCode(c)); return btoa(s); }
function b64dec(b64) { const s = atob(b64.replace(/\n/g, '')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return new TextDecoder().decode(b); }

/* ---------- birleştirme: id'li listeler 'guncel' zamanına göre, nesneler alan alan ---------- */
function birlestir(uzak, yerel) {
  if (Array.isArray(uzak) && Array.isArray(yerel)) {
    const m = new Map();
    uzak.forEach(x => x && x.id ? m.set(x.id, x) : null);
    yerel.forEach(x => {
      if (!x || !x.id) return;
      const u = m.get(x.id);
      if (!u || (x.guncel || '') >= (u.guncel || '')) m.set(x.id, x);
    });
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
let SEKME = 'bugun';
let SHA = {};

function kaydet(dosya) { KIRLI[dosya] = true; yaz(LS.dirty, KIRLI); yaz(LS.data, D); durum(); clearTimeout(kaydet.t); kaydet.t = setTimeout(() => App.sync(), 1500); }

/* ---------- GitHub eşitleme ---------- */
async function gh(yol, ops = {}) {
  const r = await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${yol}`, {
    ...ops, cache: 'no-store',
    headers: { Authorization: 'Bearer ' + CFG.token, Accept: 'application/vnd.github+json', ...(ops.headers || {}) }
  });
  return r;
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
  return (await r.json()).content.sha;
}
let SYNC_SURUYOR = false, SON_SYNC = oku('ka_son', null), SYNC_HATA = '';
async function sync(elle) {
  if (!CFG.token) { durum(); if (elle) App.ayarlar(); return; }
  if (SYNC_SURUYOR || !navigator.onLine) { durum(); return; }
  SYNC_SURUYOR = true; SYNC_HATA = ''; durum();
  try {
    for (const ad of DOSYALAR) {
      for (let deneme = 0; deneme < 3; deneme++) {
        const { veri, sha } = await dosyaCek(ad);
        if (KIRLI[ad] && !SALT_OKUNUR.includes(ad)) {
          const birlesik = veri === undefined ? D[ad] : birlestir(veri, D[ad]);
          try { SHA[ad] = await dosyaYaz(ad, birlesik, sha); D[ad] = birlesik; delete KIRLI[ad]; break; }
          catch (e) { if (e.status === 409 || e.status === 422) continue; throw e; }
        } else { if (veri !== undefined) D[ad] = veri; break; }
      }
    }
    SON_SYNC = simdi(); yaz('ka_son', SON_SYNC);
    yaz(LS.data, D); yaz(LS.dirty, KIRLI);
    if (elle) toast('Eşitlendi ✓');
  } catch (e) { SYNC_HATA = e.message; if (elle) toast('Eşitleme hatası: ' + e.message); }
  SYNC_SURUYOR = false; durum(); ciz();
}
function durum() {
  const dot = $('#syncdot'), t = $('#synctxt'); if (!dot) return;
  const bekleyen = Object.keys(KIRLI).length;
  dot.className = 'dot ' + (SYNC_HATA ? 'hata' : SYNC_SURUYOR || bekleyen ? 'bekle' : CFG.token ? 'ok' : '');
  t.textContent = !CFG.token ? 'kurulum' : SYNC_SURUYOR ? 'eşitleniyor' : SYNC_HATA ? 'hata' : bekleyen ? `${bekleyen} bekliyor` : '';
}

/* ---------- hesaplar ---------- */
const hedefler = () => canli(D.hedefler).filter(h => h.aktif !== false);
const hedefBul = id => (D.hedefler || []).find(h => h.id === id);
const seanslar = () => canli(D.kayitlar).filter(k => k.tip === 'seans');
function haftaSeans(hid, bas = haftaBasi()) {
  const b = gunStr(bas), s = gunStr(gunEkle(bas, 7));
  return seanslar().filter(k => k.hedefId === hid && k.tarih.slice(0, 10) >= b && k.tarih.slice(0, 10) < s);
}
function gunDurumu(tarih = gunStr()) { return (oku(LS.gun, {})[tarih]) || null; }
function kapasite(tarih = gunStr()) {
  const g = gunDurumu(tarih);
  if (g && g.kapasite) return g.kapasite;
  return 'normal';
}
const KAP_SAYI = { yogun: 1, normal: 3, bos: 6 };

function bugunOnerileri() {
  const bugun = new Date(); const kalanGun = 7 - ((bugun.getDay() + 6) % 7); // bugün dahil
  const bugunStr = gunStr();
  const plan = D.plan && D.plan.gunler && D.plan.gunler[bugunStr];
  const yapildiBugun = new Set(seanslar().filter(k => k.tarih.slice(0, 10) === bugunStr).map(k => k.hedefId));
  let liste = hedefler().filter(h => (h.haftalikSeans || 0) > 0).map(h => {
    const yapilan = haftaSeans(h.id).length; const kalan = Math.max(0, h.haftalikSeans - yapilan);
    const aciliyet = kalan / kalanGun;
    const pc = plan && plan.find(p => p.hedefId === h.id);
    return { h, yapilan, kalan, aciliyet: aciliyet + (pc ? 0.5 : 0), neden: pc ? pc.neden : null, dk: (pc && pc.dk) || h.seansDk || 20 };
  }).filter(x => x.kalan > 0 && !yapildiBugun.has(x.h.id));
  liste.sort((a, b) => b.aciliyet - a.aciliyet);
  return liste.slice(0, KAP_SAYI[kapasite()] || 3);
}
function yaklasanGunler(gunIcinde = 30) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const out = [];
  for (const k of canli(D.kisiler)) for (const o of (k.ozelGunler || []).concat(k.dogumGunu ? [{ ad: 'Doğum günü', tarih: k.dogumGunu }] : [])) {
    if (!o.tarih) continue;
    const [ay, gun] = o.tarih.slice(-5).split('-').map(Number);
    let d = new Date(bugun.getFullYear(), ay - 1, gun);
    if (d < bugun) d = new Date(bugun.getFullYear() + 1, ay - 1, gun);
    const kalan = Math.round((d - bugun) / 864e5);
    if (kalan <= gunIcinde) out.push({ kisi: k, ad: o.ad, tarih: d, kalan });
  }
  return out.sort((a, b) => a.kalan - b.kalan);
}
function seri() { // üst üste en az bir seans yapılan gün sayısı
  const gunler = new Set(seanslar().map(k => k.tarih.slice(0, 10)));
  let n = 0, d = new Date(); if (!gunler.has(gunStr(d))) d = gunEkle(d, -1);
  while (gunler.has(gunStr(d))) { n++; d = gunEkle(d, -1); }
  return n;
}
function buAyHarcama() {
  const ay = gunStr().slice(0, 7);
  return canli(D.finans.harcamalar).filter(h => h.tarih.slice(0, 7) === ay);
}

/* ---------- görünümler ---------- */
const V = {};
V.bugun = () => {
  const d = new Date(); const oneriler = bugunOnerileri(); const kap = kapasite();
  const yak = yaklasanGunler(14); const bugunEtk = yak.filter(y => y.kalan === 0);
  const gd = gunDurumu();
  const bugunKayit = canli(D.kayitlar).filter(k => k.tarih.slice(0, 10) === gunStr()).sort((a, b) => b.tarih.localeCompare(a.tarih));
  const ilham = (D.plan && D.plan.ilham) || null;
  let h = '';
  if (!CFG.token) h += `<div class="card hero"><h2>👋 Hoş geldin</h2><p class="mut">Verilerinin özel GitHub reposuna kaydedilmesi için önce kurulumu tamamla.</p><button class="btn" onclick="App.ayarlar()">Kurulum</button></div>`;
  if (bugunEtk.length && !gd) h += `<div class="card hero"><h2>🎉 Bugün ${bugunEtk.map(y => esc(y.kisi.ad) + ' – ' + esc(y.ad)).join(', ')}</h2><p class="mut">Bugün bir planın var mı? Varsa günün yükünü hafifletip haftaya dağıtırım.</p><div class="row"><button class="btn" onclick="App.kapasiteSec('yogun',true)">Evet, planım var</button><button class="btn sec" onclick="App.kapasiteSec('normal',true)">Hayır</button></div></div>`;
  h += `<div class="card hero"><div class="row between"><div><div class="mut small">${GUNLER[d.getDay()]}</div><div class="big">🔥 ${seri()} gün</div><div class="mut small">üst üste çalışma serisi</div></div>
    <div style="text-align:right"><div class="mut small">Bugünkü kapasiten</div><div class="seg" style="margin-top:6px">${['yogun', 'normal', 'bos'].map(k => `<button class="${kap === k ? 'on' : ''}" onclick="App.kapasiteSec('${k}')">${{ yogun: 'Yoğun', normal: 'Normal', bos: 'Boş' }[k]}</button>`).join('')}</div></div></div></div>`;
  h += `<div class="card"><h2>Bugün için öneriler <small>haftalık kotana göre</small></h2>`;
  h += oneriler.length ? oneriler.map(o => `<div class="oneri"><div class="emo">${esc(o.h.ikon || '•')}</div><div class="grow"><b>${esc(o.h.ad)}</b> <span class="mut small">· ${o.dk} dk</span><div class="mut small">${o.neden ? esc(o.neden) : `Bu hafta ${o.yapilan}/${o.h.haftalikSeans} · ${o.kalan} seans kaldı`}</div></div><button class="btn sm" onclick="App.kayitAc('${o.h.id}')">Yaptım</button></div>`).join('')
    : `<div class="empty">${hedefler().length ? 'Bugünlük bu kadar 👏 Haftalık kotalar yolunda.' : 'Henüz hedef yok — Hedefler sekmesinden ekle.'}</div>`;
  h += `</div>`;
  if (ilham) h += `<div class="card"><h2>💡 İlham kartı</h2><div>${esc(ilham.metin || ilham)}</div>${ilham.kaynak ? `<div class="mut small" style="margin-top:6px">${esc(ilham.kaynak)}</div>` : ''}</div>`;
  h += `<div class="card"><h2>Hızlı kayıt</h2><div class="row wrap">${hedefler().map(x => `<button class="chip" onclick="App.kayitAc('${x.id}')">${esc(x.ikon || '')} ${esc(x.ad)}</button>`).join('')}<button class="chip" onclick="App.harcamaAc()">💳 Harcama</button><button class="chip" onclick="App.notAc()">📝 Not</button></div></div>`;
  const yak2 = yak.filter(y => y.kalan > 0);
  if (yak2.length) h += `<div class="card"><h2>Yaklaşan özel günler</h2><div class="list">${yak2.map(y => `<div class="it"><div>🎂 <b>${esc(y.kisi.ad)}</b> <span class="mut small">${esc(y.ad)}</span></div><span class="tag">${y.kalan} gün</span></div>`).join('')}</div></div>`;
  h += `<div class="card"><h2>Bugün yaptıkların</h2>${bugunKayit.length ? `<div class="list">${bugunKayit.map(kayitSatir).join('')}</div>` : '<div class="empty">Henüz kayıt yok.</div>'}</div>`;
  return h;
};
function kayitSatir(k) {
  const h = hedefBul(k.hedefId); const saat = k.tarih.slice(11, 16);
  const etiket = k.tip === 'seans' ? `${esc(h ? h.ikon + ' ' + h.ad : 'Seans')} · ${k.dk || 0} dk` : k.tip === 'not' ? '📝 Not' : esc(k.tip);
  return `<div class="it"><div><div>${etiket}</div>${k.not ? `<div class="mut small">${esc(k.not)}</div>` : ''}</div><div class="row"><span class="tag">${saatYerel(k.tarih)}</span><button class="chip" onclick="App.sil('kayitlar','${k.id}')">✕</button></div></div>`;
}
function saatYerel(iso) { const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

V.hedefler = () => {
  let h = `<button class="btn" onclick="App.hedefAc()">＋ Yeni hedef</button>`;
  for (const x of canli(D.hedefler)) {
    const yap = haftaSeans(x.id); const dk = yap.reduce((s, k) => s + (+k.dk || 0), 0);
    const oran = x.haftalikSeans ? Math.min(1, yap.length / x.haftalikSeans) : 0;
    const tas = x.kilometreTaslari || [];
    h += `<div class="card" style="${x.aktif === false ? 'opacity:.5' : ''}"><div class="row"><div class="emo">${esc(x.ikon || '•')}</div><div class="grow"><div class="row between"><b>${esc(x.ad)}</b><button class="chip" onclick="App.hedefAc('${x.id}')">Düzenle</button></div>
      <div class="mut small">${x.haftalikSeans ? `Bu hafta ${yap.length}/${x.haftalikSeans} seans · ${dk} dk` : 'Serbest (kota yok)'}${x.aktif === false ? ' · duraklatıldı' : ''}</div>
      ${x.haftalikSeans ? `<div class="bar ${oran >= 1 ? 'ok' : ''}"><i style="width:${oran * 100}%"></i></div>` : ''}</div></div>
      ${x.hedefMetni ? `<div class="small" style="margin-top:10px">${esc(x.hedefMetni)}</div>` : ''}
      ${tas.length ? `<div style="margin-top:8px">${tas.map((t, i) => `<div class="row small" style="padding:3px 0;cursor:pointer" onclick="App.tasTikla('${x.id}',${i})">${t.tamam ? '✅' : '⬜️'} <span style="${t.tamam ? 'text-decoration:line-through;color:var(--mut)' : ''}">${esc(t.ad)}</span></div>`).join('')}</div>` : ''}
      ${kaynaklar(x.id)}</div>`;
  }
  return h;
};
function kaynaklar(hid) {
  const k = (D.icerik && D.icerik.kaynaklar || []).filter(x => x.hedefId === hid);
  if (!k.length) return '';
  return `<details style="margin-top:8px"><summary class="small mut" style="cursor:pointer">📚 Kaynaklar (${k.length})</summary>${k.map(x => `<div class="small" style="padding:4px 0">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.ad)}</a>` : esc(x.ad)}${x.not ? ` <span class="mut">— ${esc(x.not)}</span>` : ''}</div>`).join('')}</details>`;
}

V.para = () => {
  const f = D.finans; const ay = buAyHarcama(); const top = ay.reduce((s, x) => s + (+x.tutar || 0), 0);
  const abon = canli(f.abonelikler).reduce((s, x) => s + (+x.tutar || 0), 0);
  const gid = canli(f.giderler).reduce((s, x) => s + (+x.tutar || 0), 0);
  const tak = canli(f.borclar).reduce((s, x) => s + (+x.taksit || 0), 0);
  const maas = +(f.maas && f.maas.tutar) || 0; const kalan = maas - top - abon - gid - tak;
  const kat = {}; ay.forEach(x => kat[x.kategori || 'Diğer'] = (kat[x.kategori || 'Diğer'] || 0) + (+x.tutar || 0));
  const katMax = Math.max(1, ...Object.values(kat));
  const d = new Date();
  let h = `<div class="card hero"><div class="mut small">${AYLAR[d.getMonth()]} · kalan (tahmini)</div><div class="big" style="color:${kalan < 0 ? 'var(--bad)' : 'var(--text)'}">${tl(kalan)}</div>
    <div class="grid2 small" style="margin-top:10px"><div>Maaş: <b>${tl(maas)}</b> <a href="#" onclick="App.maasAc();return false">düzenle</a></div><div>Harcama: <b>${tl(top)}</b></div><div>Abonelik: <b>${tl(abon)}</b></div><div>Gider + taksit: <b>${tl(gid + tak)}</b></div></div>
    <button class="btn" style="margin-top:12px" onclick="App.harcamaAc()">＋ Harcama ekle</button></div>`;
  if (Object.keys(kat).length) h += `<div class="card"><h2>Bu ay kategoriler</h2>${Object.entries(kat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div style="margin:8px 0"><div class="row between small"><span>${esc(k)}</span><b>${tl(v)}</b></div><div class="bar"><i style="width:${v / katMax * 100}%"></i></div></div>`).join('')}</div>`;
  h += `<div class="card"><h2>Son harcamalar</h2>${ay.length ? `<div class="list">${ay.sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 15).map(x => `<div class="it"><div><b>${tl(x.tutar)}</b> <span class="mut small">${esc(x.kategori)}${x.not ? ' · ' + esc(x.not) : ''}</span></div><div class="row"><span class="tag">${x.tarih.slice(8, 10)}.${x.tarih.slice(5, 7)}</span><button class="chip" onclick="App.sil('finans.harcamalar','${x.id}')">✕</button></div></div>`).join('')}</div>` : '<div class="empty">Bu ay harcama yok.</div>'}</div>`;
  h += listeKart('Abonelikler', 'abonelikler', x => `${esc(x.ad)} <span class="mut small">· her ayın ${x.gun || '?'}'i</span>`, x => tl(x.tutar));
  h += listeKart('Düzenli giderler', 'giderler', x => `${esc(x.ad)} <span class="mut small">· her ayın ${x.gun || '?'}'i</span>`, x => tl(x.tutar));
  h += listeKart('Borçlar', 'borclar', x => `${esc(x.ad)} <div class="mut small">Kalan ${tl(x.kalan)} · taksit ${tl(x.taksit)}${x.taksit ? ` · ~${Math.ceil((+x.kalan || 0) / (+x.taksit || 1))} ay` : ''}</div>`, x => '');
  const birikim = Math.max(0, kalan);
  h += listeKart('Dilek listesi 🎸🧱', 'dilekler', x => { const eksik = Math.max(0, (+x.fiyat || 0) - (+x.biriken || 0)); const ayda = +x.aylik || 0; return `${esc(x.ad)} <div class="mut small">${!(+x.fiyat) ? 'Fiyat gir (dokun)' : `${tl(x.biriken || 0)} / ${tl(x.fiyat)}`}${!(+x.fiyat) ? '' : eksik && ayda ? ` · ayda ${tl(ayda)} ayırırsan ~${Math.ceil(eksik / ayda)} ayda` : eksik && birikim ? ` · ayın kalanı (${tl(birikim)}) ile ~${Math.ceil(eksik / birikim)} ay` : eksik ? '' : ' · alınabilir! 🎉'}</div><div class="bar"><i style="width:${Math.min(100, (+x.biriken || 0) / (+x.fiyat || 1) * 100)}%"></i></div>`; }, x => '');
  return h;
};
const FORMLAR = {
  abonelikler: [['ad', 'Ad'], ['tutar', 'Aylık tutar (₺)', 'number'], ['gun', 'Ayın kaçında yenileniyor', 'number']],
  giderler: [['ad', 'Ad (kira, fatura…)'], ['tutar', 'Tutar (₺)', 'number'], ['gun', 'Ayın kaçında', 'number']],
  borclar: [['ad', 'Ad'], ['kalan', 'Kalan borç (₺)', 'number'], ['taksit', 'Aylık taksit (₺)', 'number'], ['gun', 'Ödeme günü', 'number']],
  dilekler: [['ad', 'Ne? (ör. amfi, Lego seti)'], ['fiyat', 'Fiyat (₺)', 'number'], ['biriken', 'Biriken (₺)', 'number'], ['aylik', 'Aylık ayıracağın (₺)', 'number'], ['ne', 'Ödül mü? Hangi hedefe bağlı (isteğe bağlı)']]
};
function listeKart(baslik, alan, sol, sag) {
  const l = canli(D.finans[alan]);
  return `<div class="card"><h2>${baslik}<button class="chip" onclick="App.ogeAc('${alan}')">＋</button></h2>${l.length ? `<div class="list">${l.map(x => `<div class="it" onclick="App.ogeAc('${alan}','${x.id}')" style="cursor:pointer"><div class="grow">${sol(x)}</div><b>${sag(x)}</b></div>`).join('')}</div>` : '<div class="empty">Boş</div>'}</div>`;
}

V.kisiler = () => {
  const yak = yaklasanGunler(366);
  let h = `<button class="btn" onclick="App.kisiAc()">＋ Kişi ekle</button>`;
  const ks = canli(D.kisiler).slice().sort((a, b) => { const ya = yak.find(y => y.kisi.id === a.id), yb = yak.find(y => y.kisi.id === b.id); return (ya ? ya.kalan : 999) - (yb ? yb.kalan : 999); });
  for (const k of ks) {
    const y = yak.find(z => z.kisi.id === k.id);
    h += `<div class="card" onclick="App.kisiAc('${k.id}')" style="cursor:pointer"><div class="row between"><b>${esc(k.ad)}</b>${y ? `<span class="tag">${y.kalan === 0 ? 'Bugün!' : y.kalan + ' gün'}</span>` : ''}</div>
      <div class="mut small">${esc(k.yakinlik || '')}${k.dogumGunu ? ' · 🎂 ' + k.dogumGunu.slice(-5).split('-').reverse().join('.') : ''}</div>
      ${k.sevdikleri ? `<div class="small" style="margin-top:6px">❤️ ${esc(k.sevdikleri)}</div>` : ''}
      ${(k.hediyeOnerileri || []).length ? `<div class="small" style="margin-top:6px">🎁 ${k.hediyeOnerileri.map(esc).join(' · ')}</div>` : ''}</div>`;
  }
  if (!ks.length) h += `<div class="empty" style="margin-top:20px">Doğum günlerini ve hediye notlarını buraya ekle. Hediye önerilerini PC beyni / Claude hazırlar.</div>`;
  return h;
};

V.hafta = () => {
  const bas = haftaBasi(); const haftalar = [0, 1, 2, 3].map(i => gunEkle(bas, -7 * i));
  let h = `<div class="card"><h2>Son 4 hafta <small>yapılan / kota</small></h2><table><tr><th>Hedef</th>${haftalar.map((w, i) => `<th>${i === 0 ? 'Bu' : w.getDate() + '.' + (w.getMonth() + 1)}</th>`).join('')}</tr>
    ${canli(D.hedefler).filter(x => x.haftalikSeans).map(x => `<tr><td>${esc(x.ikon)} ${esc(x.ad)}</td>${haftalar.map(w => { const n = haftaSeans(x.id, w).length; return `<td style="color:${n >= x.haftalikSeans ? 'var(--ok)' : n ? 'var(--text)' : 'var(--mut)'}">${n}/${x.haftalikSeans}</td>`; }).join('')}</tr>`).join('')}</table></div>`;
  const an = D.plan && D.plan.analiz;
  if (an && Object.keys(an).length) h += `<div class="card"><h2>🧠 Beyin analizi <small>${D.plan.olusturma ? new Date(D.plan.olusturma).toLocaleDateString('tr-TR') : ''}</small></h2>${Object.entries(an).map(([hid, a]) => { const x = hedefBul(hid); return x ? `<div style="padding:6px 0;border-top:1px solid var(--line)"><b>${esc(x.ikon)} ${esc(x.ad)}</b><div class="mut small">${esc(a.ozet || '')}</div></div>` : ''; }).join('')}</div>`;
  const notlar = canli(D.kayitlar).filter(k => k.tip === 'haftaNotu').sort((a, b) => b.tarih.localeCompare(a.tarih));
  h += `<div class="card"><h2>Haftalık değerlendirme</h2><label>Bu hafta ne işe yaradı, ne yaramadı?</label><textarea id="hnot" placeholder="ör. Akşam gitar iyi gitti, sabah okuma tutmadı…"></textarea><button class="btn" style="margin-top:10px" onclick="App.haftaNotu()">Kaydet</button>
    ${notlar.length ? `<div class="list" style="margin-top:12px">${notlar.slice(0, 6).map(n => `<div class="it"><div><div class="mut small">${n.tarih.slice(0, 10)}</div>${esc(n.not)}</div></div>`).join('')}</div>` : ''}</div>`;
  const tum = canli(D.kayitlar).filter(k => k.tip !== 'haftaNotu').sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 30);
  h += `<div class="card"><h2>Son kayıtlar</h2>${tum.length ? `<div class="list">${tum.map(k => kayitSatir(k).replace('<span class="tag">', `<span class="tag">${k.tarih.slice(8, 10)}.${k.tarih.slice(5, 7)} `)).join('')}</div>` : '<div class="empty">Kayıt yok</div>'}</div>`;
  return h;
};

const BASLIK = { bugun: 'Bugün', hedefler: 'Hedefler', para: 'Para', kisiler: 'Kişiler', hafta: 'Hafta' };
function ciz() {
  $('#main').innerHTML = V[SEKME]();
  $('#baslik').textContent = BASLIK[SEKME];
  const d = new Date(); $('#tarih').textContent = `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === SEKME));
  durum();
}

/* ---------- alt pencere (sheet) ---------- */
function sheet(html) { $('#sheet').innerHTML = html; $('#sheetbg').classList.add('on'); }
function kapat() { $('#sheetbg').classList.remove('on'); }
$('#sheetbg').addEventListener('click', e => { if (e.target.id === 'sheetbg') kapat(); });
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };

/* ---------- eylemler ---------- */
const App = {
  sync,
  kapat,
  sekme(t) { SEKME = t; ciz(); window.scrollTo(0, 0); },
  kapasiteSec(k, etkinlik) { const g = oku(LS.gun, {}); g[gunStr()] = { kapasite: k, etkinlik: !!etkinlik }; yaz(LS.gun, g); ciz(); if (etkinlik && k === 'yogun') toast('Tamam, bugün hafif tutuyorum 🎉'); },
  kayitAc(hid) {
    const h = hedefBul(hid); const dk = h && h.seansDk || 20;
    sheet(`<h3>${esc(h.ikon)} ${esc(h.ad)}</h3><label>Kaç dakika?</label><div class="row wrap" id="dkler">${[10, 15, 20, 30, 45, 60, 90].map(n => `<button class="chip ${n === dk ? 'on' : ''}" onclick="document.querySelectorAll('#dkler .chip').forEach(c=>c.classList.remove('on'));this.classList.add('on');document.getElementById('kdk').value=${n}">${n}</button>`).join('')}</div>
      <input id="kdk" type="number" inputmode="numeric" value="${dk}" style="margin-top:8px"><label>Not (ne çalıştın, nasıl geçti?)</label><textarea id="knot" placeholder="ör. Nothing Else Matters intro, alternate picking"></textarea>
      <label>Ne zaman?</label><input id="kzaman" type="datetime-local" value="${yerelInput()}">
      <button class="btn" style="margin-top:14px" onclick="App.kayitKaydet('${hid}')">Kaydet</button>`);
  },
  kayitKaydet(hid) {
    const z = val('kzaman'); const t = z ? (z.length === 16 ? z + ':00' : z) : yerelISO();
    D.kayitlar.push({ id: uid(), tip: 'seans', hedefId: hid, dk: +val('kdk') || 0, not: val('knot'), tarih: t, kaynak: 'telefon', guncel: simdi() });
    kaydet('kayitlar'); kapat(); ciz(); toast('Kaydedildi 💪');
  },
  notAc() { sheet(`<h3>📝 Not</h3><textarea id="nn" placeholder="Bugün ne yaptın, aklına ne geldi?"></textarea><button class="btn" style="margin-top:12px" onclick="App.notKaydet()">Kaydet</button>`); },
  notKaydet() { const n = val('nn'); if (!n) return; D.kayitlar.push({ id: uid(), tip: 'not', not: n, tarih: yerelISO(), kaynak: 'telefon', guncel: simdi() }); kaydet('kayitlar'); kapat(); ciz(); toast('Not kaydedildi'); },
  haftaNotu() { const n = val('hnot'); if (!n) return; D.kayitlar.push({ id: uid(), tip: 'haftaNotu', not: n, tarih: yerelISO(), kaynak: 'telefon', guncel: simdi() }); kaydet('kayitlar'); ciz(); toast('Değerlendirme kaydedildi'); },
  harcamaAc(on = {}) {
    const k = D.finans.kategoriler || VARSAYILAN.finans.kategoriler;
    sheet(`<h3>💳 Harcama</h3><label>Tutar (₺)</label><input id="ht" type="number" inputmode="decimal" value="${esc(on.tutar || '')}" autofocus>
      <label>Kategori</label><div class="row wrap" id="hkat">${k.map((c, i) => `<button class="chip ${(on.kategori ? on.kategori === c : i === 0) ? 'on' : ''}" onclick="document.querySelectorAll('#hkat .chip').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${esc(c)}</button>`).join('')}</div>
      <label>Not</label><input id="hn" placeholder="ör. Starbucks" value="${esc(on.not || '')}">
      <label>Ödeme</label><div class="seg" id="hode"><button class="on" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Kredi kartı</button><button onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Nakit/Banka</button></div>
      <button class="btn" style="margin-top:14px" onclick="App.harcamaKaydet()">Kaydet</button>`);
    setTimeout(() => { const e = $('#ht'); e && e.focus(); }, 200);
  },
  harcamaKaydet() {
    const t = parseFloat(val('ht').replace(',', '.')); if (!t) return toast('Tutar gir');
    const kat = ($('#hkat .chip.on') || {}).textContent || 'Diğer'; const ode = ($('#hode .on') || {}).textContent || 'Kredi kartı';
    harcamaEkle(t, kat, val('hn'), ode); kapat(); ciz(); toast(`${tl(t)} kaydedildi`);
  },
  maasAc() { const m = D.finans.maas || {}; sheet(`<h3>Maaş</h3><label>Aylık net maaş (₺)</label><input id="mt" type="number" inputmode="decimal" value="${m.tutar || ''}"><label>Ayın kaçında yatıyor</label><input id="mg" type="number" value="${m.gun || 1}"><button class="btn" style="margin-top:14px" onclick="App.maasKaydet()">Kaydet</button>`); },
  maasKaydet() { D.finans.maas = { tutar: +val('mt') || 0, gun: +val('mg') || 1, guncel: simdi() }; kaydet('finans'); kapat(); ciz(); },
  ogeAc(alan, id) {
    const x = id ? D.finans[alan].find(o => o.id === id) : {};
    sheet(`<h3>${id ? 'Düzenle' : 'Ekle'}</h3>${FORMLAR[alan].map(([k, l, t]) => `<label>${l}</label><input id="f_${k}" type="${t || 'text'}" ${t === 'number' ? 'inputmode="decimal"' : ''} value="${esc(x[k] ?? '')}">`).join('')}
      <button class="btn" style="margin-top:14px" onclick="App.ogeKaydet('${alan}','${id || ''}')">Kaydet</button>${id ? `<button class="btn del" style="margin-top:8px" onclick="App.sil('finans.${alan}','${id}');App.kapat()">Sil</button>` : ''}`);
  },
  ogeKaydet(alan, id) {
    const o = id ? D.finans[alan].find(x => x.id === id) : { id: uid() };
    FORMLAR[alan].forEach(([k, , t]) => o[k] = t === 'number' ? (+val('f_' + k) || 0) : val('f_' + k));
    o.guncel = simdi(); if (!id) D.finans[alan].push(o); kaydet('finans'); kapat(); ciz();
  },
  hedefAc(id) {
    const x = id ? hedefBul(id) : { ikon: '🎯', haftalikSeans: 3, seansDk: 30, aktif: true };
    sheet(`<h3>${id ? 'Hedefi düzenle' : 'Yeni hedef'}</h3><div class="grid2"><div><label>İkon</label><input id="g_ikon" value="${esc(x.ikon)}"></div><div><label>Ad</label><input id="g_ad" value="${esc(x.ad || '')}"></div></div>
      <div class="grid2"><div><label>Haftada kaç seans (0 = serbest)</label><input id="g_hs" type="number" value="${x.haftalikSeans ?? 0}"></div><div><label>Seans süresi (dk)</label><input id="g_dk" type="number" value="${x.seansDk ?? 30}"></div></div>
      <label>Hedef / vizyon (ör. "1 ayda X parçasını temiz çalmak")</label><textarea id="g_metin">${esc(x.hedefMetni || '')}</textarea>
      <label>Kilometre taşları (her satıra bir tane)</label><textarea id="g_tas">${esc((x.kilometreTaslari || []).map(t => (t.tamam ? '[x] ' : '') + t.ad).join('\n'))}</textarea>
      <label>Bitiş tarihi (isteğe bağlı)</label><input id="g_bitis" type="date" value="${esc(x.bitis || '')}">
      <label>Durum</label><div class="seg" id="g_aktif"><button class="${x.aktif !== false ? 'on' : ''}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Aktif</button><button class="${x.aktif === false ? 'on' : ''}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Duraklat</button></div>
      <button class="btn" style="margin-top:14px" onclick="App.hedefKaydet('${id || ''}')">Kaydet</button>${id ? `<button class="btn del" style="margin-top:8px" onclick="if(confirm('Silinsin mi?')){App.sil('hedefler','${id}');App.kapat()}">Sil</button>` : ''}`);
  },
  hedefKaydet(id) {
    const ad = val('g_ad'); if (!ad) return toast('Ad gir');
    const x = id ? hedefBul(id) : { id: uid() };
    Object.assign(x, {
      ikon: val('g_ikon') || '🎯', ad, haftalikSeans: +val('g_hs') || 0, seansDk: +val('g_dk') || 0, hedefMetni: val('g_metin'), bitis: val('g_bitis'),
      kilometreTaslari: val('g_tas').split('\n').map(s => s.trim()).filter(Boolean).map(s => ({ ad: s.replace(/^\[x\]\s*/i, ''), tamam: /^\[x\]/i.test(s) })),
      aktif: ($('#g_aktif .on') || {}).textContent !== 'Duraklat', guncel: simdi()
    });
    if (!id) D.hedefler.push(x); kaydet('hedefler'); kapat(); ciz();
  },
  tasTikla(id, i) { const x = hedefBul(id); x.kilometreTaslari[i].tamam = !x.kilometreTaslari[i].tamam; x.guncel = simdi(); kaydet('hedefler'); ciz(); },
  kisiAc(id) {
    const k = id ? D.kisiler.find(x => x.id === id) : {};
    sheet(`<h3>${id ? esc(k.ad) : 'Yeni kişi'}</h3><div class="grid2"><div><label>Ad</label><input id="p_ad" value="${esc(k.ad || '')}"></div><div><label>Yakınlık</label><input id="p_yak" placeholder="annem, arkadaş…" value="${esc(k.yakinlik || '')}"></div></div>
      <label>Doğum günü</label><input id="p_dg" type="date" value="${esc(k.dogumGunu && k.dogumGunu.length === 10 ? k.dogumGunu : k.dogumGunu ? '2000-' + k.dogumGunu.slice(-5) : '')}">
      <label>Sevdikleri, ilgi alanları, özellikleri</label><textarea id="p_sev" placeholder="ör. kahve, kamp, Harry Potter, minimalist, M beden">${esc(k.sevdikleri || '')}</textarea>
      <label>Hediye bütçesi (₺, ör. 500-1500)</label><input id="p_bt" value="${esc(k.butce || '')}">
      <label>Daha önce aldığın hediyeler</label><input id="p_eski" value="${esc(k.eskiHediyeler || '')}">
      <label>Hediye fikirleri (virgülle)</label><input id="p_hed" value="${esc((k.hediyeOnerileri || []).join(', '))}">
      <button class="btn" style="margin-top:14px" onclick="App.kisiKaydet('${id || ''}')">Kaydet</button>${id ? `<button class="btn del" style="margin-top:8px" onclick="if(confirm('Silinsin mi?')){App.sil('kisiler','${id}');App.kapat()}">Sil</button>` : ''}`);
  },
  kisiKaydet(id) {
    const ad = val('p_ad'); if (!ad) return toast('Ad gir');
    const k = id ? D.kisiler.find(x => x.id === id) : { id: uid() };
    Object.assign(k, { ad, yakinlik: val('p_yak'), dogumGunu: val('p_dg'), sevdikleri: val('p_sev'), butce: val('p_bt'), eskiHediyeler: val('p_eski'), hediyeOnerileri: val('p_hed').split(',').map(s => s.trim()).filter(Boolean), guncel: simdi() });
    if (!id) D.kisiler.push(k); kaydet('kisiler'); kapat(); ciz();
  },
  sil(yol, id) {
    const [dosya, alan] = yol.split('.'); const arr = alan ? D[dosya][alan] : D[dosya];
    const o = arr.find(x => x.id === id); if (!o) return;
    o.silindi = true; o.guncel = simdi(); kaydet(dosya); ciz();
  },
  ayarlar() {
    sheet(`<h3>⚙︎ Ayarlar</h3><p class="mut small">Verilerin <b>özel</b> GitHub reponda tutulur. Anahtar (token) sadece bu telefonda saklanır.</p>
      <label>GitHub kullanıcı adı</label><input id="c_o" value="${esc(CFG.owner)}" autocapitalize="off">
      <label>Veri reposu</label><input id="c_r" value="${esc(CFG.repo)}" autocapitalize="off">
      <label>Erişim anahtarı (fine-grained token)</label><input id="c_t" type="password" value="${esc(CFG.token)}" placeholder="github_pat_…" autocapitalize="off">
      <button class="btn" style="margin-top:14px" onclick="App.ayarKaydet()">Kaydet ve eşitle</button>
      <p class="mut small" style="margin-top:14px">Son eşitleme: ${SON_SYNC ? new Date(SON_SYNC).toLocaleString('tr-TR') : '—'}${SYNC_HATA ? '<br>Hata: ' + esc(SYNC_HATA) : ''}</p>
      <p class="mut small"><b>Kestirme linkleri:</b><br>Harcama: <code>?harcama=TUTAR&kategori=Kahve</code><br>Seans: <code>?seans=gitar&dk=30</code></p>`);
  },
  ayarKaydet() { CFG = { owner: val('c_o'), repo: val('c_r'), token: val('c_t') }; yaz(LS.cfg, CFG); kapat(); sync(true); }
};
function yerelInput(d = new Date()) { return `${gunStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function harcamaEkle(tutar, kategori, not, odeme = 'Kredi kartı') {
  D.finans.harcamalar = D.finans.harcamalar || [];
  D.finans.harcamalar.push({ id: uid(), tutar, kategori, not, odeme, tarih: yerelISO(), guncel: simdi() });
  kaydet('finans');
}
window.App = App;

/* ---------- Kestirme (Shortcut) linkleri: ?harcama=150&kategori=Kahve  /  ?seans=gitar&dk=30 ---------- */
function linkIsle() {
  const p = new URLSearchParams(location.search); let islem = false;
  if (p.has('harcama')) {
    const t = parseFloat(String(p.get('harcama')).replace(',', '.'));
    if (t) { harcamaEkle(t, p.get('kategori') || 'Diğer', p.get('not') || '', p.get('odeme') || 'Kredi kartı'); toast(`${tl(t)} kaydedildi ✓`); SEKME = 'para'; islem = true; }
    else { SEKME = 'para'; setTimeout(() => App.harcamaAc({ kategori: p.get('kategori') }), 300); islem = true; }
  }
  if (p.has('seans')) {
    const q = p.get('seans').toLocaleLowerCase('tr');
    const h = canli(D.hedefler).find(x => x.id === q || x.ad.toLocaleLowerCase('tr').includes(q));
    if (h) {
      if (p.has('dk')) { D.kayitlar.push({ id: uid(), tip: 'seans', hedefId: h.id, dk: +p.get('dk') || 0, not: p.get('not') || '', tarih: yerelISO(), kaynak: 'kestirme', guncel: simdi() }); kaydet('kayitlar'); toast(`${h.ad} kaydedildi 💪`); }
      else setTimeout(() => App.kayitAc(h.id), 300);
      islem = true;
    }
  }
  if (islem) history.replaceState(null, '', location.pathname);
}

/* ---------- başlat ---------- */
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => App.sekme(b.dataset.t)));
window.addEventListener('online', () => sync());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { ciz(); sync(); } });
linkIsle();
ciz();
sync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
