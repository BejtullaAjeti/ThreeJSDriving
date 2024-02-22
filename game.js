import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


const scene = new THREE.Scene();

// Create a sphere geometry
const skyGeometry = new THREE.SphereGeometry(325, 32, 32);

// Load the texture for the sky (replace 'cloudy-sky.jpg' with your own texture)
const skyTexture = new THREE.TextureLoader().load('textures/cloudy-sky.jpg');

// Create a material using the texture
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });

// Create the skybox mesh
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);

// Add the skybox to the scene
scene.add(skybox);

// Adjust lighting
const ambientLight = new THREE.AmbientLight(0x444444); // Ambient light to illuminate the scene
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Directional light for shadows
directionalLight.position.set(0, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.left = -300;
directionalLight.shadow.camera.right = 300;
directionalLight.shadow.camera.top = 300;
directionalLight.shadow.camera.bottom = -300;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 300;
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    600
);

const chaseCam = new THREE.Object3D();
chaseCam.position.set(0, 0, 0);
const chaseCamPivot = new THREE.Object3D();
chaseCamPivot.position.set(0, 1.75, 7.5);
chaseCam.add(chaseCamPivot);
scene.add(chaseCam);

const lowerResolution = 0.375; // Adjust this value to change the lower resolution (e.g., 0.5 means half the resolution)

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * lowerResolution, window.innerHeight * lowerResolution);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.imageRendering = 'pixelated'; // Optional: maintain pixelation effect
document.body.appendChild(renderer.domElement);

const sideTexture = new THREE.TextureLoader().load('textures/wheelside.png');
const topTexture = new THREE.TextureLoader().load('textures/wheeltop.png');
const bottomTexture = new THREE.TextureLoader().load('textures/wheeltop.png');

const sideMaterial = new THREE.MeshPhongMaterial({ map: sideTexture });
const topMaterial = new THREE.MeshPhongMaterial({ map: topTexture });
const bottomMaterial = new THREE.MeshPhongMaterial({ map: bottomTexture });

// Create an array of wheel materials
const wheelMaterials = [sideMaterial, topMaterial, bottomMaterial];
const bodyColor = new THREE.MeshPhongMaterial({ color: 0xFF0000 });

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const groundMaterial = new CANNON.Material('groundMaterial');
groundMaterial.friction = 0.5;
groundMaterial.restitution = 0;

const wheelMaterial = new CANNON.Material('wheelMaterial');
wheelMaterial.friction = 5;
wheelMaterial.restitution = 0.5;

// Load the grass texture
const grassTexture = new THREE.TextureLoader().load('textures/grass.jpg');

// Create a material using the grass texture
const grassMaterial = new THREE.MeshPhongMaterial({ map: grassTexture });

// Ground
const groundGeometry = new THREE.PlaneGeometry(600, 550);
const groundMesh = new THREE.Mesh(groundGeometry, grassMaterial); // Use grass material
groundMesh.rotateX(-Math.PI / 2);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Cannon.js ground body
const groundShape = new CANNON.Box(new CANNON.Vec3(300, 1, 275));
const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(groundShape);
groundBody.position.set(0, -1, 0);
world.addBody(groundBody);

const gridSize = 28;
const roadWidth = 28;
const buildingWidth = 24;
const buildingHeight = 32;

// Function to create a Cannon.js body for a box
function createBoxBody(x, y, z, width, height, depth, mass = 0) {
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    world.addBody(body);
    return body;
}

// Function to create a road
function createRoad(x, z, length, rotation) {
    const roadGeometry = new THREE.BoxGeometry(roadWidth, 0.5, length);
    // Apply asphalt texture to the road
    const texture = new THREE.TextureLoader().load('textures/asphalt.jpg');
    const roadMaterial = new THREE.MeshStandardMaterial({ map: texture });
    roadMaterial.friction = 0.3; // Adjust the friction value for the road
    roadMaterial.restitution = 0.1;
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(x, 0, z);
    road.rotation.y = rotation;
    road.receiveShadow = true;
    scene.add(road);

    // Cannon.js body for the road
    const roadShape = new CANNON.Box(new CANNON.Vec3(roadWidth / 2, 0.25, length / 2));
    const roadBody = new CANNON.Body({ mass: 0, material: roadMaterial });
    roadBody.addShape(roadShape);
    roadBody.position.set(x, 0, z);
    world.addBody(roadBody);
}

