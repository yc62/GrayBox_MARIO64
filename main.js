/* Graybox Mario 64
    - Red box = Mario (the player)
    - Dark Green boxes = Floating islands / platforms
    - Yellow boxes = Coins
    - Brown boxes = Goombas (slow enemy, stomp to defeat)
    - Light Green boxes = Koopa Troopas (fast enemy, stomp to defeat)
    - Red lollipop = Piranha Plant (shoots red fireballs at you)
    - Yellow spinning star = The goal to reach it to WIN!
   Created by: John Cho
   Date: February 13, 2026
*/

import * as THREE from 'three';

// =====================================================
// STEP 1: Scene, Camera, Renderer
// =====================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue

const camera = new THREE.PerspectiveCamera(
    70,                                        // Field of view
    window.innerWidth / window.innerHeight,    // Screen shape
    0.1,                                       // How close you can see
    300                                        // How far you can see
);
camera.position.set(0, 8, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// =====================================================
// STEP 2: Lighting
// =====================================================

// Soft light that hits everything equally
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Directional light like the sun
const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
sunLight.position.set(10, 25, 10);
sunLight.castShadow = true;
scene.add(sunLight);

// =====================================================
// STEP 3: Helper function - makeBox
// Builds a colored box
// =====================================================

function makeBox(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh     = new THREE.Mesh(geometry, material);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    return mesh;
}

// =====================================================
// STEP 4: Create the Floating Platforms (Green Islands)
//
// Each platform is defined as: [centerX, centerY, centerZ, width, depth]
// The box is 1 unit tall, so the TOP surface = centerY + 0.5
// =====================================================

// All platform data in one array so we can loop over them easily
const platformData = [
    //  cx,    cy,   cz,   width, depth
    [    0,  -0.5,    0,    18,    18  ],  // Island 0: Starting island
    [    0,   0.5,  -22,   14,    14  ],   // Island 1
    [    5,   1.0,  -35,   11,    11  ],   // Island 2 (has piranha plant)
    [   -4,   1.5,  -47,   12,    12  ],   // Island 3 (has piranha plant)
    [    0,   2.0,  -62,   16,    16  ],   // Island 4: Final island - GOAL!
];

// We store each platform's info here so collision detection can use it later
const platforms = [];

for (let i = 0; i < platformData.length; i++) {
    const cx    = platformData[i][0];
    const cy    = platformData[i][1];
    const cz    = platformData[i][2];
    const width = platformData[i][3];
    const depth = platformData[i][4];

    // Build and place the green box
    const mesh = makeBox(width, 1, depth, 0x006400); // Dark green
    mesh.position.set(cx, cy, cz);
    scene.add(mesh);

    // Store platform info for collision detection:
    platforms.push({
        mesh:  mesh,
        cx:    cx,
        cz:    cz,
        topY:  cy + 0.5,        // Y of the top surface
        minX:  cx - width / 2,  // Left edge X
        maxX:  cx + width / 2,  // Right edge X
        minZ:  cz - depth / 2,  // Front edge Z
        maxZ:  cz + depth / 2,  // Back edge Z
        halfW: width / 2,       // Used for enemy patrol limits
    });
}

// A blue ocean far below - if Mario falls, he loses
const ocean = makeBox(300, 1, 300, 0x1a6aa8);
ocean.position.set(0, -20, -30);
scene.add(ocean);

// =====================================================
// STEP 5: Create Mario (Red Box = The Player)
// =====================================================

// Mario is a small red cube
const marioMesh = makeBox(0.8, 0.8, 0.8, 0xff2200);  // Bright red
marioMesh.position.set(0, 1.5, 0);                   // Start above island 0
scene.add(marioMesh);

// This object tracks Mario's current state
const mario = {
    mesh:     marioMesh,

    // Speed in each direction (units per second)
    speedX:   0,
    speedY:   0,
    speedZ:   0,

    onGround: false,  // Checks if Mario is standing on something (can only jump if true)
    coins:    0,      // How many coins collected
};

// Physics numbers
const MOVE_SPEED = 8;    // How fast Mario walks left/right/forward/back
const JUMP_SPEED = 13;   // How fast Mario shoots upward when jumping
const GRAVITY    = -28;  // Downward pull

// =====================================================
// STEP 6: Create Coins (Small Yellow Spinning Boxes)
// =====================================================

// Each coin position: [x, y, z]
const coinPositions = [
    // Island 0
    [ 3, 1.0,  -2], [-3, 1.0,  2], [ 5, 1.0,  0], [-5, 1.0,  0],
    [ 2, 1.0,   4], [-2, 1.0, -4],
    // Island 1
    [ 2, 2.0, -21], [-2, 2.0, -22], [ 3, 2.0, -23], [-1, 2.0, -20],
    // Island 2
    [ 5, 2.5, -34], [ 7, 2.5, -36], [ 3, 2.5, -36],
    // Island 3
    [-4, 3.0, -46], [-6, 3.0, -48], [-2, 3.0, -47],
    // Island 4 (goal)
    [ 2, 3.5, -61], [-2, 3.5, -62], [ 4, 3.5, -63], [-4, 3.5, -60],
];

// Build all the coin meshes and store them in an array
const coins = [];
for (let i = 0; i < coinPositions.length; i++) {
    const x = coinPositions[i][0];
    const y = coinPositions[i][1];
    const z = coinPositions[i][2];

    const mesh = makeBox(0.4, 0.4, 0.4, 0xFFD700); // Gold yellow
    mesh.position.set(x, y, z);
    scene.add(mesh);

    coins.push({
        mesh:      mesh,
        collected: false,  // Set to true when Mario collects it
    });
}

// =====================================================
// STEP 7: Create the Goal Star
// (A yellow box Mario must reach to win)
// =====================================================

const goalStar = makeBox(0.9, 0.9, 0.9, 0xFFFF00);      // Bright yellow
goalStar.position.set(0, 3.8, -62);                     // On top of island 4
goalStar.material.emissive = new THREE.Color(0x999900); // Slight glow effect
scene.add(goalStar);

// A simple flag pole to mark the goal location
const pole = makeBox(0.12, 5, 0.12, 0x888888);
pole.position.set(2, 4.5, -62);
scene.add(pole);

const flag = makeBox(1.5, 0.8, 0.1, 0xff0000); // Red flag
flag.position.set(2.8, 7.0, -62);
scene.add(flag);

// =====================================================
// STEP 8: Create Enemies (Goombas and Koopa Troopas)
//
// Goomba: Brown box, moves slow
// Troopa: Green box, moves faster
//
// Behavior:
//   - Patrol back and forth on their island
//   - When Mario is on the same island, they CHASE him
//   - Mario can stomp them by jumping on top
// =====================================================

const enemies = []; // All enemies go in this array

function createEnemy(type, startX, startZ, islandIndex) {
    // Pick color and speed based on enemy type
    let color      = 0x8B4513;  // Brown for goomba
    let size       = 0.8;
    let chaseSpeed = 2.5;
    let patrolSpeed = 1.5;

    if (type === 'troopa') {
        color       = 0x90EE90;  // Green for troopa
        size        = 0.9;
        chaseSpeed  = 4.0;
        patrolSpeed = 2.5;
    }

    const island = platforms[islandIndex];
    const startY = island.topY + size / 2; // Sit on top of the island

    const mesh = makeBox(size, size, size, color);
    mesh.position.set(startX, startY, startZ);
    scene.add(mesh);

    // Pick a random starting direction: 1 = right, -1 = left
    const startDir = (Math.random() > 0.5) ? 1 : -1;

    enemies.push({
        mesh:        mesh,
        island:      island,      // Which island this enemy is on
        size:        size,
        chaseSpeed:  chaseSpeed,
        patrolSpeed: patrolSpeed,
        patrolDir:   startDir,    // Current patrol direction
        alive:       true,        // Set to false when Mario stomps it
    });
}

// No enemies on island 0 (the start)
createEnemy('goomba',   2, -21,  1);  // Island 1
createEnemy('troopa',  -2, -23,  1);  // Island 1
createEnemy('troopa',   5, -36,  2);  // Island 2
createEnemy('goomba',   3, -34,  2);  // Island 2
createEnemy('troopa',  -5, -47,  3);  // Island 3
createEnemy('goomba',  -2, -45,  3);  // Island 3

// =====================================================
// STEP 9: Create Piranha Plants
//
// A green stem with a red sphere head.
// They shoot fireballs at Mario.
// =====================================================

const piranhas = []; // All piranhas go in this array

function createPiranha(x, baseY, z) {
    // The stem: a thin green box
    const stem = makeBox(0.22, 1.5, 0.22, 0x228B22);
    stem.position.set(x, baseY + 0.75, z); // 0.75 = half the stem height
    scene.add(stem);

    // The head: a red sphere
    const headGeometry = new THREE.SphereGeometry(0.55, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const head         = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, baseY + 1.65, z); // Sits on top of the stem
    scene.add(head);

    piranhas.push({
        stem:      stem,
        head:      head,
        baseY:     baseY,                 // Original Y position
        shotTimer: 2 + Math.random() * 3, // Seconds until next fireball
    });
}

createPiranha( 7.0, 1.5, -34);  // Island 2
createPiranha(-7.0, 2.0, -46);  // Island 3
createPiranha( 6.0, 2.5, -61);  // Island 4

// =====================================================
// STEP 10: Fireballs
//
// Piranhas shoot these at Mario.
// Each fireball is a small red sphere that flies in a straight line.
// =====================================================

const fireballs = []; // All active fireballs

function shootFireball(fromX, fromY, fromZ, toX, toY, toZ) {
    // Build the fireball sphere
    const geometry = new THREE.SphereGeometry(0.28, 12, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4400 });
    const mesh     = new THREE.Mesh(geometry, material);
    mesh.position.set(fromX, fromY, fromZ);
    scene.add(mesh);

    // Calculate direction: how much to move in X, Y, Z each second
    // First find the raw difference
    const diffX = toX - fromX;
    const diffY = toY - fromY;
    const diffZ = toZ - fromZ;

    // Find the total distance so we can normalize (make the direction length = 1)
    const distance = Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ);

    const FIREBALL_SPEED = 7; // Units per second
    const velX = (diffX / distance) * FIREBALL_SPEED;
    const velY = (diffY / distance) * FIREBALL_SPEED;
    const velZ = (diffZ / distance) * FIREBALL_SPEED;

    fireballs.push({
        mesh:  mesh,
        velX:  velX,
        velY:  velY,
        velZ:  velZ,
        alive: true,
    });
}

