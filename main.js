const HAND_TYPES = {
  HIGH_CARD: "HIGH_CARD",
  PAIR: "PAIR",
  TWO_PAIR: "TWO_PAIR",
  THREE_KIND: "THREE_KIND",
  STRAIGHT: "STRAIGHT",
  FLUSH: "FLUSH",
  FULL_HOUSE: "FULL_HOUSE",
  FOUR_KIND: "FOUR_KIND",
  STRAIGHT_FLUSH: "STRAIGHT_FLUSH",
  ROYAL_FLUSH: "ROYAL_FLUSH",
};

const HAND_NAMES = {
  [HAND_TYPES.HIGH_CARD]: "High Card",
  [HAND_TYPES.PAIR]: "Pair",
  [HAND_TYPES.TWO_PAIR]: "Two Pair",
  [HAND_TYPES.THREE_KIND]: "Three of a Kind",
  [HAND_TYPES.STRAIGHT]: "Straight",
  [HAND_TYPES.FLUSH]: "Flush",
  [HAND_TYPES.FULL_HOUSE]: "Full House",
  [HAND_TYPES.FOUR_KIND]: "Four of a Kind",
  [HAND_TYPES.STRAIGHT_FLUSH]: "Straight Flush",
  [HAND_TYPES.ROYAL_FLUSH]: "Royal Flush",
};

const BASE_POINTS = {
  [HAND_TYPES.HIGH_CARD]: 10,
  [HAND_TYPES.PAIR]: 50,
  [HAND_TYPES.TWO_PAIR]: 120,
  [HAND_TYPES.THREE_KIND]: 200,
  [HAND_TYPES.STRAIGHT]: 300,
  [HAND_TYPES.FLUSH]: 350,
  [HAND_TYPES.FULL_HOUSE]: 600,
  [HAND_TYPES.FOUR_KIND]: 900,
  [HAND_TYPES.STRAIGHT_FLUSH]: 1400,
  [HAND_TYPES.ROYAL_FLUSH]: 2000,
};

const DEFUSE_EFFECTS = {
  [HAND_TYPES.STRAIGHT]: { pauseTick: true },
  [HAND_TYPES.FLUSH]: { addFuseToLowest: 2 },
  [HAND_TYPES.FULL_HOUSE]: { disarmLowest: 1 },
  [HAND_TYPES.FOUR_KIND]: { disarmLowest: 1, addFuseAll: 1 },
  [HAND_TYPES.STRAIGHT_FLUSH]: { disarmLowest: 2 },
  [HAND_TYPES.ROYAL_FLUSH]: { disarmLowest: 2, addFuseAll: 1 },
};

const SUIT_SYMBOLS = ["&clubs;", "&diams;", "&hearts;", "&spades;"];
const SUIT_NAMES = ["Clubs", "Diamonds", "Hearts", "Spades"];
const RED_SUITS = new Set([1, 2]);

const dom = {
  board: document.getElementById("board"),
  bombsTop: document.getElementById("bombs-top"),
  bombsBottom: document.getElementById("bombs-bottom"),
  bombsLeft: document.getElementById("bombs-left"),
  bombsRight: document.getElementById("bombs-right"),
  hudScore: document.getElementById("hud-score"),
  hudMoves: document.getElementById("hud-moves"),
  hudCombo: document.getElementById("hud-combo"),
  hudTarget: document.getElementById("hud-target"),
  handName: document.getElementById("hand-name"),
  handCards: document.getElementById("hand-cards"),
  levelName: document.getElementById("level-name"),
  levelMeta: document.getElementById("level-meta"),
  status: document.getElementById("status"),
  menu: document.getElementById("menu"),
  levelList: document.getElementById("level-list"),
  levelEnd: document.getElementById("level-end"),
  endTitle: document.getElementById("end-title"),
  endBody: document.getElementById("end-body"),
  scoreList: document.getElementById("score-list"),
  btnClear: document.getElementById("btn-clear"),
  btnRestart: document.getElementById("btn-restart"),
  btnMenu: document.getElementById("btn-menu"),
  btnCloseMenu: document.getElementById("btn-close-menu"),
  btnNext: document.getElementById("btn-next"),
  btnRetry: document.getElementById("btn-retry"),
  btnEndMenu: document.getElementById("btn-end-menu"),
};

let nextCardId = 1;
let nextBombId = 1;

