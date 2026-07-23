const difficultySettings = {
  easy: {
    duration: 45,
    winScore: 10,
    spawnDelay: 950,
    targetLife: 1200
  },
  normal: {
    duration: 30,
    winScore: 20,
    spawnDelay: 720,
    targetLife: 900
  },
  hard: {
    duration: 20,
    winScore: 30,
    spawnDelay: 450,
    targetLife: 650
  }
};

const TOTAL_HOLES = 12;

let selectedDifficulty = "normal";
let gameRunning = false;
let score = 0;
let timeLeft = 30;
let winScore = 20;
let spawnDelay = 720;
let targetLife = 900;
let timerInterval = null;
let spawnTimeout = null;

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const feedbackEl = document.getElementById("feedback");
const milestoneEl = document.getElementById("milestones");
const endMessageEl = document.getElementById("end-message");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const difficultyEl = document.getElementById("difficulty");

function checkRequiredElements() {
  const requiredElements = [
    board,
    scoreEl,
    timeEl,
    feedbackEl,
    milestoneEl,
    endMessageEl,
    startBtn,
    resetBtn,
    difficultyEl
  ];

  return requiredElements.every(function (element) {
    return element !== null;
  });
}

if (!checkRequiredElements()) {
  console.error("One or more required HTML elements are missing.");
} else {
  initializeGame();
}

function initializeGame() {
  buildBoard();
  applyDifficulty();

  startBtn.addEventListener("click", startGame);
  resetBtn.addEventListener("click", resetGame);
  difficultyEl.addEventListener("change", applyDifficulty);
}

function buildBoard() {
  board.replaceChildren();

  for (let i = 0; i < TOTAL_HOLES; i += 1) {
    const hole = document.createElement("div");
    hole.className = "hole";
    board.appendChild(hole);
  }
}

function applyDifficulty() {
  selectedDifficulty = difficultyEl.value;

  const settings = difficultySettings[selectedDifficulty];

  timeLeft = settings.duration;
  winScore = settings.winScore;
  spawnDelay = settings.spawnDelay;
  targetLife = settings.targetLife;

  scoreEl.textContent = "0";
  timeEl.textContent = String(timeLeft);
  milestoneEl.textContent = "Goal: " + winScore + " points";

  feedbackEl.textContent =
    capitalize(selectedDifficulty) +
    " mode: Reach " +
    winScore +
    " points in " +
    timeLeft +
    " seconds.";

  endMessageEl.textContent = String();
}

function startGame() {
  stopTimers();
  clearTargets();

  const settings = difficultySettings[selectedDifficulty];

  score = 0;
  timeLeft = settings.duration;
  winScore = settings.winScore;
  spawnDelay = settings.spawnDelay;
  targetLife = settings.targetLife;
  gameRunning = true;

  scoreEl.textContent = "0";
  timeEl.textContent = String(timeLeft);
  milestoneEl.textContent = "Goal: " + winScore + " points";
  feedbackEl.textContent = "Go! Tap the water cans and avoid the traps.";
  endMessageEl.textContent = String();

  difficultyEl.disabled = true;
  startBtn.disabled = true;
  startBtn.textContent = "Playing...";

  timerInterval = setInterval(function () {
    timeLeft -= 1;
    timeEl.textContent = String(timeLeft);

    if (timeLeft <= 5 && timeLeft > 0) {
      timeEl.parentElement.classList.add("danger");
    }

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  scheduleTarget();
}

function scheduleTarget() {
  if (!gameRunning) {
    return;
  }

  createTarget();

  spawnTimeout = setTimeout(function () {
    scheduleTarget();
  }, spawnDelay);
}

function createTarget() {
  const holes = Array.from(board.querySelectorAll(".hole"));

  const availableHoles = holes.filter(function (hole) {
    return hole.querySelector(".target") === null;
  });

  if (availableHoles.length === 0) {
    return;
  }

  const randomHole =
    availableHoles[Math.floor(Math.random() * availableHoles.length)];

  const target = document.createElement("button");
  const isObstacle = Math.random() < 0.22;

  target.type = "button";
  target.className = isObstacle
    ? "target obstacle"
    : "target good";

  target.setAttribute(
    "aria-label",
    isObstacle ? "Trap can" : "Water can"
  );

  const removeTargetTimer = setTimeout(function () {
    target.remove();
  }, targetLife);

  target.addEventListener("click", function () {
    if (!gameRunning || target.classList.contains("hit")) {
      return;
    }

    clearTimeout(removeTargetTimer);
    target.classList.add("hit");

    if (isObstacle) {
      score = Math.max(0, score - 2);
      feedbackEl.textContent = "Trap can! You lost 2 points.";
      animateScore("bad-hit");
    } else {
      score += 1;
      feedbackEl.textContent = "Great job! You collected water.";
      animateScore("good-hit");
    }

    scoreEl.textContent = String(score);

    setTimeout(function () {
      target.remove();
    }, 150);

    if (score >= winScore) {
      endGame();
    }
  });

  randomHole.appendChild(target);
}

function endGame() {
  if (!gameRunning) {
    return;
  }

  gameRunning = false;
  stopTimers();
  clearTargets();

  timeEl.parentElement.classList.remove("danger");
  difficultyEl.disabled = false;
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";

  if (score >= winScore) {
    endMessageEl.textContent =
      "You won! You reached " +
      score +
      " points and supported the clean water mission.";
  } else {
    endMessageEl.textContent =
      "Time is up. You scored " +
      score +
      " points. Your goal was " +
      winScore +
      ".";
  }

  feedbackEl.textContent = "Final score: " + score;
}

function resetGame() {
  gameRunning = false;
  stopTimers();
  clearTargets();

  score = 0;

  const settings = difficultySettings[selectedDifficulty];

  timeLeft = settings.duration;
  winScore = settings.winScore;
  spawnDelay = settings.spawnDelay;
  targetLife = settings.targetLife;

  scoreEl.textContent = "0";
  timeEl.textContent = String(timeLeft);
  milestoneEl.textContent = "Goal: " + winScore + " points";
  feedbackEl.textContent = "Press Start to play.";
  endMessageEl.textContent = String();

  timeEl.parentElement.classList.remove("danger");
  scoreEl.classList.remove("good-hit", "bad-hit");

  difficultyEl.disabled = false;
  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
}

function stopTimers() {
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);

  timerInterval = null;
  spawnTimeout = null;
}

function clearTargets() {
  board.querySelectorAll(".target").forEach(function (target) {
    target.remove();
  });
}

function animateScore(className) {
  scoreEl.classList.remove("good-hit", "bad-hit");
  void scoreEl.offsetWidth;
  scoreEl.classList.add(className);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