// =====================================================
// STEP 11: Keyboard Input
// We track which keys are held down in a simple object.
// =====================================================

const keys = {}; // keys 'Space' = true means Space is currently held

window.addEventListener('keydown', function(event) {
    keys[event.code] = true;
    if (event.code === 'Space') event.preventDefault(); // Stop page from scrolling
});

window.addEventListener('keyup', function(event) {
    keys[event.code] = false;
});

// =====================================================
// STEP 12: Game State and HUD Helpers
// =====================================================

let gameState = 'playing'; // Either 'playing', 'won', or 'lost'

// Show the win/lose popup with a message
function showPopup(title, subtitle) {
    document.getElementById('overlay-title').textContent    = title;
    document.getElementById('overlay-subtitle').textContent = subtitle;
    document.getElementById('overlay').classList.add('show');
}

function triggerWin() {
    if (gameState !== 'playing') return;
    gameState = 'won';
    showPopup('YOU WIN!', 'Coins collected: ' + mario.coins);
}

function triggerLose(reason) {
    if (gameState !== 'playing') return;
    gameState = 'lost';
    showPopup('GAME OVER', reason + ' (' + mario.coins + ' coins)');
}

// Add coins and update the display
function addCoins(amount) {
    mario.coins += amount;
    document.getElementById('coinCount').textContent = mario.coins;
}

