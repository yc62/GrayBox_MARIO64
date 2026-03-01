/* Graybox Mario 64 — Overworld + World 1-1 Platformer
   Press ENTER on a node to launch World 1-1 in the same renderer.
   Created by: John Cho | February 2026
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
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(18, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(-23.5, 28, 7.0);
camera.lookAt(-23.5, 5.0, -11.0);

let MODE = 'overworld';

// ═══════════════════════════════════════════════════════
// LIGHTING  (match original exactly)
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

// ═══════════════════════════════════════════════════════
// OVERWORLD — CLOUDS
// ═══════════════════════════════════════════════════════
const cloudGroup = new THREE.Group();
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
];
const CONNECTIONS = [[0,1],[0,2]];
const nodeAdj = nodeData.map(() => []);
for (const [a, b] of CONNECTIONS) { nodeAdj[a].push(b); nodeAdj[b].push(a); }

const NODE_BASE_Y = T1 + 0.40;
const RED_TOP_Y   = NODE_BASE_Y + 0.13 + 0.12;
const levelNodes  = [];

for (const { x, z } of nodeData) {
    const grp = new THREE.Group();
    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.44, 0.10, 14),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.4 })
    );
    rim.castShadow = rim.receiveShadow = true;
    grp.add(rim);

    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.12, 14),
        new THREE.MeshStandardMaterial({ color: 0xCC1111, roughness: 0.35 })
    );
    top.position.y = 0.13;
    top.castShadow = top.receiveShadow = true;
    grp.add(top);

    grp.position.set(x, NODE_BASE_Y, z);
    scene.add(grp);
    levelNodes.push(grp);
}

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
    scene.add(road);
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
overworldNodes.push(marioMesh);

const OW_MARIO_SCALE = 0.75 / 3.291;
let owMarioVisual = null;
let owFacing      = 0;
let owMixer       = null;
let owWalkAction  = null;

new GLTFLoader().load('mario_rig.glb', function(gltf) {
    owMarioVisual = gltf.scene;
    owMarioVisual.scale.setScalar(OW_MARIO_SCALE);
    owMarioVisual.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
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
document.head.insertAdjacentHTML('beforeend', `<style>
    @keyframes enterPulse {
        0%,100% { transform:scale(1); }
        50%     { transform:scale(1.07); box-shadow:0 6px 28px rgba(229,34,34,.7); }
    }
    #enterBtn:hover { filter:brightness(1.2); }
</style>`);

const enterBtn = document.createElement('div');
enterBtn.id = 'enterBtn';
enterBtn.innerHTML = '&#9654;&nbsp;ENTER LEVEL&nbsp;<span style="font-size:11px;opacity:.75;font-weight:400">[ ENTER ]</span>';
enterBtn.style.cssText = [
    'position:absolute','bottom:22px','right:22px',
    'background:linear-gradient(135deg,#e52222,#a00)',
    'color:#fff','font-family:Arial,sans-serif','font-weight:900',
    'font-size:15px','padding:12px 24px','border-radius:40px',
    'border:3px solid #fff','box-shadow:0 4px 18px rgba(0,0,0,.5)',
    'cursor:pointer','z-index:20','display:flex','align-items:center','gap:10px',
    'letter-spacing:1px','user-select:none',
    'animation:enterPulse 1.4s ease-in-out infinite',
    'text-shadow:1px 1px 3px rgba(0,0,0,.5)',
].join(';');
enterBtn.addEventListener('click', () => launchLevel());
document.body.appendChild(enterBtn);

// ═══════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
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
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

const isLeft  = () => keys['ArrowLeft']  || keys['KeyA'];
const isRight = () => keys['ArrowRight'] || keys['KeyD'];
const isJump  = () => keys['ArrowUp']    || keys['KeyW'] || keys['Space'];
const isRun   = () => keys['ShiftLeft']  || keys['ShiftRight'];

// ═══════════════════════════════════════════════════════
// ══════════ WORLD 1-1  LEVEL ═══════════════════════════
// ═══════════════════════════════════════════════════════

// ── Platform definitions (x=centre, y=centre, w, h) ──
// Ground y=-0.5 (top surface at y=0)
const PLATFORMS = [
    // Ground left
    { x:33,   y:-0.5, w:66,  h:1,   c:0xc84c0c },
    // Ground right (after gap)
    { x:120,  y:-0.5, w:100, h:1,   c:0xc84c0c },

    // Pipes (standing on ground, y = h/2)
    { x:22,   y:0.75, w:2.8, h:2.5, c:0x1a9a1a, isPipe:true },
    { x:38,   y:1.25, w:2.8, h:3.5, c:0x1a9a1a, isPipe:true },
    { x:62,   y:2.5,  w:2.8, h:6.0, c:0x1a9a1a, isPipe:true },
    { x:87,   y:1.25, w:2.8, h:3.5, c:0x1a9a1a, isPipe:true },
    { x:136,  y:3.0,  w:2.8, h:7.0, c:0x1a9a1a, isPipe:true },

    // Floating bricks / ?-blocks — early area
    { x:15,   y:7.5,  w:2,   h:2,   c:0xd4a000, isQ:true  },
    { x:24,   y:5.0,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:27,   y:5.0,  w:2,   h:2,   c:0xd4a000, isQ:true  },
    { x:30,   y:5.0,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:28,   y:9.0,  w:2,   h:2,   c:0xd4a000, isQ:true  },

    // Mid floaters
    { x:64,   y:6.0,  w:2.5, h:2,   c:0xd4a000, isQ:true  },
    { x:68,   y:6.0,  w:2.5, h:2,   c:0xc84c0c, isBrick:true },
    { x:72,   y:6.0,  w:2.5, h:2,   c:0xd4a000, isQ:true  },
    { x:76,   y:6.0,  w:2.5, h:2,   c:0xc84c0c, isBrick:true },
    { x:80,   y:6.0,  w:2.5, h:2,   c:0xd4a000, isQ:true  },
    { x:72,   y:10.0, w:2.5, h:2,   c:0xd4a000, isQ:true  },

    // Right-area floaters
    { x:93,   y:7.0,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:97,   y:7.0,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:101,  y:7.0,  w:2,   h:2,   c:0xd4a000, isQ:true  },
    { x:105,  y:7.0,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:109,  y:7.0,  w:2,   h:2,   c:0xd4a000, isQ:true  },
    { x:97,   y:11.0, w:2,   h:2,   c:0xd4a000, isQ:true  },

    // Far-right floaters
    { x:145,  y:6.0,  w:2,   h:2,   c:0xd4a000, isQ:true  },
    { x:149,  y:6.0,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:153,  y:6.0,  w:2,   h:2,   c:0xd4a000, isQ:true  },
    { x:165,  y:4.5,  w:2,   h:2,   c:0xc84c0c, isBrick:true },
    { x:169,  y:4.5,  w:2,   h:2,   c:0xd4a000, isQ:true  },

    // Ascending staircase (x=centre, y=centre of step stack)
    { x:181,  y:0.0,  w:3,   h:1,   c:0xc84c0c },
    { x:184,  y:0.5,  w:3,   h:2,   c:0xc84c0c },
    { x:187,  y:1.0,  w:3,   h:3,   c:0xc84c0c },
    { x:190,  y:1.5,  w:3,   h:4,   c:0xc84c0c },
    { x:193,  y:2.0,  w:3,   h:5,   c:0xc84c0c },
    { x:196,  y:2.5,  w:3,   h:6,   c:0xc84c0c },
    { x:199,  y:3.0,  w:3,   h:7,   c:0xc84c0c },
    { x:202,  y:3.5,  w:3,   h:8,   c:0xc84c0c },

    // Gap then descending staircase
    { x:209,  y:3.0,  w:3,   h:7,   c:0xc84c0c },
    { x:212,  y:2.5,  w:3,   h:6,   c:0xc84c0c },
    { x:215,  y:2.0,  w:3,   h:5,   c:0xc84c0c },

    // Castle
    { x:220,  y:2.0,  w:7,   h:4,   c:0x884422 },
    { x:218,  y:5.5,  w:3,   h:3,   c:0x884422 },
    { x:222,  y:5.5,  w:3,   h:3,   c:0x884422 },
];

// Coin spawn positions [x, y]
const COIN_DEFS = [
    [15,9.5],[24,6.5],[27,6.5],[30,6.5],
    [64,7.5],[68,7.5],[72,7.5],[76,7.5],[80,7.5],[72,11.5],
    [93,8.5],[97,8.5],[101,8.5],[105,8.5],[97,12.5],
    [145,7.5],[149,7.5],[153,7.5],[165,6.0],[169,6.0],
    [10,1.5],[18,1.5],[50,1.5],[58,1.5],[85,1.5],[120,1.5],[128,1.5],[160,1.5],
];

// Enemy spawn [x, groundY, type]
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
    [71,  7.5, 'goomba'],
    [100, 8.5, 'goomba'],
];

// Piranha plant pipe top positions
const PIRANHA_DEFS = [
    { x:62,  topY:5.5  },
    { x:136, topY:6.5  },
];

// ── Level runtime state ───────────────────────────────
let platformMeshes  = [];
let coinObjects     = [];
let enemies         = [];
let fireballs       = [];
let piranhaPlants   = [];
let levelBuilt      = false;
let levelVisGroup   = null;   // optional GLB visual backdrop

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
const GRAV=-30, P_WALK=7, P_RUN=13, JMP_V=12, JMP_BOOST=7, JMP_MAX=0.30;
const P_HALF=0.75, P_RAD=0.28;

let pPos=new THREE.Vector3(), pVel=new THREE.Vector3();
let pGround=false, pJumpHeld=false, pJumpT=0, pFace=1;
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
// LAUNCH LEVEL
// ═══════════════════════════════════════════════════════
function launchLevel() {
    if (MODE !== 'overworld') return;

    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;z-index:200;transition:opacity .2s ease-in;pointer-events:none';
    document.body.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = '1'; });

    setTimeout(() => {
        flash.remove();

        // Hide overworld UI
        enterBtn.style.display = 'none';
        const loc  = document.getElementById('location');
        const hint = document.getElementById('hint');
        if (loc)  loc.style.display  = 'none';
        if (hint) hint.style.display = 'none';

        // Hide overworld scene objects
        for (const o of overworldNodes) o.visible = false;
        cloudGroup.visible = false;
        for (const n of levelNodes) n.visible = false;

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
        else             respawn(true);
    }, 220);
}

// ═══════════════════════════════════════════════════════
// BUILD LEVEL
// ═══════════════════════════════════════════════════════
function buildLevel() {
    setLoad(20, 'Creating platforms…');

    // ── Solid platforms (visible + collidable) ─────────
    platformMeshes = [];
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

        // Pipe cap
        if (p.isPipe) {
            const cap = new THREE.Mesh(
                new THREE.BoxGeometry(p.w + 0.5, 0.4, depth + 0.5),
                new THREE.MeshStandardMaterial({ color: 0x22cc22, roughness: 0.6 })
            );
            cap.position.set(p.x, p.y + p.h/2 + 0.2, 0);
            cap.castShadow = true;
            scene.add(cap);
        }

        // ? block pattern (yellow question mark texture effect)
        if (p.isQ) {
            const face = new THREE.Mesh(
                new THREE.BoxGeometry(p.w + 0.02, p.h + 0.02, depth + 0.02),
                new THREE.MeshStandardMaterial({ color: 0xFFAA00, roughness: 0.6, wireframe: false })
            );
            face.position.set(p.x, p.y, 0);
            scene.add(face);
        }
    }

    setLoad(40, 'Spawning coins…');

    // ── Coins ──────────────────────────────────────────
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

    // ── Enemies ────────────────────────────────────────
    enemies = [];
    for (const [ex, ey, etype] of ENEMY_DEFS) {
        enemies.push(buildEnemy(ex, ey, etype));
    }

    setLoad(68, 'Adding piranha plants…');

    // ── Piranha plants ────────────────────────────────
    piranhaPlants = [];
    for (const pd of PIRANHA_DEFS) {
        piranhaPlants.push(buildPiranha(pd.x, pd.topY));
    }

    setLoad(78, 'Building flagpole…');

    // ── Flagpole ───────────────────────────────────────
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

    // Try load GLB as visual backdrop (non-blocking, best-effort)
    new GLTFLoader().load('super_mario_bros__level_1_-_1.glb',
        gltf => {
            const m   = gltf.scene;
            const box = new THREE.Box3().setFromObject(m);
            const sz  = new THREE.Vector3();
            box.getSize(sz);
            m.scale.setScalar(220 / sz.x);
            box.setFromObject(m);
            const cn = new THREE.Vector3();
            box.getCenter(cn);
            m.position.x -= box.min.x;
            m.position.y -= box.min.y;
            m.position.z  = -0.5;   // behind collision meshes
            m.traverse(c => { if (c.isMesh) { c.receiveShadow = false; c.castShadow = false; } });
            scene.add(m);
            // Hide our block geometry so GLB shows
            for (const pm of platformMeshes) pm.visible = false;
            levelVisGroup = m;
            console.log('Level GLB loaded as visual backdrop ✓');
        },
        undefined,
        () => { console.log('Level GLB not found — using built geometry (that is fine)'); }
    );

    // Load level Mario
    loadLevelMario(() => {
        levelBuilt = true;
        setLoad(100, 'Ready!');
        setTimeout(() => respawn(true), 300);
    });
}

// ═══════════════════════════════════════════════════════
// BUILD ENEMY
// ═══════════════════════════════════════════════════════
function buildEnemy(ex, ey, etype) {
    const isK  = etype === 'koopa';
    const bodyH = isK ? 1.3 : 1.0;
    const grp  = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, bodyH, 0.8),
        new THREE.MeshStandardMaterial({ color: isK ? 0x22bb22 : 0x996633, roughness: 0.8 })
    );
    body.castShadow = true;
    grp.add(body);

    // Head
    const hH = isK ? 0.65 : 0.85;
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, hH, 0.75),
        new THREE.MeshStandardMaterial({ color: isK ? 0x33cc33 : 0x884400, roughness: 0.7 })
    );
    head.position.y = bodyH/2 + hH/2 - 0.05;
    grp.add(head);

    // Eyes
    const eW = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eB = new THREE.MeshStandardMaterial({ color: 0x111111 });
    for (const ex2 of [-0.2, 0.2]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), eW);
        eye.position.set(ex2, bodyH/2 + hH/2 + 0.02, 0.33);
        grp.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), eB);
        pupil.position.set(ex2 - 0.03, bodyH/2 + hH/2 + 0.02, 0.41);
        grp.add(pupil);
    }

    // Koopa shell
    if (isK) {
        const shell = new THREE.Mesh(
            new THREE.BoxGeometry(1.05, 0.65, 0.85),
            new THREE.MeshStandardMaterial({ color: 0x117711, roughness: 0.6 })
        );
        shell.position.y = bodyH * 0.2;
        grp.add(shell);
    }

    grp.position.set(ex, ey, 0);
    grp.castShadow = true;
    scene.add(grp);

    return {
        mesh:   grp,
        type:   etype,
        vel:    -1.8,
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
    const grp = new THREE.Group();
    // Stem
    const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x228822 })
    );
    stem.position.y = -0.7;
    grp.add(stem);

    // Red head (lollipop)
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xdd1111, roughness: 0.5 })
    );
    grp.add(head);

    // White dots
    const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for (const [dx, dy] of [[-0.28, 0.26],[0.28, 0.26],[-0.28,-0.2],[0.28,-0.2]]) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8), dotMat);
        dot.position.set(dx, dy, 0.63);
        grp.add(dot);
    }
    // Mouth
    const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x550000 })
    );
    mouth.position.set(0, -0.26, 0.52);
    grp.add(mouth);

    grp.position.set(px, topY, 0);
    grp.visible = false;
    grp.userData.baseY   = topY;
    grp.userData.timer   = Math.random() * 3;
    grp.userData.shotT   = 0;
    scene.add(grp);
    return grp;
}

// ═══════════════════════════════════════════════════════
// LOAD LEVEL MARIO
// ═══════════════════════════════════════════════════════
function loadLevelMario(cb) {
    new GLTFLoader().load('mario_rig.glb',
        gltf => {
            pVis = gltf.scene;
            const mb = new THREE.Box3().setFromObject(pVis);
            pVis.scale.setScalar(1.5 / (mb.max.y - mb.min.y));
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
    lvCamX = pPos.x;

    // Reset enemies
    for (const e of enemies) {
        e.alive=true; e.shell=false; e.vel=-1.8; e.shellV=0; e.kicked=false;
        e.mesh.visible=true; e.mesh.scale.set(1,1,1);
        e.mesh.position.set(e.spawnX, e.spawnY, 0);
    }
    // Reset coins
    for (const c of coinObjects) { c.active=true; c.mesh.visible=true; }
    // Kill fireballs
    for (const f of fireballs) { f.active=false; f.mesh.visible=false; }

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
}

// ─────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────
function buildLevelHUD() {
    if (hudEl) { hudEl.style.display='flex'; if(backBtnEl)  backBtnEl.style.display=''; if(ctrlHintEl) ctrlHintEl.style.display=''; hudUpdate(); return; }
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
    ctrlHintEl.innerHTML = '<b>A/&#8592;</b> Left &nbsp;<b>D/&#8594;</b> Right &nbsp;<b>W/Space</b> Jump &nbsp;<b>Shift</b> Run<br>&#9660; Stomp enemies for 100pts!';
    document.body.appendChild(ctrlHintEl);
    hudUpdate();
}
function hideLevelHUD() {
    if (hudEl)      hudEl.style.display      = 'none';
    if (backBtnEl)  backBtnEl.style.display  = 'none';
    if (ctrlHintEl) ctrlHintEl.style.display = 'none';
}

// ─────────────────────────────────────────────────────
// OVERLAY
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
    for (const n of levelNodes) n.visible = true;
    enterBtn.style.display = 'flex';
    const loc  = document.getElementById('location');
    const hint = document.getElementById('hint');
    if (loc)  loc.style.display  = '';
    if (hint) hint.style.display = '';

    camera.fov  = 18;
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
    camera.position.set(-23.5, 28, 7.0);
    camera.lookAt(-23.5, 5.0, -11.0);
    MODE = 'overworld';
}

// ═══════════════════════════════════════════════════════
// LEVEL UPDATE — MARIO PHYSICS
// ═══════════════════════════════════════════════════════
function updateMario(dt) {
    if (pDead) return;
    pInv = Math.max(0, pInv - dt);

    const spd = isRun() ? P_RUN : P_WALK;
    pVel.x = 0;
    if (isLeft())  { pVel.x = -spd; pFace = -1; }
    if (isRight()) { pVel.x =  spd; pFace =  1; }

    const jd = isJump();
    if (jd && pGround) { pVel.y=JMP_V; pGround=false; pJumpHeld=true; pJumpT=0; }
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
        if (c) { pVel.y = 0; pJumpHeld = false; }
    }
    pPos.copy(np);
    if (pPos.x < 0) { pPos.x = 0; pVel.x = 0; }
    if (pPos.y < -6) die();
    if (pPos.x >= 217) {
        lvActive = false;
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
    pVis.rotation.y = pFace > 0 ? 0 : Math.PI;
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
        if (Math.abs(ePos.x - pPos.x) > 90) continue;   // out of range

        if (e.shell) {
            // Sliding shell
            ePos.x += e.shellV * dt;
            // Shell kills other enemies
            for (const other of enemies) {
                if (other === e || !other.alive) continue;
                if (Math.abs(other.mesh.position.x - ePos.x) < 1.1 && Math.abs(other.mesh.position.y - ePos.y) < 1.5) {
                    killEnemy(other);
                    lvScore += 100; hudUpdate();
                }
            }
        } else {
            // Chase if same level, wander otherwise
            const sameLvl = Math.abs(ePos.y - pPos.y) < 1.8;
            if (sameLvl && Math.abs(pPos.x - ePos.x) < 28)
                e.vel = Math.sign(pPos.x - ePos.x) * 1.8;
            ePos.x += e.vel * dt;
        }

        // Enemy gravity
        ePos.y += GRAV * 0.55 * dt;
        const eg = simpleGround(ePos);
        if (eg !== null) { ePos.y = eg; e.onGnd = true; }
        else               { e.onGnd = false; }

        // Wall reverse
        if (!e.shell) {
            const wd = new THREE.Vector3(Math.sign(e.vel), 0, 0);
            RC.set(new THREE.Vector3(ePos.x, ePos.y + 0.5, 0), wd);
            RC.far = 1.0;
            if (RC.intersectObjects(platformMeshes, false).length > 0) e.vel *= -1;
        }
        e.mesh.rotation.y = e.vel > 0 ? Math.PI : 0;

        // ── Mario collision ────────────────────────────
        if (pInv > 0 || pDead) continue;
        const dx = pPos.x - ePos.x;
        const dy = pPos.y - ePos.y;
        if (Math.abs(dx) < 1.0 && Math.abs(dy) < 1.2) {
            const mFeet = pPos.y - P_HALF;
            const eTop  = ePos.y + e.bodyH / 2;
            if (mFeet > eTop - 0.55 && pVel.y < 0) {
                // Stomp
                if (e.type === 'koopa' && !e.shell) {
                    e.shell  = true;
                    e.vel    = 0;
                    e.shellV = 0;
                    e.mesh.scale.y = 0.5;
                    ePos.y  -= 0.35;
                } else if (e.type === 'koopa' && e.shell && !e.kicked) {
                    e.shellV = (pPos.x > ePos.x ? -14 : 14);
                    e.kicked = true;
                } else {
                    killEnemy(e);
                }
                lvScore += 100; hudUpdate();
                pVel.y = 7.5;  // bounce
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
            lvCoins++;
            lvScore += 200;
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
        pl.userData.timer += dt;
        pl.userData.shotT += dt;
        const cycle = 3.5;
        const t = pl.userData.timer % cycle;
        // Rise/fall
        let yOff;
        if      (t < 0.4)            { yOff = -2.2; pl.visible = false; }
        else if (t < 1.8)            { yOff = -2.2 + ((t - 0.4) / 1.4) * 2.2; pl.visible = true; }
        else if (t < 2.8)            { yOff = 0;    pl.visible = true; }
        else                         { yOff = -((t - 2.8) / 0.7) * 2.2; pl.visible = true; }
        pl.position.y = pl.userData.baseY + yOff;
        pl.rotation.z = Math.sin(time * 2 + pl.position.x) * 0.08;

        // Shoot fireball
        if (pl.visible && t > 0.5 && t < 2.8 && pl.userData.shotT > 1.8) {
            const d = Math.abs(pPos.x - pl.position.x);
            if (d < 45) {
                spawnFireball(pl.position.x, pl.position.y + 0.8, pPos.x > pl.position.x ? 1 : -1);
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
// MAIN LOOP
// ═══════════════════════════════════════════════════════
const clock = new THREE.Clock();
let time = 0;

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;

    if (MODE === 'overworld') {
        // Water shader time
        for (const m of mapMeshes) {
            if (m.material.uniforms) m.material.uniforms.uTime.value = time;
        }
        if (owMixer) owMixer.update(dt);

        // Node walk
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

        // Node pulse + spin
        for (let i = 0; i < levelNodes.length; i++) {
            levelNodes[i].position.y       = NODE_BASE_Y + Math.sin(time * 1.8 + i * 1.1) * 0.06;
            levelNodes[i].children[1].rotation.y = time * 0.5 + i;
        }

        // Clouds
        for (const c of cloudGroup.children) {
            c.position.x += c.userData.speed * dt;
            if (c.position.x > c.userData.startX + c.userData.rangeX)
                c.position.x = c.userData.startX - c.userData.rangeX;
        }

        // Isometric camera
        const mp = marioMesh.position;
        const CD = isZoomedOut ? 60 : 14, CH = isZoomedOut ? 70 : 30;
        const tCX = mp.x - Math.sin(cameraAngle) * CD;
        const tCY = mp.y + CH;
        const tCZ = mp.z + Math.cos(cameraAngle) * CD;
        camera.position.x += (tCX - camera.position.x) * 0.10;
        camera.position.y += (tCY - camera.position.y) * 0.10;
        camera.position.z += (tCZ - camera.position.z) * 0.10;
        camera.lookAt(mp.x + Math.sin(cameraAngle)*1.5, mp.y-1.5, mp.z - Math.cos(cameraAngle)*1.5);

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
        }
    }

    renderer.render(scene, camera);
}

animate();