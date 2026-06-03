import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_ROOTS = {
  pets: "/models/cube-pets",
  characters: "/models/mini-characters",
};

const emotions = [
  { id: "sad", label: "难过", icon: "水滴", color: "#8bd3ff" },
  { id: "angry", label: "生气", icon: "火苗", color: "#ff9aa6" },
  { id: "anxious", label: "着急", icon: "时钟", color: "#ffd36e" },
  { id: "scared", label: "害怕", icon: "月亮", color: "#b7a7ff" },
];

const roomConfigs = [
  {
    id: "makerRoom",
    label: "创作屋",
    color: "#ffd3df",
    wallColor: "#fff0f5",
    floorColor: "#ffe6ef",
    doorPosition: [-5.9, 0, -3.9],
    doorRotation: 0.28,
  },
  {
    id: "storyRoom",
    label: "故事屋",
    color: "#bfe8ff",
    wallColor: "#edf8ff",
    floorColor: "#dff4ff",
    doorPosition: [5.9, 0, -3.9],
    doorRotation: -0.28,
  },
  {
    id: "garden",
    label: "花园房",
    color: "#d7f6c9",
    wallColor: "#f0ffe8",
    floorColor: "#dff8e8",
    doorPosition: [-5.9, 0, 3.9],
    doorRotation: -0.25,
  },
  {
    id: "quietRoom",
    label: "安静角",
    color: "#d9d1ff",
    wallColor: "#f3f0ff",
    floorColor: "#eee8ff",
    doorPosition: [5.9, 0, 3.9],
    doorRotation: 0.25,
  },
];

const missions = [
  {
    id: "blockDoor",
    roomId: "makerRoom",
    sender: "小熊",
    emotion: "angry",
    intensity: 4,
    modelUrl: `${MODEL_ROOTS.pets}/animal-panda.glb`,
    title: "积木倒了以后",
    event: "小熊认真搭好的积木被碰倒了，它在创作屋里来回走，手握得很紧。",
    clues: ["握紧小拳头", "眉毛皱起来", "声音变大", "身体转向一边"],
    bodyHint: "握拳和大声说话常常说明怒气正在变高。",
    friendlyReply: "我知道你很生气，因为你认真搭好的积木倒了。你可以说：请下次小心一点，我们一起重新搭吧。",
  },
  {
    id: "stageDoor",
    roomId: "storyRoom",
    sender: "小猫",
    emotion: "scared",
    intensity: 3,
    modelUrl: `${MODEL_ROOTS.pets}/animal-cat.glb`,
    title: "想讲故事但有点怕",
    event: "小猫想在故事屋讲故事，可是它躲在书架旁，声音很轻。",
    clues: ["躲在书架边", "声音很轻", "眼睛看地面", "往后退一步"],
    bodyHint: "后退、低头和小声说话，可能是在害怕或不好意思。",
    friendlyReply: "我看到你有点害怕，因为你还没有准备好。我们可以先在门口练一句，再一起进去。",
  },
  {
    id: "gardenDoor",
    roomId: "garden",
    sender: "小兔",
    emotion: "anxious",
    intensity: 3,
    modelUrl: `${MODEL_ROOTS.pets}/animal-bunny.glb`,
    title: "等花园游戏等太久",
    event: "小兔在花园房等了很久，它不停跺脚，又一直看向队伍前面。",
    clues: ["不停跺脚", "一直问轮到我了吗", "呼吸变快", "来回看队伍"],
    bodyHint: "跺脚、反复问和呼吸快，常常是着急的身体信号。",
    friendlyReply: "你等得很着急。我们可以先吸气、呼气，再问一问队伍发生了什么。",
  },
  {
    id: "quietDoor",
    roomId: "quietRoom",
    sender: "小鹿",
    emotion: "sad",
    intensity: 2,
    modelUrl: `${MODEL_ROOTS.pets}/animal-deer.glb`,
    title: "没有被听见",
    event: "小鹿想加入朋友的游戏，但大家没有听见它说话，它慢慢走到安静角里。",
    clues: ["低着头", "肩膀垂下来", "轻轻叹气", "离朋友越来越远"],
    bodyHint: "低头、叹气和走远，可能是在难过，需要被看见。",
    friendlyReply: "你有点难过，因为你想一起玩但没有被听见。我可以陪你再说一次：我可以加入吗？",
  },
];

