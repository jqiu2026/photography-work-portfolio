(() => {
  const DATA = window.FOLIO_PHOTOS || [];
  const gallery = document.getElementById("gallery");
  const catsEl = document.getElementById("cats");
  const path = (slug, id, v) => `/photos/${slug}/${id}-${v}.webp`;
  const cols = () => { const w = gallery.clientWidth; return w < 520 ? 2 : w < 900 ? 3 : w < 1300 ? 4 : 5; };

  const sections = DATA.map((cat) => {
    const sec = document.createElement("section");
    sec.className = "cat";
    sec.id = cat.slug;
    sec.setAttribute("aria-labelledby", cat.slug + "-h");
    const h = document.createElement("h2");
    h.id = cat.slug + "-h";
    h.append(cat.title);
    const n = document.createElement("small");
    n.textContent = String(cat.items.length).padStart(2, "0");
    h.append(n);
    const m = document.createElement("div");
    m.className = "masonry";
    sec.append(h, m);
    gallery.append(sec);
    return { cat, sec, m, count: 0 };
  });

  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

  function layout(s) {
    const n = cols();
    if (s.count === n) return;
    s.count = n;
    s.m.replaceChildren();
    const colEls = Array.from({ length: n }, () => { const c = document.createElement("div"); c.className = "col"; s.m.append(c); return c; });
    const heights = new Array(n).fill(0);
    s.cat.items.forEach(([id, w, h], i) => {
      let k = 0;
      for (let j = 1; j < n; j++) if (heights[j] < heights[k] - 0.0001) k = j;
      heights[k] += h / w;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "shot";
      b.dataset.i = String(i);
      b.setAttribute("aria-label", `${s.cat.title}, photo ${i + 1} of ${s.cat.items.length}: open`);
      const img = new Image();
      img.width = w; img.height = h; img.alt = ""; img.decoding = "async"; img.draggable = false;
      img.loading = "lazy";
      img.src = path(s.cat.slug, id, "s");
      b.append(img);
      b.onclick = () => open(s, i);
      colEls[k].append(b);
      io.observe(b);
    });
  }
  const all = () => sections.forEach(layout);
  all();
  let lastN = cols();
  addEventListener("resize", () => { const n = cols(); if (n !== lastN) { lastN = n; all(); } });

  // category chips follow the scroll
  catsEl.innerHTML = DATA.map((c) => `<a href="#${c.slug}" data-s="${c.slug}">${c.title}</a>`).join("");
  const chips = [...catsEl.querySelectorAll("a")];
  const spy = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) chips.forEach((a) => {
      const on = a.dataset.s === e.target.id;
      a.classList.toggle("on", on);
      if (on) a.scrollIntoView({ block: "nearest", inline: "center" });
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  sections.forEach((s) => spy.observe(s.sec));

  // viewer
  const lb = document.getElementById("lb");
  const lbimg = document.getElementById("lbimg");
  const lbct = document.getElementById("lbct");
  let cur = null, idx = 0, opener = null;
  const show = () => {
    const [id] = cur.cat.items[idx];
    lbimg.src = path(cur.cat.slug, id, "l");
    lbimg.alt = `${cur.cat.title} photo ${idx + 1}`;
    lbct.textContent = `${cur.cat.title} · ${idx + 1} / ${cur.cat.items.length}`;
    for (const d of [1, -1]) { const nx = cur.cat.items[(idx + d + cur.cat.items.length) % cur.cat.items.length]; new Image().src = path(cur.cat.slug, nx[0], "l"); }
  };
  function open(s, i) { cur = s; idx = i; opener = document.activeElement; lb.classList.add("open"); document.body.style.overflow = "hidden"; show(); lb.querySelector(".x").focus(); }
  function close() { lb.classList.remove("open"); document.body.style.overflow = ""; lbimg.removeAttribute("src"); if (opener) opener.focus(); }
  const step = (d) => { const n = cur.cat.items.length; idx = (idx + d + n) % n; show(); };
  lb.querySelector(".x").onclick = close;
  lb.querySelector(".p").onclick = () => step(-1);
  lb.querySelector(".n").onclick = () => step(1);
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") close(); });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") { const f = [...lb.querySelectorAll("button")]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });
  let x0 = null;
  lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
})();
