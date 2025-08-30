window.addEventListener("DOMContentLoaded", () => {
    // === TON SCRIPT V1.0 COMMENCE ICI ===
// ===== Paramètres du plateau =====
const ROWS = 5;
const COLS = 9;

let board = [];
let selected = null;
let possibleMoves = [];
let playerTurn = true;
let whiteScore = 22;
let blackScore = 22;
let gameEnded = false;
let moveHistory = [];
let captureSequence = false;
let lastMovePosition = null;

// ===== RÉGLAGE CANVAS =====
const boardWrapper = document.getElementById('boardWrapper');
const boardContainer = document.getElementById('boardContainer');
const boardCanvas = document.getElementById('boardCanvas');
const ctx = boardCanvas.getContext('2d');

function drawBoardCanvas() {
    const w = boardWrapper.clientWidth;
    const h = boardWrapper.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    boardCanvas.width = Math.floor(w * dpr);
    boardCanvas.height = Math.floor(h * dpr);
    boardCanvas.style.width = w + 'px';
    boardCanvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    const cellW = w / COLS;
    const cellH = h / ROWS;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#8b4513';
    ctx.lineWidth = 2;

    const P = (r, c) => [c * cellW + cellW / 2, r * cellH + cellH / 2];

    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const [x, y] = P(r, c);
            if (c + 1 < COLS) { const [x2, y2] = P(r, c + 1); ctx.moveTo(x, y); ctx.lineTo(x2, y2); }
            if (r + 1 < ROWS) { const [x2, y2] = P(r + 1, c); ctx.moveTo(x, y); ctx.lineTo(x2, y2); }
            if (r + 1 < ROWS && c + 1 < COLS) { const [x2, y2] = P(r + 1, c + 1); ctx.moveTo(x, y); ctx.lineTo(x2, y2); }
            if (r + 1 < ROWS && c - 1 >= 0) { const [x2, y2] = P(r + 1, c - 1); ctx.moveTo(x, y); ctx.lineTo(x2, y2); }
        }
    }
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeRect(cellW / 2, cellH / 2, w - cellW, h - cellH);
}

window.addEventListener('resize', drawBoardCanvas);

// ===== Initialisation du plateau =====
function initBoard() {
    boardContainer.innerHTML = '';
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = board[i][j] === " " ? "" : board[i][j];
            if (board[i][j] === "B") cell.classList.add('ai');
            if (board[i][j] === "W") cell.classList.add('player');
            if (selected && selected[0] === i && selected[1] === j) cell.classList.add('selected');
            cell.addEventListener('click', () => handleCellClick(i, j));
            boardContainer.appendChild(cell);
        }
    }
    updateScore();
    updateStatus();
    drawBoardCanvas();
}

// ===== Création du plateau initial =====
function createInitialBoard() {
    board = [
        ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
        ["W", "W", "W", "W", "W", "W", "W", "W", "W"],
        ["B", "W", "B", "W", " ", "B", "W", "B", "W"],
        ["B", "B", "B", "B", "B", "B", "B", "B", "B"],
        ["B", "B", "B", "B", "B", "B", "B", "B", "B"]
    ];
    selected = null;
    possibleMoves = [];
    playerTurn = true;
    whiteScore = 22;
    blackScore = 22;
    gameEnded = false;
    moveHistory = [];
    captureSequence = false;
    lastMovePosition = null;
}

// ===== Gestion du clic =====
function handleCellClick(i, j) {
    if (gameEnded || !playerTurn) return;
    if (selected) {
        const [si, sj] = selected;
        if (possibleMoves.some(([mi, mj]) => mi === i && mj === j)) {
            movePiece([si, sj], [i, j]);
            return;
        } else { selected = null; possibleMoves = []; initBoard(); }
    }
    if (board[i][j] === "W") {
        selected = [i, j];
        possibleMoves = getValidMoves(i, j);
        initBoard();
        possibleMoves.forEach(([mi, mj]) => {
            const cell = document.querySelector(`[data-row="${mi}"][data-col="${mj}"]`);
            if (cell) cell.classList.add('possible-move');
        });
    }
}

