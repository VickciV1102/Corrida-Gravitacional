// DOM Elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiMenu = document.getElementById('main-menu');
const uiGameOver = document.getElementById('game-over');
const uiHud = document.getElementById('hud');
const winnerDisplay = document.getElementById('winner-display');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');
const btnStart = document.getElementById('btn-start');
const btnRetry = document.getElementById('btn-retry');
const btnMenu = document.getElementById('btn-menu');
const btnRestartHud = document.getElementById('btn-restart-hud');
const charOptions = document.querySelectorAll('.char-option');

// Game Config
let GAME_SPEED = 5; // Initial speed
const BASE_SPEED = 5;
const GRAVITY_CONSTANT = 0.6;
const FLAP_STRENGTH = 10;
let distance = 0;
let highScore = localStorage.getItem('grav_high_score') || 0;
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let selectedChar = 'chicken';
let frames = 0;

const p1Options = document.querySelectorAll('.p1-chars .char-option');
const p2Options = document.querySelectorAll('.p2-chars .char-option');

let selectedCharP1 = 'chicken';
let selectedCharP2 = 'capybara';

p1Options.forEach(op => {
    op.addEventListener('click', () => {
        p1Options.forEach(o => o.classList.remove('selected'));
        op.classList.add('selected');
        selectedCharP1 = op.dataset.char;
    });
});

p2Options.forEach(op => {
    op.addEventListener('click', () => {
        p2Options.forEach(o => o.classList.remove('selected'));
        op.classList.add('selected');
        selectedCharP2 = op.dataset.char;
    });
});

// Resize Canvas
function resize() {
    canvas.width = document.getElementById('game-container').clientWidth;
    canvas.height = document.getElementById('game-container').clientHeight;
}
window.addEventListener('resize', resize);
resize();

// Character Data
const characters = {
    chicken: { color: '#ffffff', detail: '#ff4757', emoji: '🐔' },
    capybara: { color: '#8d5524', detail: '#6b3e1b', emoji: '🐹' },
    cow: { color: '#ffffff', detail: '#2f3542', emoji: '🐮' }
};

// Global Entities Declarations
let p1;
let p2;
let bg;
let obstacles = [];

// Input Handling
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;

    // Player 1 mappings
    if (e.code === 'KeyW') p1.setGravity(-1);
    if (e.code === 'KeyS') p1.setGravity(1);

    // Player 2 mappings
    if (e.code === 'ArrowUp') p2.setGravity(-1);
    if (e.code === 'ArrowDown') p2.setGravity(1);
});

// Buttons
btnStart.addEventListener('click', () => startGame());
btnRetry.addEventListener('click', () => startGame());
btnMenu.addEventListener('click', () => {
    gameState = 'MENU';
    uiGameOver.classList.add('hidden');
    uiMenu.classList.remove('hidden');
});
btnRestartHud.addEventListener('click', () => startGame());

// Player Class
class Player {
    constructor(isP1) {
        this.isP1 = isP1;
        this.w = 40;
        this.h = 40;
        this.x = canvas.width * 0.2;
        
        this.ceilingLevel = isP1 ? 40 : canvas.height/2 + 10;
        this.groundLevel = isP1 ? canvas.height/2 - 10 : canvas.height - 40;

        this.y = this.groundLevel - this.h;
        this.vy = 0;
        this.gravity = GRAVITY_CONSTANT;
        // 1 means gravity pulls down, -1 means gravity pulls up
        this.gravityDirection = 1; 
        this.isGrounded = false;
        this.charData = characters[this.isP1 ? selectedCharP1 : selectedCharP2];
        this.rotation = 0;
        this.targetRotation = 0;
        this.isDead = false;
    }

    reset() {
        this.x = canvas.width * 0.2;
        this.ceilingLevel = this.isP1 ? 40 : canvas.height/2 + 10;
        this.groundLevel = this.isP1 ? canvas.height/2 - 10 : canvas.height - 40;
        this.y = this.groundLevel - this.h;
        this.vy = 0;
        this.gravityDirection = 1;
        this.gravity = GRAVITY_CONSTANT;
        this.charData = characters[this.isP1 ? selectedCharP1 : selectedCharP2];
        this.rotation = 0;
        this.targetRotation = 0;
        this.isGrounded = false;
        this.isDead = false;
    }

