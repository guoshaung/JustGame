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

const BOARD_COLS = 7;
const BOARD_ROWS = 5;
const BOARD_STEP = 1.55;

const hallMailTokens = [
  {
    id: "welcome",
    name: "巡线信",
    color: "#ffd766",
    start: { col: 1, row: 2 },
    pattern: "horizontal",
    rule: "沿中间一排左右巡线，碰到边缘会折返。",
  },
  {
    id: "maker",
    name: "升降信",
    color: "#ff9aa6",
    start: { col: 2, row: 0 },
    pattern: "vertical",
    rule: "沿固定一列上下移动，每回合前进一格。",
  },
  {
    id: "story",
    name: "环游信",
    color: "#8bd3ff",
    start: { col: 6, row: 0 },
    pattern: "perimeter",
    rule: "沿棋盘外圈顺时针环游，可以提前在拐角埋伏。",
  },
  {
    id: "garden",
    name: "斜跳信",
    color: "#9be28f",
    start: { col: 0, row: 4 },
    pattern: "diagonal",
    rule: "每回合斜着跳一格，碰到边缘改变方向。",
  },
  {
    id: "quiet",
    name: "闪现信",
    color: "#b7a7ff",
    start: { col: 5, row: 3 },
    pattern: "teleport",
    rule: "按照星形路线闪现，每三步会回到中心附近。",
  },
];

const perimeterPath = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
  { col: 3, row: 0 }, { col: 4, row: 0 }, { col: 5, row: 0 },
  { col: 6, row: 0 }, { col: 6, row: 1 }, { col: 6, row: 2 },
  { col: 6, row: 3 }, { col: 6, row: 4 }, { col: 5, row: 4 },
  { col: 4, row: 4 }, { col: 3, row: 4 }, { col: 2, row: 4 },
  { col: 1, row: 4 }, { col: 0, row: 4 }, { col: 0, row: 3 },
  { col: 0, row: 2 }, { col: 0, row: 1 },
];

const teleportPath = [
  { col: 5, row: 3 },
  { col: 3, row: 1 },
  { col: 1, row: 3 },
  { col: 3, row: 2 },
  { col: 5, row: 1 },
  { col: 3, row: 3 },
];

function boardToWorld(cell, y = 0) {
  return [
    (cell.col - (BOARD_COLS - 1) / 2) * BOARD_STEP,
    y,
    (cell.row - (BOARD_ROWS - 1) / 2) * BOARD_STEP,
  ];
}

function createInitialTokenStates() {
  return Object.fromEntries(
    hallMailTokens.map((token) => [
      token.id,
      {
        ...token.start,
        directionX: 1,
        directionY: 1,
        pathIndex: token.pattern === "perimeter"
          ? perimeterPath.findIndex((cell) => cell.col === token.start.col && cell.row === token.start.row)
          : 0,
      },
    ]),
  );
}

function moveTokenByRule(token, state, turn) {
  if (token.pattern === "horizontal") {
    let nextCol = state.col + state.directionX;
    let nextDirection = state.directionX;
    if (nextCol < 0 || nextCol >= BOARD_COLS) {
      nextDirection *= -1;
      nextCol = state.col + nextDirection;
    }
    return { ...state, col: nextCol, directionX: nextDirection };
  }

  if (token.pattern === "vertical") {
    let nextRow = state.row + state.directionY;
    let nextDirection = state.directionY;
    if (nextRow < 0 || nextRow >= BOARD_ROWS) {
      nextDirection *= -1;
      nextRow = state.row + nextDirection;
    }
    return { ...state, row: nextRow, directionY: nextDirection };
  }

  if (token.pattern === "perimeter") {
    const nextIndex = (state.pathIndex + 1) % perimeterPath.length;
    return { ...state, ...perimeterPath[nextIndex], pathIndex: nextIndex };
  }

  if (token.pattern === "diagonal") {
    let nextCol = state.col + state.directionX;
    let nextRow = state.row + state.directionY;
    let directionX = state.directionX;
    let directionY = state.directionY;
    if (nextCol < 0 || nextCol >= BOARD_COLS) {
      directionX *= -1;
      nextCol = state.col + directionX;
    }
    if (nextRow < 0 || nextRow >= BOARD_ROWS) {
      directionY *= -1;
      nextRow = state.row + directionY;
    }
    return { ...state, col: nextCol, row: nextRow, directionX, directionY };
  }

  const nextIndex = (turn + 1) % teleportPath.length;
  return { ...state, ...teleportPath[nextIndex], pathIndex: nextIndex };
}

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

