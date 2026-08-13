(function () {
  "use strict";

  const DATA = window.CROSSWORD_DATA;
  const words = DATA.words.map((w, idx) => ({ ...w, id: idx, solved: false }));

  // ---- build cell map -----------------------------------------------------
  // cellMap[r][c] = { letter, numbers: {A: word|null, D: word|null} }
  const grid = Array.from({ length: DATA.rows }, () =>
    Array.from({ length: DATA.cols }, () => null)
  );

  words.forEach((w) => {
    for (let i = 0; i < w.length; i++) {
      const r = w.dir === "A" ? w.row : w.row + i;
      const c = w.dir === "A" ? w.col + i : w.col;
      if (!grid[r][c]) grid[r][c] = { letter: w.answer[i], words: {} };
      grid[r][c].words[w.dir] = w.id;
      if (i === 0) grid[r][c].number = w.number;
      else if (!grid[r][c].number && false) {
        /* noop */
      }
    }
  });
  // ensure numbers also set on intersection starts that belong to the other dir
  words.forEach((w) => {
    const r = w.row, c = w.col;
    if (grid[r][c] && !grid[r][c].number) grid[r][c].number = w.number;
  });

  let currentWordId = words[0].id;
  let currentDir = words[0].dir;
  let currentR = words[0].row;
  let currentC = words[0].col;

  let started = false;
  let startTime = null;
  let timerInterval = null;
  let elapsedSeconds = 0;
  let player = { name: "", email: "" };

  // ---- DOM refs -------------------------------------------------------------
  const panels = {
    entry: document.getElementById("panel-entry"),
    game: document.getElementById("panel-game"),
    results: document.getElementById("panel-results"),
  };

  function showPanel(name) {
    Object.values(panels).forEach((p) => p.classList.remove("active"));
    panels[name].classList.add("active");
  }

  function toast(msg, type) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // ---- entry form -------------------------------------------------------------
  const form = document.getElementById("entry-form");
  const nameInput = document.getElementById("player-name");
  const emailInput = document.getElementById("player-email");

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    let ok = true;

    const nameField = nameInput.closest(".field");
    const emailField = emailInput.closest(".field");
    nameField.classList.toggle("invalid", name.length === 0);
    if (name.length === 0) ok = false;

    const emailOk = validEmail(email);
    emailField.classList.toggle("invalid", !emailOk);
    if (!emailOk) ok = false;

    if (!ok) return;

    player = { name, email };
    document.getElementById("player-badge-initial").textContent = name
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    document.getElementById("player-badge-name").textContent = name;
    document.getElementById("player-badge-email").textContent = email;

    showPanel("game");
    beginGame();
  });

  // ---- grid rendering -------------------------------------------------------------
  const gridEl = document.getElementById("crossword-grid");
  gridEl.style.gridTemplateColumns = `repeat(${DATA.cols}, 34px)`;
  gridEl.style.gridTemplateRows = `repeat(${DATA.rows}, 34px)`;

  const cellInputs = {};

  for (let r = 0; r < DATA.rows; r++) {
    for (let c = 0; c < DATA.cols; c++) {
      const cellData = grid[r][c];
      const cellEl = document.createElement("div");
      cellEl.className = "cw-cell" + (cellData ? "" : " blocked");
      cellEl.style.gridRowStart = r + 1;
      cellEl.style.gridColumnStart = c + 1;

      if (cellData) {
        if (cellData.number) {
          const numEl = document.createElement("div");
          numEl.className = "num";
          numEl.textContent = cellData.number;
          cellEl.appendChild(numEl);
        }
        const input = document.createElement("input");
        input.maxLength = 1;
        input.autocomplete = "off";
        input.spellcheck = false;
        input.dataset.r = r;
        input.dataset.c = c;
        cellEl.appendChild(input);
        cellInputs[`${r},${c}`] = { input, cellEl, data: cellData };

        input.addEventListener("click", () => selectCell(r, c, null));
        input.addEventListener("input", (e) => onCellInput(e, r, c));
        input.addEventListener("keydown", (e) => onCellKeydown(e, r, c));
      }
      gridEl.appendChild(cellEl);
    }
  }

  function wordCells(word) {
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const r = word.dir === "A" ? word.row : word.row + i;
      const c = word.dir === "A" ? word.col + i : word.col;
      cells.push({ r, c, i });
    }
    return cells;
  }

  function clearHighlights() {
    document.querySelectorAll(".cw-cell.active-word").forEach((el) => el.classList.remove("active-word"));
    document.querySelectorAll(".cw-cell.active-cell").forEach((el) => el.classList.remove("active-cell"));
    document.querySelectorAll(".clue-item.selected").forEach((el) => el.classList.remove("selected"));
  }

  function selectCell(r, c, forceDir) {
    const cellData = grid[r][c];
    if (!cellData) return;
    let dir = forceDir;
    if (!dir) {
      if (currentR === r && currentC === c) {
        // toggle direction if both available
        const other = currentDir === "A" ? "D" : "A";
        dir = cellData.words[other] !== undefined ? other : currentDir;
      } else if (cellData.words[currentDir] !== undefined) {
        dir = currentDir;
      } else {
        dir = cellData.words.A !== undefined ? "A" : "D";
      }
    }
    if (cellData.words[dir] === undefined) {
      dir = cellData.words.A !== undefined ? "A" : "D";
    }
    currentR = r;
    currentC = c;
    currentDir = dir;
    currentWordId = cellData.words[dir];

    clearHighlights();
    const word = words[currentWordId];
    wordCells(word).forEach(({ r: wr, c: wc }) => {
      const key = `${wr},${wc}`;
      if (cellInputs[key]) cellInputs[key].cellEl.classList.add("active-word");
    });
    cellInputs[`${r},${c}`].cellEl.classList.add("active-cell");

    const clueEl = document.querySelector(`.clue-item[data-word-id="${currentWordId}"]`);
    if (clueEl) {
      clueEl.classList.add("selected");
      clueEl.scrollIntoView({ block: "nearest" });
    }
    cellInputs[`${r},${c}`].input.focus();
  }

  function moveWithin(word, fromR, fromC, delta) {
    const cells = wordCells(word);
    const idx = cells.findIndex((cc) => cc.r === fromR && cc.c === fromC);
    const next = cells[idx + delta];
    if (next) selectCell(next.r, next.c, word.dir);
  }

  function onCellInput(e, r, c) {
    const val = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
    e.target.value = val.slice(-1);
    cellInputs[`${r},${c}`].cellEl.classList.remove("correct", "incorrect");
    if (val) {
      const word = words[currentWordId];
      moveWithin(word, r, c, 1);
    }
    updateProgress();
  }

  function onCellKeydown(e, r, c) {
    const word = words[currentWordId];
    if (e.key === "Backspace") {
      if (!e.target.value) {
        e.preventDefault();
        moveWithin(word, r, c, -1);
        const cells = wordCells(word);
        const idx = cells.findIndex((cc) => cc.r === r && cc.c === c);
        const prev = cells[idx - 1];
        if (prev) cellInputs[`${prev.r},${prev.c}`].input.value = "";
      }
      updateProgress();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      trySelectAdjacent(r, c, 0, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      trySelectAdjacent(r, c, 0, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      trySelectAdjacent(r, c, 1, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      trySelectAdjacent(r, c, -1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      checkAnswers();
    }
  }

  function trySelectAdjacent(r, c, dr, dc) {
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < DATA.rows && nc >= 0 && nc < DATA.cols) {
      if (grid[nr][nc]) {
        selectCell(nr, nc, dr !== 0 ? "D" : "A");
        return;
      }
      nr += dr;
      nc += dc;
    }
  }

  // ---- clue lists -------------------------------------------------------------
  function buildClueList(dir, containerId) {
    const container = document.getElementById(containerId);
    const list = words.filter((w) => w.dir === dir).sort((a, b) => a.number - b.number);
    list.forEach((w) => {
      const item = document.createElement("div");
      item.className = "clue-item";
      item.dataset.wordId = w.id;
      item.innerHTML = `<span class="clue-num">${w.number}</span><span>${w.clue}</span>`;
      item.addEventListener("click", () => selectCell(w.row, w.col, w.dir));
      container.appendChild(item);
    });
  }
  buildClueList("A", "across-clues");
  buildClueList("D", "down-clues");

  // ---- progress / timer -------------------------------------------------------------
  function updateProgress() {
    let solvedCount = 0;
    words.forEach((w) => {
      const cells = wordCells(w);
      const filled = cells.every(({ r, c }) => {
        const input = cellInputs[`${r},${c}`].input;
        return input.value && input.value === w.answer[cells.findIndex((x) => x.r === r && x.c === c)];
      });
      w.solved = filled;
      const clueEl = document.querySelector(`.clue-item[data-word-id="${w.id}"]`);
      if (clueEl) clueEl.classList.toggle("solved", filled);
      if (filled) solvedCount++;
    });
    document.getElementById("progress-count").textContent = `${solvedCount}/${words.length}`;
    return solvedCount;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function beginGame() {
    if (started) return;
    started = true;
    startTime = Date.now();
    timerInterval = setInterval(() => {
      elapsedSeconds = (Date.now() - startTime) / 1000;
      document.getElementById("timer-display").textContent = formatTime(elapsedSeconds);
    }, 500);
    setTimeout(() => {
      const first = words[0];
      selectCell(first.row, first.col, first.dir);
    }, 50);
  }

  // ---- check / submit -------------------------------------------------------------
  function checkAnswers() {
    let anyFilled = false;
    words.forEach((w) => {
      wordCells(w).forEach(({ r, c, i }) => {
        const { input, cellEl } = cellInputs[`${r},${c}`];
        if (!input.value) return;
        anyFilled = true;
        cellEl.classList.remove("correct", "incorrect");
        if (input.value === w.answer[i]) {
          cellEl.classList.add("correct");
        } else {
          cellEl.classList.add("incorrect");
        }
      });
    });
    updateProgress();
    if (!anyFilled) {
      toast("Fill in some letters first", "error");
    } else {
      toast("Checked! Green = correct, red = incorrect", "success");
    }
  }

  async function submitGame() {
    clearInterval(timerInterval);
    const finalTime = Math.round((Date.now() - startTime) / 1000);
    const solvedCount = updateProgress();
    const total = words.length;
    const pct = Math.round((solvedCount / total) * 100);

    document.getElementById("result-name").textContent = player.name;
    document.getElementById("score-ring").style.setProperty("--pct", pct);
    document.getElementById("result-pct").textContent = pct + "%";
    document.getElementById("result-pct-2").textContent = pct + "%";
    document.getElementById("result-correct").textContent = `${solvedCount}/${total}`;
    document.getElementById("result-time").textContent = formatTime(finalTime);

    showPanel("results");

    const record = {
      name: player.name,
      email: player.email,
      correctCount: solvedCount,
      totalWords: total,
      percentage: pct,
      timeSeconds: finalTime,
    };

    const statusEl = document.getElementById("submit-status");
    try {
      if (window.NBFirebase && window.NBFirebase.isConfigured) {
        await window.NBFirebase.submitScore(record);
        statusEl.textContent = "Your score has been saved to the leaderboard.";
        statusEl.className = "privacy-note";
      } else {
        statusEl.textContent =
          "Leaderboard backend isn't connected yet — your score wasn't saved centrally.";
        statusEl.className = "privacy-note";
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Couldn't save your score to the leaderboard. Please try again later.";
      statusEl.className = "privacy-note";
    }
  }

  document.getElementById("btn-check").addEventListener("click", checkAnswers);
  document.getElementById("btn-submit").addEventListener("click", () => {
    const solved = updateProgress();
    const msg =
      solved === 0
        ? "Submit with 0 clues solved? That's okay — you can submit at any point, even with none filled in. You won't be able to keep editing after this."
        : `Submit your score with ${solved}/${words.length} clues solved? You won't be able to keep editing after this.`;
    if (confirm(msg)) {
      submitGame();
    }
  });
  document.getElementById("btn-goto-board").addEventListener("click", () => {
    window.location.href = "scoreboard.html";
  });
  document.getElementById("btn-play-again").addEventListener("click", () => {
    window.location.reload();
  });

  showPanel("entry");
})();
