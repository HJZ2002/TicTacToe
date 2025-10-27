// methods and implements 
const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const playerScoreText = document.querySelector("#playerScore");
const aiScoreText = document.querySelector("#aiScore");
const highScoreText = document.querySelector("#highScore");
const bestTimeText = document.querySelector("#bestTime");
const playerNameText = document.querySelector("#playerName");
const changeNameBtn = document.querySelector("#changeNameBtn");
const leaderboardList = document.querySelector("#leaderboardList");

// Optional color buttons (only wired if present in HTML)
const changeColorBtnTop = document.querySelector("#changeColorBtn");
const changeColorBtnBottom = document.querySelector("#colorBtnBottom");

// === LocalStorage keys ===
const LS_KEYS = {
  name: "ttt_player_name",
  high: "ttt_high_score",
  bestTime: "ttt_best_time_ms",
  boardFast: "ttt_fastest_leaderboard",
  themeHue: "ttt_theme_hue"
};
//setting up the board
const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

let options = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let humanPlayer = "X"; // chosen by player each round
let aiPlayer = "O";
let running = false;
let playerScore = 0;
let aiScore = 0;

// === Timer state ===
let roundStartAt = 0;

// === Reduced motion? ===
const PREFERS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// === Persistent state ===
let playerName = loadName();
let allTimeHigh = loadHighScore();
let bestTimeMs = loadBestTime();
let leaderboardFast = loadFastLeaderboard();

/* ============================
   COLOR-BLIND MODE (add-on)
   ============================ */
const CB_PALETTES = [
  { name: "Default",      x: "#ff6b6b", o: "#4cd3ff" }, // your current look
  { name: "Deuteranopia", x: "#f9a602", o: "#0561fc" }, // orange vs deep blue
  { name: "Protanopia",   x: "#c24b30", o: "#00857a" }, // brick vs teal
  { name: "Tritanopia",   x: "#e56dcb", o: "#35c53a" }, // magenta vs green
  { name: "Monochrome",   x: "#cccccc", o: "#666666" }  // light vs dark gray
];

// Safely apply a palette by 
function applyColorBlindPalette(index){
  const listLen = CB_PALETTES.length;
  const idx = ((index % listLen) + listLen) % listLen;
  const p = CB_PALETTES[idx];
  const root = document.documentElement;
  root.style.setProperty("--x", p.x);
  root.style.setProperty("--o", p.o);
  localStorage.setItem("ttt_colorblind_index", String(idx));
 
  // setStatus(`Color mode: ${p.name}`);
}

// Cycle to next palette
function nextColorBlindPalette(){
  const cur = parseInt(localStorage.getItem("ttt_colorblind_index") || "0", 10);
  applyColorBlindPalette((cur + 1) % CB_PALETTES.length);
}

// === Init ===
initializeGame();

// === Persistence helpers ===
function loadName(){
  const n = localStorage.getItem(LS_KEYS.name);
  if (n && n.trim()) return n.trim();
  const ask = prompt("Enter your player name:", "Player") || "Player";
  localStorage.setItem(LS_KEYS.name, ask.trim());
  return ask.trim();
}
function saveName(n){ localStorage.setItem(LS_KEYS.name, n); }

function loadHighScore(){ return Number(localStorage.getItem(LS_KEYS.high) || 0); }
function saveHighScore(v){ localStorage.setItem(LS_KEYS.high, String(v)); }

function loadBestTime(){
  const v = localStorage.getItem(LS_KEYS.bestTime);
  return v ? Number(v) : Infinity;
}
function saveBestTime(ms){ localStorage.setItem(LS_KEYS.bestTime, String(ms)); }

function loadFastLeaderboard(){
  try{
    const raw = localStorage.getItem(LS_KEYS.boardFast);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveFastLeaderboard(arr){
  localStorage.setItem(LS_KEYS.boardFast, JSON.stringify(arr));
}

function renderFastLeaderboard(){
  leaderboardList.innerHTML = "";
  leaderboardFast
    .slice(0, 10)
    .forEach((row, i) => {
      const li = document.createElement("li");
      const date = new Date(row.date).toLocaleString();
      li.textContent = `${i+1}. ${row.name} — ${(row.ms/1000).toFixed(2)}s (on ${date})`;
      leaderboardList.appendChild(li);
    });
}
function renderBestTime(){
  bestTimeText.textContent = isFinite(bestTimeMs) ? (bestTimeMs/1000).toFixed(2) + "s" : "—";
}

// === Utility ===
function setStatus(msg){
  statusText.textContent = msg;
}

function clearBoardVisuals(){
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("x","o","filled","placing","win");
    // clear any inline highlight 
    cell.style.boxShadow = "";
    cell.style.filter = "";
  });
}

