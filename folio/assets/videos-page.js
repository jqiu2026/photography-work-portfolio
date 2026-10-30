(() => {
  const root = document.getElementById("videos");
  const list = window.FOLIO_VIDEOS || [];
  if (!list.length) {
    root.innerHTML = '<div class="empty"><p style="margin:0">Videos are on the way. Check back soon.</p></div>';
    return;
  }
  const grid = document.createElement("div");
  grid.className = "vgrid";
  for (const v of list) {
    const card = document.createElement("article");
    card.className = "vid";
    const frame = document.createElement("div");
    frame.className = "frame";
    if (v.src) {
      const el = document.createElement("video");
      el.controls = true;
      el.preload = "metadata";
      el.playsInline = true;
      el.setAttribute("controlslist", "nodownload noremoteplayback");
      el.disablePictureInPicture = true;
      el.disableRemotePlayback = true;
      if (v.poster) el.poster = v.poster;
      el.src = v.src;
      frame.append(el);
    } else if (v.youtube && /^[\w-]{11}$/.test(v.youtube)) {
      const go = document.createElement("button");
      go.type = "button";
      go.className = "go";
      go.setAttribute("aria-label", "Play " + v.title);
      go.textContent = "▶";
      go.onclick = () => {
        const f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + v.youtube + "?autoplay=1&rel=0&playsinline=1";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        f.title = v.title;
        frame.replaceChildren(f);
      };
      frame.append(go);
    }
    const h = document.createElement("h3");
    h.textContent = v.title;
    card.append(frame, h);
    if (v.note) {
      const p = document.createElement("p");
      p.textContent = v.note;
      card.append(p);
    }
    grid.append(card);
  }
  root.append(grid);
})();