const replyBlocks = {
  feeling: ["我知道你现在有点", "我看到你可能觉得", "这件事让你感到"],
  reason: ["因为你还没有准备好", "因为你很想和大家一起玩", "因为你认真做的东西被碰倒了", "因为你等了很久"],
  wish: ["我们可以先深呼吸。", "你可以温柔地说出自己的想法。", "我陪你一起试一次。", "我们一起找老师帮忙。"],
};

function getEmotion(id) {
  return emotions.find((emotion) => emotion.id === id) || emotions[0];
}

function getRoom(id) {
  return roomConfigs.find((room) => room.id === id) || roomConfigs[0];
}

function getMissionForRoom(roomId) {
  return missions.find((mission) => mission.roomId === roomId) || missions[0];
}

function LoadedModel({ url, targetSize = 1.25 }) {
  const gltf = useGLTF(url);

  const model = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = targetSize / (Math.max(size.x, size.y, size.z) || 1);

    return {
      scene,
      scale,
      offset: [-center.x * scale, -box.min.y * scale, -center.z * scale],
    };
  }, [gltf.scene, targetSize]);

  return <primitive object={model.scene} position={model.offset} scale={model.scale} />;
}

function Model({ url, color = "#ffd766", targetSize = 1.25 }) {
  return (
    <Suspense fallback={<FallbackModel color={color} />}>
      <LoadedModel url={url} targetSize={targetSize} />
    </Suspense>
  );
}

function FallbackModel({ color }) {
  return (
    <group>
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Player({ playerRef, label = "v2 小邮递员" }) {
  return (
    <group ref={playerRef} position={[0, 0, 1.9]}>
      <Model url={`${MODEL_ROOTS.characters}/character-female-a.glb`} color="#7cc9ff" targetSize={1.45} />
      <Html position={[0, 1.75, 0]} center>
        <div className="player-name-tag">{label}</div>
      </Html>
    </group>
  );
}

function OpeningDoor({ room, isOpen, isNearby, onEnter }) {
  const panelRef = useRef(null);

  useFrame((_, delta) => {
    if (!panelRef.current) return;
    const target = isOpen ? -Math.PI / 2.8 : 0;
    panelRef.current.rotation.y = THREE.MathUtils.damp(panelRef.current.rotation.y, target, 7, delta);
  });

  return (
    <group position={room.doorPosition} rotation={[0, room.doorRotation, 0]}>
      <mesh position={[0, 0.95, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 1.9, 0.18]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <group ref={panelRef} position={[-0.72, 0.9, 0]}>
        <mesh position={[0.72, 0, 0]} castShadow>
          <boxGeometry args={[1.42, 1.72, 0.16]} />
          <meshStandardMaterial color={room.color} />
        </mesh>
        <mesh position={[1.18, 0, 0.1]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
      </group>
      <Html position={[0, 2.18, 0]} center>
        <button className={`v2-door-label ${isNearby ? "near" : ""}`} onClick={() => onEnter(room.id)}>
          进入 {room.label}
        </button>
      </Html>
    </group>
  );
}

function HallWorld({ dpadState, currentNearbyRoomId, openRoomIds, onNearbyRoom, onEnterRoom }) {
  const playerRef = useRef(null);
  const keys = useRef({ forward: false, backward: false, left: false, right: false });
  const lastRoomId = useRef("");

  useEffect(() => {
    const handleDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === "w" || key === "arrowup") keys.current.forward = true;
      if (key === "s" || key === "arrowdown") keys.current.backward = true;
      if (key === "a" || key === "arrowleft") keys.current.left = true;
      if (key === "d" || key === "arrowright") keys.current.right = true;
      if (key === "e" && currentNearbyRoomId) onEnterRoom(currentNearbyRoomId);
    };
    const handleUp = (event) => {
      const key = event.key.toLowerCase();
      if (key === "w" || key === "arrowup") keys.current.forward = false;
      if (key === "s" || key === "arrowdown") keys.current.backward = false;
      if (key === "a" || key === "arrowleft") keys.current.left = false;
      if (key === "d" || key === "arrowright") keys.current.right = false;
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [currentNearbyRoomId, onEnterRoom]);

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player) return;

    const moveX = (keys.current.right || dpadState.current.right ? 1 : 0) - (keys.current.left || dpadState.current.left ? 1 : 0);
    const moveZ = (keys.current.backward || dpadState.current.backward ? 1 : 0) - (keys.current.forward || dpadState.current.forward ? 1 : 0);

    if (moveX || moveZ) {
      const length = Math.hypot(moveX, moveZ) || 1;
      const speed = 4.1 * delta;
      player.position.x = THREE.MathUtils.clamp(player.position.x + (moveX / length) * speed, -6.4, 6.4);
      player.position.z = THREE.MathUtils.clamp(player.position.z + (moveZ / length) * speed, -4.9, 4.9);
      player.rotation.y = Math.atan2(moveX, moveZ);
    }

    const nearbyRoom = roomConfigs.find((room) => {
      const dx = player.position.x - room.doorPosition[0];
      const dz = player.position.z - room.doorPosition[2];
      return Math.hypot(dx, dz) < 1.55;
    });
    const nearbyId = nearbyRoom?.id || "";
    if (nearbyId !== lastRoomId.current) {
      lastRoomId.current = nearbyId;
      onNearbyRoom(nearbyId);
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 5]} intensity={1.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 12]} />
        <meshStandardMaterial color="#b8edb2" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <planeGeometry args={[14.5, 0.86]} />
        <meshStandardMaterial color="#fff4c2" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2.6]}>
        <planeGeometry args={[11.2, 0.76]} />
        <meshStandardMaterial color="#bee9ff" />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.05, 1.24, 1.55]} />
        <meshStandardMaterial color="#fff3a6" />
      </mesh>
      <mesh position={[0, 1.46, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.42, 0.86, 4]} />
        <meshStandardMaterial color="#ff8aa4" />
      </mesh>
      <Html position={[0, 2.25, 0]} center>
        <div className="delivery-world-label">v2 情绪邮局大厅</div>
      </Html>
      {roomConfigs.map((room) => (
        <OpeningDoor
          key={room.id}
          room={room}
          isOpen={openRoomIds.includes(room.id)}
          isNearby={currentNearbyRoomId === room.id}
          onEnter={onEnterRoom}
        />
      ))}
      <Player playerRef={playerRef} />
      <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />
    </>
  );
}

