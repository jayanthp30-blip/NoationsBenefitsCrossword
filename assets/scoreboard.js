(function () {
  "use strict";

  const state = { rows: [] };

  function fmtTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function initials(name) {
    return (name || "")
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function rankBadgeClass(i) {
    if (i === 0) return "gold";
    if (i === 1) return "silver";
    if (i === 2) return "bronze";
    return "";
  }

  function render(rows) {
    const tbody = document.getElementById("board-body");
    const emptyState = document.getElementById("empty-state");
    const loadingState = document.getElementById("loading-state");
    const tableWrap = document.getElementById("table-wrap");
    loadingState.style.display = "none";

    if (!rows.length) {
      tableWrap.style.display = "none";
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";
    tableWrap.style.display = "block";

    tbody.innerHTML = rows
      .map((r, i) => {
        const when = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate() : null;
        const whenStr = when
          ? when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : "—";
        return `
        <tr>
          <td><span class="rank-badge ${rankBadgeClass(i)}">${i + 1}</span></td>
          <td>
            <div class="player-cell">
              <strong>${escapeHtml(r.name || "—")}</strong>
              <span class="p-email">${escapeHtml(r.email || "—")}</span>
            </div>
          </td>
          <td><span class="score-pill">${r.correctCount ?? 0}/${r.totalWords ?? 14}</span></td>
          <td>${r.percentage ?? 0}%</td>
          <td>${fmtTime(r.timeSeconds ?? 0)}</td>
          <td>${whenStr}</td>
        </tr>`;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  async function load() {
    const banner = document.getElementById("not-configured-banner");
    if (!window.NBFirebase || !window.NBFirebase.isConfigured) {
      banner.style.display = "flex";
      document.getElementById("loading-state").style.display = "none";
      document.getElementById("empty-state").style.display = "block";
      return;
    }
    try {
      const rows = await window.NBFirebase.fetchScores();
      state.rows = rows;
      render(rows);
    } catch (err) {
      console.error(err);
      document.getElementById("loading-state").style.display = "none";
      document.getElementById("empty-state").style.display = "block";
      document.getElementById("empty-state-msg").textContent =
        "Couldn't load the leaderboard right now. Please refresh to try again.";
    }
  }

  document.getElementById("btn-refresh").addEventListener("click", () => {
    document.getElementById("loading-state").style.display = "block";
    document.getElementById("table-wrap").style.display = "none";
    document.getElementById("empty-state").style.display = "none";
    load();
  });

  document.getElementById("btn-export").addEventListener("click", () => {
    if (!state.rows.length) return;
    const data = state.rows.map((r, i) => ({
      Rank: i + 1,
      Name: r.name || "",
      Email: r.email || "",
      "Correct Answers": r.correctCount ?? 0,
      "Total Clues": r.totalWords ?? 14,
      "Score (%)": r.percentage ?? 0,
      "Time Taken": fmtTime(r.timeSeconds ?? 0),
      "Time (seconds)": r.timeSeconds ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 6 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 11 }, { wch: 13 }, { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaderboard");
    XLSX.writeFile(wb, "nations-benefits-crossword-scoreboard.xlsx");
  });

  window.addEventListener("nb-firebase-ready", load);
  // fallback in case the event already fired or firebase module fails silently
  setTimeout(() => {
    if (!state.rows.length) load();
  }, 1200);
})();