const uiEffects = {
  flashSet: new Set(),
  removingSet: new Set(),
};

const selection = {
  path: [],
  set: new Set(),
  pointerActive: false,
  pointerId: null,
  dragUsed: false,
};
let suppressTapUntil = 0;

const game = {
  state: "INIT_LEVEL",
  levelIndex: null,
  levelConfig: null,
  mode: "level",
  rows: 10,
  cols: 5,
  score: 0,
  combo: 1,
  movesLeft: 0,
  moveIndex: 0,
  board: null,
  bombs: [],
  rng: Math.random,
  telemetry: {
    moves: [],
  },
};

const cellRefs = [];
const bombSlots = {
  top: [],
  bottom: [],
  left: [],
  right: [],
};

const LEVELS = buildLevels();
const ENDLESS_LEVEL = {
  name: "Endless",
  rows: 10,
  cols: 5,
  maxMoves: Infinity,
  targetScore: Infinity,
  bombs: {
    count: 3,
    fuseStartMin: 6,
    fuseStartMax: 9,
    sides: ["left", "right", "top"],
    respawnOnExplode: true,
  },
  rngProfile: "uniform",
  specialRules: {
    allowHighCard: false,
  },
};

function buildLevels() {
  const levels = [];
  for (let i = 0; i < 20; i += 1) {
    const tier = i + 1;
    const targetScore = Math.round(2200 + tier * 650 + Math.pow(tier, 1.25) * 120);
    const maxMoves = Math.max(16, 26 - Math.floor(tier / 2));
    const bombCount = Math.min(5, 1 + Math.floor(tier / 4));
    const fuseStartMax = Math.max(6, 12 - Math.floor(tier / 2));
    const fuseStartMin = Math.max(4, fuseStartMax - 3);
    const sides =
      tier < 6
        ? ["left", "right"]
        : tier < 12
          ? ["left", "right", "top"]
          : ["left", "right", "top", "bottom"];

    levels.push({
      name: `Level ${tier}`,
      rows: 10,
      cols: 5,
      maxMoves,
      targetScore,
      bombs: {
        count: bombCount,
        fuseStartMin,
        fuseStartMax,
        sides,
        respawnOnExplode: false,
      },
      rngProfile: "uniform",
      specialRules: {
        allowHighCard: false,
      },
    });
  }
  return levels;
}

function createRng(seed) {
  if (seed === null || seed === undefined) {
    return Math.random;
  }
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createCard(rng) {
  const rank = randRange(rng, 2, 14);
  const suit = randRange(rng, 0, 3);
  return {
    id: (nextCardId += 1),
    rank,
    suit,
    spawned: true,
  };
}

function rankLabel(rank) {
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  if (rank === 14) return "A";
  return String(rank);
}

function createBoard(rows, cols, rng) {
  const cards = Array.from({ length: rows }, () => Array(cols).fill(null));
  const scorch = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cards[row][col] = createCard(rng);
    }
  }
  return { rows, cols, cards, scorch };
}

function buildBoardGrid(rows, cols) {
  dom.board.style.setProperty("--rows", rows);
  dom.board.style.setProperty("--cols", cols);
  dom.bombsTop.style.setProperty("--cols", cols);
  dom.bombsBottom.style.setProperty("--cols", cols);
  dom.bombsLeft.style.setProperty("--rows", rows);
  dom.bombsRight.style.setProperty("--rows", rows);

  dom.board.innerHTML = "";
  cellRefs.length = 0;

  for (let row = 0; row < rows; row += 1) {
    cellRefs[row] = [];
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.innerHTML = `
        <div class="card-face">
          <div class="rank"></div>
          <div class="suit"></div>
          <div class="order"></div>
        </div>
      `;
      dom.board.appendChild(cell);
      cellRefs[row][col] = {
        el: cell,
        rank: cell.querySelector(".rank"),
        suit: cell.querySelector(".suit"),
        order: cell.querySelector(".order"),
      };
    }
  }

  buildBombSlots(rows, cols);
}

