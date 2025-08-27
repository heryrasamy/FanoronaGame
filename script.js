const ROWS = 5;
const COLS = 9;
let board = [];
let selected = null;
let playerTurn = true;

function createBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(" "));
    board[0].fill("X");
    board[1].fill("X");
    board[2] = ["O", "X", "O", "X", " ", "O", "X", "O", "X"];
    board[3].fill("O");
    board[4].fill("O");
}

function drawBoard() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";
    board.forEach((row, r) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";
        row.forEach((cell, c) => {
            const cellDiv = document.createElement("div");
            cellDiv.className = "cell";
            if (selected && selected[0] === r && selected[1] === c) cellDiv.classList.add("selected");
            if (cell === "X") cellDiv.classList.add("player");
            if (cell === "O") cellDiv.classList.add("ai");
            cellDiv.textContent = cell;
            cellDiv.addEventListener("click", () => handleClick(r, c));
            rowDiv.appendChild(cellDiv);
        });
        gameBoard.appendChild(rowDiv);
    });
}

function handleClick(i, j) {
    if (!playerTurn) return;
    if (selected) {
        const [si, sj] = selected;
        if (Math.abs(si - i) <= 1 && Math.abs(sj - j) <= 1 && !(si === i && sj === j) && board[i][j] === " ") {
            board[i][j] = "X";
            board[si][sj] = " ";
            selected = null;
            playerTurn = false;
            drawBoard();
            setTimeout(aiMove, 500);
            return;
        } else {
            selected = null;
        }
    }
    if (board[i][j] === "X") selected = [i, j];
    drawBoard();
}

function aiMove() {
    const moves = [];
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (board[i][j] === "O") {
                [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([di, dj]) => {
                    const ni = i + di, nj = j + dj;
                    if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj] === " ") moves.push([[i, j], [ni, nj]]);
                });
            }
        }
    }
    if (moves.length > 0) {
        const [[si, sj], [di, dj]] = moves[Math.floor(Math.random() * moves.length)];
        board[di][dj] = "O";
        board[si][sj] = " ";
    }
    playerTurn = true;
    drawBoard();
}

document.getElementById("resetBtn").addEventListener("click", () => {
    createBoard();
    drawBoard();
});

createBoard();
drawBoard();