// =====================================================
// STEP 13: Platform Collision Detection
//
// After moving Mario, check if he landed on any platform.
// If he did, snap him to the surface and stop his downfall.
//
// How it works:
//   1. Check if Mario is horizontally inside the platform's footprint (X and Z)
//   2. Check if Mario's feet are close to the platform's top surface (Y)
//   3. If both are true, he's landed - snap him on top and set speedY = 0
// =====================================================

const MARIO_HALF = 0.4; // Half of Mario's 0.8 box size

function checkPlatformLanding() {
    mario.onGround = false; // Assume in the air; flip to true if we land

    for (let i = 0; i < platforms.length; i++) {
        const plat = platforms[i];

        // Mario's current position
        const mx = mario.mesh.position.x;
        const my = mario.mesh.position.y;
        const mz = mario.mesh.position.z;

        // Check if Mario is horizontally within the platform's bounds.
        const insideX = mx > plat.minX - MARIO_HALF && mx < plat.maxX + MARIO_HALF;
        const insideZ = mz > plat.minZ - MARIO_HALF && mz < plat.maxZ + MARIO_HALF;

        if (insideX && insideZ) {
            // Mario's feet position (bottom of his box)
            const marioFeet = my - MARIO_HALF;

            // Check if Mario's feet are close enough to the platform's top surface to land.
            const nearSurface  = marioFeet < plat.topY + 0.3;
            const notTooFarBelow = marioFeet > plat.topY - 1.5;

            if (mario.speedY <= 0 && nearSurface && notTooFarBelow) {
                // Land him exactly on the surface
                mario.mesh.position.y = plat.topY + MARIO_HALF;
                mario.speedY = 0;
                mario.onGround = true;
                break; // Found a platform, no need to check the rest
            }
        }
    }
}