function RoomAnimal({ mission, completed, onSelect }) {
  const groupRef = useRef(null);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const waitRef = useRef(0);
  const emotion = getEmotion(mission.emotion);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    waitRef.current -= delta;
    if (waitRef.current <= 0 || group.position.distanceTo(targetRef.current) < 0.12) {
      targetRef.current.set((Math.random() - 0.5) * 5.1, 0, (Math.random() - 0.5) * 3.5);
      waitRef.current = 1.1 + Math.random() * 2.2;
    }

    const before = group.position.clone();
    group.position.lerp(targetRef.current, Math.min(1, delta * (completed ? 0.25 : 0.75)));
    const move = group.position.clone().sub(before);
    if (move.lengthSq() > 0.0001) group.rotation.y = Math.atan2(move.x, move.z);
  });

  return (
    <group ref={groupRef} position={[0.8, 0, -0.2]} onClick={(event) => {
      event.stopPropagation();
      onSelect(mission.id);
    }}>
      <Model url={mission.modelUrl} color={emotion.color} targetSize={1.25} />
      <Html position={[0, 1.95, 0]} center>
        <button className={`v2-animal-bubble ${completed ? "done" : ""}`} onClick={() => onSelect(mission.id)}>
          <strong>{mission.sender}</strong>
          <span>{completed ? "我收到回信啦" : mission.title}</span>
          {!completed && <em>{emotion.label} 强度 {mission.intensity}/5</em>}
        </button>
      </Html>
    </group>
  );
}

function RoomProps({ roomId }) {
  if (roomId === "makerRoom") {
    return (
      <>
        {[-1.8, 0, 1.8].map((x, index) => (
          <mesh key={x} position={[x, 0.2 + index * 0.12, -2.2]} castShadow>
            <boxGeometry args={[0.7, 0.4, 0.7]} />
            <meshStandardMaterial color={["#ffd766", "#8bd3ff", "#ff9aa6"][index]} />
          </mesh>
        ))}
      </>
    );
  }

  if (roomId === "storyRoom") {
    return (
      <>
        {[-2.4, 2.4].map((x) => (
          <mesh key={x} position={[x, 0.8, -2.1]} castShadow>
            <boxGeometry args={[0.8, 1.6, 0.34]} />
            <meshStandardMaterial color="#c8ecff" />
          </mesh>
        ))}
        <mesh position={[0, 0.06, -2.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.1, 32]} />
          <meshStandardMaterial color="#fff2bd" />
        </mesh>
      </>
    );
  }

  if (roomId === "garden") {
    return (
      <>
        {[-2.5, -1.3, 1.3, 2.5].map((x, index) => (
          <group key={x} position={[x, 0, -2 + (index % 2) * 0.9]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.55, 12]} />
              <meshStandardMaterial color="#5f9f58" />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow>
              <sphereGeometry args={[0.22, 18, 18]} />
              <meshStandardMaterial color={index % 2 ? "#ffd3df" : "#fff2bd"} />
            </mesh>
          </group>
        ))}
      </>
    );
  }

  return (
    <>
      <mesh position={[-2.1, 0.08, -2.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[2.0, 0.3, -2.0]} castShadow>
        <boxGeometry args={[1.3, 0.28, 0.8]} />
        <meshStandardMaterial color="#d9d1ff" />
      </mesh>
    </>
  );
}

