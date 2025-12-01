'use strict';

const state = {
  board: null,
  score: 0,
  previousBoard: null,
  previousScore: 0,
  isGameOver: false,
  resultSaved: false
};

let gameBoardEl;
let scoreEl;
let newGameBtn;
let undoBtn;
let leaderboardBtn;
let controlsEl;
let overlayEl;
let overlayMessageEl;
let playerNameInput;
let saveResultBtn;
let restartBtn;
let leaderboardModalEl;
let closeLeaderboardBtn;
let leaderboardBodyEl;
let directionButtons;

let cells = [];

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  cacheElements();
  createBoardCells();
  attachEventListeners();
  loadGameOrStartNew();
  renderAll();
}


function cacheElements() {
  gameBoardEl = getElement('gameBoard');
  scoreEl = getElement('score');
  newGameBtn = getElement('newGameBtn');
  undoBtn = getElement('undoBtn');
  leaderboardBtn = getElement('leaderboardBtn');
  controlsEl = getElement('controls');

  overlayEl = getElement('gameOverOverlay');
  overlayMessageEl = getElement('gameOverMessage');
  playerNameInput = getElement('playerName');
  saveResultBtn = getElement('saveResultBtn');
  restartBtn = getElement('restartBtn');

  leaderboardModalEl = getElement('leaderboardModal');
  closeLeaderboardBtn = getElement('closeLeaderboardBtn');
  leaderboardBodyEl = getElement('leaderboardBody');

  directionButtons = document.querySelectorAll('[data-direction]');
}

function createBoardCells() {
  while (gameBoardEl.firstChild) {
    gameBoardEl.removeChild(gameBoardEl.firstChild);
  }

  cells = [];

  const totalCells = BOARD_SIZE * BOARD_SIZE;

  for (let i = 0; i < totalCells; i += 1) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cells.push(cell);
    gameBoardEl.appendChild(cell);
  }
}

function attachEventListeners() {
  newGameBtn.addEventListener('click', function () {
    startNewGame();
  });

  undoBtn.addEventListener('click', function () {
    undoMove();
  });

  leaderboardBtn.addEventListener('click', function () {
    openLeaderboard();
  });

  closeLeaderboardBtn.addEventListener('click', function () {
    closeLeaderboard();
  });

  saveResultBtn.addEventListener('click', function () {
    handleSaveResult();
  });

  restartBtn.addEventListener('click', function () {
    startNewGame();
  });

  document.addEventListener('keydown', function (event) {
    handleKeyDown(event);
  });

  directionButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const direction = button.getAttribute('data-direction');
      handleMove(direction);
    });
  });
}


function saveGameState() {
  const gameState = {
    board: state.board,
    score: state.score,
    isGameOver: state.isGameOver
  };

  try {
    localStorage.setItem(STORAGE_KEYS.gameState, JSON.stringify(gameState));
  } catch (error) {
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.gameState);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function saveLeaderboard(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(list));
  } catch (error) {
  }
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.leaderboard);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    return [];
  }
}


function loadGameOrStartNew() {
  const saved = loadGameState();

  if (saved && saved.board && saved.board.length === BOARD_SIZE) {
    state.board = saved.board;
    state.score = saved.score || 0;
    state.isGameOver = Boolean(saved.isGameOver);
    state.previousBoard = null;
    state.previousScore = 0;
    state.resultSaved = false;

    if (state.isGameOver) {
      showGameOverOverlay();
      setControlsVisible(false);
    } else {
      hideGameOverOverlay();
      setControlsVisible(true);
    }
  } else {
    startNewGame();
  }

  updateUndoButtonState();
}

function startNewGame() {
  state.board = Game.initializeBoard();
  state.score = 0;
  state.previousBoard = null;
  state.previousScore = 0;
  state.isGameOver = false;
  state.resultSaved = false;

  hideGameOverOverlay();
  setControlsVisible(true);
  updateUndoButtonState();
  saveGameState();
  renderAll();
}


function renderAll() {
  renderBoard();
  renderScore();
}

function renderBoard() {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = state.board[row][col];
      const index = row * BOARD_SIZE + col;
      const cell = cells[index];

      updateCell(cell, value);
    }
  }
}

function updateCell(cell, value) {
  cell.className = 'cell';

  if (value === 0) {
    cell.textContent = '';
    return;
  }

  cell.textContent = String(value);
  cell.classList.add('cell--filled');
  cell.classList.add('cell-' + value);
}

function renderScore() {
  scoreEl.textContent = String(state.score);
}