// Returns which platform Mario is standing on right now (or null if in the air)
function getMarioPlatform() {
    for (let i = 0; i < platforms.length; i++) {
        const plat = platforms[i];

        const mx = mario.mesh.position.x;
        const my = mario.mesh.position.y;
        const mz = mario.mesh.position.z;

        const insideX     = mx > plat.minX - 0.1 && mx < plat.maxX + 0.1;
        const insideZ     = mz > plat.minZ - 0.1 && mz < plat.maxZ + 0.1;
        const onTopSurface = Math.abs((my - MARIO_HALF) - plat.topY) < 0.4;

        if (insideX && insideZ && onTopSurface) {
            return plat;
        }
    }
    return null; // Mario is in the air, not on any platform
}

// =====================================================
// STEP 14: The Animation Loop
//
// This function runs ~60 times per second.
// Each "frame" we:
//   1. Read keyboard input and move Mario
//   2. Apply gravity
//   3. Check if Mario landed on a platform
//   4. Update coins, enemies, piranhas, fireballs
//   5. Move the camera to follow Mario
//   6. Draw everything with renderer.render()
// =====================================================

// We use a clock to find out how much time passed since the last frame.
// This makes movement consistent even if the frame rate changes.
// 'dt' means "delta time" = seconds since last frame (usually about 0.016)
const clock = new THREE.Clock();
let time = 0; // Total seconds since the game started

