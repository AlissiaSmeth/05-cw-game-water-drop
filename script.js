const difficultySettings = {
  easy: {
    duration: 45,
    winScore: 10,
    spawnDelay: 950
  },
  normal: {
    duration: 30,
    winScore: 20,
    spawnDelay: 720
  },
  hard: {
    duration: 20,
    winScore: 30,
    spawnDelay: 450
  }
};

const TOTAL_HOLES = 12;
const MILESTONES = [10, 20, 30, 45];

let selectedDifficulty = "normal";
let GAME_DURATION = difficultySettings.normal.duration;
let WIN_SCORE = difficultySettings.normal.winScore;
let startingSpawnDelay = difficultySettings.normal.spawnDelay;

let gameRunning = false;
let score = 0;
let timeLeft = GAME_DURATION;
let spawnTimeout;
let timerInterval;
let currentSpawnDelay = startingSpawnDelay;

const reachedMilestones = new Set();

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const feedbackEl = document.getElementById("feedback");
const milestoneEl = document.getElementById("milestones");
const endMessageEl = document.getElementById("end-message");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const difficultyEl = document.getElementById("difficulty");

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
difficultyEl.addEventListener("change", setDifficulty);

buildBoard();
setDifficulty();

function buildBoard() {
  // Prevent duplicate holes if this function runs more than once.
  board.innerHTML = "";

  for (let i = 0; i < TOTAL_HOLES; i += 1) {
    const hole = document.createElement("div");

    hole.className = "hole";
    hole.dataset.holeId = String(i);

    board.appendChild(hole);
  }
}

function setDifficulty() {
  selectedDifficulty = difficultyEl.value;

  const settings = difficultySettings[selectedDifficulty];

  GAME_DURATION = settings.duration;
  WIN_SCORE = settings.winScore;
  startingSpawnDelay = settings.spawnDelay;
  currentSpawnDelay = startingSpawnDelay;
  timeLeft = GAME_DURATION;

  timeEl.textContent = String(timeLeft);

  feedbackEl.textContent =
    `${capitalize(selectedDifficulty)} mode: ` +
    `Collect ${WIN_SCORE} points in ${GAME_DURATION} seconds.`;
}

function startGame() {
  // Stop any previous timers before beginning a new game.
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);

  const settings = difficultySettings[selectedDifficulty];

  GAME_DURATION = settings.duration;
  WIN_SCORE = settings.winScore;
  startingSpawnDelay = settings.spawnDelay;

  resetGameStateForNewRound();

  gameRunning = true;
  difficultyEl.disabled = true;
  startBtn.textContent = "Playing...";
  startBtn.disabled = true;

  feedbackEl.textContent =
    `Go! Reach ${WIN_SCORE} points before time runs out.`;

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

  // The game gradually becomes faster during the round.
  currentSpawnDelay = Math.max(280, currentSpawnDelay - 8);

  spawnTimeout = setTimeout(scheduleSpawn, currentSpawnDelay);
}

function spawnTarget() {
  if (!gameRunning) {
    return;
  }

  const holes = Array.from(document.querySelectorAll(".hole"));

  const openHoles = holes.filter(
    (hole) => !hole.querySelector(".target")
  );

  if (openHoles.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * openHoles.length);
  const hole = openHoles[randomIndex];

  const target = document.createElement("button");
  const isObstacle = Math.random() < 0.22;

  target.className = `target ${isObstacle ? "obstacle" : "good"}`;
  target.type = "button";

  target.setAttribute(
    "aria-label",
    isObstacle ? "Obstacle can" : "Water can"
  );

  // Harder modes make targets disappear more quickly.
  const targetLifeSettings = {
    easy: {
      good: 1200,
      obstacle: 1350
    },
    normal: {
      good: 860,
      obstacle: 1000
    },
    hard: {
      good: 650,
      obstacle: 800
    }
  };

  const targetLife = isObstacle
    ? targetLifeSettings[selectedDifficulty].obstacle
    : targetLifeSettings[selectedDifficulty].good;

  const removeTimer = setTimeout(() => {
    target.remove();
  }, targetLife);

  target.addEventListener("click", () => {
    if (!gameRunning || target.classList.contains("hit")) {
      return;
    }

    clearTimeout(removeTimer);

    target.classList.add("hit");

    setTimeout(() => {
      target.remove();
    }, 170);

    if (isObstacle) {
      score = Math.max(0, score - 2);

      feedbackEl.textContent = randomFrom(obstacleMessages);
      scoreEl.textContent = String(score);

      pulseScore("bad-hit");
      return;
    }

    score += 1;

    scoreEl.textContent = String(score);
    feedbackEl.textContent = randomFrom(hypeMessages);

    pulseScore("good-hit");
    checkMilestone(score);

    // End immediately when the player reaches the selected goal.
    if (score >= WIN_SCORE) {
      endGame();
    }
  });

  hole.appendChild(target);
}