const mailCardDecks = {
  angry: [
    { id: "angry-listen", stage: "listen", title: "先听一听", text: "我看到你握紧拳头了，愿意告诉我发生了什么吗？", power: "倾听 +2" },
    { id: "angry-feel", stage: "feeling", title: "说出感受", text: "积木被碰倒让你很生气，我能理解。", power: "共情 +2" },
    { id: "angry-act", stage: "action", title: "一起重建", text: "我们先停一下，再告诉朋友要小心，并一起重新搭。", power: "行动 +2" },
    { id: "angry-lecture", stage: "trap", title: "马上讲道理", text: "你不应该生气，赶快表现得开心一点。", power: "压力 +1" },
    { id: "angry-revenge", stage: "trap", title: "以牙还牙", text: "别人碰倒你的积木，你也去碰倒他的。", power: "冲突 +2" },
    { id: "angry-ignore", stage: "trap", title: "假装没事", text: "别管积木了，我们当作什么都没发生。", power: "理解 -1" },
  ],
  scared: [
    { id: "scared-listen", stage: "listen", title: "问问担心", text: "你一直看着地面，是在担心什么吗？", power: "倾听 +2" },
    { id: "scared-feel", stage: "feeling", title: "允许害怕", text: "第一次讲故事会害怕很正常。", power: "安心 +2" },
    { id: "scared-act", stage: "action", title: "陪伴试一次", text: "我陪你先练一句，准备好了我们再进去。", power: "勇气 +2" },
    { id: "scared-force", stage: "trap", title: "立刻上场", text: "别害怕，现在就上去讲，不能后退。", power: "压力 +2" },
    { id: "scared-ignore", stage: "trap", title: "假装没看见", text: "不想讲就算了，我们先去玩别的。", power: "连接 -1" },
    { id: "scared-laugh", stage: "trap", title: "开个玩笑", text: "胆子这么小，大家会笑你的。", power: "勇气 -2" },
  ],
  anxious: [
    { id: "anxious-listen", stage: "listen", title: "发现身体信号", text: "你一直跺脚，是不是等得很着急？", power: "观察 +2" },
    { id: "anxious-feel", stage: "feeling", title: "理解等待", text: "等了很久还没轮到，确实会让人着急。", power: "共情 +2" },
    { id: "anxious-act", stage: "action", title: "呼吸等待", text: "我们先慢慢呼吸，再问问还要等多久。", power: "耐心 +2" },
    { id: "anxious-cut", stage: "trap", title: "偷偷插队", text: "趁别人没注意，赶快排到最前面。", power: "规则 -2" },
    { id: "anxious-shout", stage: "trap", title: "大声催促", text: "一直大喊快一点，大家就会让开。", power: "冲突 +1" },
    { id: "anxious-dismiss", stage: "trap", title: "不要着急", text: "这没什么好着急的，你别想太多。", power: "理解 -1" },
  ],
  sad: [
    { id: "sad-listen", stage: "listen", title: "停下来陪伴", text: "我看到你走到角落了，想和我说说吗？", power: "倾听 +2" },
    { id: "sad-feel", stage: "feeling", title: "看见难过", text: "想加入却没被听见，你一定有点难过。", power: "温暖 +2" },
    { id: "sad-act", stage: "action", title: "再次邀请", text: "我陪你再问一次：我可以加入吗？", power: "连接 +2" },
    { id: "sad-dismiss", stage: "trap", title: "这没什么", text: "别难过了，这点小事不值得说。", power: "理解 -1" },
    { id: "sad-leave", stage: "trap", title: "自己离开", text: "他们没听见就算了，你一个人去别处玩。", power: "连接 -2" },
    { id: "sad-blame", stage: "trap", title: "责怪自己", text: "一定是你声音太小了，所以大家才不理你。", power: "信心 -2" },
  ],
};

const cardStages = [
  { id: "listen", label: "第一回合：倾听线索" },
  { id: "feeling", label: "第二回合：接住感受" },
  { id: "action", label: "第三回合：给出行动" },
];

const storyComics = {
  entry: {
    image: "/story-comics/room-entry-comic.png",
    title: "星光房门打开了",
    frames: [
      { title: "发现来信", text: "小邮递员发现一封正在发光的情绪信。" },
      { title: "推开房门", text: "房门亮起暖光，新的故事正在里面等待。" },
      { title: "找到朋友", text: "房间里，小动物正因为遇到的事情感到不安。" },
      { title: "轻轻靠近", text: "先走到朋友身边，认真听它说发生了什么。" },
    ],
  },
  success: {
    image: "/story-comics/reply-success-comic.png",
    title: "暖心回信送达",
    frames: [
      { title: "认真倾听", text: "小邮递员听懂了朋友藏在动作里的感受。" },
      { title: "组合卡牌", text: "倾听、共情和行动卡组成了一封暖心回信。" },
      { title: "一起行动", text: "有了理解和陪伴，困难也可以一起解决。" },
      { title: "寄出星光", text: "回信化作星光飞向邮筒，新的友谊被点亮。" },
    ],
  },
};

function shuffleCards(cards) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function drawCardHand(cards, stageId) {
  const target = cards.find((card) => card.stage === stageId);
  const distractors = shuffleCards(cards.filter((card) => card.id !== target?.id)).slice(0, 2);
  return shuffleCards([target, ...distractors].filter(Boolean));
}