function buildBombSlots(rows, cols) {
  dom.bombsTop.innerHTML = "";
  dom.bombsBottom.innerHTML = "";
  dom.bombsLeft.innerHTML = "";
  dom.bombsRight.innerHTML = "";

  bombSlots.top = [];
  bombSlots.bottom = [];
  bombSlots.left = [];
  bombSlots.right = [];

  for (let col = 0; col < cols; col += 1) {
    const slotTop = document.createElement("div");
    slotTop.className = "bomb-slot";
    dom.bombsTop.appendChild(slotTop);
    bombSlots.top[col] = slotTop;

    const slotBottom = document.createElement("div");
    slotBottom.className = "bomb-slot";
    dom.bombsBottom.appendChild(slotBottom);
    bombSlots.bottom[col] = slotBottom;
  }

  for (let row = 0; row < rows; row += 1) {
    const slotLeft = document.createElement("div");
    slotLeft.className = "bomb-slot";
    dom.bombsLeft.appendChild(slotLeft);
    bombSlots.left[row] = slotLeft;

    const slotRight = document.createElement("div");
    slotRight.className = "bomb-slot";
    dom.bombsRight.appendChild(slotRight);
    bombSlots.right[row] = slotRight;
  }
}

function createBombs(levelConfig, rng) {
  const bombs = [];
  const positions = [];
  levelConfig.bombs.sides.forEach((side) => {
    const limit = side === "left" || side === "right" ? levelConfig.rows : levelConfig.cols;
    for (let i = 0; i < limit; i += 1) {
      positions.push({ side, index: i });
    }
  });
  shuffle(positions, rng);

  const count = Math.min(levelConfig.bombs.count, positions.length);
  for (let i = 0; i < count; i += 1) {
    const pos = positions[i];
    bombs.push({
      id: (nextBombId += 1),
      side: pos.side,
      index: pos.index,
      fuse: randRange(rng, levelConfig.bombs.fuseStartMin, levelConfig.bombs.fuseStartMax),
      state: "armed",
      explosionsTriggered: 0,
    });
  }
  return bombs;
}

function cellKey(row, col) {
  return `${row},${col}`;
}

function isAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

function canInteract() {
  return game.state === "IDLE" || game.state === "SELECTING";
}

function isSelectable(row, col) {
  if (!game.board.cards[row][col]) return false;
  return game.board.scorch[row][col] === 0;
}

function updateSelectionUI() {
  const selectionMap = new Map();
  selection.path.forEach((pos, index) => {
    selectionMap.set(cellKey(pos.row, pos.col), index + 1);
  });

  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      const key = cellKey(row, col);
      const order = selectionMap.get(key);
      const cell = cellRefs[row][col];
      cell.el.classList.toggle("selected", Boolean(order));
      cell.order.textContent = order ? String(order) : "";
    }
  }

  updateHandPreview();
}

function clearSelection() {
  selection.path = [];
  selection.set.clear();
  selection.pointerActive = false;
  selection.pointerId = null;
  selection.dragUsed = false;
  if (game.state === "SELECTING") {
    game.state = "IDLE";
  }
  updateSelectionUI();
}

function startSelection(row, col) {
  selection.path = [{ row, col }];
  selection.set = new Set([cellKey(row, col)]);
  game.state = "SELECTING";
  updateSelectionUI();
}

function tryAddToSelection(row, col, options = { allowRestart: false }) {
  if (!isSelectable(row, col)) {
    return;
  }

  const key = cellKey(row, col);
  if (selection.path.length === 0) {
    startSelection(row, col);
    return;
  }

  const last = selection.path[selection.path.length - 1];
  if (selection.set.has(key)) {
    if (selection.path.length > 1) {
      const previous = selection.path[selection.path.length - 2];
      if (previous.row === row && previous.col === col) {
        const removed = selection.path.pop();
        selection.set.delete(cellKey(removed.row, removed.col));
        updateSelectionUI();
      }
    }
    return;
  }

  if (!isAdjacent(last, { row, col })) {
    if (options.allowRestart) {
      startSelection(row, col);
    }
    return;
  }

  if (selection.path.length >= 5) {
    return;
  }

  selection.path.push({ row, col });
  selection.set.add(key);
  updateSelectionUI();
}

function updateHandPreview() {
  dom.handCards.innerHTML = "";
  if (selection.path.length === 0) {
    dom.handName.textContent = "Select 5 cards";
    return;
  }

  if (selection.path.length < 5) {
    dom.handName.textContent = `Select ${5 - selection.path.length} more`;
  } else {
    const cards = selection.path.map((pos) => game.board.cards[pos.row][pos.col]);
    const hand = evaluateHand(cards);
    dom.handName.textContent = HAND_NAMES[hand.type];
  }

  selection.path.forEach((pos) => {
    const card = game.board.cards[pos.row][pos.col];
    const chip = document.createElement("span");
    chip.className = "hand-chip";
    chip.innerHTML = `${rankLabel(card.rank)}${SUIT_SYMBOLS[card.suit]}`;
    dom.handCards.appendChild(chip);
  });
}

