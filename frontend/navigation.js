(() => {
  const make = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const path = location.pathname.split("/").pop() || "index.html";
  const publicPage = [
    "index.html",
    "login.html",
    "register.html",
    "reset-password.html",
    "offline.html",
    "privacy-policy.html",
    "cookie-policy.html",
    "security-policy.html",
  ].includes(path);
  const token = localStorage.getItem("token");
  const greeting = document.querySelector("[data-workspace-greeting]");
  const userName = localStorage.getItem("full_name");
  if (token && greeting && userName) {
    const hour = new Date().getHours();
    const dayPart = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    greeting.textContent = "Good " + dayPart + ", " + userName + " 👋";
    greeting.hidden = false;
  }
  const workspaceNavigation = !publicPage || (path === "index.html" && Boolean(token));
  let role = 2;
  try {
    role = JSON.parse(atob(token.split(".")[1])).role_id;
  } catch {}
  const dashboard =
    role === 3
      ? "/manager.html"
      : [1, 4].includes(role)
        ? "/admin-dashboard.html"
        : "/employee-dashboard.html";
  const old =
    document.querySelector(".workspace-header") ||
    document.querySelector(".wiq-main > .navbar") ||
    document.querySelector("body > .navbar") ||
    document.querySelector("body > nav");
  const header = make("header", null, "wfi-unified-header");
  const brand = make("a", null, "wfi-header-brand");
  brand.href = publicPage ? "/index.html" : "/modules.html";
  const mark = make("span", "W", "wfi-header-mark");
  mark.setAttribute("aria-hidden", "true");
  brand.append(mark, make("span", "Workforce Intelligence"));
  const top = make("div", null, "wfi-header-top");
  let menu = document.querySelector(".wfi-mobile-menu");
  if (!menu && workspaceNavigation) {
    menu = make("button", "☰ Menu", "wfi-header-toggle");
    menu.type = "button";
    menu.setAttribute("aria-label", "☰ Menu");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-controls", "wfi-primary-links");
    menu.addEventListener("click", () => {
      const expanded = header.classList.toggle("wfi-menu-expanded");
      menu.setAttribute("aria-expanded", String(expanded));
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        header.classList.contains("wfi-menu-expanded")
      ) {
        header.classList.remove("wfi-menu-expanded");
        menu.setAttribute("aria-expanded", "false");
        menu.focus();
      }
    });
  }
  if (menu) {
    top.append(menu);
    header.classList.add("wfi-with-menu");
  }
  if (!workspaceNavigation) header.classList.add("wfi-header-public");
  top.append(brand);
  header.append(top);
  const nav = make("div", null, "wfi-header-links");
  nav.id = "wfi-primary-links";
  nav.setAttribute("role", "navigation");
  nav.setAttribute("aria-label", "Main navigation");
  const link = (href, label, id, container = nav) => {
    let el = id && document.getElementById(id);
    if (!el) el = make("a", label);
    el.href = href;
    if (id) el.id = id;
    if (location.pathname === href) el.setAttribute("aria-current", "page");
    container.append(el);
    return el;
  };
  if (!workspaceNavigation) {
    link("/index.html", "Home");
    link("/register.html", "Create account");
    if (token) link(dashboard, "Dashboard");
  } else {
    link(dashboard, "Dashboard", "dashboard");
    link("/modules.html", "Modules", "modules-nav");
    link("/tasks.html", "Tasks");
    link("/projects.html", "Projects");
    link("/chat.html", "AI Chat");
    link("/helpdesk.html", "Helpdesk");
    link("/notifications.html", "Notifications");
  }
  const profile = make("div", null, "wfi-account");
  const profileButton = make("button", null, "wfi-account-toggle");
  profileButton.type = "button";
  profileButton.setAttribute("aria-label", "Account");
  profileButton.setAttribute("aria-controls", "wfi-account-links");
  profileButton.setAttribute("aria-expanded", "false");
  const avatar = make("span", null, "wfi-account-avatar");
  avatar.setAttribute("aria-hidden", "true");
  avatar.classList.add("wfi-account-icon");
  profileButton.append(avatar);
  const panel = make("div", null, "wfi-account-links");
  panel.id = "wfi-account-links";
  panel.hidden = true;
  if (token) {
    link("/profile.html", "Profile", null, panel);
    link("/application-settings.html", "Settings", null, panel);
    const logout = document.getElementById("signout") || make("button", "Sign out");
    logout.type = "button";
    logout.textContent = "Sign out";
    logout.setAttribute("aria-label", "Sign out");
    // Capture the shared action before any handler attached by the legacy page.
    logout.addEventListener("click", async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      logout.disabled = true;
      const result = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_feedback: true }),
        signal: AbortSignal.timeout(5000),
      }).then(response => response.ok ? response.json() : null).catch(() => null);
      // Keep the one-time receipt in this tab only and clear all sign-in credentials.
      try { sessionStorage.setItem("wfi-sign-out-feedback", result?.receipt || ""); } catch {}
      for (const key of ["token", "user", "user_id", "full_name", "role_id", "email"])
        localStorage.removeItem(key);
      location.replace("/login.html");
    }, { capture: true });
    panel.append(logout);
  } else {
    link("/login.html", "Sign in", null, panel);
  }
  function setAccountOpen(open) {
    panel.hidden = !open;
    profileButton.setAttribute("aria-expanded", String(open));
  }
  profileButton.addEventListener("click", () => setAccountOpen(panel.hidden));
  profile.addEventListener("keydown", event => {
    if (event.key !== "Escape" || panel.hidden) return;
    event.stopPropagation();
    setAccountOpen(false);
    profileButton.focus();
  });
  profile.addEventListener("focusout", event => {
    if (!profile.contains(event.relatedTarget)) setAccountOpen(false);
  });
  document.addEventListener("click", event => {
    if (!profile.contains(event.target)) setAccountOpen(false);
  });
  profile.append(profileButton, panel);
  header.append(nav);
  if (workspaceNavigation) {
    const history = make("div", null, "wfi-header-history");
    history.setAttribute("aria-label", "Page navigation");
    for (const [id, label, handler] of [
      [
        "history-back",
        "← Back",
        () =>
          window.history.length > 1
            ? window.history.back()
            : location.assign("/modules.html"),
      ],
      ["history-forward", "Forward →", () => window.history.forward()],
    ]) {
      let button = document.getElementById(id);
      if (!button) {
        button = make("button", label);
        button.type = "button";
        button.id = id;
        button.addEventListener("click", handler);
      }
      history.append(button);
    }
    header.append(history);
  }
  header.append(profile);
  if (old) {
    old.before(header);
    old.setAttribute("data-legacy-nav", "");
    old.style.setProperty("display", "none", "important");
    old.setAttribute("aria-hidden", "true");
    old.setAttribute("inert", "");
  } else document.body.prepend(header);
  // Older sidebars still carry logout controls from before the shared header.
  for (const control of document.querySelectorAll('a[onclick], button[onclick], .wiq-logout-btn')) {
    if (control.classList.contains("wiq-logout-btn") || /\blogout\s*\(/i.test(control.getAttribute("onclick") || "")) {
      if (!header.contains(control)) {
        control.hidden = true;
        control.setAttribute("data-legacy-signout", "");
      }
    }
  }
  // Back/forward cache and other open tabs must respect local sign-out.
  const redirectAfterSignOut = () => {
    if (!publicPage && !localStorage.getItem("token")) location.replace("/login.html");
  };
  window.addEventListener("pageshow", redirectAfterSignOut);
  window.addEventListener("storage", event => {
    if (event.key === "token" || event.key === null) redirectAfterSignOut();
  });
  const legacyThemeToggle = document.getElementById("dmToggle");
  if (legacyThemeToggle && !legacyThemeToggle.textContent.trim())
    legacyThemeToggle.setAttribute("aria-label", "Toggle color theme");
  document.body.classList.add(
    "wfi-has-unified-header",
    "wfi-page-" + path.replace(".html", ""),
  );
})();