function RoomWorld({ room, mission, completed, onSelectMission, onExitRoom }) {
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[3, 7, 4]} intensity={1.18} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      <mesh position={[0, 1.25, -3]} receiveShadow>
        <boxGeometry args={[8.2, 2.5, 0.18]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[-4, 1.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[6, 2.5, 0.18]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[4, 1.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[6, 2.5, 0.18]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[0, 0.95, 2.86]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 1.9, 0.18]} />
        <meshStandardMaterial color={room.color} />
      </mesh>
      <Html position={[0, 2.18, 2.78]} center>
        <button className="v2-door-label near" onClick={onExitRoom}>
          回到大厅
        </button>
      </Html>
      <Html position={[0, 2.55, -2.82]} center>
        <div className="delivery-world-label">{room.label}</div>
      </Html>
      <RoomProps roomId={room.id} />
      <RoomAnimal mission={mission} completed={completed} onSelect={onSelectMission} />
      <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />
    </>
  );
}

function V2Dpad({ dpadState }) {
  const bind = (direction) => ({
    onPointerDown: (event) => {
      event.preventDefault();
      dpadState.current[direction] = true;
    },
    onPointerUp: () => {
      dpadState.current[direction] = false;
    },
    onPointerLeave: () => {
      dpadState.current[direction] = false;
    },
    onPointerCancel: () => {
      dpadState.current[direction] = false;
    },
  });

  return (
    <div className="delivery-dpad v2-dpad" aria-label="移动按钮">
      <button {...bind("forward")} aria-label="向上">↑</button>
      <div>
        <button {...bind("left")} aria-label="向左">←</button>
        <button {...bind("backward")} aria-label="向下">↓</button>
        <button {...bind("right")} aria-label="向右">→</button>
      </div>
    </div>
  );
}

function EmotionThermometer({ value, onChange }) {
  return (
    <div className="v2-thermometer">
      <div>
        <strong>情绪温度计</strong>
        <span>{value}/5</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        aria-label="情绪强度"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="v2-temp-labels">
        <span>一点点</span>
        <span>很强烈</span>
      </div>
    </div>
  );
}

function BodyCluePanel({ mission, selectedClues, onToggle }) {
  return (
    <section className="v2-panel">
      <h3>身体线索观察</h3>
      <p>{mission.bodyHint}</p>
      <div className="v2-clue-grid">
        {mission.clues.map((clue) => (
          <button
            key={clue}
            className={selectedClues.includes(clue) ? "selected" : ""}
            onClick={() => onToggle(clue)}
          >
            {clue}
          </button>
        ))}
      </div>
    </section>
  );
}

function FreeReplyBuilder({ mission, selectedEmotion, replyParts, onPick, customText, onCustom }) {
  const emotion = getEmotion(selectedEmotion || mission.emotion);
  const builtReply = `${replyParts.feeling || ""}${emotion.label}${replyParts.reason ? "，" + replyParts.reason : ""}${replyParts.wish ? "。" + replyParts.wish : ""}`;

  return (
    <section className="v2-panel v2-reply-builder">
      <h3>自由回信模式</h3>
      <p>选句子卡片，也可以自己补一句。系统不会只有一个标准答案。</p>
      {Object.entries(replyBlocks).map(([group, blocks]) => (
        <div className="v2-reply-row" key={group}>
          {blocks.map((block) => (
            <button
              key={block}
              className={replyParts[group] === block ? "selected" : ""}
              onClick={() => onPick(group, block)}
            >
              {block}
            </button>
          ))}
        </div>
      ))}
      <label className="v2-custom-reply">
        <span>我还想说</span>
        <textarea value={customText} onChange={(event) => onCustom(event.target.value)} maxLength={90} />
      </label>
      <div className="v2-reply-preview">
        <strong>回信预览</strong>
        <p>{builtReply || mission.friendlyReply}</p>
        {customText && <p>{customText}</p>}
      </div>
    </section>
  );
}