    setGravity(dir) {
        if (this.isDead) return;
        if (this.gravityDirection !== dir) {
            this.gravityDirection = dir;
            // Give a little push
            this.vy = 0; // reset velocity to avoid stacking forces unfairly
            
            // Spawn particles
            spawnParticles(this.x + this.w/2, this.y + (this.gravityDirection === 1 ? 0 : this.h), '#fed330', 10);
            
            this.targetRotation = this.gravityDirection === 1 ? 0 : Math.PI;
        }
    }

    update() {
        // Apply physics
        this.vy += this.gravity * this.gravityDirection;
        this.y += this.vy;

        if (this.isDead) {
            this.x -= GAME_SPEED;
            this.rotation += 0.2;
            return;
        }

        // Smooth rotation
        this.rotation += (this.targetRotation - this.rotation) * 0.2;

        // Floor collision
        if (this.y + this.h >= this.groundLevel && this.gravityDirection === 1) {
            this.y = this.groundLevel - this.h;
            this.vy = 0;
            this.isGrounded = true;
            if (frames % 10 === 0) spawnRunningParticles(this.x, this.y + this.h, this.gravityDirection);
        } else if (this.y <= this.ceilingLevel && this.gravityDirection === -1) {
            // Ceiling collision
            this.y = this.ceilingLevel;
            this.vy = 0;
            this.isGrounded = true;
            if (frames % 10 === 0) spawnRunningParticles(this.x, this.y, this.gravityDirection);
        } else {
            this.isGrounded = false;
        }

        // Out of bounds safety
        if (this.y > canvas.height || this.y < -this.h) {
             this.die();
        }
    }

    die() {
        if(this.isDead) return;
        this.isDead = true;
        // Bump character slightly
        this.vy = -8 * this.gravityDirection;
        spawnParticles(this.x + this.w/2, this.y + this.h/2, '#ff4757', 30);
        
        checkGameOver();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.rotation);
        
        // Draw character specific
        ctx.fillStyle = this.charData.color;
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        
        // Characteristic details
        ctx.fillStyle = this.charData.detail;
        if (this.charData.emoji === '🐔') {
            // Comb
            ctx.fillRect(-this.w/4, -this.h/2 - 10, 20, 10);
            // Beak
            ctx.fillStyle = '#ffa502';
            ctx.beginPath();
            ctx.moveTo(this.w/2, -this.h/4);
            ctx.lineTo(this.w/2 + 15, -this.h/4 + 5);
            ctx.lineTo(this.w/2, -this.h/4 + 10);
            ctx.fill();
            // Eye
            ctx.fillStyle = '#000';
            ctx.fillRect(this.w/4, -this.h/4 - 2, 4, 4);
        } else if (this.charData.emoji === '🐹') {
            // Snout
            ctx.fillRect(this.w/4, -this.h/4, 20, 20);
            // Eye
            ctx.fillStyle = '#000';
            ctx.fillRect(this.w/4 + 2, -this.h/4 - 2, 4, 4);
            ctx.fillRect(this.w/4 + 12, -this.h/4 - 2, 4, 4); 
        } else {
            // Cow spots
            ctx.fillRect(-this.w/2, -this.h/2, 10, 15);
            ctx.fillRect(0, 0, 15, 10);
            // Snout
            ctx.fillStyle = '#ffb8b8';
            ctx.fillRect(this.w/2 - 10, 0, 15, 15);
            // Eye
            ctx.fillStyle = '#000';
            ctx.fillRect(this.w/4, -this.h/4, 4, 4);
        }

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h
        };
    }
}

// Background Manager
class Background {
    constructor() {
        this.clouds = [];
        this.decorations = [];
        this.initClouds();
        this.initDecors();
    }
    