function evaluateHand(cards) {
  const ranks = cards.map((card) => card.rank).sort((a, b) => a - b);
  const suits = cards.map((card) => card.suit);

  const counts = new Map();
  ranks.forEach((rank) => {
    counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  const countValues = Array.from(counts.values()).sort((a, b) => b - a);

  const flush = suits.every((suit) => suit === suits[0]);

  const straightInfo = isStraight(ranks);
  const straight = straightInfo.isStraight;

  let type = HAND_TYPES.HIGH_CARD;

  if (straight && flush) {
    type = straightInfo.isRoyal ? HAND_TYPES.ROYAL_FLUSH : HAND_TYPES.STRAIGHT_FLUSH;
  } else if (countValues[0] === 4) {
    type = HAND_TYPES.FOUR_KIND;
  } else if (countValues[0] === 3 && countValues[1] === 2) {
    type = HAND_TYPES.FULL_HOUSE;
  } else if (flush) {
    type = HAND_TYPES.FLUSH;
  } else if (straight) {
    type = HAND_TYPES.STRAIGHT;
  } else if (countValues[0] === 3) {
    type = HAND_TYPES.THREE_KIND;
  } else if (countValues[0] === 2 && countValues[1] === 2) {
    type = HAND_TYPES.TWO_PAIR;
  } else if (countValues[0] === 2) {
    type = HAND_TYPES.PAIR;
  }

  return {
    type,
    basePoints: BASE_POINTS[type],
    isScoring: type !== HAND_TYPES.HIGH_CARD,
  };
}

function isStraight(sortedRanks) {
  const unique = Array.from(new Set(sortedRanks));
  if (unique.length !== 5) {
    return { isStraight: false, isRoyal: false };
  }
  const wheel = [2, 3, 4, 5, 14];
  const isWheel = wheel.every((rank, index) => unique[index] === rank);
  if (isWheel) {
    return { isStraight: true, isRoyal: false };
  }

  for (let i = 1; i < unique.length; i += 1) {
    if (unique[i] !== unique[0] + i) {
      return { isStraight: false, isRoyal: false };
    }
  }

  const isRoyal = unique[0] === 10 && unique[4] === 14;
  return { isStraight: true, isRoyal };
}

function applyGravityAndRefill() {
  for (let col = 0; col < game.cols; col += 1) {
    const stack = [];
    for (let row = 0; row < game.rows; row += 1) {
      const card = game.board.cards[row][col];
      if (card) {
        stack.push(card);
      }
    }
    for (let row = game.rows - 1; row >= 0; row -= 1) {
      const card = stack.pop();
      if (card) {
        game.board.cards[row][col] = card;
      } else {
        game.board.cards[row][col] = createCard(game.rng);
      }
    }
  }
}

function renderBoard() {
  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      const cell = cellRefs[row][col];
      const card = game.board.cards[row][col];
      const key = cellKey(row, col);

      cell.el.classList.toggle("flash", uiEffects.flashSet.has(key));
      cell.el.classList.toggle("removing", uiEffects.removingSet.has(key));

      if (!card) {
        cell.el.classList.add("empty");
        cell.rank.textContent = "";
        cell.suit.innerHTML = "";
        cell.el.classList.remove("suit-red", "suit-black", "spawn");
        cell.el.removeAttribute("aria-label");
      } else {
        const rank = rankLabel(card.rank);
        cell.el.classList.remove("empty");
        cell.rank.textContent = rank;
        cell.suit.innerHTML = SUIT_SYMBOLS[card.suit];
        cell.el.classList.toggle("suit-red", RED_SUITS.has(card.suit));
        cell.el.classList.toggle("suit-black", !RED_SUITS.has(card.suit));
        cell.el.setAttribute("aria-label", `${rank} of ${SUIT_NAMES[card.suit]}`);

        if (card.spawned) {
          cell.el.classList.add("spawn");
          card.spawned = false;
          setTimeout(() => cell.el.classList.remove("spawn"), 250);
        }
      }

      const scorched = game.board.scorch[row][col] > 0;
      cell.el.classList.toggle("scorched", scorched);
    }
  }
}