function AccessibilityBar({ largeText, calmMode, audioOn, onToggleLargeText, onToggleCalmMode, onToggleAudio }) {
  return (
    <div className="v2-accessibility-bar" aria-label="低龄和无障碍设置">
      <button className={largeText ? "active" : ""} onClick={onToggleLargeText}>大字</button>
      <button className={calmMode ? "active" : ""} onClick={onToggleCalmMode}>安静配色</button>
      <button className={audioOn ? "active" : ""} onClick={onToggleAudio}>语音提示</button>
    </div>
  );
}

function speak(text, enabled) {
  if (!enabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  window.speechSynthesis.speak(utterance);
}

export default function V2EmotionPostOffice({ onBackToModeChoice }) {
  const dpadState = useRef({ forward: false, backward: false, left: false, right: false });
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [nearbyRoomId, setNearbyRoomId] = useState("");
  const [openRoomIds, setOpenRoomIds] = useState([]);
  const [activeMissionId, setActiveMissionId] = useState(missions[0].id);
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("emotion-post-office-v2-completed") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedEmotion, setSelectedEmotion] = useState(missions[0].emotion);
  const [temperature, setTemperature] = useState(missions[0].intensity);
  const [selectedClues, setSelectedClues] = useState([]);
  const [replyParts, setReplyParts] = useState({ feeling: "", reason: "", wish: "" });
  const [customText, setCustomText] = useState("");
  const [largeText, setLargeText] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [feedback, setFeedback] = useState("先走到大厅的门边，打开门进入房间，再观察里面移动的小动物。");

  const currentRoom = currentRoomId ? getRoom(currentRoomId) : null;
  const activeMission = missions.find((mission) => mission.id === activeMissionId) || missions[0];
  const activeEmotion = getEmotion(activeMission.emotion);
  const activeRoom = getRoom(activeMission.roomId);
  const canSend = selectedEmotion === activeMission.emotion && selectedClues.length >= 2 && replyParts.feeling && replyParts.reason && replyParts.wish;

  useEffect(() => {
    localStorage.setItem("emotion-post-office-v2-completed", JSON.stringify(completedIds));
  }, [completedIds]);

  useEffect(() => {
    setSelectedEmotion(activeMission.emotion);
    setTemperature(activeMission.intensity);
    setSelectedClues([]);
    setReplyParts({ feeling: "", reason: "", wish: "" });
    setCustomText("");
    speak(`${activeMission.sender}在${activeRoom.label}里。${activeMission.event}`, audioOn);
  }, [activeMissionId]);

  const enterRoom = (roomId) => {
    const mission = getMissionForRoom(roomId);
    const room = getRoom(roomId);
    setOpenRoomIds((ids) => ids.includes(roomId) ? ids : [...ids, roomId]);
    setCurrentRoomId(roomId);
    setActiveMissionId(mission.id);
    setFeedback(`你进入了${room.label}。请观察${mission.sender}在房间里怎么移动、停顿和表达。`);
    speak(`进入${room.label}`, audioOn);
  };

  const exitRoom = () => {
    setCurrentRoomId(null);
    setFeedback("你回到了大厅。可以换一扇门，进入另一个房间观察新的小动物。");
  };

  const selectMission = (missionId) => {
    const mission = missions.find((item) => item.id === missionId);
    if (!mission) return;
    setActiveMissionId(missionId);
    setFeedback(`正在观察${mission.sender}：${mission.title}`);
  };

  const toggleClue = (clue) => {
    setSelectedClues((clues) => clues.includes(clue) ? clues.filter((item) => item !== clue) : [...clues, clue]);
  };

  const sendReply = () => {
    if (!canSend) {
      setFeedback("还差一点：至少选两个身体线索，选对情绪，再拼出完整回信。");
      speak("还差一点，请继续观察线索。", audioOn);
      return;
    }
    setCompletedIds((ids) => ids.includes(activeMission.id) ? ids : [...ids, activeMission.id]);
    setFeedback(`${activeMission.sender}在${activeRoom.label}收到了你的回信，也学会了用 ${temperature}/5 的强度说出感受。`);
    speak("回信送达，做得很好。", audioOn);
  };

  const canvasHint = currentRoom
    ? `房间：${currentRoom.label}，小动物会在房间里移动`
    : nearbyRoomId
      ? `靠近 ${getRoom(nearbyRoomId).label}，按 E 或点击门进入`
      : "大厅：走到门边进入房间";

  return (
    <div className={`v2-shell fade-in ${largeText ? "large-text" : ""} ${calmMode ? "calm-mode" : ""}`}>
      <header className="v2-header">
        <div>
          <span>v2 房间版</span>
          <h2>情绪小邮局 v2</h2>
          <p>打开门会进入独立房间，小动物会在房间里移动；观察身体线索后再自由回信。</p>
        </div>
        <AccessibilityBar
          largeText={largeText}
          calmMode={calmMode}
          audioOn={audioOn}
          onToggleLargeText={() => setLargeText((value) => !value)}
          onToggleCalmMode={() => setCalmMode((value) => !value)}
          onToggleAudio={() => setAudioOn((value) => !value)}
        />
      </header>

      <div className={`v2-map-wrap ${currentRoom ? "room-mode" : ""}`}>
        <Canvas camera={{ position: [0, 7.4, 8.0], fov: currentRoom ? 48 : 50 }} gl={{ preserveDrawingBuffer: true }} shadows>
          {currentRoom ? (
            <RoomWorld
              room={currentRoom}
              mission={getMissionForRoom(currentRoom.id)}
              completed={completedIds.includes(getMissionForRoom(currentRoom.id).id)}
              onSelectMission={selectMission}
              onExitRoom={exitRoom}
            />
          ) : (
            <HallWorld
              dpadState={dpadState}
              currentNearbyRoomId={nearbyRoomId}
              openRoomIds={openRoomIds}
              onNearbyRoom={setNearbyRoomId}
              onEnterRoom={enterRoom}
            />
          )}
        </Canvas>
        <div className="delivery-canvas-hint">
          <span>{canvasHint}</span>
          <span>{completedIds.length}/{missions.length} 已完成</span>
        </div>
        {!currentRoom && <V2Dpad dpadState={dpadState} />}
      </div>

      <main className="v2-workbench">
        <section className="v2-panel v2-mission-card">
          <div className="v2-mission-title">
            <span style={{ background: activeEmotion.color }}>{activeEmotion.icon}</span>
            <div>
              <h3>{activeMission.sender}：{activeMission.title}</h3>
              <p>{activeMission.event}</p>
            </div>
          </div>
          <div className="v2-door-action">
            <strong>当前房间：{activeRoom.label}</strong>
            <button onClick={() => enterRoom(activeMission.roomId)}>
              进入这个房间
            </button>
          </div>
          <div className="v2-emotion-grid">
            {emotions.map((emotion) => (
              <button
                key={emotion.id}
                className={selectedEmotion === emotion.id ? "selected" : ""}
                onClick={() => setSelectedEmotion(emotion.id)}
                style={{ "--emotion-color": emotion.color }}
              >
                <span>{emotion.icon}</span>
                {emotion.label}
              </button>
            ))}
          </div>
          <EmotionThermometer value={temperature} onChange={setTemperature} />
        </section>

        <BodyCluePanel mission={activeMission} selectedClues={selectedClues} onToggle={toggleClue} />
        <FreeReplyBuilder
          mission={activeMission}
          selectedEmotion={selectedEmotion}
          replyParts={replyParts}
          onPick={(group, value) => setReplyParts((parts) => ({ ...parts, [group]: value }))}
          customText={customText}
          onCustom={setCustomText}
        />

        <section className="v2-panel v2-send-panel">
          <div>
            <strong>寄信检查</strong>
            <p>{feedback}</p>
            <small>低龄提示：先进入房间，看小动物怎么动；再点身体线索、情绪卡和黄色寄信按钮。</small>
          </div>
          <button className="primary-button" onClick={sendReply}>寄出自由回信</button>
          <button className="secondary-button" onClick={onBackToModeChoice}>返回版本选择</button>
        </section>
      </main>
    </div>
  );
}

useGLTF.preload(`${MODEL_ROOTS.pets}/animal-panda.glb`);
useGLTF.preload(`${MODEL_ROOTS.pets}/animal-cat.glb`);
useGLTF.preload(`${MODEL_ROOTS.pets}/animal-bunny.glb`);
useGLTF.preload(`${MODEL_ROOTS.pets}/animal-deer.glb`);
useGLTF.preload(`${MODEL_ROOTS.characters}/character-female-a.glb`);
