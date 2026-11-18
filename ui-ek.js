/* Kişisel Asistan — Apple deneyimi katmanı:
   tema (otomatik/açık/koyu), SF Symbols tarzı çizgi ikonlar, cihaz seçimi + ilk kurulum,
   bağlam menüsü, widget açılır penceresi, simgeden büyüyerek açılan uygulamalar,
   halka kutlaması, haftalık özet */
'use strict';

/* ---------- ayarlar ---------- */
const AYAR_VARS = { tema: 'oto', ikon: 'cizgi', anim: 'tam', cihaz: null, ad: '', kurulum: false };
let AYAR = { ...AYAR_VARS, ...oku('ka_ayar', {}) };
const ayarKaydet = () => yaz('ka_ayar', AYAR);

/* ---------- cihazlar ---------- */
const MODELLER = {
  Apple: [
    ['iPhone SE (2./3. nesil)', 'yok'], ['iPhone X / XS / 11 Pro', 'centik'], ['iPhone XR / 11', 'centik'], ['iPhone 12 mini / 13 mini', 'centik'],
    ['iPhone 12 / 13 / 14', 'centik'], ['iPhone 12 / 13 Pro', 'centik'], ['iPhone 12 / 13 Pro Max', 'centik'], ['iPhone 14 Plus', 'centik'], ['iPhone 16e', 'centik'],
    ['iPhone 14 Pro / 15 / 15 Pro / 16', 'ada'], ['iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus', 'ada'], ['iPhone 16 Pro', 'ada'], ['iPhone 16 Pro Max', 'ada'],
    ['Daha yeni iPhone', 'ada'], ['iPad', 'yok']
  ],
  Samsung: [['Galaxy S serisi', 'yok'], ['Galaxy A serisi', 'yok'], ['Galaxy Z Flip / Fold', 'yok'], ['Diğer Samsung', 'yok']],
  Xiaomi: [['Redmi / Poco', 'yok'], ['Xiaomi', 'yok']],
  Diğer: [['Diğer Android', 'yok'], ['Bilgisayar', 'yok']]
};
function cihazTahmin() {
  const ua = navigator.userAgent, w = Math.min(screen.width, screen.height), h = Math.max(screen.width, screen.height);
  if (/iPad/.test(ua)) return { marka: 'Apple', model: 'iPad', ust: 'yok' };
  if (/iPhone/.test(ua)) {
    const t = { '375x667': 'iPhone SE (2./3. nesil)', '375x812': 'iPhone X / XS / 11 Pro', '414x896': 'iPhone XR / 11', '360x780': 'iPhone 12 mini / 13 mini', '390x844': 'iPhone 12 / 13 / 14', '428x926': 'iPhone 12 / 13 Pro Max', '393x852': 'iPhone 14 Pro / 15 / 15 Pro / 16', '430x932': 'iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus', '402x874': 'iPhone 16 Pro', '440x956': 'iPhone 16 Pro Max' }[`${w}x${h}`];
    const m = t || 'Daha yeni iPhone'; return { marka: 'Apple', model: m, ust: MODELLER.Apple.find(x => x[0] === m)[1] };
  }
  if (/Samsung|SM-/.test(ua)) return { marka: 'Samsung', model: 'Galaxy S serisi', ust: 'yok' };
  if (/Android/.test(ua)) return { marka: 'Diğer', model: 'Diğer Android', ust: 'yok' };
  return { marka: 'Diğer', model: 'Bilgisayar', ust: 'yok' };
}

/* ---------- tema ---------- */
const karanlikMQ = matchMedia('(prefers-color-scheme: dark)');
function temaUygula() {
  const t = AYAR.tema === 'oto' ? (karanlikMQ.matches ? 'koyu' : 'acik') : AYAR.tema;
  document.documentElement.dataset.tema = t;
  document.documentElement.dataset.ust = (AYAR.cihaz && AYAR.cihaz.ust) || 'yok';
  document.documentElement.classList.toggle('az-anim', AYAR.anim === 'az');
  document.querySelector('meta[name=theme-color]').content = t === 'acik' ? '#f2f2f7' : '#000000';
}
karanlikMQ.addEventListener('change', () => { if (AYAR.tema === 'oto') temaUygula(); });
temaUygula();