// Array of building textures
const buildingTextures = [
    new THREE.TextureLoader().load('textures/building1.jpg'),
    new THREE.TextureLoader().load('textures/building2.jpg'),
    new THREE.TextureLoader().load('textures/building3.jpg'),
    new THREE.TextureLoader().load('textures/building4.jpg'),
    new THREE.TextureLoader().load('textures/building5.jpg'),
    // Add more textures as needed
];

// Function to create a building with a random texture
function createBuilding(x, z) {
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingWidth);

    // Randomly select a texture
    const randomTexture = buildingTextures[Math.floor(Math.random() * buildingTextures.length)];

    const buildingMaterial = new THREE.MeshPhongMaterial({ map: randomTexture });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, buildingHeight / 2, z);
    building.castShadow = true; // Enable shadow casting
    building.receiveShadow = true; // Enable shadow receiving
    scene.add(building);

    // Cannon.js body for the building
    createBoxBody(x, buildingHeight / 2, z, buildingWidth, buildingHeight, buildingWidth);
}

// Process the overhead view to generate the 3D map
const mapData = `
--------------------
|RRRRRRRRRRRRRRRRR|
|RBBBRRRBBBRRBBBBR|
|RBBBRRRBBBRRRBBBB|
|RRRRRRRRRRRRRRRRR|
|RBBRRBRBBBBBBRRBR|
|RRRRRRRRRRRRRRRRR|
|RBRRBRRRBBBBBRRRR|
|RRRRRRRRRRRRRRRRR|
|RBBRRRRRBRRBBBBBR|
|RRRRRRRRRRRRRRRRR|
|RBBRBBBBRBBRBRRBR|
|RRRRRRRRRRRRRRRRR|
|RBRBBBRRRBBBRRRBR|
|RBBBBBRRRBBBBRRBB|
|RRRRRRRRRRRRRRRRR|
--------------------
`;

const rows = mapData.trim().split('\n');
const centerOffsetX = (rows[0].length * gridSize) / 2;
const centerOffsetZ = (rows.length * gridSize) / 2;

for (let i = 0; i < rows.length; i++) {
    const row = rows[i].trim();
    for (let j = 0; j < row.length; j++) {
        const char = row[j];
        const x = (j * gridSize) - centerOffsetX;
        const z = (i * gridSize) - centerOffsetZ;

        if (char === 'R') {
            createRoad(x, z, gridSize, 0);
        } else if (char === 'B') {
            createBuilding(x, z);
        }
    }
}

const loader = new GLTFLoader();
let newCarModel;

loader.load('car1.glb', (gltf) => {
    newCarModel = gltf.scene;

    newCarModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
        }
    });

    newCarModel.castShadow = true;
    newCarModel.position.y = 2; // Adjust position if necessary
    scene.add(newCarModel);

    newCarModel.add(chaseCam);

    carBody.position.copy(newCarModel.position);
    carBody.quaternion.copy(newCarModel.quaternion);
    world.addBody(carBody);
});

const carBodyMesh = new THREE.Mesh(newCarModel, bodyColor);
carBodyMesh.position.y = 2;
carBodyMesh.castShadow = true;
scene.add(carBodyMesh);
carBodyMesh.add(chaseCam);

const carBodyShape = new CANNON.Box(new CANNON.Vec3(1.35, 0.5, 3));

const carBody = new CANNON.Body({ mass: 225 });
carBody.addShape(carBodyShape);
carBody.position.copy(carBodyMesh.position);
world.addBody(carBody);

const maxSteeringAngle = 0.75;

// front left wheel
const wheelLFGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5);
wheelLFGeometry.rotateZ(Math.PI / 2);
const wheelLFMesh = new THREE.Mesh(wheelLFGeometry, wheelMaterials);
wheelLFMesh.position.x = -1;
wheelLFMesh.position.y = 3;
wheelLFMesh.position.z = 0;
wheelLFMesh.castShadow = true;
scene.add(wheelLFMesh);
const wheelLFShape = new CANNON.Sphere(0.5);
const wheelLFBody = new CANNON.Body({ mass: 1, material: wheelMaterial });
wheelLFBody.addShape(wheelLFShape);
wheelLFBody.position.copy(wheelLFMesh.position);
world.addBody(wheelLFBody);

