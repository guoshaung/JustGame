import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const speakText = (text) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    window.speechSynthesis.speak(utterance);
  }
};

function TypewriterText({ text, speed = 40, onComplete, playSound = true }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    if (!text) return;

    const playClickSound = () => {
      if (!playSound || (!window.AudioContext && !window.webkitAudioContext)) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(450 + Math.random() * 150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700 + Math.random() * 150, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch (e) {
        // Silently catch audio blocks
      }
    };

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      playClickSound();
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      clearInterval(interval);
    };
  }, [text, speed, playSound]);

  return <span>{displayedText}</span>;
}

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
    const scene = gltf.scene;

    // 开启阴影投射，并禁用模型自带的可能干扰主渲染器的 Camera 与 Light 节点
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.isCamera) {
        child.active = false;
      }
    });

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

function Npc({ npc, onInteract }) {
  return (
    <group
      position={npc.position}
      onClick={(e) => {
        e.stopPropagation();
        onInteract(npc);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
      }}
    >
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

function Player({ playerRef }) {
  return (
    <group ref={playerRef} position={[0, 0, 0]}>
      <ModelLoader
        url={`${MODEL_ROOTS.characters}/character-female-a.glb`}
        targetSize={1.55}
        fallback={<FallbackModel color="#7cc9ff" type="npc" />}
      />
    </group>
  );
}

function MovementController({ playerRef, dpadState, onNearbyChange, disabled = false }) {
  const keysPressed = useRef({ forward: false, backward: false, left: false, right: false });
  const lastNearbyId = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") keysPressed.current.forward = true;
      if (key === "s" || key === "arrowdown") keysPressed.current.backward = true;
      if (key === "a" || key === "arrowleft") keysPressed.current.left = true;
      if (key === "d" || key === "arrowright") keysPressed.current.right = true;
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") keysPressed.current.forward = false;
      if (key === "s" || key === "arrowdown") keysPressed.current.backward = false;
      if (key === "a" || key === "arrowleft") keysPressed.current.left = false;
      if (key === "d" || key === "arrowright") keysPressed.current.right = false;
    };

    const clearKeys = () => {
      keysPressed.current = { forward: false, backward: false, left: false, right: false };
    };

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("keyup", handleKeyUp, { passive: true });
    window.addEventListener("blur", clearKeys);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearKeys);
    };
  }, [disabled]);

  useFrame((_, delta) => {
    if (!playerRef.current || disabled) return;

    const moveForward = keysPressed.current.forward || dpadState.current.forward;
    const moveBackward = keysPressed.current.backward || dpadState.current.backward;
    const moveLeft = keysPressed.current.left || dpadState.current.left;
    const moveRight = keysPressed.current.right || dpadState.current.right;

    if (moveForward || moveBackward || moveLeft || moveRight) {
      const speed = 4.2 * delta;
      let nextX = playerRef.current.position.x;
      let nextZ = playerRef.current.position.z;

      if (moveForward) nextZ -= speed;
      if (moveBackward) nextZ += speed;
      if (moveLeft) nextX -= speed;
      if (moveRight) nextX += speed;

      nextX = THREE.MathUtils.clamp(nextX, -5.8, 5.8);
      nextZ = THREE.MathUtils.clamp(nextZ, -5.1, 5.1);

      playerRef.current.position.x = nextX;
      playerRef.current.position.z = nextZ;
    }

    // 实时检测主角与小动物的距离
    const currentPos = playerRef.current.position;
    const nearby = npcData.find((npc) => {
      const dx = currentPos.x - npc.position[0];
      const dz = currentPos.z - npc.position[2];
      return Math.sqrt(dx * dx + dz * dz) < 1.6;
    });

    const nearbyId = nearby ? nearby.id : null;
    if (nearbyId !== lastNearbyId.current) {
      lastNearbyId.current = nearbyId;
      onNearbyChange(nearby || null);
    }
  });

  return null;
}