/* ---------- SF Symbols tarzı çizgi ikonlar ---------- */
const SVG = {
  ana: '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  ozet: '<path d="M4 20V11M9.5 20V5M15 20v-8M20.5 20V8"/>',
  spor: '<circle cx="14" cy="4.5" r="1.8"/><path d="M7 21l3.6-5.6L13.5 17v4M5 12l3.8-3 4.4.6 2.6 3.4H19M10.6 15.4l2.4-6.2"/>',
  saglik: '<path d="M12 20s-7.2-4.4-9-8.8C1.7 7.9 3.8 4.5 7.2 4.5c2 0 3.3 1.1 4.8 2.9 1.5-1.8 2.8-2.9 4.8-2.9 3.4 0 5.5 3.4 4.2 6.7C19.2 15.6 12 20 12 20z"/><path d="M6.5 12h3l1.5-2.5 2 5 1.5-2.5h3"/>',
  muzik: '<path d="M9 18V5.5l11-2.5v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  okuma: '<path d="M2.5 5.5c3-1 6-.8 9.5 1.2 3.5-2 6.5-2.2 9.5-1.2v13c-3-1-6-.8-9.5 1.2-3.5-2-6.5-2.2-9.5-1.2z"/><path d="M12 6.7v13"/>',
  dil: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18"/>',
  takvim: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21"/>',
  hobi: '<path d="M6.5 8.5h11a4 4 0 0 1 3.9 4.9l-.8 3.3a2.4 2.4 0 0 1-4.2.9L14 15h-4l-2.4 2.6a2.4 2.4 0 0 1-4.2-.9l-.8-3.3a4 4 0 0 1 3.9-4.9z"/><path d="M8 10.5v3M6.5 12h3M15.5 11.5h.01M17.5 13h.01"/>',
  para: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 9.5h19M6 15h4"/>',
  ayarlar: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  ekle: '<path d="M12 5v14M5 12h14"/>',
  duzenle: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  izgara: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  sil: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  geri: '<path d="M15 5l-7 7 7 7"/>',
  ac: '<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
};
const svgIkon = (ad, boy = 24, kal = 1.8) => `<svg viewBox="0 0 24 24" width="${boy}" height="${boy}" fill="none" stroke="currentColor" stroke-width="${kal}" stroke-linecap="round" stroke-linejoin="round">${SVG[ad] || ''}</svg>`;
function ikonHtml(m, boy = 34) { const k = SVG[m.id] ? m.id : null; return AYAR.ikon === 'cizgi' && k ? svgIkon(k, boy, 1.7) : esc(m.ikon); }

/* ---------- selamlama adıyla ---------- */
const eskiCiz = ciz;
ciz = function () { eskiCiz(); if (AYAR.ad) { const s = $('#selam'); s.textContent = s.textContent + ', ' + AYAR.ad; $('#kbarad').textContent = s.textContent; } };

/* ---------- ortak: açılır katman ---------- */
function katman(cls) { const d = document.createElement('div'); d.className = 'katman ' + (cls || ''); document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on')); return d; }
const hizli = () => AYAR.anim === 'az';

/* ---------- bağlam menüsü (uzun bas) ---------- */
UI.baglam = function (el) {
  const id = el.dataset.id, r = el.getBoundingClientRect(); const bg = katman('ctx');
  const kopya = el.cloneNode(true); kopya.removeAttribute('onclick'); kopya.classList.add('ctx-w'); Object.assign(kopya.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  bg.appendChild(kopya); el.style.visibility = 'hidden';
  const menu = document.createElement('div'); menu.className = 'ctx-m';
  menu.innerHTML = `<button data-k="duz">Widget'ı Düzenle${svgIkon('duzenle', 20)}</button><button data-k="ana">Ana Ekranı Düzenle${svgIkon('izgara', 20)}</button><div class="ayr"></div><button data-k="sil" class="kir">Widget'ı Kaldır${svgIkon('sil', 20)}</button>`;
  bg.appendChild(menu);
  const asagi = r.bottom + 190 < innerHeight; const mw = 250; const left = Math.min(Math.max(14, r.left), innerWidth - mw - 14);
  Object.assign(menu.style, { left: left + 'px', width: mw + 'px', top: asagi ? (r.bottom + 10) + 'px' : 'auto', bottom: asagi ? 'auto' : (innerHeight - r.top + 10) + 'px', transformOrigin: `${r.left + r.width / 2 - left}px ${asagi ? '0' : '100%'}` });
  kopya.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }], { duration: 250, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' });
  const kapa = (sonra) => { bg.classList.remove('on'); kopya.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 200, fill: 'forwards' }); setTimeout(() => { el.style.visibility = ''; bg.remove(); sonra && sonra(); }, 220); };
  bg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return kapa();
    if (b.dataset.k === 'duz') kapa(() => { const w = UIA.yerlesim.find(x => x.id === id); UI.wDetay(w.tur, w.ref, id); });
    if (b.dataset.k === 'ana') kapa(() => UI.duzenle(true));
    if (b.dataset.k === 'sil') kapa(() => UI.wSil(id)); });
};
/* galeri detayını mevcut widget'ı düzenlemek için de kullan */
const eskiDetay = UI.wDetay;
UI.wDetay = function (tur, ref, mevcutId) {
  eskiDetay.call(UI, tur, ref); UI._mevcut = mevcutId || null;
  if (mevcutId) { const btn = [...document.querySelectorAll('#sheet .btn')].pop(); btn.textContent = 'Uygula'; const w = UIA.yerlesim.find(x => x.id === mevcutId); const i = UI._sec.findIndex(s => s.boyut === w.boyut && (s.varyant || null) === (w.varyant || null)); if (i > 0) requestAnimationFrame(() => { $('#car').scrollLeft = i * $('#car').clientWidth; }); }
};
const eskiEkleSec = UI.wEkleSec;
UI.wEkleSec = function () {
  if (!UI._mevcut) return eskiEkleSec.call(UI);
  const i = +($('#car').dataset.i || 0), s = UI._sec[i], w = UIA.yerlesim.find(x => x.id === UI._mevcut);
  w.boyut = s.boyut; w.varyant = s.varyant; kaydetUI(); UI._mevcut = null; kapat(); ILK = true; ciz(); toast('Widget güncellendi');
};