// front right wheel
const wheelRFGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5);
wheelRFGeometry.rotateZ(Math.PI / 2);
const wheelRFMesh = new THREE.Mesh(wheelRFGeometry, wheelMaterials);
wheelRFMesh.position.y = 3;
wheelRFMesh.position.x = 1;
wheelRFMesh.position.z = -1;
wheelRFMesh.castShadow = true;
scene.add(wheelRFMesh);
const wheelRFShape = new CANNON.Sphere(0.5);
const wheelRFBody = new CANNON.Body({ mass: 1, material: wheelMaterial });
wheelRFBody.addShape(wheelRFShape);
wheelRFBody.position.copy(wheelRFMesh.position);
world.addBody(wheelRFBody);

// back left wheel
const wheelLBGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5);
wheelLBGeometry.rotateZ(Math.PI / 2);
const wheelLBMesh = new THREE.Mesh(wheelLBGeometry, wheelMaterials);
wheelLBMesh.position.y = 3;
wheelLBMesh.position.x = -1;
wheelLBMesh.position.z = 1;
wheelLBMesh.castShadow = true;
scene.add(wheelLBMesh);
const wheelLBShape = new CANNON.Sphere(0.5);
const wheelLBBody = new CANNON.Body({ mass: 1, material: wheelMaterial });
wheelLBBody.addShape(wheelLBShape);
wheelLBBody.position.copy(wheelLBMesh.position);
world.addBody(wheelLBBody);

// back right wheel
const wheelRBGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5);
wheelRBGeometry.rotateZ(Math.PI / 2);
const wheelRBMesh = new THREE.Mesh(wheelRBGeometry, wheelMaterials);
wheelRBMesh.position.y = 3;
wheelRBMesh.position.x = 1;
wheelRBMesh.position.z = 1;
wheelRBMesh.castShadow = true;
scene.add(wheelRBMesh);
const wheelRBShape = new CANNON.Sphere(0.5);
const wheelRBBody = new CANNON.Body({ mass: 1, material: wheelMaterial });
wheelRBBody.addShape(wheelRBShape);
wheelRBBody.position.copy(wheelRBMesh.position);
world.addBody(wheelRBBody);

const leftFrontAxis = new CANNON.Vec3(1, 0, 0);
const rightFrontAxis = new CANNON.Vec3(1, 0, 0);
const leftBackAxis = new CANNON.Vec3(1, 0, 0);
const rightBackAxis = new CANNON.Vec3(1, 0, 0);

const constraintLF = new CANNON.HingeConstraint(carBody, wheelLFBody, {
    pivotA: new CANNON.Vec3(-1.05, -0.4, -2.15),
    axisA: leftFrontAxis,
    maxForce: 100,
});
world.addConstraint(constraintLF);

const constraintRF = new CANNON.HingeConstraint(carBody, wheelRFBody, {
    pivotA: new CANNON.Vec3(1.05, -0.4, -2.15),
    axisA: rightFrontAxis,
    maxForce: 100,
});
world.addConstraint(constraintRF);

const constraintLB = new CANNON.HingeConstraint(carBody, wheelLBBody, {
    pivotA: new CANNON.Vec3(-1.05, -0.4, 1.8),
    axisA: leftBackAxis,
    maxForce: 100,
});
world.addConstraint(constraintLB);

const constraintRB = new CANNON.HingeConstraint(carBody, wheelRBBody, {
    pivotA: new CANNON.Vec3(1.05, -0.4, 1.8),
    axisA: rightBackAxis,
    maxForce: 100,
});
world.addConstraint(constraintRB);

constraintLB.enableMotor();
constraintRB.enableMotor();

const keyMap = {};
const onDocumentKey = (e) => {
    keyMap[e.code] = e.type === 'keydown';
};

let forwardVelocity = 0;
let rightVelocity = 0;

