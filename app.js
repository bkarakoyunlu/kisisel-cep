/* Kişisel Asistan — ana ekran: widget sergisi (xs/s/m/l), düzenleme (sürükle-bırak), 3B yığın,
   döner menü ve Apple Watch tarzı uygulama küresi */
'use strict';

/* ---------- kelime kartları (ileride Dil uygulaması besleyecek) ---------- */
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
const PALET = ['#ff2d6f', '#ff3b30', '#ff9500', '#ffd60a', '#9cff2e', '#30d158', '#19e6ff', '#64d2ff', '#0a84ff', '#5e5ce6', '#bf5af2', '#ff6ac1'];
const BOY_AD = { xs: 'Mini', s: 'Küçük', m: 'Orta', l: 'Büyük' };
let ILK = true, DUZENLE = false, SUPPRESS = 0;
const kisa = n => Math.abs(n) >= 10000 ? (n / 1000).toFixed(1).replace('.', ',') + 'B' : Math.round(+n || 0).toLocaleString('tr-TR');
const kotali = () => hedefler().filter(h => h.haftalikSeans > 0);
const dkYaz = d => d >= 60 ? (d / 60).toFixed(1).replace('.', ',') + ' sa' : d + ' dk';

/* ---------- halkalar: her halka bir tam tur = haftalık hedef; aşınca tur atmaya devam eder ---------- */
function halkalar(liste, kalin, bosluk, boyut = 200) {
  const c = boyut / 2; const n = liste.length || 1;
  if (!kalin) { const per = (c - 24) / n; kalin = Math.min(16, per * 0.74); bosluk = Math.min(4, per * 0.26); }
  let svg = `<svg class="rings" viewBox="0 0 ${boyut} ${boyut}">`;
  liste.forEach((x, i) => {
    const r = c - kalin / 2 - i * (kalin + bosluk); if (r < kalin) return;
    const C = 2 * Math.PI * r, o = Math.max(0, x.oran || 0);
    const arc = (p, ek = '') => { const off = C * (1 - p); return `<circle class="fg" cx="${c}" cy="${c}" r="${r}" stroke="${x.renk}" stroke-width="${kalin}" stroke-dasharray="${C}" stroke-dashoffset="${ILK ? C : off}" data-off="${off}" transform="rotate(-90 ${c} ${c})" ${ek}/>`; };
    svg += `<circle cx="${c}" cy="${c}" r="${r}" stroke="${x.renk}" stroke-opacity=".18" stroke-width="${kalin}"/>`;
    if (o <= 1) svg += arc(o, o >= 1 ? `style="filter:drop-shadow(0 0 3px ${x.renk})"` : '');
    else { const kalan = o % 1 || 1; svg += arc(1) + arc(kalan, `style="filter:drop-shadow(-1px 0 ${kalin / 4}px rgba(0,0,0,.75)) brightness(1.15)"`); }
  });
  return svg + '</svg>';
}
const tekHalka = (oran, renkK, kalin = 22) => halkalar([{ oran, renk: renkK }], kalin, 0);
const turEtiket = o => o >= 2 ? `×${Math.floor(o)}` : o >= 1 ? '✓' : '';

/* ---------- widget türleri ---------- */
const bas = (ikon, ad, sag = '') => `<div class="wh"><h2>${ikon ? ikon + ' ' : ''}${esc(ad)}</h2>${sag ? `<small>${sag}</small>` : ''}</div>`;
const say = n => `<output data-say="${n}">${ILK ? 0 : n}</output>`;