function renderBombs() {
  const bySide = {
    top: new Map(),
    bottom: new Map(),
    left: new Map(),
    right: new Map(),
  };
  game.bombs.forEach((bomb) => {
    if (bomb.state === "spent") return;
    bySide[bomb.side].set(bomb.index, bomb);
  });

  Object.entries(bombSlots).forEach(([side, slots]) => {
    slots.forEach((slot, index) => {
      const bomb = bySide[side].get(index);
      slot.innerHTML = "";
      if (!bomb) return;
      const bombEl = document.createElement("div");
      bombEl.className = "bomb";
      if (bomb.state === "disarmed") {
        bombEl.classList.add("disarmed");
        bombEl.textContent = "--";
      } else {
        bombEl.textContent = String(bomb.fuse);
        if (bomb.fuse <= 2) {
          bombEl.classList.add("danger");
        }
      }
      bombEl.title = `${bomb.side.toUpperCase()} ${bomb.index + 1}`;
      slot.appendChild(bombEl);
    });
  });
}

function updateHud() {
  dom.hudScore.textContent = String(game.score);
  dom.hudCombo.textContent = String(game.combo);
  dom.hudMoves.textContent = Number.isFinite(game.movesLeft) ? String(game.movesLeft) : "INF";
  dom.hudTarget.textContent = Number.isFinite(game.levelConfig.targetScore)
    ? String(game.levelConfig.targetScore)
    : "--";

  dom.levelName.textContent = game.levelConfig.name;
  dom.levelMeta.textContent = `Target ${Number.isFinite(game.levelConfig.targetScore) ? game.levelConfig.targetScore : "--"} | Moves ${Number.isFinite(game.movesLeft) ? game.movesLeft : "INF"}`;
}

function updateStatus(message) {
  dom.status.textContent = message;
}

function applyDefuseEffects(handType) {
  const effect = DEFUSE_EFFECTS[handType];
  const result = { pauseTick: false, changes: [] };
  if (!effect) {
    return result;
  }

  if (effect.pauseTick) {
    result.pauseTick = true;
  }

  if (effect.addFuseToLowest) {
    const target = getLowestFuseBomb();
    if (target) {
      target.fuse += effect.addFuseToLowest;
      result.changes.push(`+${effect.addFuseToLowest} fuse`);
    }
  }

  if (effect.disarmLowest) {
    disarmLowestBombs(effect.disarmLowest);
    result.changes.push(`disarmed ${effect.disarmLowest}`);
  }

  if (effect.addFuseAll) {
    game.bombs.forEach((bomb) => {
      if (bomb.state === "armed") {
        bomb.fuse += effect.addFuseAll;
      }
    });
    result.changes.push(`all +${effect.addFuseAll}`);
  }

  return result;
}

function getLowestFuseBomb() {
  const armed = game.bombs.filter((bomb) => bomb.state === "armed");
  armed.sort((a, b) => a.fuse - b.fuse);
  return armed[0] || null;
}

function disarmLowestBombs(count) {
  const armed = game.bombs.filter((bomb) => bomb.state === "armed");
  armed.sort((a, b) => a.fuse - b.fuse);
  armed.slice(0, count).forEach((bomb) => {
    bomb.state = "disarmed";
    bomb.fuse = 0;
  });
}

function tickBombs() {
  game.bombs.forEach((bomb) => {
    if (bomb.state === "armed") {
      bomb.fuse -= 1;
    }
  });
}

function handleExplosions() {
  let exploded = 0;
  game.bombs.forEach((bomb) => {
    if (bomb.state === "armed" && bomb.fuse <= 0) {
      triggerExplosion(bomb);
      exploded += 1;
    }
  });
  return exploded;
}

function triggerExplosion(bomb) {
  bomb.state = "exploding";
  bomb.explosionsTriggered += 1;
  scorchEdge(bomb);
  shuffleBoard();
  game.combo = 1;

  if (game.levelConfig.bombs.respawnOnExplode) {
    bomb.fuse = randRange(game.rng, game.levelConfig.bombs.fuseStartMin, game.levelConfig.bombs.fuseStartMax + 2);
    bomb.state = "armed";
  } else {
    bomb.state = "disarmed";
    bomb.fuse = 0;
  }
  updateStatus("Bomb exploded: edge scorched and board shock.");
}