function checkMilestone(currentScore) {
  const newMilestone = MILESTONES.find(
    (goal) =>
      currentScore >= goal &&
      goal <= WIN_SCORE &&
      !reachedMilestones.has(goal)
  );

  if (!newMilestone) {
    return;
  }

  reachedMilestones.add(newMilestone);

  feedbackEl.textContent =
    `Milestone hit: ${newMilestone}! Keep going!`;

  milestoneEl.classList.add("milestone-pop");
  updateMilestoneDisplay();

  setTimeout(() => {
    milestoneEl.classList.remove("milestone-pop");
  }, 420);
}

function updateMilestoneDisplay() {
  const activeMilestones = MILESTONES.filter(
    (goal) => goal <= WIN_SCORE
  );

  // Make sure the final winning score appears in the list.
  if (!activeMilestones.includes(WIN_SCORE)) {
    activeMilestones.push(WIN_SCORE);
    activeMilestones.sort((a, b) => a - b);
  }

  const status = activeMilestones
    .map((goal) => {
      return reachedMilestones.has(goal)
        ? `✓ ${goal}`
        : String(goal);
    })
    .join(" | ");

  milestoneEl.textContent = `Milestones: ${status}`;
}

function endGame() {
  if (!gameRunning) {
    return;
  }

  gameRunning = false;

  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);

  timeEl.parentElement.classList.remove("danger");

  board.querySelectorAll(".target").forEach((target) => {
    target.remove();
  });

  const didWin = score >= WIN_SCORE;

  endMessageEl.textContent = didWin
    ? randomFrom(winningMessages)
    : randomFrom(losingMessages);

  if (didWin) {
    feedbackEl.textContent =
      `You won with ${score} points! Goal: ${WIN_SCORE}.`;
  } else {
    feedbackEl.textContent =
      `Final score: ${score}. You needed ${WIN_SCORE} points.`;
  }

  scoreEl.classList.remove("good-hit", "bad-hit");

  difficultyEl.disabled = false;
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";
}

function resetGame() {
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);

  gameRunning = false;

  resetGameStateForNewRound();

  feedbackEl.textContent =
    `${capitalize(selectedDifficulty)} mode ready. ` +
    `Reach ${WIN_SCORE} points in ${GAME_DURATION} seconds.`;

  difficultyEl.disabled = false;
  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
}

function resetGameStateForNewRound() {
  score = 0;
  timeLeft = GAME_DURATION;
  currentSpawnDelay = startingSpawnDelay;

  reachedMilestones.clear();

  scoreEl.textContent = String(score);
  timeEl.textContent = String(timeLeft);

  scoreEl.classList.remove("good-hit", "bad-hit");
  timeEl.parentElement.classList.remove("danger");

  endMessageEl.textContent = "";

  updateMilestoneDisplay();

  board.querySelectorAll(".target").forEach((target) => {
    target.remove();
  });
}

function randomFrom(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function pulseScore(className) {
  scoreEl.classList.remove("good-hit", "bad-hit");

  // Forces the animation to restart after repeated fast clicks.
  void scoreEl.offsetWidth;

  scoreEl.classList.add(className);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