const WT = {
  halkalar: {
    ad: 'Hedef halkaları', grup: 'Genel', renk: '#ff2d6f', boyutlar: ['s', 'm', 'l'],
    ciz(w) {
      const l = kotali(); const veri = l.map(h => ({ oran: haftaOran(h), renk: renk(h) }));
      const genel = l.length ? Math.round(l.reduce((s, h) => s + Math.min(1, haftaOran(h)), 0) / l.length * 100) : 0;
      const ring = `<div class="ringbox">${halkalar(veri)}<div class="ringmid"><div><b>${say(genel)}</b><span>% hafta</span></div></div></div>`;
      const leg = (arr) => arr.map(h => { const o = haftaOran(h); return `<div><i style="background:${renk(h)}"></i><span>${esc(h.ad)}</span><b>${haftaSeans(h.id).length}/${h.haftalikSeans} <span style="color:${renk(h)}">${turEtiket(o)}</span></b></div>`; }).join('');
      if (w.boyut === 's') return ring;
      if (w.boyut === 'm') return `<div class="row" style="flex:1;min-height:0;gap:14px"><div style="height:100%;aspect-ratio:1;display:flex">${ring}</div><div class="leg grow">${leg(l)}</div></div>`;
      return `${bas('', 'Bu hafta', `${l.filter(h => haftaOran(h) >= 1).length}/${l.length} tamam`)}<div style="flex:1;min-height:0;display:flex;padding:4px 30px">${ring}</div><div class="leg" style="display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;margin-top:10px">${leg(l)}</div>`;
    }
  },
  seri: {
    ad: 'Seri', grup: 'Genel', renk: '#ff9500', boyutlar: ['xs', 's'],
    ciz(w) {
      const n = seri();
      if (w.boyut === 'xs') return `<div class="xsv"><div class="ic">🔥</div><div><b>${say(n)}</b><span>gün seri</span></div></div>`;
      const set = new Set(seanslar().map(k => k.tarih.slice(0, 10)));
      return `${bas('🔥', 'Seri')}<div class="big">${say(n)} <span class="mut" style="font-size:14px;font-weight:600">gün</span></div><div class="mut small" style="margin-top:4px">En uzun: ${enUzunSeri()} gün</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:auto">${[...Array(14)].map((_, i) => { const g = gunEkle(new Date(), i - 13); return `<i style="aspect-ratio:1;border-radius:50%;background:${set.has(gunStr(g)) ? '#ff9500' : 'var(--card2)'};${i === 13 ? 'outline:1.5px solid #fff' : ''}"></i>`; }).join('')}</div>`;
    }
  },
  sure: {
    ad: 'Çalışma süresi', grup: 'Genel', renk: '#19e6ff', boyutlar: ['xs', 's'],
    ciz(w) {
      const hafta = aralikSeans(haftaBasi(), 7).reduce((s, k) => s + (+k.dk || 0), 0);
      if (w.boyut === 'xs') return `<div class="xsv"><div class="ic">⏱</div><div><b>${(hafta / 60).toFixed(1).replace('.', ',')} sa</b><span>bu hafta</span></div></div>`;
      const m = gunDakika(); const gunler = [...Array(7)].map((_, i) => gunEkle(new Date(), i - 6)); const mx = Math.max(30, ...gunler.map(g => m[gunStr(g)] || 0));
      return `${bas('⏱', 'Süre')}<div class="big">${m[gunStr()] || 0}<span class="mut" style="font-size:14px;font-weight:600"> dk bugün</span></div><div class="mut small" style="margin-top:4px">Bu hafta ${dkYaz(hafta)}</div>
        <div class="bars" style="margin-top:8px">${gunler.map((g, i) => `<div class="bcol ${i === 6 ? 'bugun' : ''}"><div class="bstack"><i style="background:#19e6ff;height:${ILK ? 0 : (m[gunStr(g)] || 0) / mx * 100}%" data-h="${(m[gunStr(g)] || 0) / mx * 100}"></i></div></div>`).join('')}</div>`;
    }
  },
  hedef: {
    ad: 'Hedef', grup: 'Hedefler', boyutlar: ['xs', 's', 'm'],
    ciz(w) {
      const h = hedefBul(w.ref); if (!h || h.silindi) return '<div class="empty">Hedef silinmiş</div>';
      const n = haftaSeans(h.id).length, q = h.haftalikSeans, o = q ? n / q : 0, c = renk(h);
      const dk = haftaSeans(h.id).reduce((s, k) => s + (+k.dk || 0), 0);
      if (w.boyut === 'xs') return `<div style="flex:1;min-height:0;position:relative;display:flex">${tekHalka(o, c, 26)}<div class="ringmid" style="font-size:20px">${esc(h.ikon)}</div></div><div style="text-align:center;font-size:11px;font-weight:700;margin-top:2px">${q ? `${n}/${q}` : n} <span style="color:${c}">${turEtiket(o)}</span></div>`;
      const ring = `<div class="ringbox">${tekHalka(o, c, 20)}<div class="ringmid"><div><b>${n}/${q || '—'}</b><span>seans</span></div></div></div>`;
      if (w.boyut === 's') return `<div class="wh"><h2>${esc(h.ikon)} ${esc(h.ad)}</h2></div>${ring}<div class="mut small" style="text-align:center;margin-top:4px">${dkYaz(dk)} bu hafta</div>`;
      const gunler = [...Array(7)].map((_, i) => gunEkle(haftaBasi(), i)); const ks = haftaSeans(h.id); const mx = Math.max(h.seansDk || 30, ...gunler.map(g => ks.filter(k => k.tarih.slice(0, 10) === gunStr(g)).reduce((s, k) => s + (+k.dk || 0), 0)));
      const tas = (h.kilometreTaslari || []).find(t => !t.tamam);
      return `<div class="row" style="flex:1;min-height:0;gap:14px"><div style="height:100%;aspect-ratio:1;display:flex">${ring}</div><div class="grow" style="display:flex;flex-direction:column;height:100%">
        <div class="wh" style="margin-bottom:4px"><h2>${esc(h.ikon)} ${esc(h.ad)}</h2><small>${dkYaz(dk)}</small></div>
        <div class="bars">${gunler.map(g => { const d = ks.filter(k => k.tarih.slice(0, 10) === gunStr(g)).reduce((s, k) => s + (+k.dk || 0), 0); return `<div class="bcol ${gunStr(g) === gunStr() ? 'bugun' : ''}"><div class="bstack"><i style="background:${c};height:${ILK ? 0 : d / mx * 100}%" data-h="${d / mx * 100}"></i></div><span>${GUN_KISA[g.getDay()][0]}</span></div>`; }).join('')}</div>
        ${tas ? `<div class="small" style="margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🏁 ${esc(tas.ad)}</div>` : ''}</div></div>`;
    }
  },
  siradaki: {
    ad: 'Sıradaki', grup: 'Genel', renk: '#f5f5f7', boyutlar: ['m', 'l'],
    ciz(w) {
      const { liste } = bugunPlani(); const kap = kapasite(); const l = liste.slice(0, w.boyut === 'm' ? 2 : 6);
      const etk = yaklasanGunler(0); const gd = oku(LS.gun, {})[gunStr()];
      const soru = etk.length && !gd ? `<div class="evt" style="margin:0 0 8px;flex-wrap:wrap">🎉 Bugün <b>${esc(etk[0].kisi.ad)}</b> – ${esc(etk[0].ad)}. Planın var mı? <button class="mbtn" style="--c:#fff" onclick="event.stopPropagation();UI.kapasite('yogun',true)">Evet</button><button class="mbtn" style="--c:#3a3a42;color:#fff" onclick="event.stopPropagation();UI.kapasite('normal',true)">Hayır</button></div>` : '';
      return `<div class="wh"><h2>Sıradaki</h2><div class="seg" onclick="event.stopPropagation()">${[['yogun', 'Yoğun'], ['normal', 'Normal'], ['bos', 'Boş']].map(([k, a]) => `<button class="${kap === k ? 'on' : ''}" onclick="UI.kapasite('${k}')">${a}</button>`).join('')}</div></div>${soru}
        <div class="fill" style="justify-content:${l.length ? 'flex-start' : 'center'}">${l.length ? l.map(o => `<div class="next" style="--c:${renk(o.h)}"><div class="emo">${esc(o.h.ikon)}</div><div class="grow"><b>${esc(o.h.ad)}</b> <span class="mut small">${o.dk} dk</span><div class="mut small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.neden ? esc(o.neden.replace('Plan: ', '')) : `${o.kalan} seans kaldı`}</div></div><button class="go" onclick="event.stopPropagation();UI.kayit('${o.h.id}')">Yaptım</button></div>`).join('') : `<div class="empty">Bugünlük bu kadar 👏</div>`}</div>`;
    }
  },
  grafik: {
    ad: 'Odak dağılımı', grup: 'Genel', renk: '#bf5af2', boyutlar: ['m', 'l'], varyantlar: ['gun', 'hafta'], varAd: { gun: '7 gün', hafta: '6 hafta' },
    ciz(w) {
      const hs = hedefler(); const bugun = new Date(); bugun.setHours(0, 0, 0, 0); const mod = w.varyant || 'gun';
      const gunler = mod === 'gun' ? [...Array(7)].map((_, i) => ({ b: gunEkle(bugun, i - 6), n: 1 })) : [...Array(6)].map((_, i) => ({ b: gunEkle(haftaBasi(), -7 * (5 - i)), n: 7 }));
      const veri = gunler.map(g => { const ks = aralikSeans(g.b, g.n); const m = {}; ks.forEach(k => m[k.hedefId] = (m[k.hedefId] || 0) + (+k.dk || 0)); return { g, m, top: ks.reduce((s, k) => s + (+k.dk || 0), 0) }; });
      const max = Math.max(30, ...veri.map(v => v.top)); const top = {}; veri.forEach(v => Object.entries(v.m).forEach(([k, d]) => top[k] = (top[k] || 0) + d));
      const tum = Object.values(top).reduce((a, b) => a + b, 0);
      const leg = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, w.boyut === 'm' ? 3 : 10).map(([k, d]) => { const x = hedefBul(k); return x ? `<div><i style="background:${renk(x)}"></i>${esc(x.ad)} <b>${dkYaz(d)}</b></div>` : ''; }).join('');
      return `${bas('', 'Odak dağılımı', `${mod === 'gun' ? '7 gün' : '6 hafta'} · ${dkYaz(tum)}`)}
        <div class="bars">${veri.map((v, i) => `<div class="bcol ${mod === 'gun' && i === 6 ? 'bugun' : ''}"><div class="bstack">${hs.filter(x => v.m[x.id]).map(x => `<i style="background:${renk(x)};height:${ILK ? 0 : v.m[x.id] / max * 100}%" data-h="${v.m[x.id] / max * 100}"></i>`).join('')}</div><span>${mod === 'gun' ? GUN_KISA[v.g.b.getDay()] : v.g.b.getDate() + '.' + (v.g.b.getMonth() + 1)}</span></div>`).join('')}</div>
        <div class="legend">${leg || '<div>Henüz kayıt yok</div>'}</div>`;
    }
  },
  takvim: {
    ad: 'Takvim', grup: 'Takvim', renk: '#ff3b30', boyutlar: ['s', 'm', 'l'],
    ciz(w) {
      const d = new Date(), bs = gunStr(), yak = yaklasanGunler(45), plan = (D.plan && D.plan.gunler) || {};
      const nokta = s => { const yap = [...new Set(seanslar().filter(k => k.tarih.slice(0, 10) === s).map(k => k.hedefId))]; const pl = s > bs ? (plan[s] || []).map(p => p.hedefId) : []; return `<div class="dots">${yap.map(id => `<i style="background:${renk(hedefBul(id))}"></i>`).join('')}${pl.map(id => `<i style="box-shadow:inset 0 0 0 1px ${renk(hedefBul(id))}"></i>`).join('')}${yak.some(y => gunStr(y.tarih) === s) ? '<i style="background:#fff"></i>' : ''}</div>`; };
      const evt = yak[0] ? `<div class="evt">🎂<div class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><b>${esc(yak[0].kisi.ad)}</b> <span class="mut">${esc(yak[0].ad)}</span></div><b>${yak[0].kalan === 0 ? 'Bugün' : yak[0].tarih.getDate() + ' ' + AYLAR[yak[0].tarih.getMonth()].slice(0, 3)}</b></div>` : '';
      if (w.boyut === 's') { const pl = (plan[bs] || []).length; return `<div class="app" style="--c:#ff3b30">${GUNLER[d.getDay()]}</div><div style="font-size:44px;font-weight:300;line-height:1;margin:2px 0 6px">${d.getDate()}</div><div class="small mut">${pl ? `${pl} planlı seans` : 'Plan yok'}</div>${yak[0] ? `<div class="small" style="margin-top:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🎂 ${esc(yak[0].kisi.ad)} · ${yak[0].kalan ? yak[0].kalan + ' gün' : 'bugün'}</div>` : ''}`; }
      if (w.boyut === 'm') { const hb = haftaBasi(); return `${bas('', AYLAR[d.getMonth()], '● yapılan ○ planlı')}<div class="week">${[...Array(7)].map((_, i) => { const g = gunEkle(hb, i), s = gunStr(g); return `<div class="wd ${s === bs ? 'bugun' : ''}"><div class="n">${GUN_KISA[g.getDay()]}</div><div class="d">${g.getDate()}</div>${nokta(s)}</div>`; }).join('')}</div>${evt}`; }
      const ilk = new Date(d.getFullYear(), d.getMonth(), 1), bos = (ilk.getDay() + 6) % 7, gs = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return `${bas('', AYLAR[d.getMonth()] + ' ' + d.getFullYear())}<div class="month">${['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map(x => `<div class="mut" style="font-size:10px">${x}</div>`).join('')}${[...Array(bos)].map(() => '<div></div>').join('')}${[...Array(gs)].map((_, i) => { const s = gunStr(new Date(d.getFullYear(), d.getMonth(), i + 1)); return `<div class="${s === bs ? 'bugun' : ''}">${i + 1}${nokta(s)}</div>`; }).join('')}</div>${evt}`;
    }
  },
  ozelgun: {
    ad: 'Özel günler', grup: 'Takvim', renk: '#ff9f0a', boyutlar: ['xs', 's'],
    ciz(w) {
      const yak = yaklasanGunler(366);
      if (w.boyut === 'xs') { const y = yak[0]; return `<div class="xsv"><div class="ic">🎂</div><div><b>${y ? (y.kalan === 0 ? 'Bugün' : y.kalan + ' gün') : '—'}</b><span>${y ? esc(y.kisi.ad) : 'özel gün yok'}</span></div></div>`; }
      return `${bas('🎂', 'Özel günler')}<div class="fill">${yak.slice(0, 3).map(y => `<div class="next" style="--c:#ff9f0a"><div class="grow"><b>${esc(y.kisi.ad)}</b><div class="mut small">${esc(y.ad)}</div></div><b style="color:#ff9f0a">${y.kalan === 0 ? 'Bugün' : y.kalan + ' g'}</b></div>`).join('') || '<div class="empty">Kişiler eklenince burada</div>'}</div>`;
    }
  },
  basari: {
    ad: 'Başarımlar', grup: 'Genel', renk: '#ffd60a', boyutlar: ['s', 'm'],
    ciz(w) {
      const rz = rozetler().sort((a, b) => b.ok - a.ok); const acik = rz.filter(r => r.ok).length;
      const rozet = r => `<div class="rozet ${r.ok ? 'acik' : ''}" style="--c:${r.c}"><div class="r">${r.i}</div><span>${r.ad}</span></div>`;
      if (w.boyut === 's') return `${bas('🏆', 'Rozetler', `${acik}/${rz.length}`)}<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;flex:1;place-items:center">${rz.slice(0, 4).map(rozet).join('')}</div>`;
      const hs = kotali(); const ks = haftaSeans(null);
      return `${bas('🏆', 'Başarımlar', `${acik}/${rz.length} rozet`)}<div class="stat3"><div><b>${hs.filter(h => haftaOran(h) >= 1).length}/${hs.length}</b><span>kota tamam</span></div><div><b>${ks.length}</b><span>seans (hafta)</span></div><div><b>${enUzunSeri()}</b><span>en uzun seri</span></div></div><div class="rozetler">${rz.map(rozet).join('')}</div>`;
    }
  },
  para: {
    ad: 'Para', grup: 'Para', renk: '#30d158', boyutlar: ['xs', 's', 'm'],
    ciz(w) {
      const p = paraOzet(); const deger = p.maas ? p.kalan : p.harcama; const kirmizi = p.maas && p.kalan < 0 ? 'color:#ff453a' : '';
      if (w.boyut === 'xs') return `<div class="xsv"><div class="ic">💳</div><div><b style="${kirmizi}">${kisa(deger)}</b><span>₺ ${p.maas ? 'ay kalan' : 'harcama'}</span></div></div>`;
      const top = Math.max(p.maas, p.harcama + p.sabit, 1);
      const track = `<div class="track"><i style="width:${p.sabit / top * 100}%;background:#0a84ff"></i><i style="width:${p.harcama / top * 100}%;background:#30d158"></i></div>`;
      const btn = `<button class="mbtn" style="--c:#30d158" onclick="event.stopPropagation();UI.harcama()">＋ Harcama</button>`;
      if (w.boyut === 's') return `${bas('💳', 'Para')}<div class="mut small">${p.maas ? 'Ay kalan' : 'Bu ay harcama'}</div><div style="font-size:26px;font-weight:800;letter-spacing:-.6px;${kirmizi}">${kisa(deger)} ₺</div>${track}<div style="margin-top:auto">${btn}</div>`;
      const kat = Object.entries(p.kat).sort((a, b) => b[1] - a[1]).slice(0, 4);
      return `${bas('💳', 'Para', AYLAR[new Date().getMonth()])}<div class="row between"><div><div class="mut small">${p.maas ? 'Ay sonuna kalan' : 'Bu ay harcama'}</div><div style="font-size:28px;font-weight:800;letter-spacing:-.7px;${kirmizi}">${tl(deger)}</div></div>${btn}</div>${track}
        <div class="legend" style="margin-top:4px"><div><i style="background:#0a84ff"></i>Sabit <b>${tl(p.sabit)}</b></div><div><i style="background:#30d158"></i>Harcama <b>${tl(p.harcama)}</b></div></div>${kat.length ? `<div class="katlar">${kat.map(([k, v]) => `<div><span>${esc(k)}</span><b>${tl(v)}</b></div>`).join('')}</div>` : ''}`;
    }
  },
  kelime: {
    ad: 'Günün kelimesi', grup: 'Dil', renk: '#19e6ff', boyutlar: ['s', 'm'],
    ciz(w) {
      const k = KELIMELER[Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5) % KELIMELER.length];
      return `${bas('', 'Günün kelimesi', 'dokun')}<div class="flip" onclick="event.stopPropagation();this.classList.toggle('on')"><div class="in"><div class="yz"><div class="mut small">${k.dil}</div><div class="kw">${esc(k.w)}</div></div><div class="yz ar"><div class="kw" style="font-size:18px">${esc(k.a)}</div>${w.boyut === 'm' ? `<div class="mut small" style="margin-top:6px;font-style:italic">“${esc(k.o)}”</div>` : ''}</div></div></div>`;
    }
  },
  isi: {
    ad: 'Çalışma haritası', grup: 'Genel', renk: '#ff2d6f', boyutlar: ['m', 'l'],
    ciz(w) {
      const m = gunDakika(), hafta = w.boyut === 'l' ? 18 : 18, bs = gunStr(), b0 = gunEkle(haftaBasi(), -7 * (hafta - 1));
      let h = `${bas('', 'Çalışma haritası', `son ${hafta} hafta`)}<div class="heat">`;
      for (let i = 0; i < hafta * 7; i++) { const s = gunStr(gunEkle(b0, i)), d = m[s] || 0; h += `<i class="${s > bs || !d ? '' : d < 20 ? 'l1' : d < 45 ? 'l2' : d < 90 ? 'l3' : 'l4'}" style="${s > bs ? 'opacity:.25;' : ''}${s === bs ? 'outline:1.5px solid #fff;' : ''}"></i>`; }
      h += '</div>';
      if (w.boyut === 'l') { const ay = Object.entries(m).filter(([s]) => s.slice(0, 7) === bs.slice(0, 7)); h += `<div class="stat3" style="margin:12px 0 0"><div><b>${ay.length}</b><span>aktif gün (ay)</span></div><div><b>${dkYaz(ay.reduce((a, [, d]) => a + d, 0))}</b><span>bu ay</span></div><div><b>${enUzunSeri()}</b><span>en uzun seri</span></div></div>`; }
      return h;
    }
  },
  ilham: {
    ad: 'İlham kartı', grup: 'Müzik', renk: '#bf5af2', boyutlar: ['m'],
    ciz() { const i = D.plan && D.plan.ilham; return `${bas('💡', 'İlham')}<div style="font-size:15px;flex:1">${i ? esc(i.metin || i) : '<span class="mut">PC beyni ilham kartları ekledikçe şarkılarına fikir verecek hikayeler burada görünecek.</span>'}</div>${i && i.kaynak ? `<div class="mut small">${esc(i.kaynak)}</div>` : ''}`; }
  },
  yigin: {
    ad: 'Akıllı yığın (3B)', grup: 'Genel', renk: '#8e8e93', boyutlar: ['s', 'm'],
    ciz(w) {
      const uy = (w.ref || []).map(u => WT[u.tur]).filter(Boolean);
      return `${bas('🗂', 'Yığın', `${uy.length} widget`)}<div class="stack"><div class="ly ly2"></div><div class="ly ly1"></div><div class="ust"><div style="display:flex;flex-wrap:wrap;gap:6px">${uy.map(t => `<span class="chip" style="padding:5px 9px;font-size:12px;background:color-mix(in srgb,${t.renk || '#888'} 22%,#1d1d22)">${esc(t.ad)}</span>`).join('')}</div><div class="mut small" style="margin-top:auto">Dokun, aç ✨</div></div></div>`;
    }
  }
};

