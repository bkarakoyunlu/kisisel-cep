/* Kişisel Asistan — ana ekran (spor uygulaması tarzı ilerleme panosu) + döner menü */
'use strict';

/* ---------- kelime kartları (ileride Dil bölümü bunu besleyecek) ---------- */
const KELIMELER = [
  { w: 'resilient', dil: '🇬🇧', a: 'dayanıklı, çabuk toparlanan', o: 'She stayed resilient through the storm.' },
  { w: 'yearn', dil: '🇬🇧', a: 'hasretini çekmek, özlemek', o: 'I yearn for the open road.' },
  { w: 'ember', dil: '🇬🇧', a: 'kor, için için yanan parça', o: 'The last embers of the fire.' },
  { w: 'haunt', dil: '🇬🇧', a: 'aklından çıkmamak, musallat olmak', o: 'That melody still haunts me.' },
  { w: 'wander', dil: '🇬🇧', a: 'amaçsızca dolaşmak', o: 'Not all those who wander are lost.' },
  { w: 'die Sehnsucht', dil: '🇩🇪', a: 'özlem, hasret', o: 'Ich habe Sehnsucht nach dir.' },
  { w: 'das Fernweh', dil: '🇩🇪', a: 'uzaklara gitme özlemi', o: 'Im Winter habe ich oft Fernweh.' },
  { w: 'träumen', dil: '🇩🇪', a: 'hayal etmek, rüya görmek', o: 'Ich träume von Musik.' },
  { w: 'die Stimme', dil: '🇩🇪', a: 'ses (insan sesi)', o: 'Sie hat eine schöne Stimme.' },
  { w: 'restless', dil: '🇬🇧', a: 'huzursuz, yerinde duramayan', o: 'A restless heart.' }
];

/* ---------- ana ekran widget'ları ---------- */
const WIDGETLAR = {
  siradaki: { ad: 'Sıradaki', ciz: wSiradaki },
  grafik: { ad: 'Odak dağılımı', ciz: wGrafik },
  basari: { ad: 'Başarımlar', ciz: wBasari },
  takvim: { ad: 'Takvim', ciz: wTakvim },
  para: { ad: 'Para', ciz: wPara },
  kelime: { ad: 'Günün kelimesi', ciz: wKelime },
  isi: { ad: 'Çalışma haritası', ciz: wIsi },
  ilham: { ad: 'İlham kartı', ciz: wIlham }
};
const VARS_DUZEN = ['siradaki', 'grafik', 'takvim', 'basari', 'para', 'kelime', 'isi', 'ilham'];
let UIA = oku(LS.ui, {}); UIA.duzen = (UIA.duzen || VARS_DUZEN).filter(k => WIDGETLAR[k]); VARS_DUZEN.forEach(k => { if (!UIA.duzen.includes(k)) UIA.duzen.push(k); }); UIA.gizli = UIA.gizli || [];
let DUZENLE = false, ILK = true, GRAFIK_MOD = 'gun', RING_SET = 0;

/* ---------- SVG halkalar ---------- */
function halkalar(liste, boyut = 200, kalin = 17, bosluk = 4, animasyon = true) {
  const c = boyut / 2; let svg = `<svg class="rings" viewBox="0 0 ${boyut} ${boyut}">`;
  liste.forEach((x, i) => {
    const r = c - kalin / 2 - i * (kalin + bosluk); if (r < kalin / 2) return;
    const C = 2 * Math.PI * r, p = Math.min(1, x.oran), off = C * (1 - p);
    svg += `<circle cx="${c}" cy="${c}" r="${r}" stroke="${x.renk}" stroke-opacity=".2" stroke-width="${kalin}"/>
      <circle class="fg" cx="${c}" cy="${c}" r="${r}" stroke="${x.renk}" stroke-width="${kalin}" stroke-dasharray="${C}" stroke-dashoffset="${animasyon ? C : off}" data-off="${off}" transform="rotate(-90 ${c} ${c})" ${p >= 1 ? `style="filter:drop-shadow(0 0 4px ${x.renk})"` : ''}/>`;
    if (x.oran > 1) { // kotayı aşınca ikinci tur (Apple'daki gibi)
      const off2 = C * (1 - Math.min(1, x.oran - 1));
      svg += `<circle class="fg" cx="${c}" cy="${c}" r="${r}" stroke="${x.renk}" stroke-width="${kalin}" stroke-dasharray="${C}" stroke-dashoffset="${animasyon ? C : off2}" data-off="${off2}" transform="rotate(-90 ${c} ${c})" style="filter:brightness(1.25) drop-shadow(0 0 3px #000)"/>`;
    }
  });
  return svg + '</svg>';
}
const kisa = n => Math.abs(n) >= 10000 ? (n / 1000).toFixed(1).replace('.', ',') + 'B' : Math.round(+n || 0).toLocaleString('tr-TR');
function miniHalka(oran, renkK) { return halkalar([{ oran, renk: renkK }], 40, 6, 0, !!ILK); }

