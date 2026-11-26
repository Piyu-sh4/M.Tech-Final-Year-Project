/** Keep appearance responsive to both the saved account choice and OS changes. */
window.WorkforceAppearance = (() => {
  const preferenceKey = "workforce-appearance";
  const system = matchMedia("(prefers-color-scheme: dark)");
  let preference = localStorage.getItem(preferenceKey) || "system";
  const accentKey = "workforce-appearance-accent";
  let accent = localStorage.getItem(accentKey) || "default";
  function apply(value, palette = accent) {
    if (!["system", "light", "day", "night", "dark"].includes(value))
      value = "system";
    preference = value;
    accent = typeof palette === "string" && /^[a-z]{1,15}$/.test(palette) ? palette : "default";
    localStorage.setItem(accentKey, accent);
    document.body.dataset.accent = accent;
    localStorage.setItem(preferenceKey, value);
    const resolved =
      value === "system" ? (system.matches ? "dark" : "light") : value;
    document.body.dataset.appearance = resolved;
    document.body.classList.toggle(
      "dark-mode",
      ["night", "dark"].includes(resolved),
    );
  }
  system.addEventListener("change", () => {
    if (preference === "system") apply(preference);
  });
  apply(preference);
  const token = localStorage.getItem("token");
  if (token)
    fetch("/api/auth/preferences", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (settings) apply(settings.theme, settings.accent);
      })
      .catch(() => {});
  window.tdm = () => {
    const mode = document.body.classList.contains("dark-mode")
      ? "light"
      : "dark";
    apply(mode);
    if (token)
      fetch("/api/auth/preferences", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: mode }),
      }).catch(() => {});
  };
  let userId;
  try { userId = JSON.parse(localStorage.getItem("user"))?.user_id; } catch {}
  const wallpaperKey = token && Number.isInteger(userId) ? "workforce-wallpaper-" + userId : null;
  function showWallpaper(data) {
    const valid = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data || "");
    document.body.toggleAttribute("data-wallpaper", valid);
    if (valid) document.body.style.setProperty("--wfi-wallpaper", 'url("' + data + '")');
    else document.body.style.removeProperty("--wfi-wallpaper");
  }
  if (wallpaperKey) showWallpaper(localStorage.getItem(wallpaperKey));
  async function saveWallpaper(file) {
    if (!wallpaperKey) throw Error("Sign in to change the background.");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
      throw Error("Choose a JPEG, PNG or WebP image up to 5 MB.");
    const bitmap = await createImageBitmap(file).catch(() => { throw Error("This image could not be opened."); });
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    try {
      const context = canvas.getContext("2d", { alpha: false });
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.68);
      try { localStorage.setItem(wallpaperKey, data); }
      catch { throw Error("This browser could not store an image. Try a smaller image."); }
      showWallpaper(data);
    } finally { bitmap.close(); }
  }
  function removeWallpaper() {
    if (wallpaperKey) localStorage.removeItem(wallpaperKey);
    showWallpaper(null);
  }
  return { apply, saveWallpaper, removeWallpaper };
})();