function FriendshipWorld({ playerRef, dpadState, onNearbyChange, controlsDisabled, onNpcInteract }) {
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
        <Npc npc={npc} key={npc.id} onInteract={onNpcInteract} />
      ))}
      <Player playerRef={playerRef} />
      <MovementController
        playerRef={playerRef}
        dpadState={dpadState}
        onNearbyChange={onNearbyChange}
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
  const playerRef = useRef(null);
  const dpadState = useRef({ forward: false, backward: false, left: false, right: false });

  const [nearbyNpc, setNearbyNpc] = useState(null);
  const [activeNpc, setActiveNpc] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleNpcInteract = (npc) => {
    setActiveNpc(npc);
    setFeedback("");
  };

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

  const handleSpeakNpc = () => {
    if (!activeNpc) return;
    const textToSpeak = `${activeNpc.name}说：${activeNpc.story}。请选择回答。选项一：${activeNpc.answers[0].text}。选项二：${activeNpc.answers[1].text}。选项三：${activeNpc.answers[2].text}。`;
    speakText(textToSpeak);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const isInteractKey =
        event.key.toLowerCase() === "e" || event.code.toLowerCase() === "keye";

      if (isInteractKey && nearbyNpc && !activeNpc) {
        event.preventDefault();
        handleNpcInteract(nearbyNpc);
        return;
      }

      if (activeNpc) {
        const key = event.key;
        if (["1", "2", "3"].includes(key)) {
          const index = parseInt(key) - 1;
          if (index >= 0 && index < activeNpc.answers.length) {
            event.preventDefault();
            chooseAnswer(activeNpc.answers[index]);
          }
        }
        if (key === "Escape") {
          event.preventDefault();
          setActiveNpc(null);
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, { capture: true, passive: false });
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [activeNpc, nearbyNpc]);

  useEffect(() => {
    canvasShellRef.current?.focus();
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

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
          <p>用 WASD / 方向键或右下角虚拟按键移动。靠近或点击小动物开始对话。</p>
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
            playerRef={playerRef}
            dpadState={dpadState}
            onNearbyChange={setNearbyNpc}
            controlsDisabled={Boolean(activeNpc)}
            onNpcInteract={handleNpcInteract}
          />
        </Canvas>

        {/* Tactile Virtual D-pad for Kids & Touch Screens */}
        <div className="virtual-dpad" aria-label="移动控制键">
          <button
            className="dpad-btn dpad-up"
            onPointerDown={() => { dpadState.current.forward = true; }}
            onPointerUp={() => { dpadState.current.forward = false; }}
            onPointerLeave={() => { dpadState.current.forward = false; }}
            onTouchStart={(e) => { e.preventDefault(); dpadState.current.forward = true; }}
            onTouchEnd={() => { dpadState.current.forward = false; }}
          >
            ⬆️
          </button>
          <div className="dpad-row">
            <button
              className="dpad-btn dpad-left"
              onPointerDown={() => { dpadState.current.left = true; }}
              onPointerUp={() => { dpadState.current.left = false; }}
              onPointerLeave={() => { dpadState.current.left = false; }}
              onTouchStart={(e) => { e.preventDefault(); dpadState.current.left = true; }}
              onTouchEnd={() => { dpadState.current.left = false; }}
            >
              ⬅️
            </button>
            <button
              className="dpad-btn dpad-down"
              onPointerDown={() => { dpadState.current.backward = true; }}
              onPointerUp={() => { dpadState.current.backward = false; }}
              onPointerLeave={() => { dpadState.current.backward = false; }}
              onTouchStart={(e) => { e.preventDefault(); dpadState.current.backward = true; }}
              onTouchEnd={() => { dpadState.current.backward = false; }}
            >
              ⬇️
            </button>
            <button
              className="dpad-btn dpad-right"
              onPointerDown={() => { dpadState.current.right = true; }}
              onPointerUp={() => { dpadState.current.right = false; }}
              onPointerLeave={() => { dpadState.current.right = false; }}
              onTouchStart={(e) => { e.preventDefault(); dpadState.current.right = true; }}
              onTouchEnd={() => { dpadState.current.right = false; }}
            >
              ➡️
            </button>
          </div>
        </div>

        {nearbyNpc && !activeNpc && (
          <button className="three-d-near-tip" onClick={() => handleNpcInteract(nearbyNpc)}>
            靠近了{nearbyNpc.name}，按 E 或点击这里开始对话
          </button>
        )}
      </div>

      <div className="three-d-help">
        <span>键盘移动：WASD / 方向键</span>
        <span>屏幕控制：右下角虚拟按键</span>
        <span>互动：靠近后按 E，或直接点击小动物</span>
        <span>当前 NPC：{nearbyNpc?.name ?? "继续探索"}</span>
      </div>

      {activeNpc && (
        <div className="npc-dialogue-panel">
          <div className="npc-dialogue-header">
            <span style={{ background: activeNpc.color }}>{activeNpc.name}</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                className="audio-speak-btn"
                onClick={handleSpeakNpc}
                style={{ margin: 0 }}
                title="语音朗读"
                aria-label="语音朗读对话"
              >
                🔊
              </button>
              <button onClick={() => setActiveNpc(null)}>关闭</button>
            </div>
          </div>
          <p><TypewriterText key={activeNpc.id} text={activeNpc.story} /></p>
          <div className="npc-answer-list">
            {activeNpc.answers.map((answer, index) => (
              <button
                className="choice-card"
                key={answer.text}
                onClick={() => chooseAnswer(answer)}
              >
                <span className="key-badge">{index + 1}</span>
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
              <TypewriterText key={feedback} text={feedback} />
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
