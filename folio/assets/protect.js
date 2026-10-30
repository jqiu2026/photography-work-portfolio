// Discourages copying: no context menu, drag, selection, copy/cut, save/print/view-source shortcuts.
// This cannot stop a determined person (a screenshot or the browser's network tab still works); it only makes
// casual saving of the pictures a deliberate act.
(() => {
  const stop = (e) => e.preventDefault();
  const mail = (e) => e.target instanceof Element && e.target.closest(".mail");
  document.addEventListener("contextmenu", stop);
  document.addEventListener("dragstart", stop);
  document.addEventListener("copy", stop);
  document.addEventListener("cut", stop);
  document.addEventListener("selectstart", (e) => { if (!mail(e)) e.preventDefault(); });
  window.addEventListener("beforeprint", () => { document.documentElement.style.display = "none"; });
  window.addEventListener("afterprint", () => { document.documentElement.style.display = ""; });
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && ["s", "p", "u", "a", "c", "x"].includes(k)) return stop(e);
    if (mod && e.shiftKey && ["i", "j", "c", "s"].includes(k)) return stop(e);
    if (k === "f12" || k === "printscreen") {
      stop(e);
      try { navigator.clipboard && navigator.clipboard.writeText(""); } catch {}
    }
  });
  const yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
