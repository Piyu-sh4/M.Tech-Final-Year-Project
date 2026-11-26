(() => {
  const find = (id) => document.getElementById(id),
    token = localStorage.getItem("token");
  if (!token) {
    location.replace("/login.html");
    return;
  }
  async function request(path, method = "GET", payload) {
    const response = await fetch("/api" + path, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await response.json();
    if (!response.ok)
      throw Error(body.message || "Settings could not be loaded.");
    return body;
  }
  function message(text, error = false) {
    find("settings-message").textContent = text;
    find("settings-message").dataset.error = String(error);
  }
  async function perform(button, work) {
    button.disabled = true;
    try {
      await work();
    } catch (error) {
      message(error.message, true);
    } finally {
      button.disabled = false;
    }
  }
  async function listPasskeys() {
    const credentials = await request("/passkeys");
    find("passkey-list").replaceChildren();
    for (const credential of credentials) {
      const row = document.createElement("p");
      row.textContent =
        credential.rp_id +
        " · " +
        new Date(credential.created_at).toLocaleDateString() +
        " ";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove passkey";
      remove.addEventListener("click", () =>
        perform(remove, async () => {
          await request(
            "/passkeys/" + encodeURIComponent(credential.credential_id),
            "DELETE",
          );
          await listPasskeys();
          message("Passkey removed.");
        }),
      );
      row.append(remove);
      find("passkey-list").append(row);
    }
    if (!credentials.length)
      find("passkey-list").textContent = "No device is enrolled.";
  }
  Promise.all([
    request("/auth/preferences"),
    fetch("/appearance-accents.json").then(response => {
      if (!response.ok) throw Error("Accent colors could not be loaded.");
      return response.json();
    }),
    request("/auth/session-context"),
    request("/location/me"),
  ])
    .then(([preferences, accents, context, location]) => {
      find("accent").replaceChildren(...accents.map(({id, label}) => new Option(label,id)));
      find("theme").value = preferences.theme;
      find("accent").value = preferences.accent;
      find("connection-ip").textContent =
        "Connection IP: " + (context.ip_address || "Unavailable");
      const saved = location.prefs || location.preferences || location;
      find("location-enabled").checked = saved.location_enabled === 1;
      find("weather-enabled").checked = saved.weather_enabled === 1;
      find("location-source").value = saved.location_source || "manual";
      find("manual-city").value = saved.manual_city || "";
      find("manual-state").value = saved.manual_state || "";
    })
    .catch((error) => message(error.message, true));
  request("/auth/me")
    .then(async (user) => {
      if (user.role_id === 1) {
        find("company-settings").hidden = false;
        const companies = await request("/auth/companies");
        find("company-list").textContent = companies
          .map((company) => company.name)
          .join(", ");
      }
    })
    .catch((error) => message(error.message, true));
  request("/auth/attendance-audit")
    .then((events) => {
      for (const event of events) {
        const row = document.createElement("p");
        row.textContent =
          event.action +
          " · " +
          event.verification_method +
          " · " +
          (event.ip_address || "IP unavailable") +
          " · " +
          new Date(event.created_at).toLocaleString();
        find("attendance-audit").append(row);
      }
    })
    .catch((error) => message(error.message, true));
  find("company-form").addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.submitter, async () => {
      await request("/auth/companies", "POST", {
        name: find("company-name").value,
      });
      const companies = await request("/auth/companies");
      find("company-list").textContent = companies
        .map((company) => company.name)
        .join(", ");
      message("Company added to registration choices.");
    });
  });
  listPasskeys().catch((error) => message(error.message, true));
  find("appearance-form").addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.submitter, async () => {
      const theme = find("theme").value;
      const accent = find("accent").value;
      await request("/auth/preferences", "PATCH", { theme, accent });
      window.WorkforceAppearance.apply(theme, accent);
      message("Appearance saved.");
    });
  });
  find("wallpaper-form").addEventListener("submit", event => {
    event.preventDefault();
    perform(event.submitter, async () => {
      await window.WorkforceAppearance.saveWallpaper(find("wallpaper").files[0]);
      find("wallpaper").value = "";
      message("Background saved on this browser.");
    });
  });
  find("remove-wallpaper").addEventListener("click", event => {
    perform(event.currentTarget, async () => {
      window.WorkforceAppearance.removeWallpaper();
      message("Background removed.");
    });
  });
  find("location-form").addEventListener("submit", (event) => {
    event.preventDefault();
    perform(event.submitter, async () => {
      await request("/location/preferences", "PATCH", {
        location_enabled: find("location-enabled").checked,
        weather_enabled: find("weather-enabled").checked,
        location_source: find("location-source").value,
        manual_city: find("manual-city").value,
        manual_state: find("manual-state").value,
      });
      message("Location preferences saved.");
    });
  });
  find("detect-location").addEventListener("click", (event) =>
    perform(event.currentTarget, async () => {
      if (!find("location-enabled").checked)
        throw Error("Enable and save your location preferences first.");
      const source = find("location-source").value;
      const {preferences} = await request('/location/me');
      if (!preferences?.location_enabled || preferences.location_source !== source)
        throw Error('Save your location preference before requesting an update.');
      const payload = {
        location_source: source,
        manual_city: find("manual-city").value,
        manual_state: find("manual-state").value,
      };
      if (source === "gps") {
        const position = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 60000,
          }),
        );
        payload.latitude = position.coords.latitude;
        payload.longitude = position.coords.longitude;
      }
      const result = await request("/location/session", "POST", payload);
      message(result.message || "Location updated.");
    }),
  );
  find("enroll-passkey").addEventListener("click", (event) =>
    perform(event.currentTarget, async () => {
      const result = await WorkforcePasskeys.enroll(
        find("enrollment-password").value,
      );
      find("enrollment-password").value = "";
      await listPasskeys();
      message(result.message);
    }),
  );
})();
