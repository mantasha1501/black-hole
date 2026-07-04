/**
 * METRIC INTERSTELLAR ENGINE LOADER
 * Highly optimized self-contained WebGL setup with embedded shader calculations.
 */

let scene, camera, renderer, material, mesh;
let customUniforms = {};

let targetMousePos = { x: 0.25, y: 0.15 };
let currentMousePos = { x: 0.25, y: 0.15 };
let isInteractionLockActive = false;
let lastInteractionTimestamp = 0;

// EMBEDDED VERTEX SHADER STRINGS
const vertexShaderCode = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

// EMBEDDED CINEMATIC FRAGMENT SHADER LOGIC
const fragmentShaderCode = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_mass;
    uniform float u_diskRadius;
    uniform vec2 u_mouse;
    varying vec2 vUv;

    #define MAX_STEPS 140
    #define STEP_SIZE 0.065
    #define EVENT_HORIZON 0.7

    float hash31(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    }

    float noise3D(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
                mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
                mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z
        );
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        float yaw = u_mouse.x * 6.28318;
        float pitch = u_mouse.y * 2.5 - 0.4;
        
        vec3 ro = vec3(cos(yaw) * cos(pitch), sin(pitch), sin(yaw) * cos(pitch)) * 6.0;
        vec3 target = vec3(0.0, -0.1, 0.0);
        
        vec3 ww = normalize(target - ro);
        vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
        vec3 vv = cross(uu, ww);
        vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.6 * ww);

        vec3 cumulativeColor = vec3(0.0);
        float distanceMarched = 0.0;
        bool escapedToStars = true;

        for (int i = 0; i < MAX_STEPS; i++) {
            vec3 currentPos = ro + rd * distanceMarched;
            float rSquared = dot(currentPos, currentPos);
            float r = sqrt(rSquared);

            if (r < EVENT_HORIZON) {
                escapedToStars = false;
                break;
            }

            vec3 gravityVector = -currentPos / (rSquared * r);
            float deflectionMagnitude = (u_mass / rSquared) * STEP_SIZE;
            rd = normalize(rd + gravityVector * deflectionMagnitude);

            float diskInnerBoundary = 1.4;
            if (abs(currentPos.y) < 0.045 && r > diskInnerBoundary && r < u_diskRadius) {
                float angularVelocity = u_time * (2.5 / (r + 0.1));
                float phiAngle = atan(currentPos.z, currentPos.x) + angularVelocity;
                
                float densityProfile = noise3D(vec3(r * 3.0, phiAngle * 5.0, u_time * 0.15));
                densityProfile *= smoothstep(diskInnerBoundary, diskInnerBoundary + 0.4, r);
                densityProfile *= smoothstep(u_diskRadius, u_diskRadius - 0.7, r);

                vec3 diskVelocityTangent = normalize(cross(vec3(0.0, 1.0, 0.0), currentPos));
                float dopplerFactor = dot(rd, diskVelocityTangent);
                float shiftIntensity = 1.0 + (dopplerFactor * 0.85); 
                
                vec3 blueShiftColor = vec3(1.0, 0.65, 0.3);
                vec3 redShiftColor = vec3(0.9, 0.15, 0.02);
                vec3 coreGasBase = mix(redShiftColor, blueShiftColor, smoothstep(-1.0, 1.0, dopplerFactor));

                cumulativeColor += coreGasBase * (densityProfile * (0.28 / r) * pow(shiftIntensity, 3.5));
            }

            if (distanceMarched > 35.0) break;
            distanceMarched += STEP_SIZE;
        }

        if (escapedToStars) {
            float stellarDensity = hash31(floor(rd * 180.0));
            if (stellarDensity > 0.995) {
                cumulativeColor += vec3(pow(fract(stellarDensity * 45.67), 5.0) * 1.8);
            }
        }

        cumulativeColor = vec3(1.0) - exp(-cumulativeColor * 1.3);
        cumulativeColor = pow(cumulativeColor, vec3(1.0 / 2.2));
        gl_FragColor = vec4(cumulativeColor, 1.0);
    }
`;

function initRenderPipeline() {
    const canvasElement = document.getElementById("glCanvas");
    if (!canvasElement) return;

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: false,
        powerPreference: "high-performance"
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Drop rendering scale slightly to keep frames blazing fast on phones
    renderer.setSize(window.innerWidth, window.innerHeight);

    customUniforms = {
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_time: { value: 0.0 },
        u_mass: { value: parseFloat(document.getElementById("massSlider").value || 1.9) },
        u_diskRadius: { value: parseFloat(document.getElementById("diskSlider").value || 5.5) },
        u_mouse: { value: new THREE.Vector2(currentMousePos.x, currentMousePos.y) }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    material = new THREE.ShaderMaterial({
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode,
        uniforms: customUniforms,
        depthWrite: false,
        depthTest: false
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    setupPipelineListeners();
    executeRenderLoop(0);
}

function setupPipelineListeners() {
    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        customUniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("pointermove", (e) => {
        if (isInteractionLockActive) {
            targetMousePos.x = (e.clientX / window.innerWidth);
            targetMousePos.y = (e.clientY / window.innerHeight);
        }
    });

    window.addEventListener("pointerdown", (e) => {
        if (e.target.tagName === "INPUT") return;

        const currentTimestamp = performance.now();
        const latencyDelta = currentTimestamp - lastInteractionTimestamp;

        if (latencyDelta < 300) {
            isInteractionLockActive = !isInteractionLockActive;
            const badge = document.querySelector(".badge");
            if (badge) {
                if (isInteractionLockActive) {
                    badge.innerText = "CAMERA MANUAL UNLOCKED";
                    badge.style.borderColor = "#3B82F6";
                    badge.style.color = "#3B82F6";
                } else {
                    badge.innerText = "CINEMATIC PASS ACTIVE";
                    badge.style.borderColor = "#FF5A1F";
                    badge.style.color = "#FF5A1F";
                }
            }
        }
        lastInteractionTimestamp = currentTimestamp;
    });

    document.getElementById("massSlider").addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        customUniforms.u_mass.value = val;
        document.getElementById("massVal").innerText = val.toFixed(2);
    });

    document.getElementById("diskSlider").addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        customUniforms.u_diskRadius.value = val;
        document.getElementById("diskVal").innerText = val.toFixed(2);
    });
}

function executeRenderLoop(timestamp) {
    requestAnimationFrame(executeRenderLoop);

    const timeSec = timestamp * 0.001;
    customUniforms.u_time.value = timeSec;
    
    const timeReadout = document.getElementById("timeReadout");
    if (timeReadout) timeReadout.innerText = timeSec.toFixed(2) + "s";

    if (!isInteractionLockActive) {
        targetMousePos.x = 0.2 + Math.sin(timeSec * 0.05) * 0.12;
        targetMousePos.y = 0.18 + Math.cos(timeSec * 0.03) * 0.04;
    }

    currentMousePos.x += (targetMousePos.x - currentMousePos.x) * 0.04;
    currentMousePos.y += (targetMousePos.y - currentMousePos.y) * 0.04;
    customUniforms.u_mouse.value.set(currentMousePos.x, currentMousePos.y);

    renderer.render(scene, camera);
}

window.addEventListener("DOMContentLoaded", initRenderPipeline);