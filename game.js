'use strict';

const Game = (function () {
  function createEmptyBoard() {
    const board = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      const rowArr = [];
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        rowArr.push(0);
      }
      board.push(rowArr);
    }

    return board;
  }

  function cloneBoard(board) {
    return board.map(function (row) {
      return row.slice();
    });
  }

  function getEmptyCells(board) {
    const cells = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (board[row][col] === 0) {
          cells.push({ row: row, col: col });
        }
      }
    }

    return cells;
  }

  function addRandomTile(board) {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) {
      return;
    }

    const randomIndex = getRandomIntInclusive(0, emptyCells.length - 1);
    const cell = emptyCells[randomIndex];

    const valueIndex = getRandomIntInclusive(0, TILE_VALUES.length - 1);
    const value = TILE_VALUES[valueIndex];

    board[cell.row][cell.col] = value;
  }

  function addRandomTiles(board, minCount, maxCount) {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length === 0) {
      return;
    }

    const maxAllowed = Math.min(emptyCells.length, maxCount);
    const count = getRandomIntInclusive(minCount, maxAllowed);

    for (let i = 0; i < count; i += 1) {
      addRandomTile(board);
    }
  }

  function initializeBoard() {
    const board = createEmptyBoard();
    addRandomTiles(board, INITIAL_MIN_TILES, INITIAL_MAX_TILES);
    return board;
  }

  function processRowLeft(row) {
    let current = row.slice();
    let totalScore = 0;

    while (true) {
      const nonZero = [];
      for (let i = 0; i < current.length; i += 1) {
        if (current[i] !== 0) {
          nonZero.push(current[i]);
        }
      }

      const newRow = [];
      let mergedInThisPass = false;
      let i = 0;

      while (i < nonZero.length) {
        if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
          const merged = nonZero[i] * 2;
          newRow.push(merged);
          totalScore += merged;
          mergedInThisPass = true;
          i += 2;
        } else {
          newRow.push(nonZero[i]);
          i += 1;
        }
      }

      while (newRow.length < BOARD_SIZE) {
        newRow.push(0);
      }

      if (!mergedInThisPass) {
        current = newRow;
        break;
      }

      current = newRow;
    }

    let changed = false;
    for (let j = 0; j < row.length; j += 1) {
      if (row[j] !== current[j]) {
        changed = true;
        break;
      }
    }

    return {
      row: current,
      scoreGained: totalScore,
      changed: changed
    };
  }

  function moveLeft(board) {
    const newBoard = [];
    let totalScore = 0;
    let anyChanged = false;

    for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
      const row = board[rowIndex];
      const result = processRowLeft(row);

      newBoard.push(result.row);
      totalScore += result.scoreGained;

      if (result.changed) {
        anyChanged = true;
      }
    }

    return {
      board: newBoard,
      scoreGained: totalScore,
      changed: anyChanged
    };
  }

  function reverseRow(row) {
    const copy = row.slice();
    copy.reverse();
    return copy;
  }

  function moveRight(board) {
    const newBoard = [];
    let totalScore = 0;
    let anyChanged = false;

    for (let rowIndex = 0; rowIndex < BOARD_SIZE; rowIndex += 1) {
      const row = board[rowIndex];
      const reversed = reverseRow(row);
      const result = processRowLeft(reversed);
      const restored = reverseRow(result.row);

      newBoard.push(restored);
      totalScore += result.scoreGained;

      if (result.changed) {
        anyChanged = true;
      }
    }

    return {
      board: newBoard,
      scoreGained: totalScore,
      changed: anyChanged
    };
  }

  function transpose(board) {
    const newBoard = createEmptyBoard();

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        newBoard[row][col] = board[col][row];
      }
    }

    return newBoard;
  }

  function moveUp(board) {
    const transposed = transpose(board);
    const moved = moveLeft(transposed);
    const restored = transpose(moved.board);

    return {
      board: restored,
      scoreGained: moved.scoreGained,
      changed: moved.changed
    };
  }

  function moveDown(board) {
    const transposed = transpose(board);
    const moved = moveRight(transposed);
    const restored = transpose(moved.board);

    return {
      board: restored,
      scoreGained: moved.scoreGained,
      changed: moved.changed
    };
  }

  function hasMoves(board) {
    const emptyCells = getEmptyCells(board);
    if (emptyCells.length > 0) {
      return true;
    }

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const current = board[row][col];

        if (col + 1 < BOARD_SIZE && board[row][col + 1] === current) {
          return true;
        }

        if (row + 1 < BOARD_SIZE && board[row + 1][col] === current) {
          return true;
        }
      }
    }

    return false;
  }

  return {
    createEmptyBoard: createEmptyBoard,
    cloneBoard: cloneBoard,
    initializeBoard: initializeBoard,
    addRandomTiles: addRandomTiles,
    moveLeft: moveLeft,
    moveRight: moveRight,
    moveUp: moveUp,
    moveDown: moveDown,
    hasMoves: hasMoves
  };
})();