// ===== Déplacement d'un pion =====
function movePiece(from, to) {
    const [fi, fj] = from; const [ti, tj] = to;
    const captures = checkCaptures(fi, fj, ti, tj, "W");
    captures.forEach(([ci, cj]) => board[ci][cj] = " ");
    board[ti][tj] = board[fi][fj]; board[fi][fj] = " ";
    selected = [ti, tj]; possibleMoves = getAdditionalCaptures(ti, tj, [fi, fj]);
    if (possibleMoves.length > 0) { document.getElementById('gameStatus').textContent = " Capture multiple - Continuez l'attaque !"; return; }
    selected = null; possibleMoves = []; playerTurn = false; initBoard();
    if (!checkGameEnd()) setTimeout(makeAIMove, 500);
}

// ===== Mouvements valides =====
function getValidMoves(i, j) {
    const moves = []; const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    dirs.forEach(([di, dj]) => { const ni = i + di, nj = j + dj; if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === " ") { moves.push([ni, nj]); } });
    return moves;
}

// ===== Captures =====
function checkCaptures(fromI, fromJ, toI, toJ, player) {
    const opp = player === "W" ? "B" : "W"; const caps = []; const di = toI - fromI, dj = toJ - fromJ;
    let ni = toI + di, nj = toJ + dj;
    while (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === opp) { caps.push([ni, nj]); ni += di; nj += dj; }
    ni = fromI - di; nj = fromJ - dj;
    while (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === opp) { caps.push([ni, nj]); ni -= di; nj -= dj; }
    return caps;
}

// ===== Captures supplémentaires =====
function getAdditionalCaptures(i, j, prev) { const m = getValidMoves(i, j); return m.filter(([ni, nj]) => checkCaptures(i, j, ni, nj, "W").length > 0); }

// ===== IA =====
function makeAIMove() {
    if (gameEnded) return;
    const moves = [];
    for (let i = 0; i < ROWS; i++) { for (let j = 0; j < COLS; j++) { if (board[i][j] === "B") { const val = getValidMoves(i, j); val.forEach(([ni, nj]) => { const caps = checkCaptures(i, j, ni, nj, "B"); moves.push({ from: [i, j], to: [ni, nj], captures: caps }); }); } } }
    if (moves.length === 0) return;
    moves.sort((a, b) => b.captures.length - a.captures.length);
    const m = moves[0]; const [si, sj] = m.from, [ti, tj] = m.to; m.captures.forEach(([ci, cj]) => board[ci][cj] = " "); board[ti][tj] = board[si][sj]; board[si][sj] = " "; playerTurn = true; initBoard(); checkGameEnd();
}

// ===== Fin de partie =====
function checkGameEnd() {
    const w = board.flat().filter(c => c === "W").length, b = board.flat().filter(c => c === "B").length;
    if (w === 0) { document.getElementById('gameStatus').textContent = " L'IA a gagné !"; gameEnded = true; return true; }
    if (b === 0) { document.getElementById('gameStatus').textContent = "Bravo, Tu as gagné !"; gameEnded = true; return true; }
    return false;
}

// ===== Scores =====
function updateScore() {
    document.getElementById('whiteScore').textContent = board.flat().filter(c => c === "W").length;
    document.getElementById('blackScore').textContent = board.flat().filter(c => c === "B").length;
}

// ===== Statut =====
function updateStatus() {
    if (gameEnded) return; const s = document.getElementById('gameStatus');
    if (playerTurn) { s.textContent = "À ton tour - Attaquez l'IA !"; s.style.background = "linear-gradient(135deg,#27ae60,#2ecc71)"; }
    else { s.textContent = "L'IA va attaquer prépare toi !"; s.style.background = "linear-gradient(135deg,#e74c3c,#c0392b)"; }
}

// ===== Réinitialisation =====
document.getElementById('resetButton').addEventListener('click', () => { createInitialBoard(); initBoard(); });

// ===== Démarrage =====
window.onload = function () { createInitialBoard(); initBoard(); };