document.addEventListener('keydown', onDocumentKey, false);
document.addEventListener('keyup', onDocumentKey, false);

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

const clock = new THREE.Clock();
let delta;

const audioLoader = new THREE.AudioLoader();
let ambientSound;
const listener = new THREE.AudioListener();
camera.add(listener);
audioLoader.load('audio/ambient.mp3', function (buffer) {
    ambientSound = new THREE.Audio(listener);
    ambientSound.setBuffer(buffer);
    ambientSound.setLoop(true);
    ambientSound.setVolume(1);
    ambientSound.play();
});

// Function to set up audio context and related components
function setupAudio() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const numHarmonics = 6;
    const real = new Float32Array(numHarmonics);
    const imag = new Float32Array(numHarmonics).fill(0);

    for (let i = 1; i <= numHarmonics; i++) {
        real[i - 1] = 1 / i;
    }

    const customWaveform = audioContext.createPeriodicWave(real, imag);

    const oscillator = audioContext.createOscillator();
    oscillator.setPeriodicWave(customWaveform);
    oscillator.start();

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let baseFrequency = 12;
    let speedMultiplier = 0.75;

    function updateEngineSound() {
        const speed = Math.abs(forwardVelocity);
        const frequency = baseFrequency + speed * speedMultiplier;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    }

    return updateEngineSound;
}

// Event listener to trigger audio setup on user gesture (e.g., click)
document.addEventListener('click', function() {
    const audioUpdate = setupAudio();
    // Call the update function periodically or as needed
    // For example, requestAnimationFrame
    function animate() {
        audioUpdate();
        requestAnimationFrame(animate);
    }
    animate();
});



const raindropMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff });
const raindropGeometry = new THREE.SphereGeometry(0.015, 8, 8); // Use SphereBufferGeometry
const rainGroup = new THREE.Group();
scene.add(rainGroup);

const maxRadius = 10;
const maxYPosition = 5;
const maxRaindrops = 200;

function createRaindrop() {
    if (rainGroup.children.length < maxRaindrops) {
        const raindrop = new THREE.Mesh(raindropGeometry, raindropMaterial);
        const radius = Math.random() * maxRadius;
        const theta = Math.random() * Math.PI * 2;
        if(newCarModel){
        const x = radius * Math.cos(theta) + newCarModel.position.x;
        const y = Math.random() * maxYPosition + 5;
        const z = radius * Math.sin(theta) + newCarModel.position.z;
        raindrop.position.set(x, y, z);
        }
        rainGroup.add(raindrop);
    }
}

function updateRain() {
    rainGroup.children.forEach((raindrop) => {
        raindrop.position.y -= 0.1;
        if (raindrop.position.y < -5) {
            const radius = Math.random() * maxRadius;
            const theta = Math.random() * Math.PI * 2;
            const x = radius * Math.cos(theta) + newCarModel.position.x;
            const y = Math.random() * maxYPosition + 5;
            const z = radius * Math.sin(theta) + newCarModel.position.z;
            raindrop.position.set(x, y, z);
        }
    });

    if (rainGroup.children.length === 0) {
        createRaindrop();
    }
}


// Configure renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
const v = new THREE.Vector3();
let thrusting = false;