function StoryComic({ comic, onComplete, onSkip }) {
  const [visibleFrames, setVisibleFrames] = useState(1);
  const isComplete = visibleFrames === comic.frames.length;

  useEffect(() => {
    if (isComplete) return undefined;
    const timer = window.setTimeout(() => {
      setVisibleFrames((value) => Math.min(comic.frames.length, value + 1));
    }, 1050);
    return () => window.clearTimeout(timer);
  }, [comic.frames.length, isComplete, visibleFrames]);

  return (
    <div className="story-comic-overlay" role="dialog" aria-label={comic.title}>
      <section className="story-comic">
        <header>
          <div>
            <span>剧情连环画</span>
            <h3>{comic.title}</h3>
          </div>
          <button onClick={onSkip}>跳过</button>
        </header>
        <div className="story-comic-strip">
          {comic.frames.map((frame, index) => (
            <article
              className={index < visibleFrames ? "visible" : ""}
              key={frame.title}
            >
              <div
                className="story-comic-image"
                style={{
                  backgroundImage: `url(${comic.image})`,
                  backgroundPosition: `${index * 33.333}% center`,
                }}
              />
              <div>
                <strong>{index + 1}. {frame.title}</strong>
                <p>{frame.text}</p>
              </div>
            </article>
          ))}
        </div>
        <footer>
          <span>{visibleFrames}/{comic.frames.length}</span>
          <button onClick={() => {
            if (isComplete) {
              onComplete();
            } else {
              setVisibleFrames((value) => Math.min(comic.frames.length, value + 1));
            }
          }}>
            {isComplete ? "进入故事" : "下一格"}
          </button>
        </footer>
      </section>
    </div>
  );
}

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

function Player({ playerRef, label = "星光邮递员", modelUrl = `${MODEL_ROOTS.characters}/character-female-c.glb` }) {
  return (
    <group ref={playerRef} position={[0, 0, 1.9]}>
      <pointLight position={[0, 1.3, 0.5]} color="#dff7ff" intensity={0.9} distance={3} />
      <Model url={modelUrl} color="#7cc9ff" targetSize={1.55} />
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

function BoardPlayer({ cell }) {
  const groupRef = useRef(null);
  const target = useMemo(() => new THREE.Vector3(...boardToWorld(cell)), [cell.col, cell.row]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.x = THREE.MathUtils.damp(group.position.x, target.x, 11, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, target.z, 11, delta);
    const distance = group.position.distanceTo(target);
    group.position.y = distance > 0.08 ? Math.sin(Math.min(1, distance) * Math.PI) * 0.45 : 0;
  });

  return (
    <group ref={groupRef} position={boardToWorld(cell)}>
      <pointLight position={[0, 1.3, 0.5]} color="#dff7ff" intensity={0.9} distance={3} />
      <Model url={`${MODEL_ROOTS.characters}/character-female-c.glb`} color="#7cc9ff" targetSize={1.45} />
      <Html position={[0, 1.7, 0]} center>
        <div className="player-name-tag">跳跳邮递员</div>
      </Html>
    </group>
  );
}

function MovingBoardMail({ token, cell }) {
  const groupRef = useRef(null);
  const target = useMemo(() => new THREE.Vector3(...boardToWorld(cell, 0.85)), [cell.col, cell.row]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.x = THREE.MathUtils.damp(group.position.x, target.x, 9, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, target.z, 9, delta);
    group.position.y = target.y + Math.sin(clock.elapsedTime * 3 + token.start.col) * 0.12;
    group.rotation.y += delta * 1.6;
  });

  return (
    <group ref={groupRef} position={boardToWorld(cell, 0.85)}>
      <mesh castShadow>
        <boxGeometry args={[0.72, 0.48, 0.12]} />
        <meshStandardMaterial color="#fffdf5" emissive={token.color} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.02, 0.075]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.34, 0.34]} />
        <meshStandardMaterial color={token.color} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={token.color} intensity={0.8} distance={2.2} />
      <Html position={[0, 0.65, 0]} center>
        <div className="board-mail-label">{token.name}</div>
      </Html>
    </group>
  );
}

function HallWorld({
  playerCell,
  tokenStates,
  currentNearbyRoomId,
  openRoomIds,
  collectedMailIds,
  onNearbyRoom,
  onEnterRoom,
}) {
  useEffect(() => {
    const [playerX, , playerZ] = boardToWorld(playerCell);
    const nearbyRoom = roomConfigs.find((room) => {
      const dx = playerX - room.doorPosition[0];
      const dz = playerZ - room.doorPosition[2];
      return Math.hypot(dx, dz) < 2.2;
    });
    onNearbyRoom(nearbyRoom?.id || "");
  }, [onNearbyRoom, playerCell]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 5]} intensity={1.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 11]} />
        <meshStandardMaterial color="#b8edb2" />
      </mesh>
      {Array.from({ length: BOARD_ROWS * BOARD_COLS }, (_, index) => {
        const cell = { col: index % BOARD_COLS, row: Math.floor(index / BOARD_COLS) };
        const [x, , z] = boardToWorld(cell);
        const dark = (cell.col + cell.row) % 2 === 0;
        return (
          <mesh key={`${cell.col}-${cell.row}`} position={[x, 0.035, z]} receiveShadow>
            <boxGeometry args={[1.38, 0.08, 1.38]} />
            <meshStandardMaterial color={dark ? "#fff4c2" : "#dff4ff"} />
          </mesh>
        );
      })}
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
      {hallMailTokens
        .filter((token) => !collectedMailIds.includes(token.id))
        .map((token) => (
          <MovingBoardMail
            key={token.id}
            token={token}
            cell={tokenStates[token.id] || token.start}
          />
        ))}
      <BoardPlayer cell={playerCell} />
      <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />
    </>
  );
}