/* ---------- ana ekran ---------- */
function anaEkran() {
  const hs = hedefler().filter(h => h.haftalikSeans > 0);
  const setler = []; for (let i = 0; i < hs.length; i += 4) setler.push(hs.slice(i, i + 4));
  if (RING_SET >= setler.length) RING_SET = 0;
  const odak = setler[RING_SET] || [];
  const genelOran = hs.length ? hs.reduce((s, h) => s + Math.min(1, haftaOran(h)), 0) / hs.length : 0;
  const haftaDk = aralikSeans(haftaBasi(), 7).reduce((s, k) => s + (+k.dk || 0), 0);
  const p = paraOzet(); const yak = yaklasanGunler(60)[0]; const sr = seri();

  let h = '';
  if (!CFG.token) h += `<div class="card"><div class="ch"><h2>👋 Kurulum</h2></div><p class="mut" style="margin:0 0 12px">Verilerinin özel GitHub repona kaydedilmesi için anahtarını gir.</p><button class="btn" onclick="UI.ayarlar()">Kurulum</button></div>`;

  h += `<div class="hero">
    <div class="ringcard" onclick="UI.ringDegis()">${halkalar(odak.map(x => ({ oran: haftaOran(x), renk: renk(x) })), 200, 15, 3, ILK)}
      <div class="ringmid"><div><b data-say="${Math.round(genelOran * 100)}">${ILK ? 0 : Math.round(genelOran * 100)}</b><span>% hafta</span></div></div>
      ${setler.length > 1 ? `<div style="position:absolute;bottom:8px;display:flex;gap:4px">${setler.map((_, i) => `<i style="width:5px;height:5px;border-radius:50%;background:${i === RING_SET ? '#fff' : '#444'}"></i>`).join('')}</div>` : ''}
    </div>
    <div class="mini4">
      <div class="mini" style="--g:#ff9500" onclick="UI.bolum('takvim')"><div class="ic">🔥</div><div><b data-say="${sr}">${ILK ? 0 : sr}</b><span>gün seri</span></div></div>
      <div class="mini" style="--g:#19e6ff"><div class="ic">⏱</div><div><b>${(haftaDk / 60).toFixed(1).replace('.', ',')} sa</b><span>bu hafta</span></div></div>
      <div class="mini" style="--g:#30d158" onclick="UI.bolum('para')"><div class="ic">💳</div><div><b style="color:${p.maas && p.kalan < 0 ? '#ff453a' : 'inherit'}">${p.maas ? kisa(p.kalan) : kisa(p.harcama)}</b><span>₺ ${p.maas ? 'ay kalan' : 'bu ay harcama'}</span></div></div>
      <div class="mini" style="--g:#bf5af2" onclick="UI.bolum('kisiler')"><div class="ic">🎂</div><div><b>${yak ? (yak.kalan === 0 ? 'Bugün' : yak.kalan + ' gün') : '—'}</b><span>${yak ? esc(yak.kisi.ad) : 'özel gün yok'}</span></div></div>
    </div></div>`;

  h += `<div class="strip">${hedefler().map(x => { const o = haftaOran(x), n = haftaSeans(x.id).length; return `<div class="pill ${x.haftalikSeans && o >= 1 ? 'tam' : ''}" style="--c:${renk(x)}" onclick="UI.kayit('${x.id}')">${miniHalka(x.haftalikSeans ? o : 0, renk(x))}<div><b>${esc(x.ikon)} ${esc(x.ad)}</b><span>${x.haftalikSeans ? `${n}/${x.haftalikSeans} ${o >= 1 ? '✓' : ''}` : `${n} seans`}</span></div></div>`; }).join('')}</div>`;

  for (const k of UIA.duzen) {
    if (UIA.gizli.includes(k)) continue;
    const ic = WIDGETLAR[k].ciz(); if (!ic) continue;
    h += `<div class="card" data-w="${k}"><div class="editbar"><button class="eb" onclick="UI.tasi('${k}',-1)">↑</button><button class="eb" onclick="UI.tasi('${k}',1)">↓</button><button class="eb" onclick="UI.gizle('${k}')">✕</button></div>${ic}</div>`;
  }
  const gz = UIA.gizli.filter(k => WIDGETLAR[k]);
  h += `<div class="gizli-list card"><div class="ch"><h2>Gizlenen widget'lar</h2></div>${gz.length ? `<div class="chips">${gz.map(k => `<button class="chip" onclick="UI.goster('${k}')">＋ ${WIDGETLAR[k].ad}</button>`).join('')}</div>` : '<div class="empty">Hepsi ekranda</div>'}</div>`;
  return h;
}