function animate() {
    requestAnimationFrame(animate);

    delta = Math.min(Math.max(clock.getDelta(), 1 / 60), 0.1);
    world.step(delta);

    // Copy coordinates from Cannon to Three.js
    if (carBodyMesh) {
        carBodyMesh.position.set(
            carBody.position.x,
            carBody.position.y,
            carBody.position.z
        );
        carBodyMesh.quaternion.set(
            carBody.quaternion.x,
            carBody.quaternion.y,
            carBody.quaternion.z,
            carBody.quaternion.w
        );
    }
   
    // Update the GLTF model's position and rotation
    if(newCarModel){
    newCarModel.position.set(
        carBody.position.x,
        carBody.position.y,
        carBody.position.z
    );
    newCarModel.quaternion.set(
        carBody.quaternion.x,
        carBody.quaternion.y,
        carBody.quaternion.z,
        carBody.quaternion.w
    );
    }
    wheelLFMesh.position.set(
        wheelLFBody.position.x,
        wheelLFBody.position.y,
        wheelLFBody.position.z
    );
    wheelLFMesh.quaternion.set(
        wheelLFBody.quaternion.x,
        wheelLFBody.quaternion.y,
        wheelLFBody.quaternion.z,
        wheelLFBody.quaternion.w
    );

    wheelRFMesh.position.set(
        wheelRFBody.position.x,
        wheelRFBody.position.y,
        wheelRFBody.position.z
    );
    wheelRFMesh.quaternion.set(
        wheelRFBody.quaternion.x,
        wheelRFBody.quaternion.y,
        wheelRFBody.quaternion.z,
        wheelRFBody.quaternion.w
    );

    wheelLBMesh.position.set(
        wheelLBBody.position.x,
        wheelLBBody.position.y,
        wheelLBBody.position.z
    );
    wheelLBMesh.quaternion.set(
        wheelLBBody.quaternion.x,
        wheelLBBody.quaternion.y,
        wheelLBBody.quaternion.z,
        wheelLBBody.quaternion.w
    );

    wheelRBMesh.position.set(
        wheelRBBody.position.x,
        wheelRBBody.position.y,
        wheelRBBody.position.z
    );
    wheelRBMesh.quaternion.set(
        wheelRBBody.quaternion.x,
        wheelRBBody.quaternion.y,
        wheelRBBody.quaternion.z,
        wheelRBBody.quaternion.w
    );

    const steeringReturnSpeed = 0.005; 
    const topSpeed = 100; 
    const acceleration = 0.1; 
    const deceleration = 0.75; 
    const brakingPower = 0.2; 
    thrusting = false;
    
    // Accelerate or decelerate
    if (keyMap['KeyW'] || keyMap['ArrowUp']) {
        if (forwardVelocity < topSpeed) {
            forwardVelocity += acceleration;
        }
        thrusting = true;
    } else if (keyMap['KeyS'] || keyMap['ArrowDown']) {
        if (forwardVelocity > 0) {
            forwardVelocity = Math.max(0, forwardVelocity - brakingPower);
        } else {
            forwardVelocity = Math.min(-topSpeed / 10, forwardVelocity + acceleration);
        }
        thrusting = true;
    } else {
        if (forwardVelocity > 0) {
            forwardVelocity = Math.max(0, forwardVelocity - acceleration);
        } else if (forwardVelocity < 0) {
            forwardVelocity = Math.min(0, forwardVelocity + acceleration);
        }
    }

    // Steering
    if (keyMap['KeyA'] || keyMap['ArrowLeft']) {
        if (rightVelocity > -maxSteeringAngle) rightVelocity -= 0.01;
    }
    if (keyMap['KeyD'] || keyMap['ArrowRight']) {
        if (rightVelocity < maxSteeringAngle) rightVelocity += 0.01;
    }
    if (!keyMap['KeyA'] && !keyMap['ArrowLeft'] && !keyMap['KeyD'] && !keyMap['ArrowRight']) {
        if (rightVelocity > 0) {
            rightVelocity = Math.max(0, rightVelocity - steeringReturnSpeed);
        } else if (rightVelocity < 0) {
            rightVelocity = Math.min(0, rightVelocity + steeringReturnSpeed);
        }
    }
    
    if (!thrusting) {
        if (forwardVelocity > 0) {
            forwardVelocity = Math.max(0, forwardVelocity - acceleration);
        } else if (forwardVelocity < 0) {
            forwardVelocity = Math.min(0, forwardVelocity + deceleration);
        }
    }
    constraintLB.setMotorSpeed(forwardVelocity);
    constraintRB.setMotorSpeed(forwardVelocity);
    constraintLF.axisA.z = rightVelocity;
    constraintRF.axisA.z = rightVelocity;

    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    listener.position.copy(cameraPosition);
    camera.lookAt(carBodyMesh.position);

    chaseCamPivot.getWorldPosition(v);
    if (v.y < 1.5) {
        v.y = 1.5;
    }
    camera.position.lerpVectors(camera.position, v, 0.015);

    render();
    createRaindrop();
    updateRain();
}
function render() {
    renderer.render(scene, camera);
}

animate();