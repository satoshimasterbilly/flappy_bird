// --- Element References ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// --- Game Configuration ---
let canvasWidth, canvasHeight;
const birdWidth = 50;
const birdHeight = 40;
const pipeWidth = 80;
const pipeGap = 180; // Adjust for difficulty
const gravity = 0.5;
const lift = -8; // The force of the flap
const pipeSpeed = 4;
const pipeSpawnInterval = 1800; // Time in ms between new pipes

// --- Game State ---
let birdY, birdVelocity;
let pipes = [];
let score = 0;
let wingFrame = 0; // For animating the wing
let lastPipeSpawnTime = 0;
let gameState = 'start'; // Can be 'start', 'playing', or 'over'
let gameLoopId;

// --- Game Asset Drawing Functions ---

function drawBird(y, wingFrame) {
    ctx.save();
    ctx.translate(canvasWidth / 4, y);

    // Body
    ctx.fillStyle = '#FFD700'; // Yellow
    ctx.beginPath();
    ctx.arc(0, 0, birdHeight / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(birdHeight / 4, -birdHeight / 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(birdHeight / 4 + 1, -birdHeight / 6 -1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak (colorful)
    ctx.fillStyle = '#FF6347'; // Tomato Red
    ctx.beginPath();
    ctx.moveTo(birdHeight / 2 - 2, -3);
    ctx.lineTo(birdHeight / 2 + 15, 0);
    ctx.lineTo(birdHeight / 2 - 2, 3);
    ctx.closePath();
    ctx.fill();

    // Wing (flappy animation)
    ctx.fillStyle = '#FFA500'; // Orange
    ctx.beginPath();
    ctx.moveTo(-birdWidth / 4, -5);
    let wingAngle = wingFrame < 10 ? -0.5 : 0.5; // Flap up/down
    ctx.quadraticCurveTo(0, wingAngle * 25, birdWidth / 4, -5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPipe(x, y, height, isTop) {
    // Pipe Body
    ctx.fillStyle = '#73BF2E'; // Green
    ctx.fillRect(x, y, pipeWidth, height);

    // Pipe Cap for detail
    ctx.fillStyle = '#5A9A24'; // Darker Green
    if (isTop) {
        ctx.fillRect(x - 5, y + height - 30, pipeWidth + 10, 30);
    } else {
        ctx.fillRect(x - 5, y, pipeWidth + 10, 30);
    }
}

function drawBackground() {
    // The background is a solid color matching the CSS gradient end-point.
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}


// --- Game Logic Functions ---

function resetGame() {
    birdY = canvasHeight / 2;
    birdVelocity = 0;
    pipes = [];
    score = 0;
    lastPipeSpawnTime = 0;
    scoreDisplay.textContent = score;
    spawnPipe(); // Start with one pipe
}

function spawnPipe() {
    const minHeight = 50;
    const maxHeight = canvasHeight - pipeGap - minHeight;
    const topPipeHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    const bottomPipeY = topPipeHeight + pipeGap;

    pipes.push({
        x: canvasWidth,
        topHeight: topPipeHeight,
        bottomY: bottomPipeY,
        passed: false
    });
}

function update() {
    if (gameState !== 'playing') return;

    // --- Physics and Movement Updates ---
    birdVelocity += gravity;
    birdY += birdVelocity;
    wingFrame = (wingFrame + 1) % 20;

    // Spawn new pipes periodically
    if (Date.now() - lastPipeSpawnTime > pipeSpawnInterval) {
        spawnPipe();
        lastPipeSpawnTime = Date.now();
    }

    // Move pipes and update score
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        // Check if bird passed a pipe
        if (!pipes[i].passed && pipes[i].x < canvasWidth / 4 - pipeWidth) {
            pipes[i].passed = true;
            score++;
            scoreDisplay.textContent = score;
        }

        // Remove pipes that are off-screen
        if (pipes[i].x < -pipeWidth) {
            pipes.splice(i, 1);
        }
    }

    // --- Collision Detection ---
    const birdX = canvasWidth / 4;
    const birdLeft = birdX - birdWidth / 2;
    const birdRight = birdX + birdWidth / 2;
    const birdTop = birdY - birdHeight / 2;
    const birdBottom = birdY + birdHeight / 2;

    // Ground and ceiling collision
    if (birdBottom > canvasHeight || birdTop < 0) {
        endGame();
        return;
    }

    // Pipe collision
    for (const pipe of pipes) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + pipeWidth;
        const pipeTopEnd = pipe.topHeight;
        const pipeBottomStart = pipe.bottomY;

        if (birdRight > pipeLeft && birdLeft < pipeRight &&
           (birdTop < pipeTopEnd || birdBottom > pipeBottomStart)) {
            endGame();
            return;
        }
    }

    // --- Drawing ---
    drawBackground();

    for (const pipe of pipes) {
        drawPipe(pipe.x, 0, pipe.topHeight, true); // Top pipe
        drawPipe(pipe.x, pipe.bottomY, canvasHeight - pipe.bottomY, false); // Bottom pipe
    }

    drawBird(birdY, wingFrame);

    // Request the next frame
    gameLoopId = requestAnimationFrame(update);
}

function flap() {
    birdVelocity = lift;
}

// --- Game State Management ---

function startGame() {
    if (gameState === 'playing') return;
    gameState = 'playing';

    // Update UI
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    scoreDisplay.style.display = 'block';

    resetGame();
    lastPipeSpawnTime = Date.now();
    flap(); // Give an initial flap to start
    gameLoopId = requestAnimationFrame(update);
}

function endGame() {
    gameState = 'over';
    cancelAnimationFrame(gameLoopId);

    // Update UI
    gameOverScreen.style.display = 'flex';
    scoreDisplay.style.display = 'none';
    finalScoreDisplay.textContent = score;
}


// --- Setup and Event Listeners ---

function setCanvasSize() {
    const container = document.getElementById('game-container');
    const aspectRatio = 9 / 16; // A mobile-friendly aspect ratio
    const maxHeight = window.innerHeight * 0.9;
    const maxWidth = window.innerWidth * 0.9;

    let newWidth = maxWidth;
    let newHeight = newWidth * aspectRatio;

    // Adjust if height is the limiting factor
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight / aspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
}

function initialize() {
    setCanvasSize();
    birdY = canvasHeight / 2;

    // Draw the initial state for the start screen
    drawBackground();
    drawBird(birdY, 0);

    // Resize canvas and redraw if window size changes (but not during gameplay)
    window.addEventListener('resize', () => {
        if (gameState !== 'playing') {
            setCanvasSize();
            birdY = canvasHeight / 2;
            drawBackground();
            drawBird(birdY, 0);
        }
    });

    // Handle mouse clicks
    document.addEventListener('mousedown', () => {
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'playing') {
            flap();
        }
    });

    // Handle touch events
    document.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent screen zoom on mobile
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'playing') {
            flap();
        }
    }, { passive: false });

    // Handle spacebar key presses
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent page from scrolling
            if (gameState === 'start') {
                startGame();
            } else if (gameState === 'playing') {
                flap();
            }
        }
    });

    // Handle clicks on the restart button
    restartButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from triggering the document-level listener
        startGame();
    });
}

// Start the game initialization process
initialize();