function scorchEdge(bomb) {
  const candidates = [];
  const rowRange = (index) => {
    const start = Math.max(0, index - 2);
    const end = Math.min(game.rows - 1, index + 2);
    return { start, end };
  };
  const colRange = (index) => {
    const start = Math.max(0, index - 2);
    const end = Math.min(game.cols - 1, index + 2);
    return { start, end };
  };

  if (bomb.side === "left" || bomb.side === "right") {
    const { start, end } = rowRange(bomb.index);
    const colMain = bomb.side === "left" ? 0 : game.cols - 1;
    const colAdj = bomb.side === "left" ? 1 : game.cols - 2;
    for (let row = start; row <= end; row += 1) {
      candidates.push({ row, col: colMain });
      if (colAdj >= 0 && colAdj < game.cols) {
        candidates.push({ row, col: colAdj });
      }
    }
  } else {
    const { start, end } = colRange(bomb.index);
    const rowMain = bomb.side === "top" ? 0 : game.rows - 1;
    const rowAdj = bomb.side === "top" ? 1 : game.rows - 2;
    for (let col = start; col <= end; col += 1) {
      candidates.push({ row: rowMain, col });
      if (rowAdj >= 0 && rowAdj < game.rows) {
        candidates.push({ row: rowAdj, col });
      }
    }
  }

  shuffle(candidates, game.rng);
  const scorchCount = Math.min(candidates.length, randRange(game.rng, 6, 10));
  for (let i = 0; i < scorchCount; i += 1) {
    const { row, col } = candidates[i];
    game.board.scorch[row][col] = Math.max(game.board.scorch[row][col], 3);
  }
}

function shuffleBoard() {
  const cards = [];
  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      const card = game.board.cards[row][col];
      if (card) {
        cards.push(card);
      }
    }
  }
  shuffle(cards, game.rng);
  let index = 0;
  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      if (cards[index]) {
        game.board.cards[row][col] = cards[index];
        index += 1;
      } else {
        game.board.cards[row][col] = createCard(game.rng);
      }
    }
  }
}

function decrementScorch() {
  for (let row = 0; row < game.rows; row += 1) {
    for (let col = 0; col < game.cols; col += 1) {
      if (game.board.scorch[row][col] > 0) {
        game.board.scorch[row][col] -= 1;
      }
    }
  }
}

function logMove(data) {
  game.telemetry.moves.push(data);
  console.debug("Move", data);
}

async function resolveMove(hand, selectedCells) {
  game.state = "RESOLVING";
  dom.board.classList.add("disabled");

  const selectedKeys = selectedCells.map((pos) => cellKey(pos.row, pos.col));
  uiEffects.flashSet = new Set(selectedKeys);
  renderBoard();
  await delay(200);

  uiEffects.removingSet = new Set(selectedKeys);
  renderBoard();
  await delay(150);

  selectedCells.forEach((pos) => {
    game.board.cards[pos.row][pos.col] = null;
  });
  uiEffects.flashSet.clear();
  uiEffects.removingSet.clear();

  applyGravityAndRefill();
  renderBoard();
  await delay(180);

  game.state = "BOMB_TICK";

  const defuseResult = applyDefuseEffects(hand.type);
  if (!defuseResult.pauseTick) {
    tickBombs();
  }

  const bombsBefore = game.bombs.map((bomb) => ({ id: bomb.id, fuse: bomb.fuse, state: bomb.state }));

  decrementScorch();
  const explosions = handleExplosions();
  renderBoard();
  renderBombs();

  const bombsAfter = game.bombs.map((bomb) => ({ id: bomb.id, fuse: bomb.fuse, state: bomb.state }));

  logMove({
    move: game.moveIndex,
    handType: hand.type,
    points: hand.pointsAwarded,
    combo: game.combo,
    clutch: hand.clutchActive,
    bombsBefore,
    bombsAfter,
    explosions,
  });

  await delay(100);

  if (checkLevelEnd()) {
    return;
  }

  game.state = "IDLE";
  dom.board.classList.remove("disabled");
  updateHud();
}

function checkLevelEnd() {
  if (game.mode === "level" && game.score >= game.levelConfig.targetScore) {
    endLevel(true);
    return true;
  }

  if (Number.isFinite(game.movesLeft) && game.movesLeft <= 0) {
    endLevel(false);
    return true;
  }

  return false;
}