function chooseHumanSymbol(){
  while (true) {
    let s = prompt("Choose your symbol (X or O):", "X");
    if (!s) s = "X";
    s = s.trim().toUpperCase();
    if (s === "X" || s === "O") return s;
    alert("Please enter X or O.");
  }
}

function highlightWinLine(indices){
  // Inline visual highlight using currentColor and existing transitions
  indices.forEach(i => {
    const el = cells[i];
    el.classList.add("win"); // harmless if CSS has no .win style
    el.style.boxShadow = "inset 0 0 0 2px currentColor, 0 0 20px currentColor";
  });

  if (!PREFERS_REDUCED) {
    // Simple pulse 
    let step = 0;
    const pulse = setInterval(()=>{
      step++;
      const on = step % 2 === 1;
      indices.forEach(i => cells[i].style.filter = on ? "brightness(1.25)" : "brightness(1)");
      if (step >= 4) {
        clearInterval(pulse);
        indices.forEach(i => cells[i].style.filter = "");
      }
    }, 250);
  }
}

// === Game setup and its functions ===
function initializeGame() {
  // Accessibility: announce status changes
  statusText.setAttribute("role", "status");
  statusText.setAttribute("aria-live", "polite");

  // UI bind
  playerNameText.textContent = playerName;
  highScoreText.textContent = allTimeHigh;
  renderBestTime();

  changeNameBtn.addEventListener("click", () => {
    const n = prompt("Change player name:", playerName) || playerName;
    playerName = n.trim() || "Player";
    playerNameText.textContent = playerName;
    saveName(playerName);
  });

  renderFastLeaderboard();

  // Prepare cells: index, click, keyboard access
  cells.forEach((cell, index) => {
    cell.setAttribute("cellIndex", index);
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", `Board cell ${index+1}`);
    cell.addEventListener("click", cellClicked);
    cell.addEventListener("keydown", e=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        cell.click();
      }
    });
  });

  // Restart
  restartBtn.addEventListener("click", restartGame);

  // Color theme buttons (optional)
  const root = document.documentElement;
  const applyHue = (h)=>{
    localStorage.setItem(LS_KEYS.themeHue, String(h));
    root.style.setProperty("--accent", `hsl(${h}, 80%, 65%)`);
    root.style.setProperty("--accent-2", `hsl(${(h+200)%360}, 80%, 60%)`);
    // NOTE: X/O colors are controlled by color-blind palettes; we leave them alone here.
  };
  const storedHue = Number(localStorage.getItem(LS_KEYS.themeHue));
  if (!Number.isNaN(storedHue)) applyHue(storedHue);

  function randomizeTheme(){
    const h = Math.floor(Math.random()*360);
    applyHue(h);
  }
  if (changeColorBtnTop) changeColorBtnTop.addEventListener("click", randomizeTheme);
  if (changeColorBtnBottom) changeColorBtnBottom.addEventListener("click", randomizeTheme);

  // Restore saved color-blind palette (default index 0 if none)
  const savedCB = parseInt(localStorage.getItem("ttt_colorblind_index") || "0", 10);
  applyColorBlindPalette(savedCB);

  // Add a Color-Blind Mode button next to Restart (no HTML/CSS edits)
  if (!document.querySelector("#colorBlindBtn")) {
    const cbBtn = document.createElement("button");
    cbBtn.id = "colorBlindBtn";
    cbBtn.textContent = "Color-Blind Mode";
    cbBtn.className = "small";
    cbBtn.style.marginLeft = "6px"; // tiny spacing to match your UI
    restartBtn.insertAdjacentElement("afterend", cbBtn);
    cbBtn.addEventListener("click", nextColorBlindPalette);
  }

  // Start a round with player's choice of symbol
  startNewRoundWithChoice();
  running = true;
}

// === Round control ===
function startNewRoundWithChoice(){
  // Clear board state for restart
  options = ["", "", "", "", "", "", "", "", ""];
  clearBoardVisuals();

  // Player chooses symbol
  humanPlayer = chooseHumanSymbol();
  aiPlayer = (humanPlayer === "X") ? "O" : "X";

  // X always starts
  currentPlayer = (humanPlayer === "X") ? humanPlayer : aiPlayer;
  setStatus(`${currentPlayer === humanPlayer ? "Player" : "AI"}'s turn`);

  // Timer for fastest-win
  roundStartAt = performance.now();
  running = true;

  // If AI starts, make its move
  if (currentPlayer === aiPlayer) {
    setTimeout(aiMove, 300);
  }
}