function RoomAnimal({ mission, completed, canTalk, registerPosition, onTalk }) {
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
    registerPosition(group.position);
  });

  return (
    <group ref={groupRef} position={[0.8, 0, -0.2]} onClick={(event) => {
      event.stopPropagation();
      onTalk();
    }}>
      <Model url={mission.modelUrl} color={emotion.color} targetSize={1.25} />
      <Html position={[0, 1.95, 0]} center>
        <button
          className={`v2-animal-bubble ${completed ? "done" : ""} ${canTalk ? "near" : ""}`}
          onClick={onTalk}
        >
          <strong>{mission.sender}</strong>
          <span>{completed ? "我收到回信啦" : mission.title}</span>
          {!completed && <em>{canTalk ? "现在可以对话" : "靠近我再对话"}</em>}
        </button>
      </Html>
    </group>
  );
}

function RoomMovementController({
  playerRef,
  animalPositionRef,
  dpadState,
  onNearbyChange,
  onTalk,
}) {
  const keys = useRef({ forward: false, backward: false, left: false, right: false });
  const lastNearby = useRef(false);

  useEffect(() => {
    const handleDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === "w" || key === "arrowup") keys.current.forward = true;
      if (key === "s" || key === "arrowdown") keys.current.backward = true;
      if (key === "a" || key === "arrowleft") keys.current.left = true;
      if (key === "d" || key === "arrowright") keys.current.right = true;
      if (key === "e") onTalk();
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
  }, [onTalk]);

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player) return;

    const moveX = (keys.current.right || dpadState.current.right ? 1 : 0)
      - (keys.current.left || dpadState.current.left ? 1 : 0);
    const moveZ = (keys.current.backward || dpadState.current.backward ? 1 : 0)
      - (keys.current.forward || dpadState.current.forward ? 1 : 0);

    if (moveX || moveZ) {
      const length = Math.hypot(moveX, moveZ) || 1;
      const speed = 3.5 * delta;
      player.position.x = THREE.MathUtils.clamp(player.position.x + (moveX / length) * speed, -3.35, 3.35);
      player.position.z = THREE.MathUtils.clamp(player.position.z + (moveZ / length) * speed, -2.45, 2.25);
      player.rotation.y = Math.atan2(moveX, moveZ);
    }

    const animal = animalPositionRef.current;
    const nearby = Boolean(animal) && Math.hypot(
      player.position.x - animal.x,
      player.position.z - animal.z,
    ) < 1.45;
    if (nearby !== lastNearby.current) {
      lastNearby.current = nearby;
      onNearbyChange(nearby);
    }
  });

  return null;
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

function RoomWorld({
  room,
  mission,
  completed,
  dpadState,
  npcNearby,
  onNpcNearby,
  onTalk,
  onExitRoom,
}) {
  const playerRef = useRef(null);
  const animalPositionRef = useRef(new THREE.Vector3(0.8, 0, -0.2));

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
      <RoomAnimal
        mission={mission}
        completed={completed}
        canTalk={npcNearby}
        registerPosition={(position) => {
          animalPositionRef.current.copy(position);
        }}
        onTalk={() => onTalk(true)}
      />
      <Player playerRef={playerRef} />
      <RoomMovementController
        playerRef={playerRef}
        animalPositionRef={animalPositionRef}
        dpadState={dpadState}
        onNearbyChange={onNpcNearby}
        onTalk={() => onTalk(false)}
      />
      <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />
    </>
  );
}

