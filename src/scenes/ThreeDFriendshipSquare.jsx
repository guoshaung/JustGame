import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_ROOTS = {
  pets: "/models/cube-pets",
  characters: "/models/mini-characters",
};

const npcData = [
  {
    id: "rabbit",
    name: "小兔",
    color: "#ffd3df",
    modelUrl: `${MODEL_ROOTS.pets}/animal-bunny.glb`,
    position: [-4.2, 0, -2.3],
    story: "我的玩具被拿走了，我有点难过。",
    stampId: "need-expression",
    stampName: "表达需求邮票",
    skills: ["emotion", "need", "polite"],
    answers: [
      {
        text: "我还想玩一会儿，可以等我玩完再给你吗？",
        correct: true,
      },
      { text: "你可以大声抢回来。", correct: false },
      { text: "你可以说：你真讨厌！", correct: false },
    ],
  },
  {
    id: "cat",
    name: "小猫",
    color: "#bfe8ff",
    modelUrl: `${MODEL_ROOTS.pets}/animal-cat.glb`,
    position: [3.8, 0, -1.6],
    story: "我想加入朋友的游戏，可是有点不好意思。",
    stampId: "active-talk",
    stampName: "主动沟通邮票",
    skills: ["need", "polite"],
    answers: [
      { text: "我可以和你们一起玩吗？", correct: true },
      { text: "你们必须带我玩！", correct: false },
      { text: "转身不理他们。", correct: false },
    ],
  },
  {
    id: "panda",
    name: "小熊猫",
    color: "#f5c47b",
    modelUrl: `${MODEL_ROOTS.pets}/animal-panda.glb`,
    position: [0.5, 0, 3.7],
    story: "排队太久了，我有点着急。",
    stampId: "patience",
    stampName: "耐心等待邮票",
    skills: ["patience", "polite"],
    answers: [
      { text: "我可以先深呼吸，再等一等。", correct: true },
      { text: "推开前面的朋友。", correct: false },
      { text: "一直喊：快一点！", correct: false },
    ],
  },
];

function getDistance(a, b) {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function LoadedModel({ url, targetSize = 1.35 }) {
  const gltf = useGLTF(url);

  const model = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDimension;

    return {
      scene,
      scale,
      offset: [-center.x * scale, -box.min.y * scale, -center.z * scale],
    };
  }, [gltf.scene, targetSize]);

  return (
    <primitive object={model.scene} position={model.offset} scale={model.scale} />
  );
}

function FallbackModel({ color = "#ffd766", type = "npc" }) {
  if (type === "house") {
    return (
      <group>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.45, 1.1, 1.25]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.35, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.15, 0.8, 4]} />
          <meshStandardMaterial color="#ff9eb6" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function ModelLoader({ url, fallback, targetSize = 1.35 }) {
  if (!url) return fallback;

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedModel url={url} targetSize={targetSize} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function House({ position, color }) {
  return (
    <group position={position}>
      <FallbackModel color={color} type="house" />
    </group>
  );
}

function Npc({ npc }) {
  return (
    <group position={npc.position}>
      <ModelLoader
        url={npc.modelUrl}
        targetSize={1.25}
        fallback={<FallbackModel color={npc.color} type="npc" />}
      />
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#493d37" />
      </mesh>
    </group>
  );
}

function Player({ position }) {
  return (
    <group position={position}>
      <ModelLoader
        url={`${MODEL_ROOTS.characters}/character-female-a.glb`}
        targetSize={1.55}
        fallback={<FallbackModel color="#7cc9ff" type="npc" />}
      />
    </group>
  );
}

function getMovementKey(event) {
  const key = event.key.toLowerCase();
  const code = event.code.toLowerCase();

  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    return key;
  }

  if (code === "keyw") return "w";
  if (code === "keya") return "a";
  if (code === "keys") return "s";
  if (code === "keyd") return "d";
  if (code === "arrowup") return "arrowup";
  if (code === "arrowdown") return "arrowdown";
  if (code === "arrowleft") return "arrowleft";
  if (code === "arrowright") return "arrowright";

  return "";
}

