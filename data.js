'use strict';

const BOARD_SIZE = 4;
const INITIAL_MIN_TILES = 1;
const INITIAL_MAX_TILES = 3;
const NEW_TILES_MIN = 1;
const NEW_TILES_MAX = 2;
const TILE_VALUES = [2, 4];
const STORAGE_KEYS = {
  gameState: 'game2048_state',
  leaderboard: 'game2048_leaderboard'
};

function getElement(id) {
  return document.getElementById(id);
}

function getRandomIntInclusive(min, max) {
  const from = Math.ceil(min);
  const to = Math.floor(max);
  return Math.floor(Math.random() * (to - from + 1)) + from;
}