function V2Dpad({ dpadState, discrete = false, onMove }) {
  if (discrete) {
    return (
      <div className="delivery-dpad v2-dpad board-dpad" aria-label="跳跳棋移动按钮">
        <button onClick={() => onMove("forward")} aria-label="向上跳一格">↑</button>
        <div>
          <button onClick={() => onMove("left")} aria-label="向左跳一格">←</button>
          <button onClick={() => onMove("backward")} aria-label="向下跳一格">↓</button>
          <button onClick={() => onMove("right")} aria-label="向右跳一格">→</button>
        </div>
      </div>
    );
  }

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

function MailCardGame({
  mission,
  unlocked,
  solved,
  selectedCardId,
  feedback,
  combo,
  round,
  hearts,
  hand,
  onChoose,
}) {
  return (
    <section className="v2-panel v2-card-game">
      <div className="v2-card-game-heading">
        <div>
          <span>邮件卡牌挑战</span>
          <h3>为{mission.sender}打出一张暖心卡</h3>
        </div>
        <div className="v2-card-stats">
          <strong>生命 {"心".repeat(hearts)}{"空".repeat(3 - hearts)}</strong>
          <strong>连胜 {combo}</strong>
        </div>
      </div>
      <div className="v2-card-rounds" aria-label="卡牌挑战回合">
        {cardStages.map((stage, index) => (
          <span className={index < round || solved ? "done" : index === round ? "active" : ""} key={stage.id}>
            {index + 1}
          </span>
        ))}
        <strong>{solved ? "三回合完成" : cardStages[round].label}</strong>
      </div>
      <p>每回合从三张随机手牌中选出符合当前目标的卡。选错会失去一颗心，生命归零后从第一回合重来。</p>
      {unlocked ? (
        <div className="v2-mail-card-grid">
          {hand.map((card) => {
            const selected = selectedCardId === card.id;
            return (
              <button
                key={card.id}
                className={`${selected ? "selected" : ""} ${solved && card.stage !== "trap" ? "solved" : ""}`}
                disabled={solved}
                onClick={() => onChoose(card)}
              >
                <span>{card.title}</span>
                <p>{card.text}</p>
                <strong>{card.power}</strong>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="v2-card-lock">
          <strong>卡组还没有解锁</strong>
          <span>先根据故事和身体线索选对情绪，邮袋才会打开。</span>
        </div>
      )}
      <div className={`v2-card-feedback ${solved ? "success" : ""}`} role="status">
        {feedback || "选对后会点亮卡牌邮戳，才能寄出最终回信。"}
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
  const [boardPlayerCell, setBoardPlayerCell] = useState({ col: 3, row: 2 });
  const [boardTokenStates, setBoardTokenStates] = useState(createInitialTokenStates);
  const [boardTurn, setBoardTurn] = useState(0);
  const [boardMessage, setBoardMessage] = useState("每跳一格，所有星光邮件也会按自己的规律移动一格。");
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [storyType, setStoryType] = useState("");
  const [pendingRoomId, setPendingRoomId] = useState("");
  const [nearbyRoomId, setNearbyRoomId] = useState("");
  const [roomNpcNearby, setRoomNpcNearby] = useState(false);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueHeard, setDialogueHeard] = useState(false);
  const [openRoomIds, setOpenRoomIds] = useState([]);
  const [activeMissionId, setActiveMissionId] = useState(missions[0].id);
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("emotion-post-office-v2-completed") || "[]");
    } catch {
      return [];
    }
  });
  const [collectedMailIds, setCollectedMailIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("emotion-post-office-v2-mail") || "[]");
    } catch {
      return [];
    }
  });
  const [mailToast, setMailToast] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [emotionFeedback, setEmotionFeedback] = useState("先观察故事和身体动作，再选择一种情绪。");
  const [temperature, setTemperature] = useState(missions[0].intensity);
  const [selectedClues, setSelectedClues] = useState([]);
  const [cardWins, setCardWins] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("emotion-post-office-v2-card-wins") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardFeedback, setCardFeedback] = useState("");
  const [cardCombo, setCardCombo] = useState(0);
  const [cardRound, setCardRound] = useState(0);
  const [cardHearts, setCardHearts] = useState(3);
  const [cardHand, setCardHand] = useState([]);
  const [bestCombo, setBestCombo] = useState(() => Number(localStorage.getItem("emotion-post-office-v2-best-combo") || 0));
  const [replyParts, setReplyParts] = useState({ feeling: "", reason: "", wish: "" });
  const [customText, setCustomText] = useState("");
  const [largeText, setLargeText] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [feedback, setFeedback] = useState("先走到大厅的门边，打开门进入房间，再观察里面移动的小动物。");

  const currentRoom = currentRoomId ? getRoom(currentRoomId) : null;
  const activeMission = missions.find((mission) => mission.id === activeMissionId) || missions[0];
  const activeEmotion = selectedEmotion
    ? getEmotion(selectedEmotion)
    : { icon: "线索", color: "#fff4c2" };
  const activeRoom = getRoom(activeMission.roomId);
  const cardSolved = cardWins.includes(activeMission.id);
  const missionCompleted = completedIds.includes(activeMission.id);
  const canSend = selectedEmotion === activeMission.emotion
    && selectedClues.length >= 2
    && cardSolved
    && replyParts.feeling
    && replyParts.reason
    && replyParts.wish;

  useEffect(() => {
    localStorage.setItem("emotion-post-office-v2-completed", JSON.stringify(completedIds));
  }, [completedIds]);

  useEffect(() => {
    localStorage.setItem("emotion-post-office-v2-mail", JSON.stringify(collectedMailIds));
  }, [collectedMailIds]);

  useEffect(() => {
    localStorage.setItem("emotion-post-office-v2-card-wins", JSON.stringify(cardWins));
  }, [cardWins]);

  useEffect(() => {
    localStorage.setItem("emotion-post-office-v2-best-combo", String(bestCombo));
  }, [bestCombo]);

  useEffect(() => {
    if (!mailToast) return undefined;
    const timer = window.setTimeout(() => setMailToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [mailToast]);

  useEffect(() => {
    if (currentRoomId || storyType) return undefined;
    const handleBoardKey = (event) => {
      const key = event.key.toLowerCase();
      const direction = {
        w: "forward",
        arrowup: "forward",
        s: "backward",
        arrowdown: "backward",
        a: "left",
        arrowleft: "left",
        d: "right",
        arrowright: "right",
      }[key];
      if (!direction || event.repeat) return;
      event.preventDefault();
      moveOnBoard(direction);
    };
    window.addEventListener("keydown", handleBoardKey);
    return () => window.removeEventListener("keydown", handleBoardKey);
  }, [boardPlayerCell, boardTokenStates, boardTurn, collectedMailIds, currentRoomId, storyType]);

  useEffect(() => {
    setSelectedEmotion("");
    setEmotionFeedback("先观察故事和身体动作，再选择一种情绪。");
    setTemperature(activeMission.intensity);
    setSelectedClues([]);
    setSelectedCardId("");
    setCardRound(0);
    setCardHearts(3);
    setCardHand([]);
    setCardFeedback(cardWins.includes(activeMission.id) ? "这关已经获得暖心卡牌邮戳，可以继续完成回信。" : "");
    setReplyParts({ feeling: "", reason: "", wish: "" });
    setCustomText("");
    speak(`${activeMission.sender}在${activeRoom.label}里。${activeMission.event}`, audioOn);
  }, [activeMissionId]);

  const finishEnteringRoom = (roomId) => {
    const mission = getMissionForRoom(roomId);
    const room = getRoom(roomId);
    setOpenRoomIds((ids) => ids.includes(roomId) ? ids : [...ids, roomId]);
    setCurrentRoomId(roomId);
    setRoomNpcNearby(false);
    setDialogueOpen(false);
    setDialogueHeard(false);
    setActiveMissionId(mission.id);
    setFeedback(`你进入了${room.label}。请观察${mission.sender}在房间里怎么移动、停顿和表达。`);
    speak(`进入${room.label}`, audioOn);
  };

  const enterRoom = (roomId) => {
    setPendingRoomId(roomId);
    setStoryType("entry");
  };

  const finishStory = () => {
    if (storyType === "entry" && pendingRoomId) {
      const roomId = pendingRoomId;
      setStoryType("");
      setPendingRoomId("");
      finishEnteringRoom(roomId);
      return;
    }
    setStoryType("");
  };

  const exitRoom = () => {
    setCurrentRoomId(null);
    setRoomNpcNearby(false);
    setDialogueOpen(false);
    setFeedback("你回到了大厅。可以换一扇门，进入另一个房间观察新的小动物。");
  };

  const selectMission = (missionId) => {
    const mission = missions.find((item) => item.id === missionId);
    if (!mission) return;
    setActiveMissionId(missionId);
    setFeedback(`正在观察${mission.sender}：${mission.title}`);
  };

  const talkToNpc = (fromNpcTap = false) => {
    if (!roomNpcNearby && !fromNpcTap) {
      setFeedback(`再靠近一点，走到${activeMission.sender}身边才能开始对话。`);
      return;
    }
    setDialogueOpen(true);
    setFeedback(`${activeMission.sender}愿意和你说说发生的事情了。认真听，这些话会帮助你判断情绪。`);
    speak(activeMission.event, audioOn);
  };

  const toggleClue = (clue) => {
    setSelectedClues((clues) => clues.includes(clue) ? clues.filter((item) => item !== clue) : [...clues, clue]);
  };

  const chooseEmotion = (emotionId) => {
    if (!dialogueHeard) {
      setEmotionFeedback(`先进入${activeRoom.label}和${activeMission.sender}对话，听完线索后再判断。`);
      return;
    }
    setSelectedEmotion(emotionId);
    if (emotionId === activeMission.emotion) {
      setEmotionFeedback(`判断正确！${activeMission.sender}现在感到${getEmotion(emotionId).label}，邮件卡组已解锁。`);
      setCardRound(0);
      setCardHearts(3);
      setCardHand(drawCardHand(mailCardDecks[activeMission.emotion], cardStages[0].id));
      speak("情绪判断正确，邮件卡组已解锁。", audioOn);
      return;
    }
    setEmotionFeedback("这个判断和身体线索还不太一致，再看看动作、声音和发生的事情。");
    setCardFeedback("");
    speak("再观察一下身体线索。", audioOn);
  };

  const collectMail = (mailId) => {
    setCollectedMailIds((ids) => {
      if (ids.includes(mailId)) return ids;
      const nextIds = [...ids, mailId];
      setMailToast(`收集到星光邮件！大厅进度 ${nextIds.length}/${hallMailTokens.length}`);
      speak("收集到一封星光邮件。", audioOn);
      return nextIds;
    });
  };

  const moveOnBoard = (direction) => {
    const offsets = {
      forward: { col: 0, row: -1 },
      backward: { col: 0, row: 1 },
      left: { col: -1, row: 0 },
      right: { col: 1, row: 0 },
    };
    const offset = offsets[direction];
    if (!offset) return;

    const nextPlayer = {
      col: THREE.MathUtils.clamp(boardPlayerCell.col + offset.col, 0, BOARD_COLS - 1),
      row: THREE.MathUtils.clamp(boardPlayerCell.row + offset.row, 0, BOARD_ROWS - 1),
    };
    if (nextPlayer.col === boardPlayerCell.col && nextPlayer.row === boardPlayerCell.row) {
      setBoardMessage("已经到棋盘边缘了，换一个方向跳吧。");
      return;
    }

    const nextTurn = boardTurn + 1;
    const nextTokens = { ...boardTokenStates };
    const captured = [];

    hallMailTokens.forEach((token) => {
      if (collectedMailIds.includes(token.id)) return;
      const nextState = moveTokenByRule(token, boardTokenStates[token.id] || token.start, nextTurn);
      nextTokens[token.id] = nextState;
      if (nextState.col === nextPlayer.col && nextState.row === nextPlayer.row) {
        captured.push(token);
      }
    });

    setBoardPlayerCell(nextPlayer);
    setBoardTokenStates(nextTokens);
    setBoardTurn(nextTurn);

    if (captured.length) {
      captured.forEach((token) => collectMail(token.id));
      setBoardMessage(`第 ${nextTurn} 回合捕获 ${captured.map((token) => token.name).join("、")}！`);
    } else {
      setBoardMessage(`第 ${nextTurn} 回合：你跳到第 ${nextPlayer.col + 1} 列、第 ${nextPlayer.row + 1} 行，邮件也完成了移动。`);
    }
  };

  const resetBoardGame = () => {
    setBoardPlayerCell({ col: 3, row: 2 });
    setBoardTokenStates(createInitialTokenStates());
    setBoardTurn(0);
    setCollectedMailIds([]);
    setBoardMessage("棋盘已重新洗牌。每跳一格，所有星光邮件也会移动一格。");
  };

  const chooseMailCard = (card) => {
    if (cardSolved) {
      setCardFeedback("这关的暖心卡牌邮戳已经获得，继续完成回信就可以寄出了。");
      return;
    }

    setSelectedCardId(card.id);
    const targetStage = cardStages[cardRound].id;
    if (card.stage === targetStage) {
      if (cardRound < cardStages.length - 1) {
        const nextRound = cardRound + 1;
        setCardRound(nextRound);
        setCardHand(drawCardHand(mailCardDecks[activeMission.emotion], cardStages[nextRound].id));
        setCardFeedback(`回合成功！“${card.title}”符合当前目标，下一轮手牌已经送达。`);
        setCardCombo((value) => value + 1);
        speak("回合成功，进入下一轮。", audioOn);
        return;
      }

      setCardWins((ids) => ids.includes(activeMission.id) ? ids : [...ids, activeMission.id]);
      setCardCombo((value) => {
        const nextValue = value + 1;
        setBestCombo((best) => Math.max(best, nextValue));
        return nextValue;
      });
      setCardFeedback(`三回合通关！“${card.title}”完成了最后的行动建议，获得暖心卡牌邮戳。`);
      speak("三回合通关，获得暖心卡牌邮戳。", audioOn);
      return;
    }

    setCardCombo(0);
    const nextHearts = cardHearts - 1;
    if (nextHearts <= 0) {
      setCardRound(0);
      setCardHearts(3);
      setCardHand(drawCardHand(mailCardDecks[activeMission.emotion], cardStages[0].id));
      setCardFeedback(`“${card.title}”不符合这一回合，生命用完了。卡组重新洗牌，从倾听回合再来一次。`);
    } else {
      setCardHearts(nextHearts);
      setCardHand(drawCardHand(mailCardDecks[activeMission.emotion], targetStage));
      setCardFeedback(`“${card.title}”不符合“${cardStages[cardRound].label}”，失去一颗心，手牌已重新抽取。`);
    }
    speak("再想一想，先理解对方的感受。", audioOn);
  };

  const sendReply = () => {
    if (missionCompleted) {
      setFeedback("这封信已经寄出啦，去帮助下一位等待回信的朋友吧。");
      return;
    }

    if (!canSend) {
      setFeedback("还差一点：至少选两个身体线索、选对情绪、赢得邮件卡牌挑战，再拼出完整回信。");
      speak("还差一点，请继续观察线索。", audioOn);
      return;
    }
    setCompletedIds((ids) => ids.includes(activeMission.id) ? ids : [...ids, activeMission.id]);
    setFeedback(`${activeMission.sender}在${activeRoom.label}收到了你的回信，也学会了用 ${temperature}/5 的强度说出感受。`);
    setStoryType("success");
    speak("回信送达，做得很好。", audioOn);
  };

  const goToNextMission = () => {
    const currentIndex = missions.findIndex((mission) => mission.id === activeMission.id);
    const orderedMissions = [
      ...missions.slice(currentIndex + 1),
      ...missions.slice(0, currentIndex + 1),
    ];
    const nextMission = orderedMissions.find((mission) => !completedIds.includes(mission.id));
    if (!nextMission) {
      setCurrentRoomId(null);
      setFeedback("今天的暖心回信全部送达！可以在大厅继续收集星光邮件。");
      return;
    }
    enterRoom(nextMission.roomId);
  };

  const canvasHint = currentRoom
    ? roomNpcNearby
      ? `已靠近${activeMission.sender}，按 E 或点击“开始对话”`
      : `房间：${currentRoom.label}，移动角色靠近${activeMission.sender}`
    : nearbyRoomId
      ? `靠近 ${getRoom(nearbyRoomId).label}，按 E 或点击门进入`
      : `跳跳棋大厅：第 ${boardTurn} 回合`;

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
        <div className="v2-score-board" aria-label="冒险进度">
          <strong>星星 {collectedMailIds.length}</strong>
          <span>棋盘卡牌 {collectedMailIds.length}/{hallMailTokens.length}</span>
          <span>卡牌邮戳 {cardWins.length}/{missions.length}</span>
          <span>最佳连胜 {bestCombo}</span>
          <span>暖心回信 {completedIds.length}/{missions.length}</span>
        </div>
      </header>

      {storyType && (
        <StoryComic
          key={`${storyType}-${activeMission.id}`}
          comic={storyComics[storyType]}
          onComplete={finishStory}
          onSkip={finishStory}
        />
      )}

      <div className={`v2-map-wrap ${currentRoom ? "room-mode" : ""}`}>
        <Canvas
          camera={{ position: [0, 7.4, 8.0], fov: currentRoom ? 48 : 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          shadows
        >
          {currentRoom ? (
            <RoomWorld
              room={currentRoom}
              mission={getMissionForRoom(currentRoom.id)}
              completed={completedIds.includes(getMissionForRoom(currentRoom.id).id)}
              dpadState={dpadState}
              npcNearby={roomNpcNearby}
              onNpcNearby={setRoomNpcNearby}
              onTalk={talkToNpc}
              onExitRoom={exitRoom}
            />
          ) : (
            <HallWorld
              playerCell={boardPlayerCell}
              tokenStates={boardTokenStates}
              currentNearbyRoomId={nearbyRoomId}
              openRoomIds={openRoomIds}
              collectedMailIds={collectedMailIds}
              onNearbyRoom={setNearbyRoomId}
              onEnterRoom={enterRoom}
            />
          )}
        </Canvas>
        <div className="delivery-canvas-hint">
          <span>{canvasHint}</span>
          <span>{completedIds.length}/{missions.length} 已完成</span>
        </div>
        <V2Dpad
          dpadState={dpadState}
          discrete={!currentRoom}
          onMove={moveOnBoard}
        />
        {!currentRoom && (
          <aside className="board-rule-panel">
            <header>
              <strong>跳跳棋追信</strong>
              <div>
                <span>回合 {boardTurn}</span>
                <button onClick={resetBoardGame}>重新开局</button>
              </div>
            </header>
            <p>{boardMessage}</p>
            <div>
              {hallMailTokens.map((token) => (
                <article className={collectedMailIds.includes(token.id) ? "caught" : ""} key={token.id}>
                  <i style={{ background: token.color }} />
                  <span>
                    <strong>{token.name}</strong>
                    <small>{collectedMailIds.includes(token.id) ? "已捕获" : token.rule}</small>
                  </span>
                </article>
              ))}
            </div>
          </aside>
        )}
        {currentRoom && (
          <button
            className={`v2-talk-button ${roomNpcNearby ? "ready" : ""}`}
            onClick={() => talkToNpc(false)}
          >
            {roomNpcNearby ? `和${activeMission.sender}开始对话` : `靠近${activeMission.sender}`}
          </button>
        )}
        {dialogueOpen && (
          <div className="v2-dialogue-panel" role="dialog" aria-label={`与${activeMission.sender}对话`}>
            <header>
              <strong>{activeMission.sender}</strong>
              <button onClick={() => setDialogueOpen(false)}>关闭</button>
            </header>
            <p>“{activeMission.event}”</p>
            <small>身体线索：{activeMission.clues.join("、")}</small>
            <button onClick={() => {
              setDialogueOpen(false);
              setDialogueHeard(true);
              setFeedback(`你听完了${activeMission.sender}的话，现在可以结合身体线索判断情绪。`);
            }}>
              我听明白了
            </button>
          </div>
        )}
        {mailToast && <div className="v2-mail-toast" role="status">{mailToast}</div>}
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
                disabled={!dialogueHeard}
                onClick={() => chooseEmotion(emotion.id)}
                style={{ "--emotion-color": emotion.color }}
              >
                <span>{emotion.icon}</span>
                {emotion.label}
              </button>
            ))}
          </div>
          <div className={`v2-emotion-feedback ${selectedEmotion === activeMission.emotion ? "success" : ""}`} role="status">
            {dialogueHeard ? emotionFeedback : `先和${activeMission.sender}完成对话，情绪卡才会解锁。`}
          </div>
          <EmotionThermometer value={temperature} onChange={setTemperature} />
        </section>

        <BodyCluePanel mission={activeMission} selectedClues={selectedClues} onToggle={toggleClue} />
        <MailCardGame
          mission={activeMission}
          unlocked={selectedEmotion === activeMission.emotion}
          solved={cardSolved}
          selectedCardId={selectedCardId}
          feedback={cardFeedback}
          combo={cardCombo}
          round={cardRound}
          hearts={cardHearts}
          hand={cardHand}
          onChoose={chooseMailCard}
        />
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
          {missionCompleted ? (
            <button className="primary-button" onClick={goToNextMission}>
              {completedIds.length === missions.length ? "回大厅庆祝" : "前往下一封信"}
            </button>
          ) : (
            <button className="primary-button" onClick={sendReply}>寄出自由回信</button>
          )}
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
useGLTF.preload(`${MODEL_ROOTS.characters}/character-female-c.glb`);
