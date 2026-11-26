/** Device authentication delegates face/fingerprint/PIN checks to the authenticator.
 * The browser sends a signed challenge. No biometric image or fingerprint is uploaded.
 */
window.WorkforcePasskeys = (() => {
  async function request(path, payload) {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/passkeys" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(payload || {}),
    });
    const body = await response.json();
    if (!response.ok)
      throw Error(body.message || "Device verification failed.");
    return body;
  }
  function supported() {
    if (
      !window.isSecureContext ||
      !window.PublicKeyCredential ||
      !window.SimpleWebAuthnBrowser
    )
      throw Error(
        "Use HTTPS or localhost and a browser that supports passkeys.",
      );
  }
  async function enroll(password) {
    supported();
    const pending = await request("/register/options", { password });
    const response = await SimpleWebAuthnBrowser.startRegistration({
      optionsJSON: pending.options,
    });
    return request("/register/verify", {
      challengeId: pending.challengeId,
      response,
    });
  }
  async function attendance(action) {
    supported();
    const pending = await request("/attendance/options", { action });
    const response = await SimpleWebAuthnBrowser.startAuthentication({
      optionsJSON: pending.options,
    });
    const proof = await request("/attendance/verify", {
      action,
      challengeId: pending.challengeId,
      response,
    });
    const result = await fetch(
      "/api/admin/attendance/" + action.replace("_", "-"),
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification_method: "passkey",
          verification_token: proof.verification_token,
        }),
      },
    );
    const body = await result.json();
    if (!result.ok) throw Error(body.message);
    return body;
  }
  async function login(email) {
    supported();
    const pending = await request("/login/options", { email });
    const response = await SimpleWebAuthnBrowser.startAuthentication({
      optionsJSON: pending.options,
    });
    const result = await request("/login/verify", {
      challengeId: pending.challengeId,
      response,
    });
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    for (const key of ["user_id", "role_id", "full_name", "email"])
      localStorage.setItem(key, result.user[key]);
    location.assign(
      result.user.role_id === 3
        ? "/manager.html"
        : [1, 4].includes(result.user.role_id)
          ? "/admin-dashboard.html"
          : "/employee-dashboard.html",
    );
  }
  return { enroll, attendance, login };
})();
(() => {
  const login = document.getElementById("loginBtn");
  if (login) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "passkey-login";
    button.className = "action-link";
    button.textContent = "Sign in with a passkey";
    login.after(button);
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await WorkforcePasskeys.login(document.querySelector("#email").value);
      } catch (error) {
        const message = document.querySelector("#loginMsg,#message,#msg");
        if (message) {
          message.hidden = false;
          message.style.display = "block";
          message.textContent = error.message;
        } else alert(error.message);
      } finally {
        button.disabled = false;
      }
    });
  }
  const message = document.getElementById("clockMsg");
  if (message) {
    for (const [action, label] of [
      ["clock_in", "Device-verified clock in"],
      ["clock_out", "Device-verified clock out"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-link";
      button.textContent = label;
      message.before(button);
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          message.textContent = (
            await WorkforcePasskeys.attendance(action)
          ).message;
          message.style.display = "block";
        } catch (error) {
          message.textContent = error.message;
          message.style.display = "block";
        } finally {
          button.disabled = false;
        }
      });
    }
  }
})();