/* ---------- rozetler ---------- */
function rozetler() {
  const s = seanslar(), dk = s.reduce((a, k) => a + (+k.dk || 0), 0), es = enUzunSeri(), kq = kotali(), tamam = kq.filter(h => haftaOran(h) >= 1).length;
  const dkOf = id => s.filter(k => k.hedefId === id).reduce((a, k) => a + (+k.dk || 0), 0);
  return [
    { ad: 'İlk adım', i: '👟', c: '#ff2d6f', ok: s.length >= 1 }, { ad: '3 gün seri', i: '🔥', c: '#ff9500', ok: es >= 3 },
    { ad: '7 gün seri', i: '⚡️', c: '#ffd60a', ok: es >= 7 }, { ad: '30 gün seri', i: '👑', c: '#ffd60a', ok: es >= 30 },
    { ad: 'Kota ustası', i: '🎯', c: '#30d158', ok: tamam >= 1 }, { ad: 'Hepsi tamam', i: '🏆', c: '#bf5af2', ok: kq.length > 0 && tamam === kq.length },
    { ad: 'Çift tur', i: '🌀', c: '#19e6ff', ok: kq.some(h => haftaOran(h) >= 2) }, { ad: '10 saat', i: '⏳', c: '#64d2ff', ok: dk >= 600 },
    { ad: '100 saat', i: '💎', c: '#0a84ff', ok: dk >= 6000 }, { ad: 'Gitar 10 sa', i: '🎸', c: '#ff9500', ok: dkOf('gitar') >= 600 },
    { ad: 'Kitap kurdu', i: '📚', c: '#9cff2e', ok: s.filter(k => k.hedefId === 'okuma').length >= 20 }
  ];
}

