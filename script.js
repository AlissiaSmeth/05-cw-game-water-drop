const GAME_DURATION = 30;
const TOTAL_HOLES = 12;
const MILESTONES = [10, 20, 30, 45];

let gameRunning = false;
let score = 0;
let timeLeft = GAME_DURATION;
let spawnTimeout;
let timerInterval;
let currentSpawnDelay = 720;
const reachedMilestones = new Set();

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const feedbackEl = document.getElementById("feedback");
const milestoneEl = document.getElementById("milestones");
const endMessageEl = document.getElementById("end-message");
const startBtn = document.getElementById("start-btn");

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
buildBoard();

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

  gameRunning = true;
  score = 0;
  timeLeft = GAME_DURATION;
  currentSpawnDelay = 720;
  reachedMilestones.clear();
  scoreEl.textContent = String(score);
  scoreEl.classList.remove("good-hit", "bad-hit");
  timeEl.textContent = String(timeLeft);
  startBtn.textContent = "Playing...";
  startBtn.disabled = true;
  feedbackEl.textContent = "Tap every yellow can before it drops back!";
  milestoneEl.textContent = "Milestones: 10 | 20 | 30 | 45";
  endMessageEl.textContent = "";
  board.querySelectorAll(".target").forEach((target) => target.remove());

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
  currentSpawnDelay = Math.max(280, currentSpawnDelay - 8);

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
  const isObstacle = Math.random() < 0.22;
  target.className = `target ${isObstacle ? "obstacle" : "good"}`;
  target.type = "button";
  target.setAttribute("aria-label", isObstacle ? "Obstacle can" : "Water can");

  const life = isObstacle ? 1000 : 860;
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
  const newMilestone = MILESTONES.find((goal) => currentScore >= goal && !reachedMilestones.has(goal));

  if (!newMilestone) {
    return;
  }

  reachedMilestones.add(newMilestone);
  feedbackEl.textContent = `Milestone hit: ${newMilestone}! Keep going!`;
  milestoneEl.classList.add("milestone-pop");

  const status = MILESTONES.map((goal) => (reachedMilestones.has(goal) ? `(${goal})` : String(goal))).join(" | ");
  milestoneEl.textContent = `Milestones: ${status}`;

  setTimeout(() => {
    milestoneEl.classList.remove("milestone-pop");
  }, 420);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);
  timeEl.parentElement.classList.remove("danger");
  board.querySelectorAll(".target").forEach((target) => target.remove());

  const didWin = score >= 20;
  endMessageEl.textContent = didWin ? randomFrom(winningMessages) : randomFrom(losingMessages);
  feedbackEl.textContent = `Final score: ${score}`;
  scoreEl.classList.remove("good-hit", "bad-hit");
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";
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