function endLevel(won) {
  game.state = "LEVEL_END";
  dom.board.classList.add("disabled");
  const title = won ? "Level Complete" : "Out of Moves";
  dom.endTitle.textContent = title;
  dom.endBody.textContent = won
    ? `Score ${game.score}. Great hands under pressure.`
    : `Score ${game.score}. Try a stronger chain next time.`;
  dom.levelEnd.classList.add("visible");

  if (game.mode === "level" && game.levelIndex !== null && game.levelIndex < LEVELS.length - 1 && won) {
    dom.btnNext.style.display = "inline-flex";
  } else {
    dom.btnNext.style.display = "none";
  }
}

function hideEndOverlay() {
  dom.levelEnd.classList.remove("visible");
}

function openMenu() {
  dom.menu.classList.add("visible");
}

function closeMenu() {
  dom.menu.classList.remove("visible");
}

function startLevel(levelIndex, mode = "level") {
  const levelConfig = mode === "endless" ? ENDLESS_LEVEL : LEVELS[levelIndex];
  game.mode = mode;
  game.levelIndex = mode === "endless" ? null : levelIndex;
  game.levelConfig = levelConfig;
  game.rows = levelConfig.rows;
  game.cols = levelConfig.cols;
  game.score = 0;
  game.combo = 1;
  game.movesLeft = levelConfig.maxMoves;
  game.moveIndex = 0;
  game.telemetry.moves = [];
  nextCardId = 1;

  game.rng = createRng(mode === "endless" ? Date.now() : levelIndex + 1);
  game.board = createBoard(game.rows, game.cols, game.rng);
  game.bombs = createBombs(levelConfig, game.rng);

  buildBoardGrid(game.rows, game.cols);
  clearSelection();
  renderBoard();
  renderBombs();
  updateHud();
  updateStatus("Drag or tap across 5 adjacent cards.");

  game.state = "IDLE";
  dom.board.classList.remove("disabled");
  hideEndOverlay();
  closeMenu();
}

function handlePointerDown(event) {
  if (!canInteract()) return;
  const cell = event.target.closest(".cell");
  if (!cell) return;
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  selection.pointerActive = true;
  selection.pointerId = event.pointerId;
  selection.dragUsed = false;
  tryAddToSelection(row, col, { allowRestart: true });
}

function handlePointerOver(event) {
  if (!selection.pointerActive) return;
  if (event.pointerId !== selection.pointerId) return;
  const cell = event.target.closest(".cell");
  if (!cell) return;
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  selection.dragUsed = true;
  tryAddToSelection(row, col, { allowRestart: false });
}

function handlePointerUp(event) {
  if (!selection.pointerActive) return;
  if (event.pointerId !== selection.pointerId) return;
  selection.pointerActive = false;
  selection.pointerId = null;

  if (selection.dragUsed) {
    suppressTapUntil = Date.now() + 150;
    finalizeSelection();
  }
}

function finalizeSelection() {
  if (selection.path.length !== 5) {
    updateStatus("Need exactly 5 adjacent cards.");
    clearSelection();
    return;
  }

  const cards = selection.path.map((pos) => game.board.cards[pos.row][pos.col]);
  const hand = evaluateHand(cards);

  if (!hand.isScoring && !game.levelConfig.specialRules.allowHighCard) {
    updateStatus("No scoring hand. Need a pair or better.");
    clearSelection();
    return;
  }

  const scoringMove = hand.isScoring;
  const clutchActive = scoringMove && game.bombs.some((bomb) => bomb.state === "armed" && bomb.fuse === 1);
  const clutchMultiplier = clutchActive ? 1.25 : 1;
  const basePoints = hand.basePoints;
  const comboMultiplier = scoringMove ? game.combo : 1;
  const scoreGained = Math.round(basePoints * comboMultiplier * clutchMultiplier);

  game.score += scoreGained;
  game.combo = scoringMove ? game.combo + 1 : 1;
  game.moveIndex += 1;
  if (Number.isFinite(game.movesLeft)) {
    game.movesLeft -= 1;
  }

  hand.pointsAwarded = scoreGained;
  hand.clutchActive = clutchActive;

  updateStatus(`${HAND_NAMES[hand.type]} +${scoreGained}${clutchActive ? " (clutch)" : ""}`);

  const selectedCells = selection.path.map((pos) => ({ ...pos }));
  clearSelection();
  updateHud();
  resolveMove(hand, selectedCells);
}