// Backward-compat if something calls startNewRound()
function startNewRound(){
  startNewRoundWithChoice();
}

// === Interaction ===
function cellClicked() {
  const cellIndex = this.getAttribute("cellIndex");
  if (this.classList.contains("filled")) return;
  if (options[cellIndex] !== "" || !running || currentPlayer !== humanPlayer) return;

  updateCell(this, cellIndex);
  this.classList.add("filled");
  checkWinner();
  if (running) setTimeout(aiMove, 300);
}

function updateCell(cell, index) {
  options[index] = currentPlayer;
  cell.textContent = currentPlayer;
  // Color/animation hooks (CSS may style .x/.o/.placing)
  cell.classList.add(currentPlayer.toLowerCase(), "placing");
  if (!PREFERS_REDUCED) {
    cell.addEventListener('animationend', () => cell.classList.remove('placing'), { once: true });
  } else {
    // Immediately remove when reduced motion (no animation)
    cell.classList.remove('placing');
  }
}

function changePlayer() {
  currentPlayer = (currentPlayer === "X") ? "O" : "X";
  setStatus(`${currentPlayer === humanPlayer ? "Player" : "AI"}'s turn`);
}

function checkWinner() {
  let winLine = null;

  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    const cellA = options[a], cellB = options[b], cellC = options[c];
    if (cellA === "" || cellB === "" || cellC === "") continue;
    if (cellA === cellB && cellB === cellC) { winLine = [a,b,c]; break; }
  }

  if (winLine) {
    running = false;
    const humanWon = currentPlayer === humanPlayer;
    setStatus(humanWon ? "Player wins!" : "AI wins!");

    // highlight winners (inline styles only)
    highlightWinLine(winLine);

    if (humanWon) {
      // Update session score and high score
      playerScore++;
      playerScoreText.textContent = playerScore;

      if (playerScore > allTimeHigh) {
        allTimeHigh = playerScore;
        highScoreText.textContent = allTimeHigh;
        saveHighScore(allTimeHigh);
      }

      // Fastest win tracking
      const elapsedMs = Math.max(0, performance.now() - roundStartAt);
      if (elapsedMs < bestTimeMs) {
        bestTimeMs = elapsedMs;
        saveBestTime(bestTimeMs);
        renderBestTime();
      }

      // Leaderboard push (Top 10 fastest)
      leaderboardFast.push({
        name: playerName,
        ms: elapsedMs,
        date: new Date().toISOString()
      });
      leaderboardFast.sort((a, b) => a.ms - b.ms || new Date(a.date) - new Date(b.date));
      // cap stored list to avoid unlimited growth
      if (leaderboardFast.length > 50) leaderboardFast.length = 50;
      saveFastLeaderboard(leaderboardFast);
      renderFastLeaderboard();

    } else {
      aiScore++;
      aiScoreText.textContent = aiScore;
    }

    return;
  }

  if (!options.includes("")) {
    setStatus("Draw!");
    running = false;
  } else {
    changePlayer();
  }
}

function aiMove() {
  if (!running) return;
  const bestMove = findBestMove();
  if (bestMove !== null) {
    const aiCell = cells[bestMove];
    updateCell(aiCell, bestMove);
    aiCell.classList.add("filled");
    checkWinner();
    if (running) {
      currentPlayer = humanPlayer;
      setStatus("Player's turn");
    }
  }
}

function findBestMove() {
  // Try to win the ai bro
  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (options[a] === aiPlayer && options[b] === aiPlayer && options[c] === "") return c;
    if (options[a] === aiPlayer && options[c] === aiPlayer && options[b] === "") return b;
    if (options[b] === aiPlayer && options[c] === aiPlayer && options[a] === "") return a;
  }
  // Block
  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (options[a] === humanPlayer && options[b] === humanPlayer && options[c] === "") return c;
    if (options[a] === humanPlayer && options[c] === humanPlayer && options[b] === "") return b;
    if (options[b] === humanPlayer && options[c] === humanPlayer && options[a] === "") return a;
  }
  // Random
  const empty = [];
  options.forEach((v, i) => { if (v === "") empty.push(i); });
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

// === Restart: ask X/O again every time ===
function restartGame() {
  running = true;
  startNewRoundWithChoice();
}