function wSiradaki() {
  const { liste } = bugunPlani(); const kap = kapasite();
  const bugunEtk = yaklasanGunler(0); const gd = oku(LS.gun, {})[gunStr()];
  let h = '';
  if (bugunEtk.length && !gd) h += `<div class="evt" style="margin:0 0 12px;flex-direction:column;align-items:stretch">🎉 Bugün ${bugunEtk.map(y => `<b>${esc(y.kisi.ad)}</b> – ${esc(y.ad)}`).join(', ')}. Bir planın var mı?<div class="row" style="margin-top:8px"><button class="btn" onclick="UI.kapasite('yogun',true)">Evet, hafif tut</button><button class="btn ghost" onclick="UI.kapasite('normal',true)">Hayır</button></div></div>`;
  h += `<div class="ch"><h2>Sıradaki</h2><div class="seg">${[['yogun', 'Yoğun'], ['normal', 'Normal'], ['bos', 'Boş']].map(([k, a]) => `<button class="${kap === k ? 'on' : ''}" onclick="UI.kapasite('${k}')">${a}</button>`).join('')}</div></div>`;
  h += liste.length ? liste.map(o => `<div class="next" style="--c:${renk(o.h)}"><div class="emo">${esc(o.h.ikon)}</div><div class="grow"><b>${esc(o.h.ad)}</b> <span class="mut small">${o.dk} dk</span><div class="mut small">${o.neden ? esc(o.neden.replace('Plan: ', '')) : `${o.kalan} seans kaldı · ${o.yapilan}/${o.h.haftalikSeans}`}</div></div><button class="go" onclick="UI.kayit('${o.h.id}')">Yaptım</button></div>`).join('')
    : `<div class="empty">${hedefler().length ? 'Bugünlük bu kadar 👏 Kotalar yolunda.' : 'Hedef yok'}</div>`;
  return h;
}

function wGrafik() {
  const hs = hedefler(); const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  let gunler, etiket;
  if (GRAFIK_MOD === 'gun') { gunler = [...Array(7)].map((_, i) => ({ bas: gunEkle(bugun, i - 6), n: 1 })); etiket = g => GUN_KISA[g.bas.getDay()]; }
  else { gunler = [...Array(6)].map((_, i) => ({ bas: gunEkle(haftaBasi(), -7 * (5 - i)), n: 7 })); etiket = g => `${g.bas.getDate()}.${g.bas.getMonth() + 1}`; }
  const veri = gunler.map(g => { const ks = aralikSeans(g.bas, g.n); const m = {}; ks.forEach(k => m[k.hedefId] = (m[k.hedefId] || 0) + (+k.dk || 0)); return { g, m, top: ks.reduce((s, k) => s + (+k.dk || 0), 0) }; });
  const max = Math.max(30, ...veri.map(v => v.top));
  const toplamlar = {}; veri.forEach(v => Object.entries(v.m).forEach(([k, d]) => toplamlar[k] = (toplamlar[k] || 0) + d));
  const tum = Object.values(toplamlar).reduce((a, b) => a + b, 0);
  return `<div class="ch"><h2>Odak dağılımı</h2><div class="seg"><button class="${GRAFIK_MOD === 'gun' ? 'on' : ''}" onclick="UI.grafik('gun')">7 gün</button><button class="${GRAFIK_MOD === 'hafta' ? 'on' : ''}" onclick="UI.grafik('hafta')">6 hafta</button></div></div>
    <div style="margin:-4px 0 6px"><b style="font-size:26px;font-weight:800;letter-spacing:-.5px">${Math.floor(tum / 60)}<span class="mut small"> sa </span>${tum % 60}<span class="mut small"> dk</span></b></div>
    <div class="bars">${veri.map((v, i) => `<div class="bcol ${GRAFIK_MOD === 'gun' && i === 6 ? 'bugun' : ''}"><div class="bstack">${hs.filter(x => v.m[x.id]).map(x => `<i style="background:${renk(x)};height:${ILK ? 0 : v.m[x.id] / max * 100}%" data-h="${v.m[x.id] / max * 100}"></i>`).join('')}</div><span>${etiket(v.g)}</span></div>`).join('')}</div>
    <div class="legend">${Object.entries(toplamlar).sort((a, b) => b[1] - a[1]).map(([k, d]) => { const x = hedefBul(k); return x ? `<div><i style="background:${renk(x)}"></i>${esc(x.ad)} <b>${d >= 60 ? (d / 60).toFixed(1).replace('.', ',') + ' sa' : d + ' dk'}</b></div>` : ''; }).join('') || '<div>Henüz kayıt yok</div>'}</div>`;
}

