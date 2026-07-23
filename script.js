const TOTAL_HOLES = 12;
const DIFFICULTY_MODES = {
  easy: {
    label: "Easy",
    duration: 36,
    milestones: [8, 16, 24, 32],
    winScore: 16,
    lives: 4,
    startSpawnDelay: 780,
    minSpawnDelay: 360,
    spawnAcceleration: 6,
    obstacleChance: 0.16,
    goodLife: 980,
    obstacleLife: 1120
  },
  normal: {
    label: "Normal",
    duration: 30,
    milestones: [10, 20, 30, 45],
    winScore: 20,
    lives: 3,
    startSpawnDelay: 720,
    minSpawnDelay: 280,
    spawnAcceleration: 8,
    obstacleChance: 0.22,
    goodLife: 860,
    obstacleLife: 1000
  },
  hard: {
    label: "Hard",
    duration: 24,
    milestones: [12, 24, 36, 50],
    winScore: 24,
    lives: 2,
    startSpawnDelay: 650,
    minSpawnDelay: 220,
    spawnAcceleration: 11,
    obstacleChance: 0.3,
    goodLife: 760,
    obstacleLife: 900
  }
};

let gameRunning = false;
let score = 0;
let currentMode = "normal";
let modeConfig = DIFFICULTY_MODES[currentMode];
let timeLeft = modeConfig.duration;
let lives = modeConfig.lives;
let spawnTimeout;
let timerInterval;
let currentSpawnDelay = modeConfig.startSpawnDelay;
const reachedMilestones = new Set();

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const feedbackEl = document.getElementById("feedback");
const milestoneEl = document.getElementById("milestones");
const endMessageEl = document.getElementById("end-message");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const livesContainerEl = document.getElementById("lives-container");
const difficultyEl = document.getElementById("difficulty");
const modeSummaryEl = document.getElementById("mode-summary");

const hypeMessages = [
  "Quick tap! +1 point",
  "Hydration hero move!",
  "Nice reflexes!",
  "You are on a streak!"
];

const obstacleMessages = [
  "Trap can! -2 points",
  "Watch it, that was a decoy!",
  "Obstacle hit. Recover fast!"
];

const winningMessages = [
  "Huge win! You crushed the challenge.",
  "Excellent work. Your taps changed the game.",
  "Top-tier run. You are a jerry can legend."
];

const losingMessages = [
  "Good run. Go again and beat your best score.",
  "Close one. One more try and you have this.",
  "You are getting faster. Jump back in."
];

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
difficultyEl.addEventListener("change", handleDifficultyChange);
buildBoard();
syncModeConfig(difficultyEl.value);
resetGameStateForNewRound();

function buildBoard() {
  for (let i = 0; i < TOTAL_HOLES; i += 1) {
    const hole = document.createElement("div");
    hole.className = "hole";
    hole.dataset.holeId = String(i);
    board.appendChild(hole);
  }
}

function startGame() {
  if (gameRunning) {
    return;
  }

  resetGameStateForNewRound();
  gameRunning = true;
  startBtn.textContent = "Playing...";
  startBtn.disabled = true;
  difficultyEl.disabled = true;

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = String(timeLeft);

    if (timeLeft <= 5 && timeLeft > 0) {
      timeEl.parentElement.classList.add("danger");
    }

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  scheduleSpawn();
}

function scheduleSpawn() {
  if (!gameRunning) {
    return;
  }

  spawnTarget();
  currentSpawnDelay = Math.max(modeConfig.minSpawnDelay, currentSpawnDelay - modeConfig.spawnAcceleration);

  spawnTimeout = setTimeout(scheduleSpawn, currentSpawnDelay);
}

function spawnTarget() {
  const holes = Array.from(document.querySelectorAll(".hole"));
  const openHoles = holes.filter((hole) => !hole.querySelector(".target"));

  if (openHoles.length === 0) {
    return;
  }

  const hole = openHoles[Math.floor(Math.random() * openHoles.length)];
  const target = document.createElement("button");
  const isObstacle = Math.random() < modeConfig.obstacleChance;
  target.className = `target ${isObstacle ? "obstacle" : "good"}`;
  target.type = "button";
  target.setAttribute("aria-label", isObstacle ? "Obstacle can" : "Water can");

  const life = isObstacle ? modeConfig.obstacleLife : modeConfig.goodLife;
  const removeTimer = setTimeout(() => target.remove(), life);

  target.addEventListener("click", () => {
    clearTimeout(removeTimer);
    target.classList.add("hit");
    setTimeout(() => target.remove(), 170);

    if (isObstacle) {
      score = Math.max(0, score - 2);
      feedbackEl.textContent = randomFrom(obstacleMessages);
      scoreEl.textContent = String(score);
      pulseScore("bad-hit");
      loseLife();

      if (lives <= 0) {
        feedbackEl.textContent = "You ran out of lives!";
        endGame("lives");
      }

      return;
    }

    score += 1;
    scoreEl.textContent = String(score);
    pulseScore("good-hit");
    feedbackEl.textContent = randomFrom(hypeMessages);
    checkMilestone(score);
  });

  hole.appendChild(target);
}