function handleTap(event) {
  if (!canInteract()) return;
  if (Date.now() < suppressTapUntil) return;
  const cell = event.target.closest(".cell");
  if (!cell) return;
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  if (selection.pointerActive) return;
  tryAddToSelection(row, col, { allowRestart: true });
  if (selection.path.length === 5) {
    finalizeSelection();
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMenu() {
  dom.levelList.innerHTML = "";

  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    button.innerHTML = `<strong>${level.name}</strong><span>Target ${level.targetScore} - Moves ${level.maxMoves}</span>`;
    button.addEventListener("click", () => startLevel(index, "level"));
    dom.levelList.appendChild(button);
  });

  const endless = document.createElement("button");
  endless.type = "button";
  endless.className = "level-button";
  endless.innerHTML = `<strong>Endless</strong><span>Survive the bomb loop</span>`;
  endless.addEventListener("click", () => startLevel(null, "endless"));
  dom.levelList.appendChild(endless);
}

function buildScoreList() {
  const order = [
    HAND_TYPES.PAIR,
    HAND_TYPES.TWO_PAIR,
    HAND_TYPES.THREE_KIND,
    HAND_TYPES.STRAIGHT,
    HAND_TYPES.FLUSH,
    HAND_TYPES.FULL_HOUSE,
    HAND_TYPES.FOUR_KIND,
    HAND_TYPES.STRAIGHT_FLUSH,
    HAND_TYPES.ROYAL_FLUSH,
  ];

  dom.scoreList.innerHTML = "";
  order.forEach((type) => {
    const row = document.createElement("div");
    row.className = "score-row";
    const effectLabel = describeDefuseEffect(type);
    row.innerHTML = `
      <div class="score-main">
        <span class="score-hand">${HAND_NAMES[type]}</span>
        <span class="score-points">${BASE_POINTS[type]}</span>
      </div>
      <div class="score-effect">${effectLabel}</div>
    `;
    dom.scoreList.appendChild(row);
  });
}

function describeDefuseEffect(type) {
  const effect = DEFUSE_EFFECTS[type];
  if (!effect) return "No defuse effect";
  const parts = [];
  if (effect.pauseTick) {
    parts.push("Pause tick");
  }
  if (effect.addFuseToLowest) {
    parts.push(`Lowest bomb +${effect.addFuseToLowest} fuse`);
  }
  if (effect.disarmLowest) {
    parts.push(`Disarm ${effect.disarmLowest} lowest`);
  }
  if (effect.addFuseAll) {
    parts.push(`All bombs +${effect.addFuseAll} fuse`);
  }
  return parts.join(" + ");
}

function bindEvents() {
  dom.board.addEventListener("pointerdown", handlePointerDown);
  dom.board.addEventListener("pointerover", handlePointerOver);
  document.addEventListener("pointerup", handlePointerUp);
  document.addEventListener("pointercancel", handlePointerUp);
  dom.board.addEventListener("click", handleTap);

  dom.btnClear.addEventListener("click", () => {
    clearSelection();
    updateStatus("Selection cleared.");
  });

  dom.btnRestart.addEventListener("click", () => {
    if (game.mode === "endless") {
      startLevel(null, "endless");
    } else if (game.levelIndex !== null) {
      startLevel(game.levelIndex, "level");
    }
  });

  dom.btnMenu.addEventListener("click", openMenu);
  dom.btnCloseMenu.addEventListener("click", closeMenu);

  dom.btnRetry.addEventListener("click", () => {
    if (game.mode === "endless") {
      startLevel(null, "endless");
    } else if (game.levelIndex !== null) {
      startLevel(game.levelIndex, "level");
    }
  });

  dom.btnNext.addEventListener("click", () => {
    if (game.levelIndex !== null) {
      startLevel(game.levelIndex + 1, "level");
    }
  });

  dom.btnEndMenu.addEventListener("click", () => {
    hideEndOverlay();
    openMenu();
  });
}

function init() {
  buildMenu();
  buildScoreList();
  buildBoardGrid(game.rows, game.cols);
  game.board = createBoard(game.rows, game.cols, createRng(1));
  renderBoard();
  bindEvents();
  openMenu();
  updateStatus("Choose a level to begin.");
}

init();