function rozetler() {
  const s = seanslar(), dk = s.reduce((a, k) => a + (+k.dk || 0), 0), es = enUzunSeri();
  const kotali = hedefler().filter(h => h.haftalikSeans); const tamam = kotali.filter(h => haftaOran(h) >= 1).length;
  const dkOf = id => s.filter(k => k.hedefId === id).reduce((a, k) => a + (+k.dk || 0), 0);
  return [
    { ad: 'İlk adım', i: '👟', c: '#ff2d6f', ok: s.length >= 1 },
    { ad: '3 gün seri', i: '🔥', c: '#ff9500', ok: es >= 3 },
    { ad: '7 gün seri', i: '⚡️', c: '#ffd60a', ok: es >= 7 },
    { ad: '30 gün seri', i: '👑', c: '#ffd60a', ok: es >= 30 },
    { ad: 'Kota ustası', i: '🎯', c: '#30d158', ok: tamam >= 1 },
    { ad: 'Hepsi tamam', i: '🏆', c: '#bf5af2', ok: kotali.length > 0 && tamam === kotali.length },
    { ad: '10 saat', i: '⏳', c: '#19e6ff', ok: dk >= 600 },
    { ad: '100 saat', i: '💎', c: '#0a84ff', ok: dk >= 6000 },
    { ad: 'Gitar 10 sa', i: '🎸', c: '#ff9500', ok: dkOf('gitar') >= 600 },
    { ad: 'Kitap kurdu', i: '📚', c: '#9cff2e', ok: s.filter(k => k.hedefId === 'okuma').length >= 20 }
  ];
}
function wBasari() {
  const hs = hedefler().filter(h => h.haftalikSeans); const tamam = hs.filter(h => haftaOran(h) >= 1);
  const ks = haftaSeans(null); const rz = rozetler(); const acik = rz.filter(r => r.ok).length;
  return `<div class="ch"><h2>Başarımlar</h2><small>${acik}/${rz.length} rozet</small></div>
    <div class="bigstat"><div><b>${tamam.length}/${hs.length}</b><span>kota tamam</span></div><div><b>${ks.length}</b><span>seans (hafta)</span></div><div><b>${enUzunSeri()}</b><span>en uzun seri</span></div></div>
    <div class="rozetler">${rz.sort((a, b) => b.ok - a.ok).map(r => `<div class="rozet ${r.ok ? 'acik' : ''}" style="--c:${r.c}"><div class="r">${r.i}</div><span>${r.ad}</span></div>`).join('')}</div>`;
}

function wTakvim() {
  const bas = haftaBasi(); const bs = gunStr(); const yak = yaklasanGunler(30);
  const plan = (D.plan && D.plan.gunler) || {};
  let h = `<div class="ch"><h2>${AYLAR[new Date().getMonth()]}</h2><small>● yapılan ○ planlı</small></div><div class="week">`;
  for (let i = 0; i < 7; i++) {
    const g = gunEkle(bas, i), s = gunStr(g);
    const yapilan = [...new Set(seanslar().filter(k => k.tarih.slice(0, 10) === s).map(k => k.hedefId))];
    const planli = s > bs ? (plan[s] || []).map(p => p.hedefId) : [];
    const etk = yak.some(y => gunStr(y.tarih) === s);
    h += `<div class="wd ${s === bs ? 'bugun' : ''}"><div class="n">${GUN_KISA[g.getDay()]}</div><div class="d">${g.getDate()}</div><div class="dots">${yapilan.map(id => `<i style="background:${renk(hedefBul(id))}"></i>`).join('')}${planli.map(id => `<i style="box-shadow:inset 0 0 0 1px ${renk(hedefBul(id))}"></i>`).join('')}${etk ? '<i style="background:#fff"></i>' : ''}</div></div>`;
  }
  h += `</div>`;
  const y = yak[0];
  if (y) h += `<div class="evt">🎂<div class="grow"><b>${esc(y.kisi.ad)}</b> <span class="mut">· ${esc(y.ad)}</span></div><b>${y.kalan === 0 ? 'Bugün' : y.tarih.getDate() + ' ' + AYLAR[y.tarih.getMonth()].slice(0, 3)}</b></div>`;
  return h;
}