    initClouds() {
        for(let i=0; i<5; i++) {
            this.clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height/2),
                size: 30 + Math.random() * 50,
                speed: 0.5 + Math.random()
            });
        }
    }
    
    initDecors() {
        for(let i=0; i<10; i++) {
            this.decorations.push({
                x: Math.random() * canvas.width,
                w: 10 + Math.random() * 30,
                h: 20 + Math.random() * 20,
                type: Math.random() > 0.5 ? 'top' : 'bottom'
            });
        }
    }

    update() {
        // Clouds
        this.clouds.forEach(c => {
            c.x -= c.speed;
            if (c.x + c.size * 2 < 0) {
                c.x = canvas.width + c.size;
                c.y = Math.random() * (canvas.height/2);
            }
        });

        // Decors (bg items)
        this.decorations.forEach(d => {
            d.x -= GAME_SPEED * 0.5; // parallax effect
            if (d.x + d.w < 0) {
                d.x = canvas.width + Math.random() * 100;
                d.type = Math.random() > 0.5 ? 'top' : 'bottom';
            }
        });
    }

    draw() {
        // Draw flat background
        ctx.fillStyle = '#70a1ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size, 0, Math.PI*2);
            ctx.arc(c.x + c.size/2, c.y - c.size/2, c.size*0.8, 0, Math.PI*2);
            ctx.arc(c.x + c.size, c.y, c.size, 0, Math.PI*2);
            ctx.fill();
        });

        // Draw base ground and ceiling structure (conveyor belts)
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(0, 0, canvas.width, 40); // Top Ceiling
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40); // Bottom Floor
        
        // Middle Wall
        ctx.fillStyle = '#57606f';
        ctx.fillRect(0, canvas.height/2 - 10, canvas.width, 20);

        // Background decorations (trees/buildings silhouette)
        ctx.fillStyle = '#57606f';
        this.decorations.forEach(d => {
            if (d.type === 'bottom') {
                ctx.fillRect(d.x, canvas.height - 40 - d.h, d.w, d.h);
            } else {
                ctx.fillRect(d.x, 40, d.w, d.h);
            }
        });
        
        // Hazard stripes on boundaries to look cool
        ctx.fillStyle = '#fbc531';
        for(let i=-(distance*GAME_SPEED % 40); i<canvas.width; i+=40) {
            ctx.fillRect(i, 0, 20, 5); // Ceiling 1
            ctx.fillRect(i, canvas.height/2 - 10, 20, 5); // Floor 1
            ctx.fillRect(i, canvas.height/2 + 5, 20, 5); // Ceiling 2
            ctx.fillRect(i, canvas.height-5, 20, 5); // Floor 2
        }
    }
}

// Initialization Function
function initGameObjects() {
    p1 = new Player(true);
    p2 = new Player(false);
    bg = new Background();
}
// Init immediately for Menu
initGameObjects();

// Collision logic
function checkCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y);
}

class Obstacle {
    constructor(lane) {
        this.lane = lane;
        this.w = 50 + Math.random() * 50;
        this.h = 40 + Math.random() * 40;
        this.x = canvas.width;
        
        let c = lane === 1 ? 40 : canvas.height/2 + 10;
        let g = lane === 1 ? canvas.height/2 - 10 : canvas.height - 40;

        // Ground or ceiling
        this.isOnGround = Math.random() > 0.5;
        this.y = this.isOnGround ? g - this.h : c;
        this.type = Math.random() > 0.3 ? 'box' : 'saw';
        this.rotation = 0;
        if(this.type === 'saw') {
             this.w = 40 + Math.random() * 20;
             this.h = this.w;
             this.y = this.isOnGround ? g - this.h/2 : c + this.h/2;
        }
        this.passed = false;
    }
    
    update() {
        this.x -= GAME_SPEED;
        if (this.type === 'saw') {
            this.rotation += 0.1;
        }
    }
    
