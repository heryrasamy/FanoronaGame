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

// ===== Initialisation du plateau =====
function initBoard() {
    const container = document.getElementById('boardContainer');
    container.innerHTML = '';
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            if (board[i][j] === "B") cell.classList.add('ai');
            if (board[i][j] === "W") cell.classList.add('player');
            if (selected && selected[0] === i && selected[1] === j) cell.classList.add('selected');
            cell.addEventListener('click', () => handleCellClick(i, j));
            container.appendChild(cell);
        }
    }
    updateScore();
    updateStatus();
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

// ===== Gestion du clic sur une cellule =====
function handleCellClick(i, j) {
    if (gameEnded) return;
    if (!playerTurn) return;

    if (selected) {
        const [si, sj] = selected;
        if (possibleMoves.some(([mi, mj]) => mi === i && mj === j)) {
            movePiece([si, sj], [i, j]);
            return;
        } else {
            selected = null;
            possibleMoves = [];
            initBoard();
        }
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
    const [fi, fj] = from;
    const [ti, tj] = to;

    const captures = checkCaptures(fi, fj, ti, tj, "W");
    captures.forEach(([ci, cj]) => board[ci][cj] = " ");

    board[ti][tj] = board[fi][fj];
    board[fi][fj] = " ";

    selected = [ti, tj];
    possibleMoves = getAdditionalCaptures(ti, tj, [fi, fj]);

    if (possibleMoves.length > 0) {
        document.getElementById('gameStatus').textContent = "  Capture multiple - Continuez l'attaque !";
        return;
    }

    selected = null;
    possibleMoves = [];
    playerTurn = false;
    initBoard();

    if (!checkGameEnd()) setTimeout(makeAIMove, 500);
}

// ===== Mouvements valides =====
function getValidMoves(i, j) {
    const moves = [];
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    directions.forEach(([di, dj]) => {
        const ni = i + di, nj = j + dj;
        if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === " ") {
            moves.push([ni, nj]);
        }
    });
    return moves;
}

// ===== Captures =====
function checkCaptures(fromI, fromJ, toI, toJ, player) {
    const opponent = player === "W" ? "B" : "W";
    const captures = [];
    const di = toI - fromI;
    const dj = toJ - fromJ;

    // Approche
    let ni = toI + di, nj = toJ + dj;
    while (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === opponent) {
        captures.push([ni, nj]);
        ni += di; nj += dj;
    }

    // Retrait
    ni = fromI - di; nj = fromJ - dj;
    while (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === opponent) {
        captures.push([ni, nj]);
        ni -= di; nj -= dj;
    }

    return captures;
}

// ===== Combos =====
function getAdditionalCaptures(i, j, previous) {
    const moves = getValidMoves(i, j);
    return moves.filter(([ni, nj]) => checkCaptures(i, j, ni, nj, "W").length > 0);
}

// ===== IA =====
function makeAIMove() {
    if (gameEnded) return;
    const moves = [];
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (board[i][j] === "B") {
                const valids = getValidMoves(i, j);
                valids.forEach(([ni, nj]) => {
                    const caps = checkCaptures(i, j, ni, nj, "B");
                    moves.push({ from: [i, j], to: [ni, nj], captures: caps });
                });
            }
        }
    }
    if (moves.length === 0) return;

    moves.sort((a, b) => b.captures.length - a.captures.length);
    const move = moves[0];
    const [si, sj] = move.from;
    const [ti, tj] = move.to;

    move.captures.forEach(([ci, cj]) => board[ci][cj] = " ");
    board[ti][tj] = board[si][sj];
    board[si][sj] = " ";

    playerTurn = true;
    initBoard();
    checkGameEnd();
}

// ===== Fin de partie =====
function checkGameEnd() {
    const whiteLeft = board.flat().filter(c => c === "W").length;
    const blackLeft = board.flat().filter(c => c === "B").length;

    if (whiteLeft === 0) {
        document.getElementById('gameStatus').textContent = " Tu as été battu par L'IA !";
        gameEnded = true;
        return true;
    }
    if (blackLeft === 0) {
        document.getElementById('gameStatus').textContent = "Bravo, Tu as gagné !";
        gameEnded = true;
        return true;
    }
    return false;
}

// ===== Scores =====
function updateScore() {
    document.getElementById('whiteScore').textContent = board.flat().filter(c => c === "W").length;
    document.getElementById('blackScore').textContent = board.flat().filter(c => c === "B").length;
}

// ===== Statut =====
function updateStatus() {
    if (gameEnded) return;
    const status = document.getElementById('gameStatus');
    if (playerTurn) {
        status.textContent = "À ton tour !";
        status.style.background = "linear-gradient(135deg, #27ae60, #2ecc71)";
    } else {
        status.textContent = "L'IA va attaquer prépare toi !";
        status.style.background = "linear-gradient(135deg, #e74c3c, #c0392b)";
    }
}

// ===== Reset =====
document.getElementById('resetButton').addEventListener('click', () => {
    createInitialBoard();
    initBoard();
});

// ===== Lancement =====
window.onload = function () {
    createInitialBoard();
    initBoard();
};
