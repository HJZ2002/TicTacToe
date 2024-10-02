const cells = document.querySelectorAll(".cell");
const statusText = document.querySelector("#statusText");
const restartBtn = document.querySelector("#restartBtn");
const playerScoreText = document.querySelector("#playerScore");
const aiScoreText = document.querySelector("#aiScore");

const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let options = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let humanPlayer = "X";
let aiPlayer = "O";
let running = false;
let playerScore = 0;  // Track player score
let aiScore = 0;      // Track AI score
let playerLosses = 0; // Track player losses
const lossLimit = 5;  // Limit to prompt "X" or "O"

initializeGame();

function initializeGame() {
    if (playerLosses >= lossLimit) {
        choosePlayer();  // Ask after 5 losses
    } else {
        resetGameVariables();  // Just reset for normal game start
    }
    cells.forEach((cell, index) => {
        cell.setAttribute("cellIndex", index);
        cell.addEventListener("click", cellClicked);
    });
    restartBtn.addEventListener("click", restartGame);
    statusText.textContent = `${currentPlayer === humanPlayer ? "Player" : "AI"}'s turn`;
    running = true;
}

function choosePlayer() {
    let choice = prompt("Do you want to be 'X' or 'O'?").toUpperCase();
    if (choice !== "X" && choice !== "O") {
        choice = "X"; // Default to X if input is invalid
    }
    humanPlayer = choice;
    aiPlayer = humanPlayer === "X" ? "O" : "X";
    resetGameVariables();
}

function resetGameVariables() {
    options = ["", "", "", "", "", "", "", "", ""];
    cells.forEach(cell => cell.textContent = "");
    if (Math.random() < 0.5) {
        currentPlayer = humanPlayer; // Player starts
    } else {
        currentPlayer = aiPlayer; // AI starts
        statusText.textContent = "AI's turn";
        setTimeout(aiMove, 300);
    }
}

function cellClicked() {
    const cellIndex = this.getAttribute("cellIndex");

    if (options[cellIndex] !== "" || !running || currentPlayer !== humanPlayer) {
        return; // Prevent clicking if cell is occupied, game is over, or AI's turn
    }

    updateCell(this, cellIndex);
    checkWinner();

    if (running) {
        setTimeout(aiMove, 300); // AI takes a turn if game is still running
    }
}

function updateCell(cell, index) {
    options[index] = currentPlayer;
    cell.textContent = currentPlayer;
}

function changePlayer() {
    currentPlayer = (currentPlayer === "X") ? "O" : "X";
    statusText.textContent = `${currentPlayer === humanPlayer ? "Player" : "AI"}'s turn`;
}

function checkWinner() {
    let roundWon = false;

    for (let i = 0; i < winConditions.length; i++) {
        const condition = winConditions[i];
        const cellA = options[condition[0]];
        const cellB = options[condition[1]];
        const cellC = options[condition[2]];

        if (cellA === "" || cellB === "" || cellC === "") {
            continue;
        }
        if (cellA === cellB && cellB === cellC) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusText.textContent = `${currentPlayer === humanPlayer ? "Player" : "AI"} wins!`;
        running = false;

        // Update scores
        if (currentPlayer === humanPlayer) {
            playerScore++;
            playerScoreText.textContent = playerScore; // Update player score on screen
        } else {
            aiScore++;
            aiScoreText.textContent = aiScore; // Update AI score on screen
            playerLosses++;  // Increment loss counter if AI wins
        }

    } else if (!options.includes("")) {
        statusText.textContent = "Draw!";
        running = false;
    } else {
        changePlayer();
    }
}

function aiMove() {
    if (!running) return;

    let bestMove = findBestMove();

    if (bestMove !== null) {
        const aiCell = cells[bestMove];
        updateCell(aiCell, bestMove);
        checkWinner();

        if (running) {
            currentPlayer = humanPlayer;
            statusText.textContent = "Player's turn";
        }
    }
}

function findBestMove() {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (options[a] === aiPlayer && options[b] === aiPlayer && options[c] === "") return c;
        if (options[a] === aiPlayer && options[c] === aiPlayer && options[b] === "") return b;
        if (options[b] === aiPlayer && options[c] === aiPlayer && options[a] === "") return a;
    }

    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (options[a] === humanPlayer && options[b] === humanPlayer && options[c] === "") return c;
        if (options[a] === humanPlayer && options[c] === humanPlayer && options[b] === "") return b;
        if (options[b] === humanPlayer && options[c] === humanPlayer && options[a] === "") return a;
    }

    let emptyCells = [];
    options.forEach((cell, index) => {
        if (cell === "") {
            emptyCells.push(index);
        }
    });
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
}

function restartGame() {
    if (playerLosses >= lossLimit) {
        choosePlayer();  // Ask again if player lost 5 times
    } else {
        resetGameVariables();  // No prompt, just reset
    }
    running = true;
}