    draw() {
        ctx.save();
        if (this.type === 'box') {
            ctx.fillStyle = '#b2bec3';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = '#636e72';
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x+2, this.y+2, this.w-4, this.h-4);
            ctx.beginPath();
            ctx.moveTo(this.x+2, this.y+2);
            ctx.lineTo(this.x+this.w-2, this.y+this.h-2);
            ctx.moveTo(this.x+this.w-2, this.y+2);
            ctx.lineTo(this.x+2, this.y+this.h-2);
            ctx.stroke();
        } else {
            ctx.translate(this.x + this.w/2, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = '#dfe6e9';
            ctx.beginPath();
            for(let i=0; i<8; i++) {
                 ctx.lineTo(Math.cos(i*Math.PI/4)*this.w/2, Math.sin(i*Math.PI/4)*this.w/2);
                 ctx.lineTo(Math.cos(i*Math.PI/4 + 0.2)*(this.w/2+10), Math.sin(i*Math.PI/4 + 0.2)*(this.w/2+10));
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#b2bec3';
            ctx.beginPath();
            ctx.arc(0, 0, this.w/4, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    getHitbox() {
        if (this.type === 'saw') {
             let shrink = 10;
             return {
                  x: this.x + shrink/2,
                  y: this.y - this.h/2 + shrink/2,
                  w: this.w - shrink,
                  h: this.h - shrink
             };
        }
        return {x: this.x, y: this.y, w: this.w, h: this.h};
    }
}

// Particles System
let particles = [];
function spawnParticles(x, y, color, amount) {
    for(let i=0; i<amount; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 20 + Math.random() * 20,
            maxLife: 40,
            color,
            size: Math.random() * 6 + 2
        });
    }
}

function spawnRunningParticles(x, y, dir) {
    particles.push({
         x, y,
         vx: -Math.random() * 2,
         vy: dir * (Math.random() * 2), // away from floor/ceiling
         life: 10 + Math.random() * 10,
         maxLife: 20,
         color: '#ffffff',
         size: Math.random() * 4 + 2
    });
}

function updateDrawParticles() {
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if(p.life <= 0) particles.splice(i, 1);
    }
}

// Main Game Logic
let winnerText = "Empate!";

function checkGameOver() {
    if(p1.isDead && p2.isDead) {
        winnerText = "Empate!";
        gameOver();
    } else if (p1.isDead) {
        winnerText = "Jogador 2 Venceu!";
        gameOver();
    } else if (p2.isDead) {
        winnerText = "Jogador 1 Venceu!";
        gameOver();
    }
}

function startGame() {
    winnerText = "Empate!";
    gameState = 'PLAYING';
    uiMenu.classList.add('hidden');
    uiGameOver.classList.add('hidden');
    uiHud.classList.remove('hidden');
    
    p1.reset();
    p2.reset();
    particles = [];
    obstacles = [];
    distance = 0;
    frames = 0;
    GAME_SPEED = BASE_SPEED;
}

function gameOver() {
    gameState = 'GAMEOVER';
    uiHud.classList.add('hidden');
    uiGameOver.classList.remove('hidden');
    
    // Check HighScore
    const displayDist = Math.floor(distance / 10);
    if(displayDist > highScore) {
        highScore = displayDist;
        localStorage.setItem('grav_high_score', highScore);
    }
    
    // Update winner display if it exists, otherwise fallbacks to creating it or setting it if I add it in HTML
    if (winnerDisplay) {
        winnerDisplay.innerText = winnerText;
    }
    
    finalScoreDisplay.innerText = displayDist + 'm';
    highScoreDisplay.innerText = highScore + 'm';
}

function render() {
    bg.draw();
    
    if (gameState === 'PLAYING') {
        p1.update();
        p1.draw();
        p2.update();
        p2.draw();
        
        // Spawn obstacles
        if (frames % (Math.max(40, 100 - Math.floor(GAME_SPEED * 2))) === 0) {
             let newObs1 = new Obstacle(1);
             obstacles.push(newObs1);
             
             // Avoid impossible obstacles on lane 2 directly below an obstacle on lane 1
             if (Math.random() > 0.3) {
                 let newObs2 = new Obstacle(2);
                 // Check if both are saws to avoid impossible saw patterns simultaneously
                 if (!(newObs1.type === 'saw' && newObs2.type === 'saw')) {
                     obstacles.push(newObs2);
                 }
             }
        } else if (frames % 45 === 0 && Math.random() > 0.6) {
             obstacles.push(new Obstacle(2));
        }
        
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.update();
            obs.draw();
            
            if (!p1.isDead && obs.lane === 1 && checkCollision(p1.getHitbox(), obs.getHitbox())) {
                p1.die();
            }
            if (!p2.isDead && obs.lane === 2 && checkCollision(p2.getHitbox(), obs.getHitbox())) {
                p2.die();
            }
            
            if (obs.x + obs.w < 0) {
                obstacles.splice(i, 1);
            }
        }
        
        // Increase speed slightly over time
        if (frames % 600 === 0) { // every ~10s
            GAME_SPEED += 0.5;
        }
        
        if (!p1.isDead || !p2.isDead) {
            distance++;
            scoreDisplay.innerText = Math.floor(distance / 10) + 'm';
            frames++;
        }
        
    } else if (gameState === 'GAMEOVER') {
        // Empty context
    } else {
        // MENU
        p1.targetRotation = 0;
        p1.draw(); 
        p2.targetRotation = 0;
        p2.draw();
    }
    
    if (gameState !== 'MENU') {
        bg.update();
    }
    
    updateDrawParticles();
}

function loop() {
    render();
    requestAnimationFrame(loop);
}

// Start loop
loop();
