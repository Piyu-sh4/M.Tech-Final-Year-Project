(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    location.replace("/login.html");
    return;
  }
  const message = document.getElementById("manager-message"),
    button = document.getElementById("refresh-team");
  function element(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  }
  async function loadTeam() {
    button.disabled = true;
    message.textContent = "Loading your team…";
    try {
      const response = await fetch("/api/manager/overview", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.message || "Your team could not be loaded.");
      const summary = document.getElementById("manager-summary");
      summary.replaceChildren();
      for (const [label, value] of [
        ["Direct reports", data.team.length],
        ["Open team tasks", data.open_tasks],
        ["Leave awaiting review", data.pending_leave],
      ]) {
        const card = document.createElement("div");
        card.className = "stat-card";
        const metric = element("strong", String(value));
        metric.className = "stat-num";
        const caption = element("span", label);
        caption.className = "stat-label";
        card.append(metric, caption);
        summary.append(card);
      }
      const table = document.getElementById("team-members");
      table.replaceChildren();
      for (const employee of data.team) {
        const row = document.createElement("tr");
        for (const key of [
          "full_name",
          "designation",
          "dept_name",
          "company_name",
        ])
          row.append(element("td", employee[key] || "—"));
        table.append(row);
      }
      document.getElementById("team-empty").hidden = data.team.length > 0;
      message.textContent = "Team records refreshed.";
      message.dataset.error = "false";
    } catch (error) {
      message.textContent = error.message;
      message.dataset.error = "true";
    } finally {
      button.disabled = false;
    }
  }
  button.addEventListener("click", loadTeam);
  loadTeam();
})();