/* ---------- yerleşim (cihazda saklanır) ---------- */
function varsayilanYerlesim() {
  const y = [{ tur: 'halkalar', boyut: 's' }, { tur: 'seri', boyut: 'xs' }, { tur: 'sure', boyut: 'xs' }, { tur: 'para', boyut: 'xs' }, { tur: 'ozelgun', boyut: 'xs' },
  { tur: 'siradaki', boyut: 'm' }];
  ['gitar', 'okuma', 'ingilizce', 'spor'].forEach(id => y.push({ tur: 'hedef', boyut: 'xs', ref: id }));
  y.push({ tur: 'grafik', boyut: 'm', varyant: 'gun' }, { tur: 'takvim', boyut: 'm' }, { tur: 'basari', boyut: 'm' }, { tur: 'kelime', boyut: 's' },
    { tur: 'yigin', boyut: 's', ref: [{ tur: 'isi', boyut: 'm' }, { tur: 'grafik', boyut: 'm', varyant: 'hafta' }, { tur: 'para', boyut: 'm' }, { tur: 'takvim', boyut: 'l' }] },
    { tur: 'hedef', boyut: 'm', ref: 'gitar' }, { tur: 'para', boyut: 'm' }, { tur: 'isi', boyut: 'm' });
  return y.map(x => ({ id: uid(), ...x }));
}
let UIA = oku(LS.ui, {});
if (UIA.v !== 2) UIA = { v: 2, yerlesim: varsayilanYerlesim() };
const kaydetUI = () => yaz(LS.ui, UIA);