function wPara() {
  const p = paraOzet(); const toplam = Math.max(p.maas, p.harcama + p.sabit, 1);
  const katlar = Object.entries(p.kat).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return `<div class="ch"><h2>Para</h2><small>${AYLAR[new Date().getMonth()]}</small></div>
    <div class="money"><div class="mut small">${p.maas ? 'Ay sonuna kalan (tahmini)' : 'Bu ay harcama'}</div><b class="k" style="color:${p.maas && p.kalan < 0 ? '#ff453a' : 'inherit'}">${p.maas ? tl(p.kalan) : tl(p.harcama)}</b>
    <div class="track"><i style="width:${p.sabit / toplam * 100}%;background:#0a84ff"></i><i style="width:${p.harcama / toplam * 100}%;background:#30d158"></i></div>
    <div class="legend" style="margin-top:6px"><div><i style="background:#0a84ff"></i>Sabit <b>${tl(p.sabit)}</b></div><div><i style="background:#30d158"></i>Harcama <b>${tl(p.harcama)}</b></div>${p.maas ? `<div><i style="background:#3a3a42"></i>Maaş <b>${tl(p.maas)}</b></div>` : ''}</div>
    ${katlar.length ? `<div class="katlar">${katlar.map(([k, v]) => `<div><span>${esc(k)}</span><b>${tl(v)}</b></div>`).join('')}</div>` : ''}
    <button class="btn" style="margin-top:14px;background:#30d158" onclick="UI.harcama()">＋ Harcama</button></div>`;
}

function wKelime() {
  const gun = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
  const k = KELIMELER[gun % KELIMELER.length];
  return `<div class="ch"><h2>Günün kelimesi</h2><small>dokun, çevir</small></div>
    <div class="flip" onclick="this.classList.toggle('on')"><div class="in">
      <div class="yz"><div class="mut small">${k.dil} Biliyor musun?</div><div class="w">${esc(k.w)}</div></div>
      <div class="yz ar"><div class="w" style="font-size:20px">${esc(k.a)}</div><div class="mut small" style="margin-top:6px;font-style:italic">“${esc(k.o)}”</div></div>
    </div></div>`;
}

function wIsi() {
  const m = gunDakika(); const hafta = 17; const bas = gunEkle(haftaBasi(), -7 * (hafta - 1)); const bs = gunStr();
  let h = `<div class="ch"><h2>Çalışma haritası</h2><small>son ${hafta} hafta</small></div><div class="heat">`;
  for (let i = 0; i < hafta * 7; i++) {
    const s = gunStr(gunEkle(bas, i)); const d = m[s] || 0;
    const l = s > bs || d === 0 ? '' : d < 20 ? 'l1' : d < 45 ? 'l2' : d < 90 ? 'l3' : 'l4';
    h += `<i class="${l}" style="${s > bs ? 'opacity:.25;' : ''}${s === bs ? 'outline:1.5px solid #fff;' : ''}"></i>`;
  }
  const kare = c => `<i style="width:10px;height:10px;border-radius:3px;background:${c};display:inline-block"></i>`;
  return h + `</div><div class="row small mut" style="justify-content:flex-end;gap:4px;margin-top:8px">az ${kare('#3b0f20')}${kare('#7a1838')}${kare('#c4204f')}${kare('#ff2d6f')} çok</div>`;
}

function wIlham() {
  const i = D.plan && D.plan.ilham; if (!i) return '';
  return `<div class="ch"><h2>💡 İlham</h2></div><div style="font-size:16px">${esc(i.metin || i)}</div>${i.kaynak ? `<div class="mut small" style="margin-top:6px">${esc(i.kaynak)}</div>` : ''}`;
}