function checkMilestone(currentScore) {
  const newMilestone = modeConfig.milestones.find((goal) => currentScore >= goal && !reachedMilestones.has(goal));

  if (!newMilestone) {
    return;
  }

  reachedMilestones.add(newMilestone);
  feedbackEl.textContent = `Milestone hit: ${newMilestone}! Keep going!`;
  milestoneEl.classList.add("milestone-pop");
  renderMilestones();

  setTimeout(() => {
    milestoneEl.classList.remove("milestone-pop");
  }, 420);
}

function endGame(reason = "time") {
  if (!gameRunning) {
    return;
  }

  gameRunning = false;
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);
  timeEl.parentElement.classList.remove("danger");
  board.querySelectorAll(".target").forEach((target) => target.remove());

  const didWin = reason !== "lives" && score >= modeConfig.winScore;
  endMessageEl.textContent = didWin ? randomFrom(winningMessages) : randomFrom(losingMessages);
  feedbackEl.textContent = `Final score: ${score} | Goal (${modeConfig.label}): ${modeConfig.winScore} | Lives left: ${lives}`;
  scoreEl.classList.remove("good-hit", "bad-hit");
  startBtn.disabled = false;
  difficultyEl.disabled = false;
  startBtn.textContent = "Play Again";
}

function resetGame() {
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);
  gameRunning = false;
  resetGameStateForNewRound();
  feedbackEl.textContent = "Game reset. Press Start to play.";
  startBtn.disabled = false;
  difficultyEl.disabled = false;
  startBtn.textContent = "Start Game";
}

function handleDifficultyChange(event) {
  if (gameRunning) {
    return;
  }

  syncModeConfig(event.target.value);
  resetGameStateForNewRound();
  feedbackEl.textContent = `${modeConfig.label} mode selected. Press Start to play.`;
}

function syncModeConfig(modeName) {
  const chosenMode = DIFFICULTY_MODES[modeName] ? modeName : "normal";
  currentMode = chosenMode;
  modeConfig = DIFFICULTY_MODES[chosenMode];
  difficultyEl.value = chosenMode;
  modeSummaryEl.textContent = `${modeConfig.label}: ${modeConfig.duration}s, win at ${modeConfig.winScore} points, ${modeConfig.lives} lives`;
}

function renderMilestones() {
  const status = modeConfig.milestones
    .map((goal) => (reachedMilestones.has(goal) ? `(${goal})` : String(goal)))
    .join(" | ");
  milestoneEl.textContent = `Milestones: ${status}`;
}

function renderLives() {
  livesContainerEl.textContent = "";

  for (let i = 0; i < lives; i += 1) {
    const life = document.createElement("span");
    life.className = "life-dot";
    life.setAttribute("aria-hidden", "true");
    livesContainerEl.appendChild(life);
  }
}

function loseLife() {
  if (lives <= 0) {
    return;
  }

  lives -= 1;
  const lifeToRemove = livesContainerEl.lastElementChild;

  if (!lifeToRemove) {
    return;
  }

  lifeToRemove.classList.add("lost");
  setTimeout(() => lifeToRemove.remove(), 140);
}

function randomFrom(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function pulseScore(className) {
  scoreEl.classList.remove("good-hit", "bad-hit");
  // Force reflow so repeated fast taps re-trigger the animation.
  void scoreEl.offsetWidth;
  scoreEl.classList.add(className);
}

function resetGameStateForNewRound() {
  score = 0;
  timeLeft = modeConfig.duration;
  lives = modeConfig.lives;
  currentSpawnDelay = modeConfig.startSpawnDelay;
  reachedMilestones.clear();
  scoreEl.textContent = String(score);
  scoreEl.classList.remove("good-hit", "bad-hit");
  timeEl.textContent = String(timeLeft);
  timeEl.parentElement.classList.remove("danger");
  renderMilestones();
  renderLives();
  endMessageEl.textContent = "";
  board.querySelectorAll(".target").forEach((target) => target.remove());
}