/* ---------- widget'a dokununca: yerinden büyüyerek açılan pencere ---------- */
function buyukBoy(t) { return t.boyutlar.includes('l') ? 'l' : t.boyutlar.includes('m') ? 'm' : 's'; }
UI.wTik = function (e, id) {
  if (DUZENLE || Date.now() - SUPPRESS < 400) return;
  const w = UIA.yerlesim.find(x => x.id === id); if (!w) return; const el = document.querySelector(`[data-id="${id}"]`);
  if (w.tur === 'yigin') return yiginAc(w);
  acilir(w, el);
};
const WIDGET_ALAN = { para: 'para', takvim: 'takvim', ozelgun: 'takvim', kelime: 'dil', ilham: 'muzik', halkalar: 'ozet', basari: 'ozet', grafik: 'ozet', isi: 'ozet', sure: 'ozet', seri: 'ozet' };
function acilir(w, el) {
  const t = WT[w.tur], r = el.getBoundingClientRect(); const bg = katman('pop');
  const h = w.tur === 'hedef' ? hedefBul(w.ref) : null; const alan = h ? alanOf(h) : WIDGET_ALAN[w.tur];
  const eski = ILK; ILK = true;
  const icerik = `<div class="grid">${wHtml({ ...w, id: 'pop', boyut: w.tur === 'hedef' ? 'm' : buyukBoy(t) }, false)}</div>`;
  ILK = eski;
  const son = h ? `<div class="pop-list">${haftaSeans(h.id).sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 4).map(k => `<div class="row between"><span>${GUN_KISA[new Date(k.tarih).getDay()]} ${k.tarih.slice(11, 16)}${k.not ? ' · <span class="mut">' + esc(k.not) + '</span>' : ''}</span><b>${k.dk} dk</b></div>`).join('') || '<div class="mut small">Bu hafta henüz seans yok</div>'}</div>` : '';
  const btns = `<div class="pop-btn">${h ? `<button class="btn" style="background:${renk(h)}" data-k="seans">＋ Seans ekle</button>` : ''}${alan ? `<button class="btn ghost" data-k="app">${svgIkon('ac', 18)} ${esc((alanBul(alan) || OZET_APP).kisa || (alanBul(alan) || OZET_APP).ad)} uygulamasını aç</button>` : ''}</div>`;
  const kart = document.createElement('div'); kart.className = 'pop-k'; kart.innerHTML = icerik + son + btns; bg.appendChild(kart);
  const f0 = kart.getBoundingClientRect(); kart.style.left = Math.max(14, (innerWidth - f0.width) / 2) + 'px'; kart.style.top = Math.max(60, (innerHeight - f0.height) / 2) + 'px';
  const f = kart.getBoundingClientRect();
  const kf = [{ transform: `translate(${r.left - f.left}px,${r.top - f.top}px) scale(${r.width / f.width},${r.height / f.height})`, borderRadius: '22px' }, { transform: 'none' }];
  kart.animate(kf, { duration: hizli() ? 1 : 480, easing: 'cubic-bezier(.2,.9,.25,1.05)' });
  el.style.visibility = 'hidden'; setTimeout(() => animasyon(kart), 120);
  const kapa = (sonra) => { bg.classList.remove('on'); const f2 = kart.getBoundingClientRect(); kart.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${r.left - f2.left}px,${r.top - f2.top}px) scale(${r.width / f2.width},${r.height / f2.height})`, opacity: .4 }], { duration: hizli() ? 1 : 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => { el.style.visibility = ''; bg.remove(); sonra && sonra(); }; };
  bg.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { e.stopPropagation(); if (b.dataset.k === 'seans') kapa(() => UI.kayit(h.id)); if (b.dataset.k === 'app') { const rr = el.getBoundingClientRect(); kapa(() => UI.bolum(alan, rr)); } return; } if (!e.target.closest('.pop-k') || e.target.closest('.grid') === null && !e.target.closest('.pop-list')) kapa(); });
}

/* ---------- uygulamalar: simgeden büyüyerek açılır, uygulama içinde uygulama ---------- */
const OZET_APP = { id: 'ozet', ad: 'Haftalık Özet', kisa: 'Özet', ikon: '📊', renk: '#5e5ce6' };
const PLANLAR = {
  spor: ['Antrenman ve günlük hareket takibi', 'Apple Sağlık\'tan adım, uyku, antrenman (Kestirmeler ile)', 'Halısaha ve spor etkinlikleri'],
  saglik: ['Tahlil ve doktor raporlarından değer grafikleri', 'Ne yediysen gir → kalori ve besin hesabı', 'Takviyeler ve beslenme düzeni'],
  muzik: ['Gitar pratiği: teknik ve parça çalışma, BPM ilerlemesi', 'Ders ve video önerileri', 'Şarkı defteri: Türkçe/İngilizce sözler, fikir → kayıt'],
  okuma: ['Kitaplığım: okuyor / bitti / okunacak', 'Sesli kitap', 'Alıntılar → ilham defteri'],
  dil: ['İngilizce ve Almanca serileri', 'Kelime kartları ve tekrar', 'Haber ve kısa okumalar'],
  takvim: ['İş, maçlar, halısaha, tatiller, resmi tatiller', 'Doğum günleri ve hediye önerici', 'Esnek planın günlere yerleşimi'],
  film: ['İzleme listesi ve hedefleri', 'İzlediklerim ve puanlarım'],
  hobi: ['PC oyunları, kodlama, Lego', 'Yeni hobi önerileri ve denemeler', 'Hobi alışveriş listesi'],
  para: ['Bakiye, günlük / haftalık / aylık harcama', 'Birikim ve satın alma hedefleri', 'Banka dökümünden otomatik hesaplama']
};
let APP_KAYNAK = null;
UI.bolum = function (id, kaynak) {
  if (id === 'ana') { kapat(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  if (id === 'ayarlar') return UI.ayarlar();
  if (id === 'ekle') return UI.alanEkle();
  uygulamaAc(id, kaynak);
};
function uygulamaAc(id, kaynak) {
  const a = id === 'ozet' ? OZET_APP : alanBul(id) || { id, ad: id, ikon: '•', renk: '#888' };
  document.querySelectorAll('.appv').forEach(x => x.remove());
  const v = document.createElement('div'); v.className = 'appv'; v.style.setProperty('--c', a.renk);
  const eski = ILK; ILK = true;
  v.innerHTML = `<div class="appbar"><button class="geri" data-k="geri">${svgIkon('geri', 22, 2.2)}<span>Ana Ekran</span></button><b class="appbar-ad">${esc(a.kisa || a.ad)}</b><span style="width:80px"></span></div>
    <div class="appic"><div class="apphead"><div class="appikon">${ikonHtml(a, 30)}</div><div><div class="app" style="--c:${a.renk}">Uygulama</div><h1>${esc(a.ad)}</h1></div></div>${id === 'ozet' ? ozetHtml() : appHtml(a)}</div>`;
  ILK = eski;
  document.body.appendChild(v);
  const r = kaynak || $('#tutamak').getBoundingClientRect();
  const sx = r.width / innerWidth, sy = r.height / innerHeight;
  v.animate([{ transform: `translate(${r.left}px,${r.top}px) scale(${sx},${sy})`, borderRadius: '40%', opacity: .5 }, { transform: 'translate(0,0) scale(1)', borderRadius: '0', opacity: 1 }], { duration: hizli() ? 1 : 520, easing: 'cubic-bezier(.2,.9,.22,1)' }).onfinish = () => animasyon(v);
  v.querySelector('.appic').animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: hizli() ? 1 : 420, delay: hizli() ? 0 : 120, easing: 'ease-out', fill: 'backwards' });
  APP_KAYNAK = r;
  const kapa = () => { const r2 = APP_KAYNAK; v.animate([{ transform: 'none', borderRadius: '0', opacity: 1 }, { transform: `translate(${r2.left}px,${r2.top}px) scale(${r2.width / innerWidth},${r2.height / innerHeight})`, borderRadius: '40%', opacity: 0 }], { duration: hizli() ? 1 : 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => v.remove(); };
  v.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; if (b.dataset.k === 'geri') kapa(); if (b.dataset.k === 'seans') UI.kayit(b.dataset.h); if (b.dataset.k === 'harcama') UI.harcama(); });
  v.addEventListener('scroll', () => { v.querySelector('.appbar').classList.toggle('dolu', v.scrollTop > 50); }, { passive: true });
  // kenardan sağa kaydırarak geri (iOS)
  let t = null;
  v.addEventListener('touchstart', e => { const x = e.touches[0].clientX; t = x < 24 ? { x, y: e.touches[0].clientY } : null; }, { passive: true });
  v.addEventListener('touchmove', e => { if (!t) return; const dx = e.touches[0].clientX - t.x; if (dx > 0) { v.style.transform = `translateX(${dx}px)`; t.dx = dx; } }, { passive: true });
  v.addEventListener('touchend', () => { if (!t) return; const dx = t.dx || 0; t = null; if (dx > 110) { v.animate([{ transform: `translateX(${dx}px)` }, { transform: `translateX(${innerWidth}px)` }], { duration: 220, fill: 'forwards' }).onfinish = () => v.remove(); } else { v.style.transition = 'transform .25s'; v.style.transform = ''; setTimeout(() => v.style.transition = '', 260); } });
}
function appHtml(a) {
  const ilgili = hedefler().filter(h => alanOf(h) === a.id);
  let h = '';
  if (ilgili.length) h += `<div class="bolumbas">Hedefler</div><div class="grid">${ilgili.map(x => `<div class="w w-s" style="--c:${renk(x)}" data-k="seans" data-h="${x.id}"><div class="glow"></div>${WT.hedef.ciz({ tur: 'hedef', boyut: 's', ref: x.id })}</div>`).join('')}</div>`;
  if (a.id === 'para') h += `<div class="bolumbas">Bu ay</div><div class="grid">${wHtml({ id: 'ap', tur: 'para', boyut: 'm' }, false)}</div>`;
  if (a.id === 'takvim') h += `<div class="bolumbas">Takvim</div><div class="grid">${wHtml({ id: 'at', tur: 'takvim', boyut: 'l' }, false)}${wHtml({ id: 'ao', tur: 'ozelgun', boyut: 's' }, false)}</div>`;
  if (a.id === 'dil') h += `<div class="bolumbas">Bugün</div><div class="grid">${wHtml({ id: 'ak', tur: 'kelime', boyut: 'm' }, false)}</div>`;
  const p = PLANLAR[a.id];
  h += `<div class="bolumbas">Yakında</div><div class="liste-k">${(p || ['Bu uygulamayı birlikte tasarlayacağız']).map(x => `<div class="li"><i style="background:${a.renk}"></i>${esc(x)}</div>`).join('')}<div class="mut small" style="padding:10px 2px 0">Bu uygulamayı birlikte, adım adım tasarlayacağız ✨</div></div>`;
  return h;
}

/* ---------- haftalık özet ---------- */
function ozetHtml() {
  const bu = haftaBasi(), gecen = gunEkle(bu, -7);
  const dk = (b, hid) => aralikSeans(b, 7, hid).reduce((s, k) => s + (+k.dk || 0), 0);
  const buDk = dk(bu), gDk = dk(gecen), fark = gDk ? Math.round((buDk - gDk) / gDk * 100) : null;
  const kq = kotali(), kapanan = kq.filter(h => haftaOran(h) >= 1).length;
  const ok = (a, b) => a > b ? `<span style="color:var(--ok)">▲</span>` : a < b ? `<span style="color:#ff453a">▼</span>` : '<span class="mut">•</span>';
  const gunBu = [...Array(7)].map((_, i) => aralikSeans(gunEkle(bu, i), 1).reduce((s, k) => s + (+k.dk || 0), 0));
  const gunG = [...Array(7)].map((_, i) => aralikSeans(gunEkle(gecen, i), 1).reduce((s, k) => s + (+k.dk || 0), 0));
  const mx = Math.max(30, ...gunBu, ...gunG);
  const enIyi = gunBu.indexOf(Math.max(...gunBu));
  const dil = {}; aralikSeans(bu, 7).forEach(k => { const s = new Date(k.tarih).getHours(); const d = s < 12 ? 'Sabah' : s < 17 ? 'Öğleden sonra' : s < 23 ? 'Akşam' : 'Gece'; dil[d] = (dil[d] || 0) + (+k.dk || 0); });
  const enDil = Object.entries(dil).sort((a, b) => b[1] - a[1])[0];
  const harc = b => canli(D.finans.harcamalar).filter(x => { const t = (x.tarih || '').slice(0, 10); return t >= gunStr(b) && t < gunStr(gunEkle(b, 7)); }).reduce((s, x) => s + (+x.tutar || 0), 0);
  const hb = harc(bu), hg = harc(gecen);
  const aralik = `${bu.getDate()} ${AYLAR[bu.getMonth()].slice(0, 3)} – ${gunEkle(bu, 6).getDate()} ${AYLAR[gunEkle(bu, 6).getMonth()].slice(0, 3)}`;
  return `<div class="mut" style="margin:-6px 0 10px;font-weight:600">${aralik}</div>
    <div class="grid">
      <div class="w w-l" style="--c:#ff2d6f"><div class="glow"></div>${WT.halkalar.ciz({ boyut: 'l' })}</div>
      <div class="w w-s" style="--c:#19e6ff"><div class="wh"><h2>Toplam süre</h2></div><div class="big">${Math.floor(buDk / 60)}<span class="mut" style="font-size:14px"> sa </span>${buDk % 60}<span class="mut" style="font-size:14px"> dk</span></div><div class="small" style="margin-top:6px">${fark === null ? '<span class="mut">Geçen hafta kayıt yok</span>' : `${ok(buDk, gDk)} geçen haftaya göre %${Math.abs(fark)}`}</div><div class="small mut" style="margin-top:auto">Geçen hafta ${dkYaz(gDk)}</div></div>
      <div class="w w-s" style="--c:#30d158"><div class="wh"><h2>Halkalar</h2></div><div class="big">${kapanan}<span class="mut" style="font-size:16px">/${kq.length}</span></div><div class="small mut" style="margin-top:6px">kapanan halka</div><div class="small" style="margin-top:auto">🔥 ${seri()} gün seri</div></div>
      <div class="w w-m" style="--c:#5e5ce6"><div class="glow"></div><div class="wh"><h2>Bu hafta vs geçen hafta</h2><small><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5e5ce6"></i> bu · <i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--fill3)"></i> geçen</small></div>
        <div class="bars">${gunBu.map((d, i) => `<div class="bcol ${i === enIyi && d ? 'bugun' : ''}"><div style="flex:1;width:100%;display:flex;gap:3px;align-items:flex-end;justify-content:center"><div class="bstack" style="max-width:12px;height:100%"><i style="background:var(--fill3);height:${ILK ? 0 : gunG[i] / mx * 100}%" data-h="${gunG[i] / mx * 100}"></i></div><div class="bstack" style="max-width:12px;height:100%"><i style="background:#5e5ce6;height:${ILK ? 0 : d / mx * 100}%" data-h="${d / mx * 100}"></i></div></div><span>${GUN_KISA[gunEkle(bu, i).getDay()]}</span></div>`).join('')}</div></div>
    </div>
    <div class="bolumbas">Hedef hedef</div><div class="liste-k">${kq.map(h => { const a = dk(bu, h.id), b = dk(gecen, h.id); return `<div class="li" style="justify-content:space-between"><span style="display:flex;align-items:center;gap:10px"><i style="background:${renk(h)}"></i>${esc(h.ad)}</span><span>${dkYaz(a)} ${ok(a, b)} <span class="mut small">${dkYaz(b)}</span></span></div>`; }).join('')}</div>
    <div class="bolumbas">Öne çıkanlar</div><div class="liste-k">
      <div class="li">⭐ En verimli gün: <b style="margin-left:auto">${gunBu[enIyi] ? GUNLER[gunEkle(bu, enIyi).getDay()] + ' · ' + dkYaz(gunBu[enIyi]) : '—'}</b></div>
      <div class="li">🕐 En verimli zaman: <b style="margin-left:auto">${enDil ? enDil[0] : '—'}</b></div>
      <div class="li">💳 Bu hafta harcama: <b style="margin-left:auto">${tl(hb)} ${ok(hg, hb)}</b></div>
      <div class="li">🏆 Rozetler: <b style="margin-left:auto">${rozetler().filter(r => r.ok).length}/${rozetler().length}</b></div>
    </div>`;
}

/* ---------- halka kutlaması (Apple Fitness gibi) ---------- */
function kutla(h, tur) {
  if (hizli()) return toast(`🎉 ${h.ad} halkası kapandı!`);
  const c = renk(h); const bg = katman('kutla');
  bg.innerHTML = `<canvas></canvas><div class="kutla-ic"><div class="parilti" style="--c:${c}"></div><div class="kutla-ring">${halkalar([{ oran: 1, renk: c }], 26, 0)}<div class="ringmid" style="font-size:44px">${AYAR.ikon === 'cizgi' && SVG[alanOf(h)] ? `<span style="color:${c}">${svgIkon(alanOf(h), 48, 1.6)}</span>` : esc(h.ikon)}</div></div>
    <h2>${tur > 1 ? `${tur}. tur! 🌀` : 'Halka kapandı!'}</h2><p>${esc(h.ad)} · haftalık hedefin tamam</p><div class="mut small">Kapatmak için dokun</div></div>`;
  const fg = bg.querySelector('.kutla-ring .fg'); if (fg) { fg.style.strokeDashoffset = fg.getAttribute('stroke-dasharray'); requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)'; fg.style.strokeDashoffset = 0; })); }
  const cv = bg.querySelector('canvas'), ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const renkler = [c, '#ffd60a', '#19e6ff', '#ff2d6f', '#9cff2e', '#bf5af2', '#ffffff'];
  const P = [...Array(140)].map(() => ({ x: innerWidth / 2, y: innerHeight * 0.42, vx: (Math.random() - .5) * 14, vy: -Math.random() * 15 - 4, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .4, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, c: renkler[Math.floor(Math.random() * renkler.length)] }));
  let son = performance.now(), canli2 = true;
  (function f(t) { if (!canli2) return; const dt = Math.min(2, (t - son) / 16.7); son = t; ctx.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach(p => { p.vy += 0.38 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); ctx.restore(); });
    if (P.some(p => p.y < innerHeight + 20)) requestAnimationFrame(f); })(son);
  const kapa = () => { canli2 = false; bg.classList.remove('on'); setTimeout(() => bg.remove(), 300); };
  bg.addEventListener('click', kapa); setTimeout(kapa, 4200);
}

/* ---------- ayarlar ---------- */
UI.ayarlar = function () {
  const c = AYAR.cihaz || cihazTahmin();
  const seg = (k, ops) => `<div class="seg2" data-ayar="${k}">${ops.map(([v, a]) => `<button class="${AYAR[k] === v ? 'on' : ''}" data-v="${v}">${a}</button>`).join('')}</div>`;
  sheet(`<h3>Ayarlar <span class="mut small" style="font-weight:600">sürüm 9</span></h3>
    <div class="grp"><div class="grp-b">Profil</div><div class="hucre"><span>Adın</span><input id="s_ad" value="${esc(AYAR.ad)}" placeholder="İsteğe bağlı" style="max-width:180px;text-align:right;background:none;border:0;padding:4px"></div></div>
    <div class="grp"><div class="grp-b">Görünüm</div>
      <div class="hucre col"><span>Tema</span>${seg('tema', [['oto', 'Otomatik'], ['acik', 'Açık'], ['koyu', 'Koyu']])}</div>
      <div class="hucre col"><span>İkonlar</span>${seg('ikon', [['cizgi', 'Çizgi (SF)'], ['emoji', 'Emoji']])}</div>
      <div class="hucre col"><span>Animasyonlar</span>${seg('anim', [['tam', 'Tam'], ['az', 'Azaltılmış']])}</div></div>
    <div class="grp"><div class="grp-b">Cihaz</div>
      <div class="hucre"><span>Marka</span><select id="s_marka">${Object.keys(MODELLER).map(m => `<option ${c.marka === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class="hucre"><span>Model</span><select id="s_model">${(MODELLER[c.marka] || MODELLER.Diğer).map(([m]) => `<option ${c.model === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class="hucre"><span class="mut small">Algılanan: ${esc(cihazTahmin().model)}</span><button class="chip" id="s_algila">Algıla</button></div></div>
    <div class="grp"><div class="grp-b">Ana ekran</div>
      <div class="hucre tik" onclick="UI.kapat();UI.duzenle(true)"><span>Düzenle</span><span class="mut">›</span></div>
      <div class="hucre tik" onclick="UI.kapat();UI.duzenle(true);setTimeout(UI.galeri,400)"><span>Widget ekle</span><span class="mut">›</span></div>
      <div class="hucre tik" onclick="if(confirm('Ana ekran varsayılana dönsün mü?')){UIA.yerlesim=varsayilanYerlesim();kaydetUI();UI.kapat();ILK=true;ciz()}"><span style="color:#ff453a">Varsayılana dön</span></div></div>
    <div class="grp"><div class="grp-b">Bağlantı (özel GitHub reposu)</div>
      <div class="hucre"><span>Kullanıcı</span><input id="c_o" value="${esc(CFG.owner)}" autocapitalize="off" style="max-width:190px;text-align:right;background:none;border:0;padding:4px"></div>
      <div class="hucre"><span>Repo</span><input id="c_r" value="${esc(CFG.repo)}" autocapitalize="off" style="max-width:190px;text-align:right;background:none;border:0;padding:4px"></div>
      <div class="hucre"><span>Anahtar</span><input id="c_t" type="password" value="${esc(CFG.token)}" placeholder="github_pat_…" autocapitalize="off" style="max-width:190px;text-align:right;background:none;border:0;padding:4px"></div>
      <div class="hucre tik" onclick="UI.ayarKaydet()"><span style="color:#0a84ff">Kaydet ve eşitle</span></div></div>
    <p class="mut small" style="text-align:center">Son eşitleme: ${SON_SYNC ? new Date(SON_SYNC).toLocaleString('tr-TR') : '—'}${SYNC_HATA ? '<br>Hata: ' + esc(SYNC_HATA) : ''}</p>
    <div class="grp"><div class="hucre tik" onclick="UI.kapat();onboarding(true)"><span>Kurulum sihirbazını yeniden aç</span><span class="mut">›</span></div></div>`);
  const sh = $('#sheet');
  sh.querySelectorAll('.seg2').forEach(s => s.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); AYAR[s.dataset.ayar] = b.dataset.v; ayarKaydet(); temaUygula(); Petek.kume(); ILK = false; ciz(); }));
  $('#s_ad').addEventListener('change', e => { AYAR.ad = e.target.value.trim(); ayarKaydet(); ciz(); });
  const modelYaz = () => { const mk = $('#s_marka').value; $('#s_model').innerHTML = MODELLER[mk].map(([m]) => `<option>${m}</option>`).join(''); };
  const cihazKaydet = () => { const mk = $('#s_marka').value, md = $('#s_model').value; AYAR.cihaz = { marka: mk, model: md, ust: (MODELLER[mk].find(x => x[0] === md) || [0, 'yok'])[1] }; ayarKaydet(); temaUygula(); toast(md + ' seçildi'); };
  $('#s_marka').addEventListener('change', () => { modelYaz(); cihazKaydet(); }); $('#s_model').addEventListener('change', cihazKaydet);
  $('#s_algila').addEventListener('click', () => { const t = cihazTahmin(); $('#s_marka').value = t.marka; modelYaz(); $('#s_model').value = t.model; cihazKaydet(); });
};

/* ---------- ilk kurulum sihirbazı ---------- */
function onboarding(yeniden) {
  if (AYAR.kurulum && !yeniden) return;
  const t = AYAR.cihaz || cihazTahmin(); let adim = 0;
  const o = document.createElement('div'); o.className = 'onb'; document.body.appendChild(o);
  const adimlar = [
    () => `<img class="onb-app" src="icon-512.png" alt=""><h1>blacksheep'e<br>hoş geldin</h1><p>Hedeflerin, alışkanlıkların, takvimin ve paran tek yerde. Önce birkaç küçük ayar.</p><input id="o_ad" placeholder="Adın (isteğe bağlı)" value="${esc(AYAR.ad)}">`,
    () => `<div class="onb-ic">${svgIkon('ayarlar', 56, 1.4)}</div><h1>Telefonun bu mu?</h1><p>Ekranı telefonuna göre ayarlayacağım. Sonradan Ayarlar'dan değiştirebilirsin.</p>
      <div class="onb-kart secili" data-k="evet"><b>${esc(t.model)}</b><span>${t.ust === 'ada' ? 'Dynamic Island' : t.ust === 'centik' ? 'Çentikli ekran' : 'Standart ekran'} · algılandı</span></div>
      <div class="onb-sec"><select id="o_marka">${Object.keys(MODELLER).map(m => `<option ${t.marka === m ? 'selected' : ''}>${m}</option>`).join('')}</select><select id="o_model">${MODELLER[t.marka].map(([m]) => `<option ${t.model === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>`,
    () => `<div class="onb-ic">${svgIkon('izgara', 56, 1.4)}</div><h1>Görünüm</h1><p>Sistemle otomatik değişsin ya da kendin seç.</p>
      <div class="onb-tema">${[['oto', 'Otomatik'], ['acik', 'Açık'], ['koyu', 'Koyu']].map(([v, a]) => `<div class="tm ${AYAR.tema === v ? 'secili' : ''}" data-tema="${v}"><div class="tm-o tm-${v}"><i></i><i></i><i></i></div><span>${a}</span></div>`).join('')}</div>
      <div class="seg2" id="o_ikon" style="margin-top:18px"><button class="${AYAR.ikon === 'cizgi' ? 'on' : ''}" data-v="cizgi">Çizgi ikonlar</button><button class="${AYAR.ikon === 'emoji' ? 'on' : ''}" data-v="emoji">Emoji</button></div>`
  ];
  function goster(yon = 1) {
    o.innerHTML = `<div class="onb-ic-k">${adimlar[adim]()}</div><div class="onb-alt"><div class="noktalar">${adimlar.map((_, i) => `<i class="${i === adim ? 'on' : ''}"></i>`).join('')}</div><button class="btn" id="o_ileri">${adim === adimlar.length - 1 ? 'Başla' : 'Devam'}</button>${adim ? '<button class="pillbtn" id="o_geri" style="background:none;color:var(--mut)">Geri</button>' : ''}</div>`;
    o.querySelector('.onb-ic-k').animate([{ opacity: 0, transform: `translateX(${40 * yon}px)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1)' });
    animasyon(o); const sv = o.querySelectorAll('.onb-hero .fg'); sv.forEach(c => { c.style.strokeDashoffset = c.dataset.off; });
    if (adim === 1) { const mk = $('#o_marka'), md = $('#o_model'); mk.onchange = () => { md.innerHTML = MODELLER[mk.value].map(([m]) => `<option>${m}</option>`).join(''); o.querySelector('.onb-kart').classList.remove('secili'); }; md.onchange = () => o.querySelector('.onb-kart').classList.remove('secili'); o.querySelector('.onb-kart').onclick = e => { e.currentTarget.classList.add('secili'); mk.value = t.marka; mk.onchange(); md.value = t.model; e.currentTarget.classList.add('secili'); }; }
    if (adim === 2) { o.querySelectorAll('.tm').forEach(x => x.onclick = () => { o.querySelectorAll('.tm').forEach(y => y.classList.remove('secili')); x.classList.add('secili'); AYAR.tema = x.dataset.tema; temaUygula(); }); o.querySelectorAll('#o_ikon button').forEach(b => b.onclick = () => { o.querySelectorAll('#o_ikon button').forEach(y => y.classList.toggle('on', y === b)); AYAR.ikon = b.dataset.v; }); }
    $('#o_ileri').onclick = () => {
      if (adim === 0) AYAR.ad = ($('#o_ad').value || '').trim();
      if (adim === 1) { const mk = $('#o_marka').value, md = $('#o_model').value; AYAR.cihaz = { marka: mk, model: md, ust: (MODELLER[mk].find(x => x[0] === md) || [0, 'yok'])[1] }; }
      if (adim < adimlar.length - 1) { adim++; goster(1); return; }
      AYAR.kurulum = true; ayarKaydet(); temaUygula(); Petek.kume();
      o.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.08)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => o.remove();
      ILK = true; ciz(); if (!CFG.token) setTimeout(UI.ayarlar, 500);
    };
    const g = $('#o_geri'); if (g) g.onclick = () => { adim--; goster(-1); };
  }
  goster();
}

/* ---------- başlat ---------- */
Petek.kume(); ILK = true; ciz();
onboarding();