/* ---------- çizim ---------- */
function ciz() {
  const d = new Date(); const s = d.getHours();
  $('#tarih').textContent = `${GUNLER[d.getDay()]}, ${d.getDate()} ${AYLAR[d.getMonth()]}`;
  $('#selam').textContent = s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar';
  $('#main').innerHTML = anaEkran();
  $('#main').classList.toggle('duzenle', DUZENLE);
  durum();
  if (ILK) requestAnimationFrame(() => requestAnimationFrame(animasyon));
}
function animasyon() {
  document.querySelectorAll('.rings .fg').forEach(c => c.style.strokeDashoffset = c.dataset.off);
  document.querySelectorAll('.bstack i').forEach(i => i.style.height = i.dataset.h + '%');
  document.querySelectorAll('[data-say]').forEach(e => { const hedef = +e.dataset.say; const t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 1100); e.textContent = Math.round(hedef * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  document.querySelectorAll('.ilk .card,.ilk .strip').forEach((c, i) => c.style.animationDelay = (0.08 + i * 0.06) + 's');
  setTimeout(() => { ILK = false; document.body.classList.remove('ilk'); }, 1600);
}
function durum() {
  const dot = $('#syncdot'); if (!dot) return; const b = Object.keys(KIRLI).length;
  dot.className = 'dot ' + (SYNC_HATA ? 'hata' : SYNC_SURUYOR || b ? 'bekle' : CFG.token ? 'ok' : '');
}
Olay.addEventListener('veri', () => { if (!ILK) ciz(); });
Olay.addEventListener('durum', durum);

/* ---------- döner menü (Apple Watch esinli) ---------- */
const MENU = [
  { id: 'ana', ad: 'Ana Ekran', ikon: '🏠', c: '#f5f5f7' },
  { id: 'spor', ad: 'Spor', ikon: '🏋️', c: RENKLER.spor },
  { id: 'gitar', ad: 'Gitar', ikon: '🎸', c: RENKLER.gitar },
  { id: 'okuma', ad: 'Okuma', ikon: '📖', c: RENKLER.okuma },
  { id: 'dil', ad: 'Dil', ikon: '🌍', c: RENKLER.ingilizce },
  { id: 'sarki', ad: 'Şarkı', ikon: '✍️', c: RENKLER.sarki },
  { id: 'hobi', ad: 'Hobi', ikon: '🧩', c: RENKLER.hobi },
  { id: 'saglik', ad: 'Sağlık', ikon: '🩺', c: '#64d2ff' },
  { id: 'kisiler', ad: 'Kişiler', ikon: '🎁', c: '#ff9f0a' },
  { id: 'takvim', ad: 'Takvim', ikon: '📅', c: '#ff375f' },
  { id: 'para', ad: 'Para', ikon: '💳', c: '#30d158' },
  { id: 'ayarlar', ad: 'Ayarlar', ikon: '⚙️', c: '#8e8e93' }
];
const Dial = (() => {
  const el = $('#dial'), arc = $('#arc'), lbl = $('#dlbl'); const N = MENU.length, ADIM = 360 / N;
  let rot = 0, R = 0, cx = 0, cy = 0, surukle = null, anim = null;
  const items = MENU.map((m, i) => { const d = document.createElement('div'); d.className = 'item'; d.style.setProperty('--c', m.c); d.textContent = m.ikon; d.dataset.i = i; el.appendChild(d); return d; });
  function olc() { const w = el.clientWidth; R = Math.max(190, w * 0.62); cx = w / 2; cy = 62 + R; arc.style.width = arc.style.height = (2 * R + 40) + 'px'; arc.style.top = '32px'; yerlestir(); }
  const norm = a => ((a % 360) + 540) % 360 - 180;
  function yerlestir() {
    let enYakin = 0, enAz = 999;
    items.forEach((d, i) => {
      const a = norm(i * ADIM + rot), rad = a * Math.PI / 180;
      const x = cx + R * Math.sin(rad), y = cy - R * Math.cos(rad);
      const yak = Math.max(0, 1 - Math.abs(a) / 80), s = 0.62 + 0.48 * yak * yak;
      d.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      d.style.opacity = Math.abs(a) > 85 ? 0 : 0.35 + 0.65 * yak;
      d.style.zIndex = Math.round(yak * 10);
      if (Math.abs(a) < enAz) { enAz = Math.abs(a); enYakin = i; }
    });
    lbl.textContent = MENU[enYakin].ad; lbl.style.color = enAz < 4 ? 'var(--text)' : 'var(--mut)';
  }
  function git(hedef, sonra) {
    cancelAnimationFrame(anim);
    const adim = () => { rot += (hedef - rot) * 0.2; if (Math.abs(hedef - rot) < 0.1) { rot = hedef; yerlestir(); sonra && sonra(); return; } yerlestir(); anim = requestAnimationFrame(adim); };
    anim = requestAnimationFrame(adim);
  }
  const secili = () => ((Math.round(-rot / ADIM) % N) + N) % N;
  function sec(i, ac = true) { const fark = norm(i * ADIM + rot); git(rot - fark, () => { if (ac) UI.bolum(MENU[i].id); }); }
  el.addEventListener('pointerdown', e => { if (!e.target.closest('.item,.arc')) return; surukle = { x: e.clientX, r: rot, hiz: 0, lx: e.clientX, lt: performance.now(), hedef: e.target.closest('.item') }; cancelAnimationFrame(anim); el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => { if (!surukle) return; const now = performance.now(); surukle.hiz = (e.clientX - surukle.lx) / Math.max(1, now - surukle.lt); surukle.lx = e.clientX; surukle.lt = now; rot = surukle.r + (e.clientX - surukle.x) * (90 / R) * 0.9; yerlestir(); });
  const birak = e => {
    if (!surukle) return; const dx = Math.abs(e.clientX - surukle.x); const s = surukle; surukle = null;
    if (dx < 6) { if (s.hedef) { const i = +s.hedef.dataset.i; if (i === secili()) UI.bolum(MENU[i].id); else sec(i); } else git(Math.round(rot / ADIM) * ADIM); return; }
    const atalet = rot + s.hiz * 180 * (90 / R); git(Math.round(atalet / ADIM) * ADIM, () => { const i = secili(); if (MENU[i].id !== 'ana') UI.bolum(MENU[i].id); });
  };
  el.addEventListener('pointerup', birak); el.addEventListener('pointercancel', birak);
  window.addEventListener('resize', olc); olc();
  return { anaya: () => sec(0, false) };
})();

/* ---------- alt pencereler ---------- */
function sheet(html, kapaninca) { $('#sheet').innerHTML = '<div class="grab"></div>' + html; $('#sheetbg').classList.add('on'); sheet.kap = kapaninca; }
function kapat() { $('#sheetbg').classList.remove('on'); const f = sheet.kap; sheet.kap = null; f && f(); }
$('#sheetbg').addEventListener('click', e => { if (e.target.id === 'sheetbg') kapat(); });
const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
function segSec(el) { el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); el.classList.add('on'); }

const UI = {
  kapat,
  duzenle() { DUZENLE = !DUZENLE; $('#editbtn').classList.toggle('on', DUZENLE); ciz(); if (DUZENLE) toast("Widget'ları taşı ya da gizle"); },
  tasi(k, y) { const d = UIA.duzen, i = d.indexOf(k), j = i + y; if (j < 0 || j >= d.length) return; [d[i], d[j]] = [d[j], d[i]]; yaz(LS.ui, UIA); ciz(); },
  gizle(k) { UIA.gizli.push(k); yaz(LS.ui, UIA); ciz(); },
  goster(k) { UIA.gizli = UIA.gizli.filter(x => x !== k); yaz(LS.ui, UIA); ciz(); },
  ringDegis() { RING_SET++; ILK = true; ciz(); },
  grafik(m) { GRAFIK_MOD = m; ILK = true; ciz(); },
  kapasite(k, etk) { const g = oku(LS.gun, {}); g[gunStr()] = { kapasite: k, etkinlik: !!etk }; yaz(LS.gun, g); ciz(); if (etk && k === 'yogun') toast('Tamam, bugün hafif tutuyorum 🎉'); },
  kayit(hid) {
    const h = hedefBul(hid); if (!h) return; const dk = h.seansDk || 20;
    sheet(`<h3>${esc(h.ikon)} ${esc(h.ad)}</h3><div class="mut small">Bu hafta ${haftaSeans(h.id).length}/${h.haftalikSeans || '—'} seans</div>
      <label>Kaç dakika?</label><div class="chips" style="--c:${renk(h)}">${[10, 15, 20, 30, 45, 60, 90].map(n => `<button class="chip ${n === dk ? 'on' : ''}" onclick="segSec(this);document.getElementById('kdk').value=${n}">${n}</button>`).join('')}</div>
      <input id="kdk" type="number" inputmode="numeric" value="${dk}" style="margin-top:10px">
      <label>Not</label><textarea id="knot" placeholder="Ne çalıştın, nasıl geçti?"></textarea>
      <label>Ne zaman?</label><input id="kzaman" type="datetime-local" value="${yerelISO().slice(0, 16)}">
      <button class="btn" style="margin-top:16px;background:${renk(h)}" onclick="UI.kayitKaydet('${hid}')">Kaydet</button>`);
  },
  kayitKaydet(hid) { const z = val('kzaman'); seansEkle(hid, val('kdk'), val('knot'), z ? z + ':00' : yerelISO()); kapat(); toast('Kaydedildi 💪'); ILK = true; document.body.classList.add('ilk'); ciz(); },
  harcama(on = {}) {
    const k = D.finans.kategoriler || VARSAYILAN.finans.kategoriler;
    sheet(`<h3>💳 Harcama</h3><label>Tutar (₺)</label><input id="ht" type="number" inputmode="decimal" value="${esc(on.tutar || '')}">
      <label>Kategori</label><div class="chips" id="hkat" style="--c:#30d158">${k.map((c, i) => `<button class="chip ${(on.kategori ? on.kategori === c : i === 0) ? 'on' : ''}" onclick="segSec(this)">${esc(c)}</button>`).join('')}</div>
      <label>Not</label><input id="hn" placeholder="ör. Starbucks">
      <button class="btn" style="margin-top:16px;background:#30d158" onclick="UI.harcamaKaydet()">Kaydet</button>`);
    setTimeout(() => $('#ht') && $('#ht').focus(), 350);
  },
  harcamaKaydet() { const t = parseFloat(val('ht').replace(',', '.')); if (!t) return toast('Tutar gir'); harcamaEkle(t, ($('#hkat .chip.on') || {}).textContent || 'Diğer', val('hn')); kapat(); toast(`${tl(t)} kaydedildi`); },
  ayarlar() {
    sheet(`<h3>⚙️ Ayarlar</h3><p class="mut small">Verilerin <b>özel</b> GitHub reponda. Anahtar sadece bu cihazda saklanır.</p>
      <label>GitHub kullanıcı adı</label><input id="c_o" value="${esc(CFG.owner)}" autocapitalize="off">
      <label>Veri reposu</label><input id="c_r" value="${esc(CFG.repo)}" autocapitalize="off">
      <label>Erişim anahtarı</label><input id="c_t" type="password" value="${esc(CFG.token)}" placeholder="github_pat_…" autocapitalize="off">
      <button class="btn" style="margin-top:16px" onclick="UI.ayarKaydet()">Kaydet ve eşitle</button>
      <p class="mut small" style="margin-top:14px">Son eşitleme: ${SON_SYNC ? new Date(SON_SYNC).toLocaleString('tr-TR') : '—'}${SYNC_HATA ? '<br>Hata: ' + esc(SYNC_HATA) : ''}</p>`, () => Dial.anaya());
  },
  ayarKaydet() { CFG = { owner: val('c_o'), repo: val('c_r'), token: val('c_t') }; yaz(LS.cfg, CFG); kapat(); sync(true); },
  bolum(id) {
    if (id === 'ana') { kapat(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (id === 'ayarlar') return UI.ayarlar();
    if (id === 'para') return sheet(`<h3>💳 Para</h3><p class="mut" style="margin-top:0">Para bölümü sırada: bütçe, abonelikler, kart dönemi ve dilek listesi burada olacak.</p><div class="card" style="background:var(--card2)">${wPara()}</div>`, () => Dial.anaya());
    const m = MENU.find(x => x.id === id);
    const ilgili = id === 'dil' ? hedefler().filter(h => ['ingilizce', 'almanca'].includes(h.id)) : hedefler().filter(h => h.id === id);
    sheet(`<h3>${m ? m.ikon + ' ' + m.ad : id}</h3><p class="mut" style="margin-top:0">Bu bölümü birlikte tasarlayacağız. Şimdilik hızlı kayıt:</p>
      ${ilgili.map(h => `<div class="next" style="--c:${renk(h)}"><div class="emo">${esc(h.ikon)}</div><div class="grow"><b>${esc(h.ad)}</b><div class="mut small">Bu hafta ${haftaSeans(h.id).length}/${h.haftalikSeans || '—'}</div></div><button class="go" onclick="UI.kayit('${h.id}')">＋ Seans</button></div>`).join('') || '<div class="empty">Yakında ✨</div>'}`, () => Dial.anaya());
  }
};
window.UI = UI; window.segSec = segSec;

/* ---------- Kestirme linkleri: ?harcama=150&kategori=Kahve  /  ?seans=gitar&dk=30 ---------- */
(function linkIsle() {
  const p = new URLSearchParams(location.search); let ok = false;
  if (p.has('harcama')) { const t = parseFloat(String(p.get('harcama')).replace(',', '.')); if (t) { harcamaEkle(t, p.get('kategori') || 'Diğer', p.get('not') || ''); setTimeout(() => toast(`${tl(t)} kaydedildi ✓`), 400); } else setTimeout(() => UI.harcama({ kategori: p.get('kategori') }), 500); ok = true; }
  if (p.has('seans')) { const q = p.get('seans').toLocaleLowerCase('tr'); const h = canli(D.hedefler).find(x => x.id === q || x.ad.toLocaleLowerCase('tr').includes(q)); if (h) { if (p.has('dk')) { seansEkle(h.id, p.get('dk'), p.get('not') || '', yerelISO(), 'kestirme'); setTimeout(() => toast(`${h.ad} kaydedildi 💪`), 400); } else setTimeout(() => UI.kayit(h.id), 500); ok = true; } }
  if (ok) history.replaceState(null, '', location.pathname);
})();

window.addEventListener('online', () => sync());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
ciz();
sync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