function MovementController({ playerPosition, setPlayerPosition, disabled = false }) {
  const pressedKeys = useRef(new Set());
  const positionRef = useRef(playerPosition);

  useEffect(() => {
    positionRef.current = playerPosition;
  }, [playerPosition]);

  useEffect(() => {
    const movementKeys = new Set([
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ]);

    const onKeyDown = (event) => {
      const key = getMovementKey(event);
      if (!movementKeys.has(key)) return;

      event.preventDefault();
      pressedKeys.current.add(key);
    };

    const onKeyUp = (event) => {
      const key = getMovementKey(event);
      if (key) pressedKeys.current.delete(key);
    };

    const clearKeys = () => pressedKeys.current.clear();

    const keyboardTargets = [window, document, document.body].filter(Boolean);
    const keyOptions = { capture: true, passive: false };

    keyboardTargets.forEach((target) => {
      target.addEventListener("keydown", onKeyDown, keyOptions);
      target.addEventListener("keyup", onKeyUp, true);
    });
    window.addEventListener("blur", clearKeys);

    return () => {
      keyboardTargets.forEach((target) => {
        target.removeEventListener("keydown", onKeyDown, true);
        target.removeEventListener("keyup", onKeyUp, true);
      });
      window.removeEventListener("blur", clearKeys);
    };
  }, []);

  useFrame((_, delta) => {
    if (disabled) return;

    const keys = pressedKeys.current;
    if (!keys.size) return;

    const speed = 3.2 * delta;
    let [nextX, , nextZ] = positionRef.current;

    if (keys.has("w") || keys.has("arrowup")) nextZ -= speed;
    if (keys.has("s") || keys.has("arrowdown")) nextZ += speed;
    if (keys.has("a") || keys.has("arrowleft")) nextX -= speed;
    if (keys.has("d") || keys.has("arrowright")) nextX += speed;

    nextX = THREE.MathUtils.clamp(nextX, -5.8, 5.8);
    nextZ = THREE.MathUtils.clamp(nextZ, -5.1, 5.1);

    const nextPosition = [nextX, 0, nextZ];
    positionRef.current = nextPosition;
    setPlayerPosition(nextPosition);
  });

  return null;
}

function FriendshipWorld({ playerPosition, setPlayerPosition, controlsDisabled }) {
  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[4, 8, 5]} intensity={1.15} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#a8e6a2" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <planeGeometry args={[13, 1.05]} />
        <meshStandardMaterial color="#fff2bd" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2.8]}>
        <planeGeometry args={[10, 0.9]} />
        <meshStandardMaterial color="#ffe6ef" />
      </mesh>
      <House position={[-5, 0, -4]} color="#ffe08a" />
      <House position={[4.7, 0, -4.2]} color="#c9ebff" />
      <House position={[-4.7, 0, 4.1]} color="#ffd4df" />
      <House position={[4.6, 0, 4.1]} color="#d7f6c9" />
      {npcData.map((npc) => (
        <Npc npc={npc} key={npc.id} />
      ))}
      <Player position={playerPosition} />
      <MovementController
        playerPosition={playerPosition}
        setPlayerPosition={setPlayerPosition}
        disabled={controlsDisabled}
      />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.45}
        minDistance={7}
        maxDistance={10}
      />
    </>
  );
}