function animate() {
    requestAnimationFrame(animate); // Schedule this function to run again next frame

    // Stop updating if the game is over, but keep rendering so screen doesn't freeze
    if (gameState !== 'playing') {
        renderer.render(scene, camera);
        return;
    }

    // Find out how much time passed since the last frame
    // We cap it at 0.05 so the game doesn't go crazy if the tab was hidden
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;

    // --------------------------------------------------
    // PLAYER MOVEMENT
    // WASD / Arrow Keys move Mario in fixed world directions.
    // --------------------------------------------------

    // Reset horizontal speed each frame so Mario stops when you release the key
    mario.speedX = 0;
    mario.speedZ = 0;

    if (keys['ArrowLeft']  || keys['KeyA']) mario.speedX = -MOVE_SPEED;
    if (keys['ArrowRight'] || keys['KeyD']) mario.speedX =  MOVE_SPEED;
    if (keys['ArrowUp']    || keys['KeyW']) mario.speedZ = -MOVE_SPEED;
    if (keys['ArrowDown']  || keys['KeyS']) mario.speedZ =  MOVE_SPEED;

    // Jump: only allowed when Mario is standing on the ground
    if (keys['Space'] && mario.onGround) {
        mario.speedY   = JUMP_SPEED;
        mario.onGround = false;
    }

    // Apply gravity: pull Mario downward every framw
    mario.speedY += GRAVITY * dt;

    // Cap falling speed so Mario can't pass through thin platforms
    if (mario.speedY < -25) mario.speedY = -25;

    // Move Mario's position based on his current speeds
    mario.mesh.position.x += mario.speedX * dt;
    mario.mesh.position.y += mario.speedY * dt;
    mario.mesh.position.z += mario.speedZ * dt;

    // Check if Mario landed on any platform after moving
    checkPlatformLanding();

    // --------------------------------------------------
    // FALL DETECTION
    // If Mario falls below the ocean, he loses
    // --------------------------------------------------
    if (mario.mesh.position.y < -8) {
        triggerLose('You fell into the ocean!');
        return;
    }

    // --------------------------------------------------
    // COINS - spin each frame, collect when Mario gets close
    // --------------------------------------------------
    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        if (coin.collected) continue;

        coin.mesh.rotation.y += 2.5 * dt; // Spin the coin

        // Distance between Mario and this coin
        const dx   = mario.mesh.position.x - coin.mesh.position.x;
        const dy   = mario.mesh.position.y - coin.mesh.position.y;
        const dz   = mario.mesh.position.z - coin.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 0.85) {
            coin.collected = true;
            scene.remove(coin.mesh);
            addCoins(1);
        }
    }

    // --------------------------------------------------
    // GOAL STAR - spin it, check if Mario reaches it
    // --------------------------------------------------
    goalStar.rotation.y += 2.5 * dt;
    goalStar.rotation.x += dt;

    const gDx   = mario.mesh.position.x - goalStar.position.x;
    const gDy   = mario.mesh.position.y - goalStar.position.y;
    const gDz   = mario.mesh.position.z - goalStar.position.z;
    const gDist = Math.sqrt(gDx * gDx + gDy * gDy + gDz * gDz);

    if (gDist < 1.5) {
        addCoins(10); // Bonus coins for winning!
        triggerWin();
        return;
    }

    // --------------------------------------------------
    // ENEMIES - patrol their island, chase Mario if he's there
    // --------------------------------------------------

    // Find out which platform Mario is currently on
    const marioPlatform = getMarioPlatform();

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.alive) continue;

        // Always keep the enemy sitting on top of its island
        enemy.mesh.position.y = enemy.island.topY + enemy.size / 2;

        // Check if Mario is on the same island as this enemy. If so, the enemy will chase him.
        const marioIsHere = (marioPlatform === enemy.island);

        if (marioIsHere) {
            // CHASE: move toward Mario's X and Z position
            const dx = mario.mesh.position.x - enemy.mesh.position.x;
            const dz = mario.mesh.position.z - enemy.mesh.position.z;

            // Normalize direction: find the total length, then divide
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.2) {
                enemy.mesh.position.x += (dx / dist) * enemy.chaseSpeed * dt;
                enemy.mesh.position.z += (dz / dist) * enemy.chaseSpeed * dt;
            }

        } else {
            // PATROL: walk back and forth on the island
            enemy.mesh.position.x += enemy.patrolDir * enemy.patrolSpeed * dt;

            // Flip direction at island edges
            const leftEdge  = enemy.island.cx - enemy.island.halfW + 0.8;
            const rightEdge = enemy.island.cx + enemy.island.halfW - 0.8;
            if (enemy.mesh.position.x > rightEdge) enemy.patrolDir = -1;
            if (enemy.mesh.position.x < leftEdge)  enemy.patrolDir =  1;
        }

        // COLLISION CHECK: Did Mario run into this enemy?
        const ex = mario.mesh.position.x - enemy.mesh.position.x;
        const ez = mario.mesh.position.z - enemy.mesh.position.z;
        const horizontalDist = Math.sqrt(ex * ex + ez * ez);
        const hitRadius      = MARIO_HALF + enemy.size / 2 + 0.1;

        if (horizontalDist < hitRadius) {
            // STOMP CHECK:
            // If Mario's center is above the enemy's center AND he's falling down,
            // that means he jumped on top of it
            const marioAboveEnemy = mario.mesh.position.y > enemy.mesh.position.y + 0.1;
            const marioFalling    = mario.speedY < 0;

            if (marioAboveEnemy && marioFalling) {
                // Stomped! Remove the enemy and bounce Mario upward
                enemy.alive = false;
                scene.remove(enemy.mesh);
                mario.speedY = 9; // Bounce up
                addCoins(3);      // Reward
            } else {
                // Mario ran into the side - game over
                triggerLose('You were caught by an enemy!');
                return;
            }
        }
    }

    // --------------------------------------------------
    // PIRANHA PLANTS - bob up and down, shoot fireballs
    // --------------------------------------------------
    for (let i = 0; i < piranhas.length; i++) {
        const p = piranhas[i];

        // Bob up and down using a sine wave
        // Math.sin(time) produces a smooth value between -1 and 1 over time
        const bobOffset = Math.sin(time * 2.5) * 0.15;
        p.stem.position.y = p.baseY + 0.75 + bobOffset;
        p.head.position.y = p.baseY + 1.65 + bobOffset;

        // Count down to the next shot
        p.shotTimer -= dt;
        if (p.shotTimer <= 0) {
            p.shotTimer = 3 + Math.random() * 3; // Wait 3-6 seconds before next shot

            // Shoot only if Mario is within 30 units
            const dx   = mario.mesh.position.x - p.head.position.x;
            const dy   = mario.mesh.position.y - p.head.position.y;
            const dz   = mario.mesh.position.z - p.head.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 30) {
                shootFireball(
                    p.head.position.x, p.head.position.y, p.head.position.z,
                    mario.mesh.position.x, mario.mesh.position.y, mario.mesh.position.z
                );
            }
        }
    }

    // --------------------------------------------------
    // FIREBALLS - move forward, check if they hit Mario
    // --------------------------------------------------
    for (let i = 0; i < fireballs.length; i++) {
        const fb = fireballs[i];
        if (!fb.alive) continue;

        // Move the fireball in its direction
        fb.mesh.position.x += fb.velX * dt;
        fb.mesh.position.y += fb.velY * dt;
        fb.mesh.position.z += fb.velZ * dt;
        fb.mesh.rotation.x += 5 * dt; // Spin for visual effect

        // Remove if it flew too far away or fell below the ocean
        const dx   = fb.mesh.position.x - mario.mesh.position.x;
        const dy   = fb.mesh.position.y - mario.mesh.position.y;
        const dz   = fb.mesh.position.z - mario.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist > 40 || fb.mesh.position.y < -12) {
            fb.alive = false;
            scene.remove(fb.mesh);
            continue;
        }

        // Collision check with Mario
        if (dist < 0.85) {
            triggerLose('You were hit by a fireball!');
            return;
        }
    }

    // --------------------------------------------------
    // CAMERA - follows behind and above Mario
    //
    // We want the camera to stay behind Mario in world space.
    // Target position: directly behind on Z, a bit above on Y.
    // We use linear interpolation to make it glide smoothly:
    //   current = current + (target - current) * smoothing
    // --------------------------------------------------
    const camTargetX = mario.mesh.position.x;
    const camTargetY = mario.mesh.position.y + 7;
    const camTargetZ = mario.mesh.position.z + 12;

    // Smooth factor: 0.1 means move 10% of the remaining distance each frame
    const smooth = 0.1;
    camera.position.x += (camTargetX - camera.position.x) * smooth;
    camera.position.y += (camTargetY - camera.position.y) * smooth;
    camera.position.z += (camTargetZ - camera.position.z) * smooth;

    // Always look at a point just above Mario
    camera.lookAt(mario.mesh.position.x, mario.mesh.position.y + 1, mario.mesh.position.z);

    // Draw the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// Kick off the animation loop
animate();

// =====================================================
// STEP 15: Handle Window Resize
// =====================================================

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});