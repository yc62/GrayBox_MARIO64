/* Graybox Mario 64 — Title → Overworld → World 1-1 Platformer
   Updated: Title Screen, Audio, Block Sizes, Mario Facing, Piranha Range, Goomba GLB
   Original created by: John Cho | February 2026
*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ═══════════════════════════════════════════════════════
// RENDERER
// ═══════════════════════════════════════════════════════
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════════════════
// SCENE + CAMERA
// ═══════════════════════════════════════════════════════
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);   // black for title; changed later

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(0, 2, 20);
camera.lookAt(0, 2, 0);

// MODE: 'title' | 'overworld' | 'level'
let MODE = 'title';

// ═══════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════
const overworldBGM = new Audio('Overworld_Theme.mp3');
overworldBGM.loop   = true;
overworldBGM.volume = 0.15;

const titleBGM = new Audio('title_theme.mp3');
titleBGM.loop   = true;
titleBGM.volume = 0.6;
// Autoplay is blocked by browsers; we'll start it on the first user interaction.
// titleBGM.play().catch(() => {});
const hereWeGoSFX = new Audio('Here_We_Go.mp3');
hereWeGoSFX.volume = 1.0;

const jumpSFX = new Audio('Mario_Jump.mp3');
jumpSFX.volume = 0.8;

const deathSFX = new Audio('mario_death.mp3');
deathSFX.volume = 0.9;

function playJumpSFX() {
    jumpSFX.currentTime = 0;
    jumpSFX.play().catch(() => {});
}
function playDeathSFX() {
    deathSFX.currentTime = 0;
    deathSFX.play().catch(() => {});
}

function playOverworldBGM() {
    overworldBGM.currentTime = 0;
    overworldBGM.play().catch(() => {});
}
function stopOverworldBGM() {
    overworldBGM.pause();
    overworldBGM.currentTime = 0;
}

// ═══════════════════════════════════════════════════════
// LIGHTING
// ═══════════════════════════════════════════════════════
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xC8A86B, 0.9);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xFFF4CC, 2.8);
sunLight.position.set(40, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width  = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near   = 1;
sunLight.shadow.camera.far    = 300;
sunLight.shadow.camera.left   = -80;
sunLight.shadow.camera.right  =  80;
sunLight.shadow.camera.top    =  60;
sunLight.shadow.camera.bottom = -60;
sunLight.shadow.bias          = -0.001;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xA8C8FF, 0.55);
fillLight.position.set(-30, 20, -30);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xFFD080, 0.4);
rimLight.position.set(-20, 5, 40);
scene.add(rimLight);

// Extra title-screen light so the logo looks great
const titleSpotLight = new THREE.PointLight(0xFFEE88, 3.0, 40);
titleSpotLight.position.set(0, 8, 10);
scene.add(titleSpotLight);

// ═══════════════════════════════════════════════════════
// TITLE SCREEN
// ═══════════════════════════════════════════════════════
document.head.insertAdjacentHTML('beforeend', `<style>
    @keyframes titleBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    @keyframes enterPulse {
        0%,100% { transform:scale(1); }
        50%     { transform:scale(1.07); box-shadow:0 6px 28px rgba(229,34,34,.7); }
    }
    #enterBtn:hover { filter:brightness(1.2); }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
</style>`);

// Title overlay (DOM layer over canvas)
const titleOverlay = document.createElement('div');
titleOverlay.id = 'titleOverlay';
titleOverlay.style.cssText = [
    'position:fixed','inset:0','z-index:100',
    'display:flex','flex-direction:column',
    'align-items:center','justify-content:flex-end',
    'padding-bottom:80px','pointer-events:none',
].join(';');

// Subtitle under logo area
const titleSubtitle = document.createElement('div');
titleSubtitle.innerHTML = 'Recreated in Three.js by John Cho';
titleSubtitle.style.cssText = [
    'color:#AAD8FF','font-size:14px','letter-spacing:6px',
    'font-family:"Arial",sans-serif','font-weight:bold',
    'text-shadow:0 0 12px rgba(0,150,255,0.7)',
    'margin-bottom:30px','opacity:0.85',
].join(';');
titleOverlay.appendChild(titleSubtitle);

const titlePressEnter = document.createElement('div');
titlePressEnter.innerHTML = 'PRESS &nbsp; ENTER &nbsp; TO &nbsp; PLAY';
titlePressEnter.style.cssText = [
    'color:#FFD700','font-size:20px','letter-spacing:5px',
    'font-family:"Arial",sans-serif','font-weight:900',
    'text-shadow:2px 2px 0 #000, 0 0 20px rgba(255,200,0,0.8)',
    'animation:titleBlink 1.1s step-end infinite',
].join(';');
titleOverlay.appendChild(titlePressEnter);

document.body.appendChild(titleOverlay);

// Load logo_mario.glb into the title scene
let titleLogoScene = null;
let titleLogoMixer = null;
const titleLogoGroup = new THREE.Group();
scene.add(titleLogoGroup);

new GLTFLoader().load('newlogo_mario.glb',
    gltf => {
        titleLogoScene = gltf.scene;
        // Auto-scale to fill a nice portion of the screen
        const box  = new THREE.Box3().setFromObject(titleLogoScene);
        const size = new THREE.Vector3();
        const ctr  = new THREE.Vector3();
        box.getSize(size); box.getCenter(ctr);
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredSize = 7;
        titleLogoScene.scale.setScalar(desiredSize / maxDim);
        // Re-center
        const box2  = new THREE.Box3().setFromObject(titleLogoScene);
        const ctr2  = new THREE.Vector3();
        box2.getCenter(ctr2);
        titleLogoScene.position.sub(ctr2);
        titleLogoScene.position.y += 2.5;  // lift slightly
        titleLogoScene.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        titleLogoGroup.add(titleLogoScene);
        if (gltf.animations.length > 0) {
            titleLogoMixer = new THREE.AnimationMixer(titleLogoScene);
            titleLogoMixer.clipAction(gltf.animations[0]).play();
        }
        console.log('Logo GLB loaded ✓');
    },
    undefined,
    () => {
        // Fallback: draw "MARIO" text-like shapes
        const fallback = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 0.5),
            new THREE.MeshStandardMaterial({ color: 0xE52222 })
        );
        titleLogoGroup.add(fallback);
        console.warn('newlogo_mario.glb not found — using fallback');
    }
);

function hideTitleScreen() {
    titleOverlay.style.display = 'none';
    titleLogoGroup.visible     = false;
    titleSpotLight.visible     = false;
}

function showTitleScreen() {
    titleOverlay.style.display = 'flex';
    titleLogoGroup.visible     = true;
    titleSpotLight.visible     = true;
}

// ═══════════════════════════════════════════════════════
// OVERWORLD — CLOUDS
// ═══════════════════════════════════════════════════════
const cloudGroup = new THREE.Group();
cloudGroup.visible = false;   // hidden while on title
scene.add(cloudGroup);

function makeCloud(x, y, z) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    const g   = new THREE.Group();
    const parts = [
        [0, 0, 0, 1.8, 1.0, 1.8], [-1.2, -0.2, 0, 1.2, 0.8, 1.2],
        [1.2, -0.2, 0, 1.2, 0.8, 1.2], [0, 0.5, 0, 1.0, 0.7, 1.0],
    ];
    for (const [cx, cy, cz, w, h, d] of parts) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mat);
        m.scale.set(w, h, d); m.position.set(cx, cy, cz); g.add(m);
    }
    g.position.set(x, y, z);
    g.userData.speed  = 0.5 + Math.random() * 0.8;
    g.userData.startX = x;
    g.userData.rangeX = 30 + Math.random() * 20;
    cloudGroup.add(g);
}
const cloudPositions = [
    [-20,22,-10],[-5,25,-20],[10,23,-15],[20,24,-5],
    [-15,26,-35],[5,27,-45],[-25,22,-50],[15,25,-55],[0,28,-30],[-10,23,-25],
];
for (const [x,y,z] of cloudPositions) makeCloud(x,y,z);

// ═══════════════════════════════════════════════════════
// OVERWORLD — HELPERS
// ═══════════════════════════════════════════════════════
function makeBox(w, h, d, color) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color })
    );
    m.castShadow = m.receiveShadow = true;
    return m;
}

// ═══════════════════════════════════════════════════════
// OVERWORLD — NODES + ROADS
// ═══════════════════════════════════════════════════════
const T1 = 6.5;
const nodeData = [
    { x: -22.5, z: -11.5 },
    { x: -25.5, z: -11.5 },
    { x: -19.0, z: -11.5 },
    { x: -18.5, z: -14.5 },
];
const CONNECTIONS = [[0,1],[0,2]];
const nodeAdj = nodeData.map(() => []);
for (const [a, b] of CONNECTIONS) { nodeAdj[a].push(b); nodeAdj[b].push(a); }

const NODE_BASE_Y = T1 + 0.40;
const RED_TOP_Y   = NODE_BASE_Y + 0.13 + 0.12;
const levelNodes  = [];

nodeData.forEach(({ x, z }, i) => {
    const grp = new THREE.Group();
    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.44, 0.10, 14),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 })
    );
    rim.castShadow = rim.receiveShadow = true;
    grp.add(rim);
    const color = (i === 3) ? 0x111111 : 0xCC1111;
    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.12, 14),
        new THREE.MeshStandardMaterial({ color, roughness: 0.35 })
    );
    top.position.y = 0.13;
    top.castShadow = top.receiveShadow = true;
    grp.add(top);
    grp.position.set(x, NODE_BASE_Y, z);
    grp.visible = false;   // hidden on title
    scene.add(grp);
    levelNodes.push(grp);
});

const overworldRoads = [];
const ROAD_Y = T1 + 0.18;
for (const [a, b] of CONNECTIONS) {
    const na = nodeData[a], nb = nodeData[b];
    const dx = nb.x - na.x, dz = nb.z - na.z;
    const len = Math.sqrt(dx*dx + dz*dz);
    const road = new THREE.Mesh(
        new THREE.BoxGeometry(0.80, 0.08, len),
        new THREE.MeshStandardMaterial({ color: 0xD4B870, roughness: 0.95 })
    );
    road.position.set((na.x+nb.x)/2, ROAD_Y, (na.z+nb.z)/2);
    road.rotation.y = Math.atan2(dx, dz);
    road.receiveShadow = true;
    road.visible = false;   // hidden on title
    scene.add(road);
    overworldRoads.push(road);
}

// ═══════════════════════════════════════════════════════
// OVERWORLD — MAP SHADERS (water + sunlight)
// ═══════════════════════════════════════════════════════
const mapVertexShader = `
    uniform float uTime;
    varying vec3 vNormal, vPosition;
    varying vec2 vUv;
    varying float vIsWater;
    varying vec3 vWaterNormal;
    void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float iw = step(wp.y, 3.8);
        vIsWater = iw;
        if (iw > 0.5) {
            float wx = wp.x, wz = wp.z;
            float tot = sin(wx*0.28+uTime*1.1)*0.22 + cos(wz*0.22+uTime*0.9)*0.18
                      + sin(wx*0.75+wz*0.55+uTime*2.3)*0.09;
            wp.y += tot;
            float e = 0.25;
            float hx = sin((wx+e)*0.28+uTime*1.1)*0.22 + cos(wz*0.22+uTime*0.9)*0.18
                     + sin((wx+e)*0.75+wz*0.55+uTime*2.3)*0.09;
            float hz = sin(wx*0.28+uTime*1.1)*0.22 + cos((wz+e)*0.22+uTime*0.9)*0.18
                     + sin(wx*0.75+(wz+e)*0.55+uTime*2.3)*0.09;
            vWaterNormal = normalize(vec3(-(hx-tot)/e, 1.0, -(hz-tot)/e));
        } else {
            vWaterNormal = vec3(0.0, 1.0, 0.0);
        }
        vPosition = wp.xyz;
        vNormal   = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
    }
`;
const mapFragmentShader = `
    precision highp float;
    uniform vec3  uLightPosition, uLightColor, uSkyColor, uGroundColor;
    uniform vec3  uBaseColor, uFogColor;
    uniform sampler2D uTexture;
    uniform bool  uHasTexture;
    uniform float uFogNear, uFogFar, uTime;
    varying vec3  vNormal, vPosition, vWaterNormal;
    varying vec2  vUv;
    varying float vIsWater;
    float caustics(vec2 uv, float t) {
        float c = abs(sin(uv.x*4.0+uv.y*3.1+t*2.3))
                + abs(sin(uv.x*3.3-uv.y*4.5+t*1.9))
                + abs(sin((uv.x+uv.y)*5.0+t*2.7));
        return pow(max(1.0 - c/3.0, 0.0), 3.0) * 1.5;
    }
    void main() {
        vec3 N = normalize(vIsWater > 0.5 ? vWaterNormal : vNormal);
        vec3 L = normalize(uLightPosition - vPosition);
        vec3 V = normalize(cameraPosition  - vPosition);
        vec3 H = normalize(L + V);
        vec3 amb  = mix(uGroundColor, uSkyColor, dot(N,vec3(0,1,0))*0.5+0.5) * 0.55;
        vec3 diff = max((dot(N,L)+0.35)/1.35, 0.0) * uLightColor;
        vec3 spec = pow(max(dot(N,H),0.0), vIsWater>0.5?180.0:32.0) * uLightColor;
        vec4 tc   = uHasTexture ? texture2D(uTexture, vUv) : vec4(1.0);
        tc.rgb   *= uBaseColor;
        if (vIsWater > 0.5) {
            vec3 wc = mix(mix(vec3(0.04,0.22,0.55),vec3(0.15,0.55,0.85),0.4),
                         mix(uSkyColor,vec3(1.0,0.97,0.85),0.3),
                         clamp(pow(1.0-max(dot(N,V),0.0),3.5),0.0,1.0)*0.6);
            wc += caustics(vPosition.xz*0.5+uTime*0.12, uTime)*0.35*vec3(0.6,0.85,1.0);
            wc += pow(max(dot(N,H),0.0),280.0)*3.5*vec3(1.0,0.98,0.85);
            float fog = smoothstep(uFogNear, uFogFar, length(cameraPosition-vPosition));
            gl_FragColor = vec4(mix((amb+diff*0.5)*wc+spec*1.8, uFogColor, fog*0.5), 0.92);
            return;
        }
        vec3 fc = (amb+diff)*tc.rgb + spec*0.3
                + pow(max(dot(N,vec3(0,1,0)),0.0),1.5)*0.18*uLightColor*tc.rgb;
        float fogF = smoothstep(uFogNear, uFogFar, length(cameraPosition-vPosition));
        gl_FragColor = vec4(mix(fc, uFogColor, fogF), tc.a);
    }
`;

// ═══════════════════════════════════════════════════════
// OVERWORLD — LOAD MAP GLB
// ═══════════════════════════════════════════════════════
const loadingDiv = document.createElement('div');
loadingDiv.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:24px;font-weight:bold;text-shadow:2px 2px 6px #000;z-index:30;pointer-events:none';
loadingDiv.textContent = 'Loading map…';
document.body.appendChild(loadingDiv);

const mapMeshes       = [];
const overworldNodes  = [];   // scene objects to hide when entering level

new GLTFLoader().load(
    'super_mario_world_map.glb',
    function(gltf) {
        loadingDiv.remove();
        const mapModel = gltf.scene;
        mapModel.visible = false;   // hidden on title
        scene.add(mapModel);
        overworldNodes.push(mapModel);

        const box    = new THREE.Box3().setFromObject(mapModel);
        const size   = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size); box.getCenter(center);
        const sc = 70 / Math.max(size.x, size.z);
        mapModel.scale.setScalar(sc);
        box.setFromObject(mapModel); box.getSize(size); box.getCenter(center);
        mapModel.position.x += (0    - center.x);
        mapModel.position.z += (-31  - center.z);
        mapModel.position.y += (-1   - box.min.y);

        mapModel.traverse(child => {
            if (!child.isMesh) return;
            child.castShadow = child.receiveShadow = true;
            const old = child.material;
            child.material = new THREE.ShaderMaterial({
                vertexShader:   mapVertexShader,
                fragmentShader: mapFragmentShader,
                transparent:    true,
                uniforms: {
                    uLightPosition: { value: sunLight.position },
                    uLightColor:    { value: new THREE.Color(0xFFF4CC) },
                    uSkyColor:      { value: new THREE.Color(0x87CEEB) },
                    uGroundColor:   { value: new THREE.Color(0xC8A86B) },
                    uTexture:       { value: old.map },
                    uHasTexture:    { value: !!old.map },
                    uBaseColor:     { value: old.color || new THREE.Color(1,1,1) },
                    uTime:          { value: 0 },
                    uFogColor:      { value: new THREE.Color(0x87CEEB) },
                    uFogNear:       { value: 40 },
                    uFogFar:        { value: 120 },
                }
            });
            mapMeshes.push(child);
        });
        console.log('Map GLB loaded ✓');
    },
    xhr => { if (xhr.total > 0) loadingDiv.textContent = 'Loading map… ' + Math.round(xhr.loaded/xhr.total*100) + '%'; },
    err => { console.error(err); loadingDiv.textContent = '⚠ Map failed to load'; }
);

// ═══════════════════════════════════════════════════════
// OVERWORLD — MARIO WALKER
// ═══════════════════════════════════════════════════════
const MARIO_SIZE = 0.70;
const MARIO_HALF = MARIO_SIZE / 2;
const MARIO_ON_Y = RED_TOP_Y + MARIO_HALF;

const marioMesh = makeBox(MARIO_SIZE, MARIO_SIZE, MARIO_SIZE, 0xff2200);
marioMesh.visible = false;
marioMesh.position.set(nodeData[0].x, MARIO_ON_Y, nodeData[0].z);
scene.add(marioMesh);

const OW_MARIO_SCALE = 0.75 / 3.291;
let owMarioVisual = null;
let owFacing      = 0;
let owMixer       = null;
let owWalkAction  = null;

new GLTFLoader().load('mario_rig.glb', function(gltf) {
    owMarioVisual = gltf.scene;
    owMarioVisual.scale.setScalar(OW_MARIO_SCALE);
    owMarioVisual.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
    owMarioVisual.visible = false;   // hidden on title
    scene.add(owMarioVisual);
    overworldNodes.push(owMarioVisual);

    owMixer = new THREE.AnimationMixer(owMarioVisual);
    if (gltf.animations.length > 0) {
        const clip = gltf.animations[0].clone();
        clip.tracks = clip.tracks.filter(t => !t.name.endsWith('.scale'));
        clip.tracks.forEach(t => {
            if (t.name.endsWith('.quaternion')) {
                for (let i = 0; i < t.values.length; i += 4) {
                    const l = Math.sqrt(t.values[i]**2+t.values[i+1]**2+t.values[i+2]**2+t.values[i+3]**2);
                    if (l > 0.001) { t.values[i]/=l; t.values[i+1]/=l; t.values[i+2]/=l; t.values[i+3]/=l; }
                }
            }
        });
        owWalkAction = owMixer.clipAction(clip);
        owWalkAction.setEffectiveTimeScale(1.8);
        owWalkAction.setEffectiveWeight(1);
        owWalkAction.setLoop(THREE.LoopRepeat, Infinity);
    }
    owUpdateVisual(false);
    console.log('Mario Rig GLB loaded ✓');
}, undefined, err => console.error('Mario Rig failed:', err));

function owUpdateVisual(moving) {
    if (!owMarioVisual) return;
    owMarioVisual.position.set(
        marioMesh.position.x,
        marioMesh.position.y - MARIO_HALF,
        marioMesh.position.z
    );
    owMarioVisual.rotation.y = owFacing;
    if (owWalkAction) {
        if (moving && !owWalkAction.isRunning()) { owWalkAction.reset(); owWalkAction.play(); }
        if (!moving && owWalkAction.isRunning())   owWalkAction.stop();
    }
}

// ═══════════════════════════════════════════════════════
// OVERWORLD — NODE MOVEMENT
// ═══════════════════════════════════════════════════════
let currentNode  = 0;
let targetNode   = -1;
let moveProgress = 0;
const WALK_SPEED = 3.5;
let cameraAngle  = 0;
let isZoomedOut  = false;

function tryMove(dx, dz) {
    if (targetNode !== -1) return;
    const mag = Math.sqrt(dx*dx + dz*dz);
    const ndx = dx/mag, ndz = dz/mag;
    let best = -1, bestDot = 0.3;
    for (const ni of nodeAdj[currentNode]) {
        const ex = nodeData[ni].x - nodeData[currentNode].x;
        const ez = nodeData[ni].z - nodeData[currentNode].z;
        const em = Math.sqrt(ex*ex + ez*ez);
        const dot = (ex/em)*ndx + (ez/em)*ndz;
        if (dot > bestDot) { bestDot = dot; best = ni; }
    }
    if (best !== -1) { targetNode = best; moveProgress = 0; }
}

// ═══════════════════════════════════════════════════════
// OVERWORLD — ENTER BUTTON
// ═══════════════════════════════════════════════════════
const enterBtn = document.createElement('div');
enterBtn.id = 'enterBtn';
enterBtn.innerHTML = '&#9654;&nbsp;ENTER LEVEL&nbsp;<span style="font-size:11px;opacity:.75;font-weight:400">[ ENTER ]</span>';
enterBtn.style.cssText = [
    'position:absolute','bottom:22px','right:22px',
    'background:linear-gradient(135deg,#e52222,#a00)',
    'color:#fff','font-family:Arial,sans-serif','font-weight:900',
    'font-size:15px','padding:12px 24px','border-radius:40px',
    'border:3px solid #fff','box-shadow:0 4px 18px rgba(0,0,0,.5)',
    'cursor:pointer','z-index:20','display:none','align-items:center','gap:10px',
    'letter-spacing:1px','user-select:none',
    'animation:enterPulse 1.4s ease-in-out infinite',
    'text-shadow:1px 1px 3px rgba(0,0,0,.5)',
].join(';');
enterBtn.addEventListener('click', () => launchLevel());
document.body.appendChild(enterBtn);

// ═══════════════════════════════════════════════════════
// WORLD 1-1 TRANSITION OVERLAY  ("Here We Go!" card)
// ═══════════════════════════════════════════════════════
const hereWeGoOverlay = document.createElement('div');
hereWeGoOverlay.id = 'hereWeGoOverlay';
hereWeGoOverlay.style.cssText = [
    'display:none','position:fixed','inset:0','z-index:200',
    'background:#000','align-items:center',
    'justify-content:center','flex-direction:column','gap:18px',
    'color:#fff','font-family:Arial,sans-serif',
    'text-shadow:3px 3px 0 #000',
].join(';');
hereWeGoOverlay.innerHTML = `
    <div style="font-size:18px;letter-spacing:8px;opacity:.7;font-weight:bold">WORLD</div>
    <div style="font-size:80px;font-weight:900;letter-spacing:8px;line-height:1">1-1</div>
    <div id="hereWeGoLives" style="font-size:28px;margin-top:10px;letter-spacing:2px">&#9829; &times; 3</div>`;
document.body.appendChild(hereWeGoOverlay);

// ═══════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════
const keys = {};
let audioStarted = false;
function startAudioOnInteraction() {
    if (audioStarted) return;
    audioStarted = true;
    // On the first interaction, we can start the audio. This is required by modern
    // browsers, which block audio from playing until the user interacts with the page.
    if (MODE === 'title' && titleBGM.paused) {
        titleBGM.play().catch(() => {});
    }
}

window.addEventListener('keydown', e => {
    startAudioOnInteraction();
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();

    if (MODE === 'title') {
        if (e.code === 'Enter') enterOverworld();
        return;
    }

    if (MODE === 'overworld') {
        const a = cameraAngle;
        const fX = Math.sin(a), fZ = -Math.cos(a);
        const rX = Math.cos(a), rZ =  Math.sin(a);
        if (e.code === 'ArrowUp')    tryMove( fX,  fZ);
        if (e.code === 'ArrowDown')  tryMove(-fX, -fZ);
        if (e.code === 'ArrowRight') tryMove( rX,  rZ);
        if (e.code === 'ArrowLeft')  tryMove(-rX, -rZ);
        if (e.code === 'KeyQ') cameraAngle -= Math.PI / 4;
        if (e.code === 'KeyE') cameraAngle += Math.PI / 4;
        if (e.code === 'KeyZ') isZoomedOut = !isZoomedOut;
        if (e.code === 'Enter' || e.code === 'Space') launchLevel();
    }

    if (MODE === 'level') {
        if (e.code === 'KeyX') spawnPlayerFireball();
    }
});
window.addEventListener('mousedown', startAudioOnInteraction);
window.addEventListener('keyup', e => { keys[e.code] = false; });

const isLeft  = () => keys['ArrowLeft']  || keys['KeyA'];
const isRight = () => keys['ArrowRight'] || keys['KeyD'];
const isJump  = () => keys['ArrowUp']    || keys['KeyW'] || keys['Space'];
const isRun   = () => keys['ShiftLeft']  || keys['ShiftRight'];

// ═══════════════════════════════════════════════════════
// TITLE → OVERWORLD TRANSITION
// ═══════════════════════════════════════════════════════
function enterOverworld() {
    if (MODE !== 'title') return;
    titleBGM.pause();
    MODE = 'overworld';

    // Fade out title, reveal overworld
    hideTitleScreen();
    scene.background = new THREE.Color(0x87CEEB);

    // Show overworld elements
    for (const o of overworldNodes) o.visible = true;
    for (const n of levelNodes)     n.visible = true;
    for (const r of overworldRoads) r.visible = true;
    cloudGroup.visible = true;

    // Camera to overworld position
    camera.fov  = 25;
    camera.near = 0.1;
    camera.far  = 600;
    camera.updateProjectionMatrix();
    camera.position.set(-23.5, 28, 7.0);
    camera.lookAt(-23.5, 5.0, -11.0);

    // Show overworld UI
    enterBtn.style.display = 'flex';
    const loc  = document.getElementById('location');
    const hint = document.getElementById('hint');
    if (loc)  loc.style.display  = '';
    if (hint) hint.style.display = '';

    // Start overworld music
    playOverworldBGM();
}

// ═══════════════════════════════════════════════════════
// ══════════ WORLD 1-1  LEVEL ═══════════════════════════
// ═══════════════════════════════════════════════════════

// ── Block height = Mario height (P_HALF*2 = 1.5 units) ──
// Row 1 floaters: y=2.0, h=1.5  → top surface at y=2.75  (reachable from ground)
// Row 2 floaters: y=5.5, h=1.5  → top surface at y=6.25  (reachable from row 1)
const PLATFORMS = [
    // Ground left
    { x:33,   y:-0.5,  w:66,  h:1,   c:0xc84c0c },
    // Ground right (after gap)
    { x:120,  y:-0.5,  w:100, h:1,   c:0xc84c0c },

    // Pipes (standing on ground)
    { x:22,   y:0.75,  w:2.8, h:2.5, c:0x1a9a1a, isPipe:true }, 
    { x:38,   y:0.75,  w:2.8, h:3.5, c:0x1a9a1a, isPipe:true },
    { x:62,   y:0.75,   w:2.8, h:4.0, c:0x1a9a1a, isPipe:true },
    { x:87,   y:0.75,  w:2.8, h:3.5, c:0x1a9a1a, isPipe:true },
    { x:136,  y:0.75,   w:2.8, h:4.0, c:0x1a9a1a, isPipe:true },

    // ── Floating bricks / ?-blocks — raised to y=3.5, spread out ──
    { x:15,   y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },
    { x:19,   y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin'     },  // moved from 21 (was above pipe@22)
    { x:28,   y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'mushroom' },
    { x:35,   y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin'     },
    // Row 2 tall Q raised
    { x:28,   y:6.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },

    // ── Mid floaters ──────────────────────────────────────
    { x:66,   y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },  // moved from 64 (was above pipe@62)
    { x:70,   y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:76,   y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'mushroom' },
    { x:82,   y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:90,   y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },  // moved from 88 (was above pipe@87)
    { x:76,   y:6.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },

    // ── Right-area floaters ───────────────────────────────
    { x:94,   y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:101,  y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:108,  y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'mushroom' },
    { x:115,  y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:122,  y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },
    { x:101,  y:6.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },

    // ── Far-right floaters ────────────────────────────────
    { x:145,  y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'fireflower' },
    { x:152,  y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:159,  y:3.5,   w:1.5, h:1.5, c:0xFFAA00, isQ:true, reward:'mushroom' },
    { x:166,  y:3.5,   w:1.5, h:1.5, c:0x7B3F00, reward:'coin' },
    { x:172,  y:3.5,   w:10.0, h:1.5, c:0xd4a000, isQ:true   },

    // ── Ascending staircase ───────────────────────────────
    { x:181,  y:0.0,   w:3,   h:1,   c:0xc84c0c },
    { x:184,  y:0.5,   w:3,   h:2,   c:0xc84c0c },
    { x:187,  y:1.0,   w:3,   h:3,   c:0xc84c0c },
    { x:190,  y:1.5,   w:3,   h:4,   c:0xc84c0c },
    { x:193,  y:2.0,   w:3,   h:5,   c:0xc84c0c },
    { x:196,  y:2.5,   w:3,   h:6,   c:0xc84c0c },
    { x:199,  y:3.0,   w:3,   h:7,   c:0xc84c0c },
    { x:202,  y:3.5,   w:3,   h:8,   c:0xc84c0c },

    // ── Gap then descending staircase ─────────────────────
    { x:209,  y:3.0,   w:3,   h:7,   c:0xc84c0c },
    { x:212,  y:2.5,   w:3,   h:6,   c:0xc84c0c },
    { x:215,  y:2.0,   w:3,   h:5,   c:0xc84c0c },

    // ── Castle ────────────────────────────────────────────
    { x:220,  y:2.0,   w:7,   h:4,   c:0x884422 },
    { x:218,  y:5.5,   w:3,   h:3,   c:0x884422 },
    { x:222,  y:5.5,   w:3,   h:3,   c:0x884422 },
];

// Coin positions adjusted for new block heights
// Row-1 block top = 2.75  → coins float at y≈3.5
// Row-2 block top = 6.25  → coins float at y≈7.0
const COIN_DEFS = [
    [15, 3.5],
    [24, 3.5],[27, 3.5],[30, 3.5],
    [64, 3.5],[68, 3.5],[72, 3.5],[76, 3.5],[80, 3.5],[72, 7.0],
    [93, 3.5],[97, 3.5],[101,3.5],[105,3.5],[97, 7.0],
    [145,3.5],[149,3.5],[153,3.5],[165,3.5],[169,3.5],
    [10, 1.5],[18, 1.5],[50, 1.5],[58, 1.5],[85, 1.5],[120,1.5],[128,1.5],[160,1.5],
];

// Enemy spawn [x, groundY, type]
// Platform goombas updated to sit on new block top (2.75) → spawn at 3.2
const ENEMY_DEFS = [
    [42,  1.5, 'goomba'],
    [54,  1.5, 'goomba'],
    [75,  1.5, 'koopa'],
    [93,  1.5, 'goomba'],
    [110, 1.5, 'goomba'],
    [143, 1.5, 'koopa'],
    [157, 1.5, 'goomba'],
    [170, 1.5, 'goomba'],
    [175, 1.5, 'koopa'],
    // ── NEW: goomba.glb between first green platform pipes (x=22 … x=38) ──
    [30,  1.5, 'goomba'],
    [34,  1.5, 'goomba'],
    // Platform goombas (now on lowered blocks)
    [71,  3.2, 'goomba'],
    [100, 3.2, 'goomba'],
];

// Piranha plant pipe-top positions
const PIRANHA_DEFS = [
    { x:62,  topY:5.5 },
    { x:136, topY:6.5 },
];

// ── Level runtime state ───────────────────────────────
let platformMeshes  = [];
let platformDataMap = new Map();   // mesh → platform entry
let coinObjects     = [];
let enemies         = [];
let fireballs       = [];
let playerFireballs = [];          // Mario's own fireballs
let piranhaPlants   = [];
let spawnedMushrooms = [];         // active mushroom objects
let firePlantPickups = [];         // fire plant collectibles
let levelBuilt      = false;
let levelVisGroup   = null;

// Mario power-up state
let pHasFirePower = false;         // can shoot fireballs
let pBig         = false;          // mushroom big mode
let pBigTimer    = 0;              // seconds remaining for big
let pFireCooldown = 0;             // cooldown between shots

let lvScore=0, lvCoins=0, lvLives=3, lvTimer=400, lvTimerTick=0, lvActive=false;
let hudEl=null, backBtnEl=null, ctrlHintEl=null, overlayEl=null;

function hudUpdate() {
    if (!hudEl) return;
    hudEl.querySelector('#lvScore').textContent = String(lvScore).padStart(6,'0');
    hudEl.querySelector('#lvCoins').textContent = '×' + String(lvCoins).padStart(2,'0');
    hudEl.querySelector('#lvTime').textContent  = lvTimer;
    hudEl.querySelector('#lvLives').textContent = '♥ ' + lvLives;
}

// ── Mario physics vars ────────────────────────────────
const GRAV=-30, P_WALK=7, P_RUN=13, JMP_V=16, JMP_BOOST=9, JMP_MAX=0.35;
const P_HALF=0.75, P_RAD=0.28;

let pPos=new THREE.Vector3(), pVel=new THREE.Vector3();
let pGround=false, pJumpHeld=false, pJumpT=0, pFace=1;  //
let pVis=null, pMixer=null, pWalk=null;
let pInv=0, pDead=false;

// raycaster
const RC = new THREE.Raycaster();
function groundProbe(pos) {
    let best = null;
    const origins = [
        new THREE.Vector3(pos.x,           pos.y+0.05, pos.z),
        new THREE.Vector3(pos.x+P_RAD*0.8, pos.y+0.05, pos.z),
        new THREE.Vector3(pos.x-P_RAD*0.8, pos.y+0.05, pos.z),
    ];
    for (const o of origins) {
        RC.set(o, new THREE.Vector3(0,-1,0));
        RC.far = 0.6 + P_HALF;
        const h = RC.intersectObjects(platformMeshes, false);
        if (h.length && (!best || h[0].distance < best.distance)) best = h[0];
    }
    return best;
}
function wallProbe(pos, dir) {
    for (const oy of [P_HALF*0.4, P_HALF*1.1]) {
        RC.set(new THREE.Vector3(pos.x, pos.y+oy, pos.z), dir);
        RC.far = P_RAD + 0.15;
        const h = RC.intersectObjects(platformMeshes, false);
        if (h.length) return h[0];
    }
    return null;
}
function ceilProbe(pos) {
    RC.set(new THREE.Vector3(pos.x, pos.y+P_HALF-0.05, pos.z), new THREE.Vector3(0,1,0));
    RC.far = 0.4;
    const h = RC.intersectObjects(platformMeshes, false);
    return h.length ? h[0] : null;
}
function simpleGround(pos) {
    RC.set(new THREE.Vector3(pos.x, pos.y+0.3, pos.z), new THREE.Vector3(0,-1,0));
    RC.far = 1.8;
    const h = RC.intersectObjects(platformMeshes, false);
    return h.length ? h[0].point.y : null;
}

// ── Level loading overlay ─────────────────────────────
const lvLoadDiv = document.createElement('div');
lvLoadDiv.style.cssText = 'display:none;position:fixed;inset:0;background:#5c94fc;z-index:100;align-items:center;justify-content:center;flex-direction:column;gap:18px;color:#fff;font-size:28px;font-weight:bold;text-shadow:3px 3px 0 #000;font-family:Arial,sans-serif';
lvLoadDiv.innerHTML = `
    <div>WORLD 1-1</div>
    <div style="width:340px;height:22px;background:rgba(0,0,0,.3);border:3px solid #fff;border-radius:11px;overflow:hidden">
        <div id="lvFill" style="height:100%;width:0%;background:linear-gradient(to right,#ff4e00,#ec9f05);border-radius:8px;transition:width .2s"></div>
    </div>
    <div id="lvMsg" style="font-size:14px;opacity:.8">Building level…</div>`;
document.body.appendChild(lvLoadDiv);
function setLoad(p, m) {
    lvLoadDiv.querySelector('#lvFill').style.width = p + '%';
    if (m) lvLoadDiv.querySelector('#lvMsg').textContent = m;
}

// ═══════════════════════════════════════════════════════
// GOOMBA GLB — preload so enemies can use it
// ═══════════════════════════════════════════════════════
let goombaGLB = null;
new GLTFLoader().load('goomba.glb',
    gltf => {
        goombaGLB = gltf;
        console.log('Goomba GLB loaded ✓');
    },
    undefined,
    () => console.warn('goomba.glb not found — using procedural goomba')
);

// ═══════════════════════════════════════════════════════
// KOOPA TROOPA GLB — preload so enemies can use it
// ═══════════════════════════════════════════════════════
let koopaGLB = null;
new GLTFLoader().load('koopa_troopa.glb',
    gltf => {
        koopaGLB = gltf;
        console.log('Koopa Troopa GLB loaded ✓');
    },
    undefined,
    () => console.warn('koopa_troopa.glb not found — using procedural koopa')
);

// ═══════════════════════════════════════════════════════
// PLANTE PIRANHA GLB — preload so buildPiranha can use it
// ═══════════════════════════════════════════════════════
let piranhaGLB = null;
new GLTFLoader().load('plante_piranha.glb',
    gltf => {
        piranhaGLB = gltf;
        console.log('Plante Piranha GLB loaded ✓');
    },
    undefined,
    () => console.warn('plante_piranha.glb not found — using procedural piranha')
);

// ═══════════════════════════════════════════════════════
// MUSHROOM GLB — preload for mystery block reward
// ═══════════════════════════════════════════════════════
let mushroomGLB = null;
new GLTFLoader().load('mushroom.glb',
    gltf => {
        mushroomGLB = gltf;
        console.log('Mushroom GLB loaded ✓');
    },
    undefined,
    () => console.warn('mushroom.glb not found — using procedural mushroom')
);

// ═══════════════════════════════════════════════════════
// FIRE PLANT GLB — collectible that gives Mario fire power
// ═══════════════════════════════════════════════════════
let firePlantGLB = null;
new GLTFLoader().load('fire_flower.glb',
    gltf => {
        firePlantGLB = gltf;
        console.log('Fire Plant GLB loaded ✓');
    },
    undefined,
    () => console.warn('fire_plant.glb not found — using procedural fire plant')
);

// ═══════════════════════════════════════════════════════
// LAUNCH LEVEL  (overworld → "Here We Go" → level)
// ═══════════════════════════════════════════════════════
function launchLevel() {
    if (MODE !== 'overworld') return;

    // 1. Stop overworld BGM
    stopOverworldBGM();

    // 2. Play "Here We Go" SFX immediately
    hereWeGoSFX.currentTime = 0;
    hereWeGoSFX.play().catch(() => {});

    // 3. Show "WORLD 1-1" transition card
    hereWeGoOverlay.querySelector('#hereWeGoLives').innerHTML = '&#9829; &times; ' + lvLives;
    hereWeGoOverlay.style.display = 'flex';

    // 4. Hide overworld UI while waiting
    enterBtn.style.display = 'none';
    const loc  = document.getElementById('location');
    const hint = document.getElementById('hint');
    if (loc)  loc.style.display  = 'none';
    if (hint) hint.style.display = 'none';

    // 5. After 3 seconds, begin level
    setTimeout(() => {
        hereWeGoOverlay.style.display = 'none';

        // Hide overworld scene
        for (const o of overworldNodes) o.visible = false;
        cloudGroup.visible = false;
        for (const n of levelNodes)     n.visible = false;
        for (const r of overworldRoads) r.visible = false;

        // Level sky + sun
        scene.background = new THREE.Color(0x5c94fc);
        sunLight.position.set(20, 50, 20);
        sunLight.shadow.camera.left   = -120;
        sunLight.shadow.camera.right  =  120;
        sunLight.shadow.camera.top    =  50;
        sunLight.shadow.camera.bottom = -20;
        sunLight.shadow.needsUpdate   = true;

        camera.fov  = 42;
        camera.near = 0.1;
        camera.far  = 500;
        camera.updateProjectionMatrix();

        lvLoadDiv.style.display = 'flex';
        setLoad(5, 'Building level…');

        if (!levelBuilt) buildLevel();
        else             respawn(false);
    }, 3000);
}

// ═══════════════════════════════════════════════════════
// BUILD LEVEL
// ═══════════════════════════════════════════════════════
function buildLevel() {
    setLoad(20, 'Creating platforms…');

    platformMeshes = [];
    platformDataMap = new Map();
    for (const p of PLATFORMS) {
        const depth = 4;
        const geo   = new THREE.BoxGeometry(p.w, p.h, depth);
        const mat   = new THREE.MeshStandardMaterial({ color: p.c, roughness: 0.85 });
        const mesh  = new THREE.Mesh(geo, mat);
        mesh.position.set(p.x, p.y, 0);
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.geometry.computeBoundingBox();
        scene.add(mesh);
        platformMeshes.push(mesh);
        platformDataMap.set(mesh, { ...p, used: false });

        if (p.isPipe) {
            const cap = new THREE.Mesh(
                new THREE.BoxGeometry(p.w + 0.5, 0.4, depth + 0.5),
                new THREE.MeshStandardMaterial({ color: 0x22cc22, roughness: 0.6 })
            );
            cap.position.set(p.x, p.y + p.h/2 + 0.2, 0);
            cap.castShadow = true;
            scene.add(cap);
        }

        if (p.isQ) {
            const face = new THREE.Mesh(
                new THREE.BoxGeometry(p.w + 0.02, p.h + 0.02, depth + 0.02),
                new THREE.MeshStandardMaterial({ color: 0xFFAA00, roughness: 0.6 })
            );
            face.position.set(p.x, p.y, 0);
            scene.add(face);

            // ── "?" decal on the front (+Z) face ──────────────
            const qCanvas = document.createElement('canvas');
            qCanvas.width  = 128;
            qCanvas.height = 128;
            const ctx = qCanvas.getContext('2d');
            ctx.fillStyle = '#FFAA00';
            ctx.fillRect(0, 0, 128, 128);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 88px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 64, 68);
            const qTex = new THREE.CanvasTexture(qCanvas);
            const qDecal = new THREE.Mesh(
                new THREE.PlaneGeometry(p.w * 0.72, p.h * 0.72),
                new THREE.MeshBasicMaterial({ map: qTex, transparent: true, depthWrite: false })
            );
            qDecal.position.set(p.x, p.y, depth / 2 + 0.04);
            scene.add(qDecal);
            // Back face too
            const qDecalBack = qDecal.clone();
            qDecalBack.position.z = -(depth / 2 + 0.04);
            qDecalBack.rotation.y = Math.PI;
            scene.add(qDecalBack);
        }
    }

    setLoad(40, 'Spawning coins…');

    coinObjects = [];
    const cMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.7 });
    for (const [cx, cy] of COIN_DEFS) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 10), cMat);
        m.position.set(cx, cy, 0);
        m.rotation.x = Math.PI / 2;
        m.castShadow = true;
        scene.add(m);
        coinObjects.push({ mesh: m, active: true, baseY: cy });
    }

    setLoad(55, 'Spawning enemies…');

    enemies = [];
    for (const [ex, ey, etype] of ENEMY_DEFS) {
        enemies.push(buildEnemy(ex, ey, etype));
    }

    setLoad(68, 'Adding piranha plants…');

    piranhaPlants = [];
    for (const pd of PIRANHA_DEFS) {
        piranhaPlants.push(buildPiranha(pd.x, pd.topY));
    }

    setLoad(72, 'Building flagpole…');

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 14, 8),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 })
    );
    pole.position.set(217, 7, 0);
    scene.add(pole);
    const flag = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.3, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x22aa22 })
    );
    flag.position.set(216, 13.5, 0);
    scene.add(flag);

    setLoad(85, 'Loading Mario…');

    new GLTFLoader().load('super_mario_bros__level_1_-_1.glb',
        gltf => {
            const m   = gltf.scene;
            const box = new THREE.Box3().setFromObject(m);
            const sz  = new THREE.Vector3();
            box.getSize(sz);
            m.scale.setScalar(220 / sz.x);
            box.setFromObject(m);
            m.position.x -= box.min.x;
            m.position.y -= box.min.y;
            m.position.z  = -0.5;
            m.traverse(c => { if (c.isMesh) { c.receiveShadow = false; c.castShadow = false; } });
            scene.add(m);
            for (const pm of platformMeshes) pm.visible = false;
            levelVisGroup = m;
            console.log('Level GLB loaded as visual backdrop ✓');
        },
        undefined,
        () => { console.log('Level GLB not found — using built geometry (that is fine)'); }
    );

    loadLevelMario(() => {
        levelBuilt = true;
        setLoad(100, 'Ready!');
        setTimeout(() => respawn(false), 300);
    });
}

// ═══════════════════════════════════════════════════════
// BUILD ENEMY — uses goomba.glb for 'goomba' type if loaded
// ═══════════════════════════════════════════════════════
function buildEnemy(ex, ey, etype) {
    const isK   = etype === 'koopa';
    const bodyH = isK ? 1.3 : 1.0;

    // ── Use GLB model for goombas if available ────────────
    if (etype === 'goomba' && goombaGLB) {
        const root = goombaGLB.scene.clone(true);
        // Auto-scale to bodyH
        const b = new THREE.Box3().setFromObject(root);
        const s = new THREE.Vector3(); b.getSize(s);
        const sc = bodyH / (s.y || 1);
        root.scale.setScalar(sc);
        // Re-centre so feet are at y=0 of the group
        const b2 = new THREE.Box3().setFromObject(root);
        root.position.y -= b2.min.y;
        root.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });

        const grp = new THREE.Group();
        grp.add(root);
        grp.position.set(ex, ey, 0);
        scene.add(grp);

        return {
            mesh:   grp,
            type:   etype,
            vel:    etype === 'koopa' ? -2.8 : -1.8,
            alive:  true,
            onGnd:  false,
            shell:  false,
            shellV: 0,
            kicked: false,
            spawnX: ex,
            spawnY: ey,
            bodyH,
        };
    }

    // ── Use GLB model for koopa troopas if available ──────
    if (etype === 'koopa' && koopaGLB) {
        const root = koopaGLB.scene.clone(true);
        const b = new THREE.Box3().setFromObject(root);
        const s = new THREE.Vector3(); b.getSize(s);
        const sc = bodyH / (s.y || 1);
        root.scale.setScalar(sc);
        const b2 = new THREE.Box3().setFromObject(root);
        root.position.y -= b2.min.y;
        root.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });

        const grp = new THREE.Group();
        grp.add(root);
        grp.position.set(ex, ey, 0);
        scene.add(grp);

        return {
            mesh:   grp,
            type:   etype,
            vel:    etype === 'koopa' ? -2.8 : -1.8,
            alive:  true,
            onGnd:  false,
            shell:  false,
            shellV: 0,
            kicked: false,
            spawnX: ex,
            spawnY: ey,
            bodyH,
        };
    }

    // ── Procedural fallback ───────────────────────────────
    const grp = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, bodyH, 0.8),
        new THREE.MeshStandardMaterial({ color: isK ? 0x22bb22 : 0x996633, roughness: 0.8 })
    );
    // Centre body so bottom is at y=0 of group
    body.position.y = bodyH / 2;
    body.castShadow = true;
    grp.add(body);

    const hH = isK ? 0.65 : 0.85;
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, hH, 0.75),
        new THREE.MeshStandardMaterial({ color: isK ? 0x33cc33 : 0x884400, roughness: 0.7 })
    );
    head.position.y = bodyH + hH / 2 - 0.05;
    grp.add(head);

    const eW = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eB = new THREE.MeshStandardMaterial({ color: 0x111111 });
    for (const ex2 of [-0.2, 0.2]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), eW);
        eye.position.set(ex2, bodyH + hH / 2, 0.33);
        grp.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), eB);
        pupil.position.set(ex2 - 0.03, bodyH + hH / 2, 0.41);
        grp.add(pupil);
    }

    if (isK) {
        const shell = new THREE.Mesh(
            new THREE.BoxGeometry(1.05, 0.65, 0.85),
            new THREE.MeshStandardMaterial({ color: 0x117711, roughness: 0.6 })
        );
        shell.position.y = bodyH * 0.45;
        grp.add(shell);
    }

    grp.position.set(ex, ey, 0);
    grp.castShadow = true;
    scene.add(grp);

    return {
        mesh:   grp,
        type:   etype,
        vel:    etype === 'koopa' ? -2.8 : -1.8,
        alive:  true,
        onGnd:  false,
        shell:  false,
        shellV: 0,
        kicked: false,
        spawnX: ex,
        spawnY: ey,
        bodyH,
    };
}

// ═══════════════════════════════════════════════════════
// BUILD PIRANHA PLANT
// ═══════════════════════════════════════════════════════
function buildPiranha(px, topY) {
    // ── Use GLB model if available ────────────────────────
    if (piranhaGLB) {
        const root = piranhaGLB.scene.clone(true);
        const b = new THREE.Box3().setFromObject(root);
        const s = new THREE.Vector3(); b.getSize(s);
        const sc = 1.4 / (s.y || 1);
        root.scale.setScalar(sc);
        const b2 = new THREE.Box3().setFromObject(root);
        root.position.y -= b2.min.y;
        root.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });

        const grp = new THREE.Group();
        grp.add(root);
        grp.position.set(px, topY, 0);
        grp.visible = false;
        grp.userData.baseY = topY;
        grp.userData.timer = Math.random() * 3;
        grp.userData.shotT = 0;
        scene.add(grp);
        return grp;
    }

    // ── Procedural fallback ───────────────────────────────
    const grp = new THREE.Group();
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x228822 })
    );
    stem.position.y = -0.7;
    grp.add(stem);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xdd1111, roughness: 0.5 })
    );
    grp.add(head);

    const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for (const [dx, dy] of [[-0.28, 0.26],[0.28, 0.26],[-0.28,-0.2],[0.28,-0.2]]) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8), dotMat);
        dot.position.set(dx, dy, 0.63);
        grp.add(dot);
    }
    const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x550000 })
    );
    mouth.position.set(0, -0.26, 0.52);
    grp.add(mouth);

    grp.position.set(px, topY, 0);
    grp.visible = false;
    grp.userData.baseY = topY;
    grp.userData.timer = Math.random() * 3;
    grp.userData.shotT = 0;
    scene.add(grp);
    return grp;
}

// ═══════════════════════════════════════════════════════
// BUILD FIRE PLANT PICKUP
// ═══════════════════════════════════════════════════════
function buildFirePlantPickup(px, py) {
    let root;
    if (firePlantGLB) {
        root = firePlantGLB.scene.clone(true);
        const b = new THREE.Box3().setFromObject(root);
        const s = new THREE.Vector3(); b.getSize(s);
        root.scale.setScalar(1.2 / (s.y || 1));
        const b2 = new THREE.Box3().setFromObject(root);
        root.position.y -= b2.min.y;
        root.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
    } else {
        // Procedural fallback: orange flower-like shape
        root = new THREE.Group();
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6),
            new THREE.MeshStandardMaterial({ color: 0x228822 })
        );
        stem.position.y = 0.3;
        root.add(stem);
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: new THREE.Color(0xff2200), emissiveIntensity: 0.4 })
        );
        head.position.y = 0.8;
        root.add(head);
    }
    const grp = new THREE.Group();
    grp.add(root);
    grp.position.set(px, py, 0);
    scene.add(grp);
    return { mesh: grp, active: true, baseY: py };
}
function spawnFireFlowerFromBlock(bx, blockTop) {
    const pickup = buildFirePlantPickup(bx, blockTop + 0.5);
    firePlantPickups.push(pickup);
}

function spawnMushroom(bx, by) {
    let root;
    if (mushroomGLB) {
        root = mushroomGLB.scene.clone(true);
        const b = new THREE.Box3().setFromObject(root);
        const s = new THREE.Vector3(); b.getSize(s);
        const sc = 1.0 / (s.y || 1);
        root.scale.setScalar(sc);
        const b2 = new THREE.Box3().setFromObject(root);
        root.position.y -= b2.min.y;
        root.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
    } else {
        // Procedural fallback
        root = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 10, 8),
            new THREE.MeshStandardMaterial({ color: 0xff2200 })
        );
    }
    const grp = new THREE.Group();
    grp.add(root);
    grp.position.set(bx, by + 0.9, 0);
    scene.add(grp);
    spawnedMushrooms.push({ mesh: grp, active: true, vy: 2.5, vx: 1.2, onGnd: false });
    console.log('Mushroom spawned at', bx, by);
}

function handleBlockHit(hitMesh) {
    const pdata = platformDataMap.get(hitMesh);
    if (!pdata || pdata.used) return;
    if (!pdata.reward) return;   // block has no special reward

    pdata.used = true;

    // Bump animation
    const origY = hitMesh.position.y;
    hitMesh.position.y += 0.25;
    setTimeout(() => { hitMesh.position.y = origY; }, 120);

    if (pdata.reward === 'mushroom') {
        spawnMushroom(pdata.x, pdata.y + pdata.h / 2);
    } else if (pdata.reward === 'fireflower') {
        spawnFireFlowerFromBlock(pdata.x, pdata.y + pdata.h / 2);
    } else if (pdata.reward === 'coin') {
        lvCoins++; lvScore += 200; hudUpdate();
        // Tiny coin pop visual
        const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.28, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8 })
        );
        coin.position.set(pdata.x, pdata.y + pdata.h / 2 + 0.8, 0);
        coin.rotation.x = Math.PI / 2;
        scene.add(coin);
        let vy = 6;
        const tick = (dt) => {
            vy -= 28 * dt; coin.position.y += vy * dt;
            if (coin.position.y < pdata.y + pdata.h / 2) { scene.remove(coin); }
        };
        coinPopCallbacks.push(tick);
    }
}

// Short-lived callback list for coin pop animations
const coinPopCallbacks = [];
let pBaseScale = 1;   // stored after Mario model loads

function loadLevelMario(cb) {
    new GLTFLoader().load('mario_rig.glb',
        gltf => {
            pVis = gltf.scene;
            const mb = new THREE.Box3().setFromObject(pVis);
            pBaseScale = 1.5 / (mb.max.y - mb.min.y);
            pVis.scale.setScalar(pBaseScale);
            pVis.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
            scene.add(pVis);
            if (gltf.animations.length > 0) {
                pMixer = new THREE.AnimationMixer(pVis);
                const clip = gltf.animations[0].clone();
                clip.tracks = clip.tracks.filter(t => !t.name.endsWith('.scale'));
                clip.tracks.forEach(t => {
                    if (t.name.endsWith('.quaternion')) {
                        for (let i = 0; i < t.values.length; i += 4) {
                            const l = Math.sqrt(t.values[i]**2+t.values[i+1]**2+t.values[i+2]**2+t.values[i+3]**2);
                            if (l > 0.001) { t.values[i]/=l; t.values[i+1]/=l; t.values[i+2]/=l; t.values[i+3]/=l; }
                        }
                    }
                });
                pWalk = pMixer.clipAction(clip);
                pWalk.setEffectiveTimeScale(2);
                pWalk.setLoop(THREE.LoopRepeat, Infinity);
            }
            cb();
        },
        undefined,
        () => {
            pVis = new THREE.Mesh(
                new THREE.CylinderGeometry(P_RAD, P_RAD, P_HALF*2, 10),
                new THREE.MeshStandardMaterial({ color: 0xdd1111 })
            );
            scene.add(pVis);
            cb();
        }
    );
}

// ─────────────────────────────────────────────────────
// RESPAWN
// ─────────────────────────────────────────────────────
let lvCamX = 0;

function respawn(fresh) {
    if (fresh) { lvScore=0; lvCoins=0; lvLives=3; lvTimer=400; }
    lvTimerTick = 0;
    pPos.set(2, 3, 0);
    pVel.set(0, 0, 0);
    pGround=false; pDead=false; pInv=0;
    pFace = 1;   // default face east
    pHasFirePower = false;
    pBig = false; pBigTimer = 0; pFireCooldown = 0;
    lvCamX = pPos.x;

    for (const e of enemies) {
        e.alive=true; e.shell=false; e.vel = e.type === 'koopa' ? -2.8 : -1.8; e.shellV=0; e.kicked=false;
        e.mesh.visible=true; e.mesh.scale.set(1,1,1);
        e.mesh.position.set(e.spawnX, e.spawnY, 0);
    }
    for (const c of coinObjects) { c.active=true; c.mesh.visible=true; }
    for (const f of fireballs)   { f.active=false; f.mesh.visible=false; }
    for (const m of spawnedMushrooms) { m.active=false; m.mesh.visible=false; }
    for (const fp of firePlantPickups) { fp.active=true; fp.mesh.visible=true; }
    // Reset block used flags
    for (const [, pdata] of platformDataMap) pdata.used = false;

    if (pVis) { pVis.visible=true; pVis.position.copy(pPos); }
    if (levelVisGroup) levelVisGroup.visible = true;
    for (const pm of platformMeshes) pm.visible = levelVisGroup == null || !levelVisGroup.visible;

    camera.position.set(lvCamX, pPos.y+8, 22);
    camera.lookAt(lvCamX, pPos.y+4, 0);

    buildLevelHUD();
    lvLoadDiv.style.display = 'none';
    hideOverlay();
    lvActive = true;
    MODE = 'level';

    // Start / resume overworld BGM for the level
    playOverworldBGM();
}

// ─────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────
function buildLevelHUD() {
    if (hudEl) { hudEl.style.display='flex'; if(backBtnEl) backBtnEl.style.display=''; if(ctrlHintEl) ctrlHintEl.style.display=''; hudUpdate(); return; }
    hudEl = document.createElement('div');
    hudEl.style.cssText = 'position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:10px 30px;color:#fff;font-size:16px;font-weight:bold;text-shadow:2px 2px 0 #000;z-index:20;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.35),transparent);font-family:Arial,sans-serif';
    hudEl.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:11px;letter-spacing:2px;opacity:.9">MARIO</div><div id="lvScore" style="font-size:20px">000000</div></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:11px;letter-spacing:2px;opacity:.9">COINS</div><div id="lvCoins" style="font-size:20px">×00</div></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:11px;letter-spacing:2px;opacity:.9">WORLD</div><div style="font-size:20px">1-1</div></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:11px;letter-spacing:2px;opacity:.9">TIME</div><div id="lvTime" style="font-size:20px">400</div></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:11px;letter-spacing:2px;opacity:.9">LIVES</div><div id="lvLives" style="font-size:20px">&#9829; 3</div></div>`;
    document.body.appendChild(hudEl);

    backBtnEl = document.createElement('button');
    backBtnEl.textContent = '← MAP';
    backBtnEl.style.cssText = 'position:absolute;bottom:14px;right:14px;background:rgba(0,0,0,.45);color:#fff;border:2px solid rgba(255,255,255,.6);padding:7px 16px;border-radius:20px;font-size:13px;font-weight:bold;cursor:pointer;z-index:30;font-family:Arial,sans-serif';
    backBtnEl.addEventListener('click', returnToMap);
    document.body.appendChild(backBtnEl);

    ctrlHintEl = document.createElement('div');
    ctrlHintEl.style.cssText = 'position:absolute;bottom:14px;left:14px;color:rgba(255,255,255,.9);font-size:12px;text-shadow:1px 1px 3px #000;background:rgba(0,0,0,.3);padding:8px 14px;border-radius:8px;z-index:20;pointer-events:none;line-height:1.8;font-family:Arial,sans-serif';
    ctrlHintEl.innerHTML = '<b>A/&#8592;</b> Left &nbsp;<b>D/&#8594;</b> Right &nbsp;<b>W/Space</b> Jump &nbsp;<b>Shift</b> Run &nbsp;<b>X</b> Fireball<br>&#9660; Stomp: Goomba=100pts &nbsp; Koopa=200pts';
    document.body.appendChild(ctrlHintEl);
    hudUpdate();
}
function hideLevelHUD() {
    if (hudEl)      hudEl.style.display      = 'none';
    if (backBtnEl)  backBtnEl.style.display  = 'none';
    if (ctrlHintEl) ctrlHintEl.style.display = 'none';
}

// ─────────────────────────────────────────────────────
// OVERLAY (death / level clear)
// ─────────────────────────────────────────────────────
function showOverlay(title, label, cb) {
    if (!overlayEl) {
        overlayEl = document.createElement('div');
        overlayEl.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);align-items:center;justify-content:center;z-index:50;flex-direction:column;gap:22px;color:#fff;font-size:38px;font-weight:bold;text-shadow:3px 3px 0 #000;font-family:Arial,sans-serif';
        document.body.appendChild(overlayEl);
    }
    overlayEl.innerHTML = `
        <div>${title}</div>
        <button id="ov1" style="font-size:18px;padding:12px 32px;border-radius:30px;border:3px solid #fff;background:linear-gradient(135deg,#e52222,#900);color:#fff;font-weight:bold;cursor:pointer;font-family:Arial,sans-serif">${label}</button>
        <button id="ov2" style="font-size:14px;padding:9px 24px;border-radius:20px;border:2px solid rgba(255,255,255,.5);background:rgba(0,0,0,.4);color:#fff;cursor:pointer;font-family:Arial,sans-serif">← Back to Map</button>`;
    overlayEl.querySelector('#ov1').onclick = cb;
    overlayEl.querySelector('#ov2').onclick = returnToMap;
    overlayEl.style.display = 'flex';
}
function hideOverlay() { if (overlayEl) overlayEl.style.display = 'none'; }

// ─────────────────────────────────────────────────────
// DEATH
// ─────────────────────────────────────────────────────
function die() {
    if (!lvActive || pInv > 0 || pDead) return;
    pDead = true; lvActive = false; lvLives--;
    stopOverworldBGM();
    playDeathSFX();
    if (pVis) pVis.visible = false;
    hudUpdate();
    setTimeout(() => {
        if (lvLives <= 0) showOverlay('GAME OVER ☠', 'RESTART', () => respawn(true));
        else              showOverlay(`YOU DIED &nbsp;♥ ${lvLives}`, 'TRY AGAIN', () => respawn(false));
    }, 600);
}

// ─────────────────────────────────────────────────────
// RETURN TO MAP
// ─────────────────────────────────────────────────────
function returnToMap() {
    if (MODE !== 'level') return;
    lvActive = false; pDead = false;
    stopOverworldBGM();
    hideLevelHUD(); hideOverlay();
    if (pVis)          pVis.visible          = false;
    if (levelVisGroup) levelVisGroup.visible  = false;
    for (const pm of platformMeshes) pm.visible = false;
    for (const e  of enemies)        e.mesh.visible = false;
    for (const c  of coinObjects)    c.mesh.visible = false;
    for (const p  of piranhaPlants)  p.visible = false;
    for (const f  of fireballs)      { f.active=false; f.mesh.visible=false; }

    for (const o of overworldNodes) o.visible = true;
    cloudGroup.visible = true;
    for (const n of levelNodes)     n.visible = true;
    for (const r of overworldRoads) r.visible = true;
    enterBtn.style.display = 'flex';
    const loc  = document.getElementById('location');
    const hint = document.getElementById('hint');
    if (loc)  loc.style.display  = '';
    if (hint) hint.style.display = '';

    camera.fov  = 25;
    camera.near = 0.1;
    camera.far  = 600;
    camera.updateProjectionMatrix();
    scene.background = new THREE.Color(0x87CEEB);
    sunLight.position.set(40, 60, 30);
    sunLight.shadow.camera.left   = -80;
    sunLight.shadow.camera.right  =  80;
    sunLight.shadow.camera.top    =  60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.needsUpdate   = true;
    camera.position.set(-35, 18, 8.0);
    camera.lookAt(-18, 4.0, -22.0);
    MODE = 'overworld';

    // Resume overworld BGM when returning to map
    playOverworldBGM();
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — MARIO PHYSICS
// ═══════════════════════════════════════════════════════
function updateMario(dt) {
    if (pDead) return;
    pInv = Math.max(0, pInv - dt);
    pFireCooldown = Math.max(0, pFireCooldown - dt);

    // Big timer countdown
    if (pBig) {
        pBigTimer -= dt;
        if (pBigTimer <= 0) { pBig = false; pBigTimer = 0; }
    }

    const spd = isRun() ? P_RUN : P_WALK;
    pVel.x = 0;
    if (isLeft())  { pVel.x = -spd; pFace = -1; }   // face west
    if (isRight()) { pVel.x =  spd; pFace =  1; }   // face east

    const jd = isJump();
    if (jd && pGround) { pVel.y=JMP_V; pGround=false; pJumpHeld=true; pJumpT=0; playJumpSFX(); }   
    if (pJumpHeld && jd && !pGround) {
        pJumpT += dt;
        if (pJumpT < JMP_MAX) pVel.y += JMP_BOOST * dt;
        else pJumpHeld = false;
    }
    if (!jd) pJumpHeld = false;
    if (!pGround) pVel.y += GRAV * dt;

    const np = pPos.clone();
    np.x += pVel.x * dt;
    np.y += pVel.y * dt;

    if (pVel.x !== 0) {
        const w = wallProbe(np, new THREE.Vector3(Math.sign(pVel.x), 0, 0));
        if (w) { np.x = pPos.x; pVel.x = 0; }
    }
    pGround = false;
    if (pVel.y <= 0) {
        const g = groundProbe(np);
        if (g) { np.y = g.point.y; pVel.y = 0; pGround = true; }
    }
    if (pVel.y > 0) {
        const c = ceilProbe(np);
        if (c) { pVel.y = 0; pJumpHeld = false; handleBlockHit(c.object); }
    }
    pPos.copy(np);
    if (pPos.x < 0) { pPos.x = 0; pVel.x = 0; }
    if (pPos.y < -6) die();
    if (pPos.x >= 217) {
        lvActive = false;
        stopOverworldBGM();
        lvScore += lvTimer * 50;
        hudUpdate();
        showOverlay('🏆 LEVEL CLEAR!', 'PLAY AGAIN', () => respawn(false));
    }
}

function updateLvCamera(dt) {
    lvCamX += (pPos.x + pFace * 4 - lvCamX) * Math.min(dt * 9, 1);
    lvCamX  = Math.max(lvCamX, 10);
    camera.position.x += (lvCamX - camera.position.x) * Math.min(dt*11, 1);
    camera.position.y += ((pPos.y + 8) - camera.position.y) * Math.min(dt*7, 1);
    camera.position.z  = 22;
    camera.lookAt(camera.position.x + pFace * 2, pPos.y + 4, 0);
}

function updatePVis(dt) {
    if (!pVis) return;
    if (pMixer) pMixer.update(dt);
    pVis.visible = (pInv <= 0) || (Math.floor(pInv / 0.1) % 2 === 0);
    pVis.position.copy(pPos);

    // Scale Mario: base size normally, 1.6x when mushroom big
    const bigScale = pBig ? 1.6 : 1.0;
    pVis.scale.setScalar(pBaseScale * bigScale);

    // ── Mario facing: east (+X) = +PI/2, west (-X) = -PI/2 ──
    pVis.rotation.y = pFace > 0 ? Math.PI / 2 : -Math.PI / 2;

    // Tint orange when fire-powered
    if (pHasFirePower) {
        pVis.traverse(c => { if (c.isMesh && c.material && !c._fireTinted) {
            c.material = c.material.clone();
            c.material.emissive = new THREE.Color(0xff4400);
            c.material.emissiveIntensity = 0.25;
            c._fireTinted = true;
        }});
    }

    const moving = Math.abs(pVel.x) > 0.5;
    if (pWalk) {
        if (moving && pGround && !pWalk.isRunning()) { pWalk.reset(); pWalk.play(); }
        if ((!moving || !pGround) && pWalk.isRunning()) pWalk.stop();
    }
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — ENEMIES
// ═══════════════════════════════════════════════════════
function updateEnemies(dt) {
    for (const e of enemies) {
        if (!e.alive) continue;
        const ePos = e.mesh.position;
        if (Math.abs(ePos.x - pPos.x) > 90) continue;

        if (e.shell) {
            ePos.x += e.shellV * dt;
            for (const other of enemies) {
                if (other === e || !other.alive) continue;
                if (Math.abs(other.mesh.position.x - ePos.x) < 1.1 && Math.abs(other.mesh.position.y - ePos.y) < 1.5) {
                    killEnemy(other); lvScore += 100; hudUpdate();
                }
            }
        } else {
            const baseSpd = e.type === 'koopa' ? 2.8 : 1.8;
            const sameLvl = Math.abs(ePos.y - pPos.y) < 1.8;
            if (sameLvl && Math.abs(pPos.x - ePos.x) < 28)
                e.vel = Math.sign(pPos.x - ePos.x) * baseSpd;
            ePos.x += e.vel * dt;
        }

        ePos.y += GRAV * 0.55 * dt;
        const eg = simpleGround(ePos);
        if (eg !== null) { ePos.y = eg; e.onGnd = true; }
        else             { e.onGnd = false; }

        if (!e.shell) {
            const wd = new THREE.Vector3(Math.sign(e.vel), 0, 0);
            RC.set(new THREE.Vector3(ePos.x, ePos.y + 0.5, 0), wd);
            RC.far = 1.0;
            if (RC.intersectObjects(platformMeshes, false).length > 0) e.vel *= -1;
        }
        e.mesh.rotation.y = e.vel > 0 ? Math.PI / 2 : -Math.PI / 2;

        if (pInv > 0 || pDead) continue;
        const dx = pPos.x - ePos.x;
        const dy = pPos.y - ePos.y;
        if (Math.abs(dx) < 1.2 && Math.abs(dy) < 2.0) {
            const mFeet = pPos.y - P_HALF;
            const eTop  = ePos.y + e.bodyH / 2;
            if (mFeet >= eTop - 0.9 && pVel.y <= 0) {
                // Stomp: kill enemy
                killEnemy(e);
                const pts = e.type === 'koopa' ? 200 : 100;
                lvScore += pts; hudUpdate();
                pVel.y = 8;
            } else {
                die();
            }
        }
    }
}

function killEnemy(e) {
    e.alive = false;
    e.mesh.scale.y = 0.1;
    setTimeout(() => { e.mesh.visible = false; }, 280);
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — COINS
// ═══════════════════════════════════════════════════════
function updateCoins(time) {
    for (const c of coinObjects) {
        if (!c.active) continue;
        c.mesh.rotation.z = time * 3;
        c.mesh.position.y = c.baseY + Math.sin(time * 3 + c.baseY) * 0.08;
        const dx = pPos.x - c.mesh.position.x;
        const dy = pPos.y - c.mesh.position.y;
        if (Math.sqrt(dx*dx + dy*dy) < 0.85) {
            c.active = false; c.mesh.visible = false;
            lvCoins++; lvScore += 200;
            if (lvCoins % 100 === 0) lvLives++;
            hudUpdate();
        }
    }
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — PIRANHA PLANTS + FIREBALLS
// ═══════════════════════════════════════════════════════
function updatePiranhas(dt, time) {
    for (const pl of piranhaPlants) {
        pl.userData.shotT += dt;
        // Plant is always fully extended and visible — no bob cycle
        pl.position.y = pl.userData.baseY;
        pl.visible     = true;
        pl.rotation.z  = 0;

        // ── FIREBALL: shoot when Mario is within ~7.5 units ──
        if (pl.userData.shotT > 2.0) {
            const d = Math.abs(pPos.x - pl.position.x);
            if (d < 7.5) {
                const dir = pPos.x > pl.position.x ? 1 : -1;
                pl.rotation.y = dir > 0 ? 0 : Math.PI;
                spawnFireball(pl.position.x, pl.position.y + 0.8, dir);
                pl.userData.shotT = 0;
            }
        }
    }
}

function spawnFireball(x, y, dir) {
    let fb = fireballs.find(f => !f.active);
    if (!fb) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: new THREE.Color(0xff3300), emissiveIntensity: 0.8 })
        );
        mesh.castShadow = true;
        scene.add(mesh);
        fb = { mesh, active: false, vx: 0, vy: 0 };
        fireballs.push(fb);
    }
    fb.active = true;
    fb.mesh.visible = true;
    fb.mesh.position.set(x, y, 0);
    fb.vx = dir * 9;
    fb.vy = 3;
}

function updateFireballs(dt) {
    for (const fb of fireballs) {
        if (!fb.active) continue;
        fb.vy += GRAV * dt * 0.45;
        fb.mesh.position.x += fb.vx * dt;
        fb.mesh.position.y += fb.vy * dt;
        fb.mesh.rotation.z += dt * 8;
        const g = simpleGround(fb.mesh.position);
        if (g !== null && fb.mesh.position.y < g + 0.28) {
            fb.vy = Math.abs(fb.vy) * 0.65;
            fb.mesh.position.y = g + 0.28;
        }
        if (Math.abs(fb.mesh.position.x - pPos.x) > 65 || fb.mesh.position.y < -6) {
            fb.active = false; fb.mesh.visible = false; continue;
        }
        if (!pDead && pInv <= 0) {
            const dx = pPos.x - fb.mesh.position.x;
            const dy = pPos.y - fb.mesh.position.y;
            if (Math.sqrt(dx*dx + dy*dy) < 0.75) {
                fb.active = false; fb.mesh.visible = false;
                die();
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — MUSHROOMS
// ═══════════════════════════════════════════════════════
function updateMushrooms(dt) {
    for (const m of spawnedMushrooms) {
        if (!m.active) continue;
        m.vy += GRAV * dt;
        m.mesh.position.x += m.vx * dt;
        m.mesh.position.y += m.vy * dt;

        const g = simpleGround(m.mesh.position);
        if (g !== null && m.mesh.position.y <= g + 0.01) {
            m.mesh.position.y = g;
            m.vy = 0;
            m.onGnd = true;
        }

        // Wall bounce
        const wd = new THREE.Vector3(Math.sign(m.vx), 0, 0);
        RC.set(new THREE.Vector3(m.mesh.position.x, m.mesh.position.y + 0.5, 0), wd);
        RC.far = 0.8;
        if (RC.intersectObjects(platformMeshes, false).length > 0) m.vx *= -1;

        // Collect
        const dx = pPos.x - m.mesh.position.x;
        const dy = pPos.y - m.mesh.position.y;
        if (Math.sqrt(dx*dx + dy*dy) < 1.0) {
            m.active = false;
            m.mesh.visible = false;
            // Big Mario: grow + full immunity for 10 seconds
            pBig      = true;
            pBigTimer = 10;
            pInv      = 10;
            lvScore  += 1000; hudUpdate();
            console.log('Mushroom collected! Mario is now BIG for 10s');
        }
    }
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — FIRE PLANT PICKUPS
// ═══════════════════════════════════════════════════════
function updateFirePlantPickups(dt, time) {
    for (const fp of firePlantPickups) {
        if (!fp.active) continue;
        // Gentle bob
        fp.mesh.position.y = fp.baseY + Math.sin(time * 2.5 + fp.baseY) * 0.12;
        fp.mesh.rotation.y = time * 1.5;

        const dx = pPos.x - fp.mesh.position.x;
        const dy = pPos.y - fp.mesh.position.y;
        if (Math.sqrt(dx*dx + dy*dy) < 1.1) {
            fp.active = false;
            fp.mesh.visible = false;
            pHasFirePower = true;
            lvScore += 500; hudUpdate();
            console.log('Fire power acquired!');
        }
    }
}

// ═══════════════════════════════════════════════════════
// PLAYER FIREBALL — spawned by Mario with Z key
// ═══════════════════════════════════════════════════════
function spawnPlayerFireball() {
    if (!pHasFirePower || pFireCooldown > 0) return;
    pFireCooldown = 0.4;

    let fb = playerFireballs.find(f => !f.active);
    if (!fb) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.20, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0xffee00, emissive: new THREE.Color(0xff8800), emissiveIntensity: 1.0 })
        );
        mesh.castShadow = true;
        scene.add(mesh);
        fb = { mesh, active: false, vx: 0, vy: 0 };
        playerFireballs.push(fb);
    }
    fb.active = true;
    fb.mesh.visible = true;
    fb.mesh.position.set(pPos.x + pFace * 0.6, pPos.y + 0.4, 0);
    fb.vx = pFace * 14;
    fb.vy = 3;
}

function updatePlayerFireballs(dt) {
    for (const fb of playerFireballs) {
        if (!fb.active) continue;
        fb.vy += GRAV * dt * 0.45;
        fb.mesh.position.x += fb.vx * dt;
        fb.mesh.position.y += fb.vy * dt;
        fb.mesh.rotation.z += dt * 10;
        const g = simpleGround(fb.mesh.position);
        if (g !== null && fb.mesh.position.y < g + 0.25) {
            fb.vy = Math.abs(fb.vy) * 0.6;
            fb.mesh.position.y = g + 0.25;
        }
        if (Math.abs(fb.mesh.position.x - pPos.x) > 40 || fb.mesh.position.y < -6) {
            fb.active = false; fb.mesh.visible = false; continue;
        }
        // Hit enemies
        for (const e of enemies) {
            if (!e.alive) continue;
            const dx = e.mesh.position.x - fb.mesh.position.x;
            const dy = e.mesh.position.y - fb.mesh.position.y;
            if (Math.sqrt(dx*dx + dy*dy) < 1.1) {
                fb.active = false; fb.mesh.visible = false;
                killEnemy(e);
                lvScore += e.type === 'koopa' ? 200 : 100; hudUpdate();
                break;
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════
const clock = new THREE.Clock();
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;

    if (MODE === 'title') {
        // Slowly spin the logo for visual appeal
        if (titleLogoGroup) titleLogoGroup.rotation.y = time * 0.4;
        if (titleLogoMixer) titleLogoMixer.update(dt);
        // Camera gently bobs
        camera.position.set(0, 2 + Math.sin(time * 0.5) * 0.15, 20);
        camera.lookAt(0, 2, 0);

    } else if (MODE === 'overworld') {
        for (const m of mapMeshes) {
            if (m.material.uniforms) m.material.uniforms.uTime.value = time;
        }
        if (owMixer) owMixer.update(dt);

        if (targetNode !== -1) {
            const from = nodeData[currentNode], to = nodeData[targetNode];
            const dx = to.x - from.x, dz = to.z - from.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            moveProgress += (WALK_SPEED / dist) * dt;
            if (moveProgress >= 1) { moveProgress = 1; currentNode = targetNode; targetNode = -1; }
            marioMesh.position.x = from.x + dx * moveProgress;
            marioMesh.position.z = from.z + dz * moveProgress;
            marioMesh.position.y = MARIO_ON_Y;
            owFacing = Math.atan2(dx, dz);
            owUpdateVisual(true);
        } else {
            marioMesh.position.set(nodeData[currentNode].x, MARIO_ON_Y, nodeData[currentNode].z);
            owFacing = 0;
            owUpdateVisual(false);
        }

        for (let i = 0; i < levelNodes.length; i++) {
            levelNodes[i].children[1].rotation.y = time * 0.5 + i;
        }

        for (const c of cloudGroup.children) {
            c.position.x += c.userData.speed * dt;
            if (c.position.x > c.userData.startX + c.userData.rangeX)
                c.position.x = c.userData.startX - c.userData.rangeX;
        }

        const mp = marioMesh.position;
        const CD = isZoomedOut ? 60 : 14, CH = isZoomedOut ? 70 : 15;
        const tCX = mp.x - Math.sin(cameraAngle) * CD;
        const tCY = mp.y + CH;
        const tCZ = mp.z + Math.cos(cameraAngle) * CD;
        camera.position.x += (tCX - camera.position.x) * 0.10;
        camera.position.y += (tCY - camera.position.y) * 0.10;
        camera.position.z += (tCZ - camera.position.z) * 0.10;
        camera.lookAt(mp.x + Math.sin(cameraAngle)*1.5, mp.y-1.5, mp.z - Math.cos(cameraAngle)*3);

    } else {   // LEVEL
        if (lvActive) {
            lvTimerTick += dt;
            if (lvTimerTick >= 0.4) { lvTimerTick = 0; lvTimer = Math.max(0, lvTimer-1); hudUpdate(); }
            if (lvTimer <= 0) die();

            updateMario(dt);
            updateLvCamera(dt);
            updatePVis(dt);
            updateEnemies(dt);
            updateCoins(time);
            updatePiranhas(dt, time);
            updateFireballs(dt);
            updatePlayerFireballs(dt);
            updateMushrooms(dt);
            updateFirePlantPickups(dt, time);
            // coin-pop tick callbacks
            for (let i = coinPopCallbacks.length - 1; i >= 0; i--) {
                coinPopCallbacks[i](dt);
                // callbacks remove themselves via scene.remove when done (no explicit removal needed)
            }
        }
    }

    renderer.render(scene, camera);
}

animate();