function ThreeDFriendshipSquare({
  stars,
  stampCount,
  completedTasks,
  onBackToMap,
  onReward,
}) {
  const canvasShellRef = useRef(null);
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
  const [activeNpc, setActiveNpc] = useState(null);
  const [feedback, setFeedback] = useState("");

  const nearbyNpc = useMemo(() => {
    return npcData.find((npc) => getDistance(playerPosition, npc.position) < 1.45);
  }, [playerPosition]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isInteractKey =
        event.key.toLowerCase() === "e" || event.code.toLowerCase() === "keye";

      if (isInteractKey && nearbyNpc && !activeNpc) {
        event.preventDefault();
        setActiveNpc(nearbyNpc);
        setFeedback("");
      }
    };

    document.addEventListener("keydown", onKeyDown, { capture: true, passive: false });
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [activeNpc, nearbyNpc]);

  useEffect(() => {
    canvasShellRef.current?.focus();
  }, []);

  const chooseAnswer = (answer) => {
    if (!activeNpc) return;

    if (answer.correct) {
      setFeedback(`说得真棒！获得 1 颗星，解锁${activeNpc.stampName}。`);
      onReward({
        taskId: `threeD-${activeNpc.id}`,
        stampIds: [activeNpc.stampId],
        skills: activeNpc.skills,
        stars: 1,
      });
    } else {
      setFeedback("这句话可能不够温柔，我们换一种更友好的说法吧。");
    }
  };

  const activeTaskDone = activeNpc
    ? completedTasks.includes(`threeD-${activeNpc.id}`)
    : false;

  return (
    <div className="three-d-square fade-in">
      <div className="three-d-hud">
        <button className="secondary-button" onClick={onBackToMap}>
          返回地图
        </button>
        <div>
          <span>星星 {stars}</span>
          <span>邮票 {stampCount}/6</span>
        </div>
      </div>

      <div className="scene-heading">
        <span>3D</span>
        <div>
          <h2>3D 友谊广场</h2>
          <p>用 WASD 或方向键移动主角，靠近小动物后按 E 开始对话。</p>
        </div>
      </div>

      <div
        className="r3f-canvas-shell"
        ref={canvasShellRef}
        tabIndex={0}
        onPointerDown={() => canvasShellRef.current?.focus()}
      >
        <Canvas
          camera={{ position: [0, 7.2, 8.4], fov: 48 }}
          gl={{ preserveDrawingBuffer: true }}
          shadows
        >
          <FriendshipWorld
            playerPosition={playerPosition}
            setPlayerPosition={setPlayerPosition}
            controlsDisabled={Boolean(activeNpc)}
          />
        </Canvas>
        {nearbyNpc && !activeNpc && (
          <div className="three-d-near-tip">
            靠近了{nearbyNpc.name}，按 E 开始对话
          </div>
        )}
      </div>

      <div className="three-d-help">
        <span>移动：WASD / 方向键</span>
        <span>互动：靠近 NPC 后按 E</span>
        <span>当前 NPC：{nearbyNpc?.name ?? "继续探索"}</span>
      </div>

      {activeNpc && (
        <div className="npc-dialogue-panel">
          <div className="npc-dialogue-header">
            <span style={{ background: activeNpc.color }}>{activeNpc.name}</span>
            <button onClick={() => setActiveNpc(null)}>关闭</button>
          </div>
          <p>{activeNpc.story}</p>
          <div className="npc-answer-list">
            {activeNpc.answers.map((answer) => (
              <button
                className="choice-card"
                key={answer.text}
                onClick={() => chooseAnswer(answer)}
              >
                {answer.text}
              </button>
            ))}
          </div>
          {feedback && (
            <div
              className={`feedback-box ${
                feedback.startsWith("说得真棒") ? "success" : "gentle"
              }`}
            >
              {feedback}
              {activeTaskDone && feedback.startsWith("说得真棒") && (
                <strong>这个朋友的 3D 对话任务已经完成。</strong>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

useGLTF.preload(`${MODEL_ROOTS.pets}/animal-bunny.glb`);
useGLTF.preload(`${MODEL_ROOTS.pets}/animal-cat.glb`);
useGLTF.preload(`${MODEL_ROOTS.pets}/animal-panda.glb`);
useGLTF.preload(`${MODEL_ROOTS.characters}/character-female-a.glb`);

export { ModelLoader };
export default ThreeDFriendshipSquare;