function handleKeyDown(event) {
  if (state.isGameOver || isLeaderboardOpen()) {
    return;
  }

  let direction = null;

  if (event.key === 'ArrowLeft') {
    direction = 'left';
  } else if (event.key === 'ArrowRight') {
    direction = 'right';
  } else if (event.key === 'ArrowUp') {
    direction = 'up';
  } else if (event.key === 'ArrowDown') {
    direction = 'down';
  }

  if (!direction) {
    return;
  }

  event.preventDefault();
  handleMove(direction);
}

function handleMove(direction) {
  if (state.isGameOver || isLeaderboardOpen()) {
    return;
  }

  let result;

  if (direction === 'left') {
    result = Game.moveLeft(state.board);
  } else if (direction === 'right') {
    result = Game.moveRight(state.board);
  } else if (direction === 'up') {
    result = Game.moveUp(state.board);
  } else if (direction === 'down') {
    result = Game.moveDown(state.board);
  } else {
    return;
  }

  if (!result.changed) {
    return;
  }

  state.previousBoard = Game.cloneBoard(state.board);
  state.previousScore = state.score;

  state.board = result.board;
  state.score += result.scoreGained;

  Game.addRandomTiles(state.board, NEW_TILES_MIN, NEW_TILES_MAX);

  if (!Game.hasMoves(state.board)) {
    state.isGameOver = true;
    showGameOverOverlay();
    setControlsVisible(false);
  }

  updateUndoButtonState();
  saveGameState();
  renderAll();
}


function undoMove() {
  if (!state.previousBoard || state.isGameOver) {
    return;
  }

  state.board = Game.cloneBoard(state.previousBoard);
  state.score = state.previousScore;
  state.previousBoard = null;
  state.previousScore = 0;

  hideGameOverOverlay();
  setControlsVisible(true);
  updateUndoButtonState();
  saveGameState();
  renderAll();
}

function updateUndoButtonState() {
  if (!state.previousBoard || state.isGameOver) {
    undoBtn.disabled = true;
  } else {
    undoBtn.disabled = false;
  }
}


function showGameOverOverlay() {
  overlayEl.classList.add('overlay--visible');
  overlayMessageEl.textContent = 'Игра окончена. Введите имя, чтобы сохранить результат.';
  playerNameInput.classList.remove('hidden');
  saveResultBtn.classList.remove('hidden');
  playerNameInput.value = '';
  state.resultSaved = false;
}

function hideGameOverOverlay() {
  overlayEl.classList.remove('overlay--visible');
}

function handleSaveResult() {
  if (state.resultSaved) {
    return;
  }

  const name = playerNameInput.value.trim();
  if (!name) {
    playerNameInput.focus();
    return;
  }

  const leaderboard = loadLeaderboard();
  const entry = {
    name: name,
    score: state.score,
    date: new Date().toLocaleString('ru-RU')
  };

  leaderboard.push(entry);

  leaderboard.sort(function (a, b) {
    return b.score - a.score;
  });

  const top10 = leaderboard.slice(0, 10);

  saveLeaderboard(top10);
  state.resultSaved = true;

  playerNameInput.classList.add('hidden');
  saveResultBtn.classList.add('hidden');
  overlayMessageEl.textContent = 'Ваш рекорд сохранен.';

  updateLeaderboardTable(top10);
}


function openLeaderboard() {
  const leaderboard = loadLeaderboard();
  updateLeaderboardTable(leaderboard);
  leaderboardModalEl.classList.add('modal--visible');
  setControlsVisible(false);
}

function closeLeaderboard() {
  leaderboardModalEl.classList.remove('modal--visible');
  if (!state.isGameOver) {
    setControlsVisible(true);
  }
}

function updateLeaderboardTable(leaderboard) {
  const list = leaderboard || loadLeaderboard();

  while (leaderboardBodyEl.firstChild) {
    leaderboardBodyEl.removeChild(leaderboardBodyEl.firstChild);
  }

  list.forEach(function (item) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    const scoreCell = document.createElement('td');
    const dateCell = document.createElement('td');

    nameCell.textContent = item.name;
    scoreCell.textContent = String(item.score);
    dateCell.textContent = item.date;

    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);

    leaderboardBodyEl.appendChild(row);
  });
}

function isLeaderboardOpen() {
  return leaderboardModalEl.classList.contains('modal--visible');
}


function setControlsVisible(isVisible) {
  if (!controlsEl) {
    return;
  }

  if (isVisible) {
    controlsEl.classList.remove('controls--hidden');
  } else {
    controlsEl.classList.add('controls--hidden');
  }
}