/* ---------- çizim ---------- */
function wHtml(w, edit = true) {
  const t = WT[w.tur]; if (!t) return '';
  const c = w.tur === 'hedef' ? renk(hedefBul(w.ref)) : t.renk;
  return `<div class="w w-${w.boyut}" data-id="${w.id}" style="--c:${c}" onclick="UI.wTik(event,'${w.id}')">${w.boyut !== 'xs' ? '<div class="glow"></div>' : ''}
    ${edit ? `<button class="badge b-sil" onclick="event.stopPropagation();UI.wSil('${w.id}')">−</button><button class="badge b-boy" onclick="event.stopPropagation();UI.wBoy('${w.id}')">${w.boyut.toUpperCase()}</button>${t.varyantlar ? `<button class="badge b-var" onclick="event.stopPropagation();UI.wVar('${w.id}')">◐</button>` : ''}` : ''}
    ${t.ciz(w)}</div>`;
}
function hucre() { const m = $('#main'); const W = Math.min(520, window.innerWidth) - 28; document.documentElement.style.setProperty('--cell', ((W - 3 * 12) / 4) + 'px'); }
function ciz() {
  const d = new Date(), s = d.getHours();
  $('#tarih').textContent = `${GUNLER[d.getDay()]}, ${d.getDate()} ${AYLAR[d.getMonth()]}`;
  $('#selam').textContent = s < 5 ? 'İyi geceler' : s < 12 ? 'Günaydın' : s < 18 ? 'İyi günler' : 'İyi akşamlar';
  let h = '';
  if (!CFG.token) h += `<div class="w w-m" style="margin-bottom:12px;height:auto"><div class="wh"><h2>👋 Kurulum</h2></div><p class="mut" style="margin:0 0 12px">Verilerinin özel GitHub repona kaydedilmesi için anahtarını gir.</p><button class="btn" onclick="UI.ayarlar()">Kurulum</button></div>`;
  h += `<div class="grid" id="grid">${UIA.yerlesim.map(w => wHtml(w)).join('')}</div>`;
  if (!UIA.yerlesim.length) h += `<div class="empty" style="padding:40px 0">Ana ekran boş. ✎ → ＋ Widget ile ekle.</div>`;
  $('#main').innerHTML = h;
  document.body.classList.toggle('duzenle-modu', DUZENLE);
  durum();
  if (ILK) { document.body.classList.add('ilk'); requestAnimationFrame(() => requestAnimationFrame(() => animasyon())); }
}
function animasyon(kok = document) {
  kok.querySelectorAll('.rings .fg').forEach(c => c.style.strokeDashoffset = c.dataset.off);
  kok.querySelectorAll('.bstack i[data-h]').forEach(i => i.style.height = i.dataset.h + '%');
  kok.querySelectorAll('[data-say]').forEach(e => { const n = +e.dataset.say, t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 1100); e.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  if (kok === document) { document.querySelectorAll('.ilk .w').forEach((c, i) => c.style.animationDelay = (0.03 + i * 0.035) + 's'); setTimeout(() => { ILK = false; document.body.classList.remove('ilk'); }, 1700); }
}
function durum() { const dot = $('#syncdot'); if (!dot) return; const b = Object.keys(KIRLI).length; dot.className = 'dot ' + (SYNC_HATA ? 'hata' : SYNC_SURUYOR || b ? 'bekle' : CFG.token ? 'ok' : ''); }
Olay.addEventListener('veri', () => { if (!ILK && !SURUKLE) ciz(); });
Olay.addEventListener('durum', durum);
window.addEventListener('resize', hucre);

/* ---------- düzenleme: uzun bas → düzenle, basılı tut ve sürükle → taşı ---------- */
let BASLA = null, SURUKLE = null;
document.addEventListener('pointerdown', e => {
  const w = e.target.closest('#grid .w'); if (!w || e.target.closest('.badge,button,.seg')) return;
  BASLA = { w, x: e.clientX, y: e.clientY, id: w.dataset.id };
  BASLA.t = setTimeout(() => {
    if (!BASLA) return;
    if (!DUZENLE) { SUPPRESS = Date.now(); BASLA = null; UI.duzenle(true); return; }
    surukleBasla(BASLA, e.clientX, e.clientY);
  }, DUZENLE ? 200 : 550);
});
document.addEventListener('pointermove', e => {
  if (BASLA && !SURUKLE && Math.hypot(e.clientX - BASLA.x, e.clientY - BASLA.y) > 8) { clearTimeout(BASLA.t); BASLA = null; }
  if (!SURUKLE) return;
  const s = SURUKLE; s.clone.style.left = (e.clientX - s.dx) + 'px'; s.clone.style.top = (e.clientY - s.dy) + 'px';
  if (e.clientY < 90) window.scrollBy(0, -10); else if (e.clientY > innerHeight - 200) window.scrollBy(0, 10);
  const hit = document.elementFromPoint(e.clientX, e.clientY); const hw = hit && hit.closest('#grid .w');
  if (hw && hw !== s.w && hw !== s.son) {
    s.son = hw; const L = UIA.yerlesim, a = L.findIndex(x => x.id === s.id), b = L.findIndex(x => x.id === hw.dataset.id);
    const [it] = L.splice(a, 1); L.splice(b, 0, it);
    const g = $('#grid'); if (a < b) g.insertBefore(s.w, hw.nextSibling); else g.insertBefore(s.w, hw);
  } else if (!hw) s.son = null;
});
const birak = () => { if (BASLA) { clearTimeout(BASLA.t); BASLA = null; } if (!SURUKLE) return; SURUKLE.clone.remove(); SURUKLE.w.classList.remove('ph'); SURUKLE = null; SUPPRESS = Date.now(); kaydetUI(); };
document.addEventListener('pointerup', birak); document.addEventListener('pointercancel', birak);
document.addEventListener('touchmove', e => { if (SURUKLE) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', e => { if (e.target.closest('#grid')) e.preventDefault(); });
function surukleBasla(b, x, y) {
  const r = b.w.getBoundingClientRect(); const clone = b.w.cloneNode(true); clone.classList.add('clone');
  Object.assign(clone.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.appendChild(clone); b.w.classList.add('ph');
  SURUKLE = { w: b.w, id: b.id, clone, dx: x - r.left, dy: y - r.top, son: null }; BASLA = null;
}

/* ---------- 3B yığın: dokununca içindeki widget'lar büyüyerek açılır ---------- */
function yiginAc(w) {
  const kaynak = document.querySelector(`[data-id="${w.id}"]`).getBoundingClientRect();
  const uyeler = (w.ref || []).map((u, i) => ({ id: 'y' + i, ...u }));
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = `<button class="pillbtn on kapat">Kapat</button><div class="grid">${uyeler.map(u => wHtml(u, false)).join('')}</div>`;
  document.body.appendChild(ov); const eski = ILK; ILK = true;
  const kartlar = [...ov.querySelectorAll('.w')];
  requestAnimationFrame(() => {
    ov.classList.add('on');
    kartlar.forEach((k, i) => {
      const r = k.getBoundingClientRect(); const sx = kaynak.width / r.width, sy = kaynak.height / r.height;
      k.animate([{ transform: `translate(${kaynak.left - r.left}px,${kaynak.top - r.top}px) scale(${sx},${sy}) perspective(800px) rotateX(-55deg)`, opacity: 0 },
      { transform: 'none', opacity: 1 }], { duration: 650, delay: i * 90, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'backwards' });
    });
    setTimeout(() => { animasyon(ov); ILK = eski; }, 250);
  });
  const kapa = () => {
    kartlar.forEach((k, i) => { const r = k.getBoundingClientRect(); k.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${kaynak.left - r.left}px,${kaynak.top - r.top}px) scale(${kaynak.width / r.width},${kaynak.height / r.height}) perspective(800px) rotateX(-55deg)`, opacity: 0 }], { duration: 380, delay: (kartlar.length - i - 1) * 50, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }); });
    ov.classList.remove('on'); setTimeout(() => ov.remove(), 380 + kartlar.length * 50);
  };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.classList.contains('kapat') || e.target.classList.contains('grid')) kapa(); });
}

/* ---------- menü öğeleri (alanlar + ayarlar + ekle) ---------- */
const menuOgeleri = () => [{ id: 'ana', ad: 'Ana Ekran', ikon: '🏠', renk: '#d1d1d6' }, ...alanlar().map(a => ({ ...a, ad: a.kisa || a.ad })), { id: 'ayarlar', ad: 'Ayarlar', ikon: '⚙️', renk: '#8e8e93' }, { id: 'ekle', ad: 'Yeni alan', ikon: '＋', renk: '#48484f' }];

const Dial = { kur() { Petek.kume(); }, anaya() { } };

/* ---------- Apple Watch tarzı uygulama küresi (petek) ---------- */
const Petek = (() => {
  const el = $('#petek'), adEl = $('#petekad'); let M = [], bubs = [], pos = [], px = 0, py = 0, vx = 0, vy = 0, anim = null, sur = null, W = 0, H = 0;
  const S = 88, YON = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  function hexler(n) { const out = [[0, 0]]; for (let k = 1; out.length < n; k++) { let q = -k, r = k; for (let d = 0; d < 6; d++) for (let j = 0; j < k; j++) { out.push([q, r]); q += YON[d][0]; r += YON[d][1]; } } return out.slice(0, n).map(([q, r]) => [S * (q + r / 2), S * r * 0.866]); }
  function kur() { bubs.forEach(b => b.remove()); M = menuOgeleri().filter(m => m.id !== 'ana'); pos = hexler(M.length); bubs = M.map((m, i) => { const b = document.createElement('div'); b.className = 'bub' + (m.id === 'ekle' ? ' ekle' : ''); b.style.setProperty('--c', m.renk); b.textContent = m.ikon; b.dataset.i = i; el.appendChild(b); return b; }); }
  function ciz() {
    W = el.clientWidth; H = el.clientHeight; const cx = W / 2, cy = H / 2 + 10, R0 = Math.min(W, H) * 0.27, RM = Math.min(W, H) * 0.5;
    let en = -1, az = 1e9;
    bubs.forEach((b, i) => {
      const x = pos[i][0] + px, y = pos[i][1] + py, d = Math.hypot(x, y) || 0.001;
      const d2 = d < R0 ? d : R0 + (d - R0) * 0.62; const s = d < R0 ? 1 : Math.max(0.18, 1 - Math.pow((d - R0) / RM, 1.3));
      b.style.transform = `translate(${cx + x / d * d2}px,${cy + y / d * d2}px) scale(${s})`; b.style.opacity = s < 0.25 ? s * 2 : 1;
      if (d < az) { az = d; en = i; }
    });
    if (M[en]) adEl.textContent = M[en].ad || '';
  }
  function sinir() { const mx = Math.max(...pos.map(p => Math.abs(p[0]))) + 20, my = Math.max(...pos.map(p => Math.abs(p[1]))) + 20; return { mx, my }; }
  function atalet() { cancelAnimationFrame(anim); const { mx, my } = sinir(); const f = () => { px += vx; py += vy; vx *= 0.93; vy *= 0.93; if (px > mx) vx += (mx - px) * 0.08; if (px < -mx) vx += (-mx - px) * 0.08; if (py > my) vy += (my - py) * 0.08; if (py < -my) vy += (-my - py) * 0.08; ciz(); if (Math.abs(vx) + Math.abs(vy) > 0.05 || Math.abs(px) > mx + 1 || Math.abs(py) > my + 1) anim = requestAnimationFrame(f); }; anim = requestAnimationFrame(f); }
  el.addEventListener('pointerdown', e => { cancelAnimationFrame(anim); sur = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), ust: !!e.target.closest('#petekpad'), hedef: e.target.closest('.bub'), mod: null }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!sur) return; const dx = e.clientX - sur.lx, dy = e.clientY - sur.ly, now = performance.now(), dt = Math.max(1, now - sur.lt);
    if (sur.ust && e.clientY - sur.y > 0) { sur.mod = 'kapa'; el.style.transition = 'none'; el.style.transform = `translateY(${e.clientY - sur.y}px)`; }
    else if (sur.mod !== 'kapa') { px += dx; py += dy; vx = dx / dt * 16; vy = dy / dt * 16; ciz(); }
    sur.lx = e.clientX; sur.ly = e.clientY; sur.lt = now;
  });
  const bitir = e => {
    if (!sur) return; const s = sur; sur = null; el.style.transition = '';
    if (s.mod === 'kapa') { el.style.transform = ''; if (e.clientY - s.y > 90) kapat(); return; }
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) { if (s.hedef) { const m = M[+s.hedef.dataset.i]; s.hedef.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.6)' }, { filter: 'brightness(1)' }], 250); setTimeout(() => { kapat(); UI.bolum(m.id); }, 150); } return; }
    atalet();
  };
  el.addEventListener('pointerup', bitir); el.addEventListener('pointercancel', bitir);
  function ac() { kur(); px = 0; py = 0; vx = vy = 0; el.classList.add('on'); requestAnimationFrame(() => { ciz(); bubs.forEach((b, i) => b.animate([{ transform: b.style.transform + ' scale(.2)', opacity: 0 }, { transform: b.style.transform, opacity: b.style.opacity }], { duration: 500, delay: 80 + Math.hypot(...pos[i]) * 0.8, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards' })); }); }
  function kapat() { el.classList.remove('on'); el.style.transform = ''; }
  window.addEventListener('resize', () => el.classList.contains('on') && ciz());
  /* alt tutamak: renkli mini petek; dokun ya da yukarı çek */
  const tut = $('#tutamak'), kumeEl = $('#kume');
  function kume() { const m = menuOgeleri().filter(x => x.id !== 'ana' && x.id !== 'ekle').slice(0, 7); const p = [[0, 0], [12, 0], [-12, 0], [6, -10], [-6, -10], [6, 10], [-6, 10]]; kumeEl.innerHTML = m.map((x, i) => `<i style="left:${26 + p[i][0]}px;top:${15 + p[i][1]}px;background:${x.renk};color:${x.renk};animation-delay:${i * .25}s"></i>`).join(''); }
  let cek = null;
  tut.addEventListener('pointerdown', e => { cek = { y: e.clientY, t: performance.now() }; tut.setPointerCapture(e.pointerId); kur(); px = py = 0; el.style.transition = 'none'; el.style.visibility = 'visible'; el.style.transform = 'translateY(100%)'; ciz(); });
  tut.addEventListener('pointermove', e => { if (!cek) return; const dy = Math.min(0, e.clientY - cek.y); el.style.transform = `translateY(${el.clientHeight + dy * 1.15}px)`; });
  const birak2 = e => { if (!cek) return; const dy = e.clientY - cek.y, hiz = dy / Math.max(1, performance.now() - cek.t); cek = null; el.style.transition = ''; el.style.visibility = '';
    if (Math.abs(dy) < 6 || dy < -70 || hiz < -0.5) { el.classList.add('on'); el.style.transform = ''; requestAnimationFrame(ciz); } else { el.style.transform = ''; } };
  tut.addEventListener('pointerup', birak2); tut.addEventListener('pointercancel', birak2);
  kume();
  return { ac, kapat, kume };
})();

/* ---------- alt pencereler ---------- */
function sheet(html, kap) { $('#sheet').innerHTML = '<div class="grab"></div>' + html; $('#sheet').scrollTop = 0; $('#sheetbg').classList.add('on'); sheet.kap = kap; }
function kapat() { $('#sheetbg').classList.remove('on'); const f = sheet.kap; sheet.kap = null; f && f(); }
$('#sheetbg').addEventListener('click', e => { if (e.target.id === 'sheetbg') kapat(); });
const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
function segSec(el) { el.parentNode.querySelectorAll('.chip,button').forEach(c => c.classList.remove('on')); el.classList.add('on'); }

const UI = {
  kapat,
  duzenle(ac) { DUZENLE = ac; document.body.classList.toggle('duzenle-modu', ac); if (ac) toast('Basılı tut ve sürükle · − kaldır · S/M/L boyut'); ciz(); },
  wTik(e, id) {
    if (DUZENLE || Date.now() - SUPPRESS < 400) return;
    const w = UIA.yerlesim.find(x => x.id === id); if (!w) return;
    if (w.tur === 'yigin') return yiginAc(w);
    if (w.tur === 'hedef') return UI.kayit(w.ref);
    const alan = { para: 'para', takvim: 'takvim', ozelgun: 'takvim', kelime: 'dil', ilham: 'muzik' }[w.tur];
    if (alan) UI.bolum(alan);
  },
  wSil(id) { const el = document.querySelector(`[data-id="${id}"]`); const f = () => { UIA.yerlesim = UIA.yerlesim.filter(x => x.id !== id); kaydetUI(); ciz(); }; if (el) el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.3)', opacity: 0 }], { duration: 220, easing: 'ease-in' }).onfinish = f; else f(); },
  wBoy(id) { const w = UIA.yerlesim.find(x => x.id === id), b = WT[w.tur].boyutlar; w.boyut = b[(b.indexOf(w.boyut) + 1) % b.length]; kaydetUI(); ILK = true; ciz(); },
  wVar(id) { const w = UIA.yerlesim.find(x => x.id === id), v = WT[w.tur].varyantlar; w.varyant = v[(v.indexOf(w.varyant || v[0]) + 1) % v.length]; kaydetUI(); ILK = true; ciz(); },
  galeri() {
    const gruplar = {}; Object.entries(WT).forEach(([k, t]) => { if (k === 'hedef') return; (gruplar[t.grup] = gruplar[t.grup] || []).push(k); });
    const onizle = (tur, boyut, ref, varyant) => { const eski = ILK; ILK = false; const h = `<div class="gal"><div class="grid">${wHtml({ id: 'onizle', tur, boyut, ref, varyant }, false)}</div></div>`; ILK = eski; return h; };
    let h = `<h3>Widget ekle</h3><p class="mut small" style="margin-top:0">Boyutu seç, ana ekranın en üstüne eklenir. Sonra sürükleyip yerleştir.</p>`;
    for (const [g, liste] of Object.entries(gruplar)) {
      h += `<h4>${esc(g)}</h4>`;
      for (const k of liste) { const t = WT[k]; const ref = k === 'yigin' ? varsayilanYerlesim().find(x => x.tur === 'yigin').ref : undefined;
        h += `<div class="row between" style="margin-top:6px"><b>${esc(t.ad)}</b><div class="chips" style="--c:${t.renk}">${t.boyutlar.map(b => `<button class="chip" onclick='UI.wEkle(${JSON.stringify({ tur: k, boyut: b, ref, varyant: t.varyantlar ? t.varyantlar[0] : undefined })})'>${BOY_AD[b]}</button>`).join('')}</div></div>${onizle(k, t.boyutlar.includes('s') ? 's' : t.boyutlar[0], ref, t.varyantlar && t.varyantlar[0])}`; }
    }
    h += `<h4>Hedefler</h4>`;
    for (const x of hedefler()) h += `<div class="row between" style="margin-top:6px"><b>${esc(x.ikon)} ${esc(x.ad)}</b><div class="chips" style="--c:${renk(x)}">${WT.hedef.boyutlar.map(b => `<button class="chip" onclick='UI.wEkle(${JSON.stringify({ tur: 'hedef', boyut: b, ref: x.id })})'>${BOY_AD[b]}</button>`).join('')}</div></div>`;
    sheet(h);
  },
  wEkle(w) { UIA.yerlesim.unshift({ id: uid(), ...w }); kaydetUI(); kapat(); ILK = true; ciz(); window.scrollTo({ top: 0, behavior: 'smooth' }); toast('Widget eklendi ✨'); },
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
  kayitKaydet(hid) { const z = val('kzaman'); seansEkle(hid, val('kdk'), val('knot'), z ? z + ':00' : yerelISO()); kapat(); toast('Kaydedildi 💪'); ILK = true; ciz(); },
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
    sheet(`<h3>⚙️ Ayarlar</h3>
      <h4>Ana ekran</h4><div class="chips"><button class="chip" onclick="UI.kapat();UI.duzenle(true)">✎ Düzenle</button><button class="chip" onclick="UI.kapat();UI.duzenle(true);setTimeout(UI.galeri,400)">＋ Widget ekle</button><button class="chip" onclick="if(confirm('Ana ekran varsayılana dönsün mü?')){UIA.yerlesim=varsayilanYerlesim();kaydetUI();UI.kapat();ILK=true;ciz()}">↺ Varsayılana dön</button></div>
      <h4>Bağlantı</h4><p class="mut small" style="margin-top:0">Verilerin <b>özel</b> GitHub reponda. Anahtar sadece bu cihazda saklanır.</p>
      <label>GitHub kullanıcı adı</label><input id="c_o" value="${esc(CFG.owner)}" autocapitalize="off">
      <label>Veri reposu</label><input id="c_r" value="${esc(CFG.repo)}" autocapitalize="off">
      <label>Erişim anahtarı</label><input id="c_t" type="password" value="${esc(CFG.token)}" placeholder="github_pat_…" autocapitalize="off">
      <button class="btn" style="margin-top:16px" onclick="UI.ayarKaydet()">Kaydet ve eşitle</button>
      <p class="mut small" style="margin-top:14px">Son eşitleme: ${SON_SYNC ? new Date(SON_SYNC).toLocaleString('tr-TR') : '—'}${SYNC_HATA ? '<br>Hata: ' + esc(SYNC_HATA) : ''}</p>`, () => Dial.anaya());
  },
  ayarKaydet() { CFG = { owner: val('c_o'), repo: val('c_r'), token: val('c_t') }; yaz(LS.cfg, CFG); kapat(); sync(true); },
  alanEkle() {
    sheet(`<h3>＋ Yeni alan</h3><p class="mut small" style="margin-top:0">Kendini geliştirmek istediğin yeni bir konu ekle. Ayrıntılarını sonra birlikte tasarlarız.</p>
      <div class="row"><div style="width:80px"><label>İkon</label><input id="a_ikon" value="✨" style="text-align:center;font-size:22px"></div><div class="grow"><label>Ad</label><input id="a_ad" placeholder="ör. Fotoğrafçılık"></div></div>
      <label>Renk</label><div class="renkler" id="a_renk">${PALET.map((c, i) => `<button class="${i === 9 ? 'on' : ''}" data-c="${c}" style="background:${c}" onclick="segSec(this)"></button>`).join('')}</div>
      <div class="row"><div class="grow"><label>Haftalık hedef (seans, 0 = yok)</label><input id="a_hs" type="number" value="2"></div><div class="grow"><label>Seans süresi (dk)</label><input id="a_dk" type="number" value="30"></div></div>
      <button class="btn" style="margin-top:18px" onclick="UI.alanKaydet()">Ekle</button>`, () => Dial.anaya());
  },
  alanKaydet() {
    const ad = val('a_ad'); if (!ad) return toast('Ad gir');
    const r = ($('#a_renk .on') || {}).dataset?.c || '#5e5ce6', ikon = val('a_ikon') || '✨', id = 'a_' + uid();
    D.alanlar = D.alanlar || []; D.alanlar.push({ id, ad, kisa: ad, ikon, renk: r, guncel: simdi() }); kaydet('alanlar');
    const hs = +val('a_hs') || 0;
    if (hs > 0) { const hid = 'h_' + uid(); D.hedefler.push({ id: hid, ad, ikon, renk: r, alan: id, haftalikSeans: hs, seansDk: +val('a_dk') || 30, aktif: true, kilometreTaslari: [], guncel: simdi() }); kaydet('hedefler'); UIA.yerlesim.unshift({ id: uid(), tur: 'hedef', boyut: 's', ref: hid }); kaydetUI(); }
    kapat(); Dial.kur(); ILK = true; ciz(); toast(`${ikon} ${ad} eklendi`);
  },
  bolum(id) {
    if (id === 'ana') { kapat(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (id === 'ayarlar') return UI.ayarlar();
    if (id === 'ekle') return UI.alanEkle();
    const a = alanBul(id) || { ad: id, ikon: '•', renk: '#888' };
    const ilgili = hedefler().filter(h => alanOf(h) === id);
    const eski = ILK; ILK = false;
    const ek = id === 'para' ? `<div class="gal"><div class="grid">${wHtml({ id: 'p', tur: 'para', boyut: 'm' }, false)}</div></div>` : id === 'takvim' ? `<div class="gal"><div class="grid">${wHtml({ id: 't', tur: 'takvim', boyut: 'l' }, false)}</div></div>` : '';
    ILK = eski;
    sheet(`<div class="row" style="gap:12px;margin-bottom:6px"><div style="width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:26px;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,${a.renk} 92%,#fff),color-mix(in srgb,${a.renk} 50%,#000))">${a.ikon}</div><div><h3 style="margin:0">${esc(a.ad)}</h3><div class="mut small">Bu uygulamayı birlikte tasarlayacağız</div></div></div>
      ${ek}${ilgili.map(h => `<div class="next" style="--c:${renk(h)}"><div class="emo">${esc(h.ikon)}</div><div class="grow"><b>${esc(h.ad)}</b><div class="mut small">Bu hafta ${haftaSeans(h.id).length}/${h.haftalikSeans || '—'}</div></div><button class="go" onclick="UI.kayit('${h.id}')">＋ Seans</button></div>`).join('') || (ek ? '' : '<div class="empty">Yakında ✨</div>')}`, () => Dial.anaya());
  }
};
window.UI = UI; window.segSec = segSec; window.varsayilanYerlesim = varsayilanYerlesim; window.kaydetUI = kaydetUI;

/* ---------- Kestirme linkleri: ?harcama=150&kategori=Kahve  /  ?seans=gitar&dk=30 ---------- */
(function linkIsle() {
  const p = new URLSearchParams(location.search); let ok = false;
  if (p.has('harcama')) { const t = parseFloat(String(p.get('harcama')).replace(',', '.')); if (t) { harcamaEkle(t, p.get('kategori') || 'Diğer', p.get('not') || ''); setTimeout(() => toast(`${tl(t)} kaydedildi ✓`), 400); } else setTimeout(() => UI.harcama({ kategori: p.get('kategori') }), 500); ok = true; }
  if (p.has('seans')) { const q = p.get('seans').toLocaleLowerCase('tr'); const h = canli(D.hedefler).find(x => x.id === q || x.ad.toLocaleLowerCase('tr').includes(q)); if (h) { if (p.has('dk')) { seansEkle(h.id, p.get('dk'), p.get('not') || '', yerelISO(), 'kestirme'); setTimeout(() => toast(`${h.ad} kaydedildi 💪`), 400); } else setTimeout(() => UI.kayit(h.id), 500); ok = true; } }
  if (ok) history.replaceState(null, '', location.pathname);
})();

window.addEventListener('online', () => sync());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
hucre();
ciz();
sync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
