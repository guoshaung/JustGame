import { useEffect, useMemo, useReducer, useState } from "react";
import ThreeDFriendshipSquare from "./scenes/ThreeDFriendshipSquare.jsx";

const STORAGE_KEY = "emotion-post-office-day";
const SINGLE_STORAGE_KEY = "emotion-post-office-single";
const DOUBLE_STORAGE_KEY = "emotion-post-office-double";

const doubleStamps = [
  {
    id: "coop-patience",
    name: "合作·耐心等待邮票",
    icon: "🤝⏳",
    ability: "耐心与理解",
    description: "两名小朋友合作帮助小兔平复着急的情绪。"
  },
  {
    id: "coop-polite",
    name: "合作·礼貌沟通邮票",
    icon: "🤝🗣️",
    ability: "沟通与解决",
    description: "两名小朋友合作帮助小熊礼貌地解决积木冲突。"
  },
  {
    id: "coop-share",
    name: "合作·社交主动邮票",
    icon: "🤝🐱",
    ability: "主动与共情",
    description: "两名小朋友合作帮助小猫克服不好意思，主动加入游戏。"
  }
];

const doubleLetters = [
  {
    id: "doubleQueue",
    sender: "小兔",
    icon: "🐰",
    title: "排队等滑梯",
    event: "小兔排队很久还没有轮到它，它觉得很着急。",
    clue: "它不停地跺脚，拉着衣角，一直问什么时候能轮到它。",
    emotion: "anxious",
    emotionLabel: "着急",
    destinationName: "排队小站",
    options: [
      { text: "我知道你等得很着急，我们可以一起深呼吸，再等一等。", correct: true },
      { text: "你不要着急，这没什么。", correct: false },
      { text: "你可以推开别人先去玩。", correct: false }
    ],
    skills: ["emotionRecognition", "friendlyReply", "cooperation", "empathy", "turnTaking"]
  },
  {
    id: "doubleBlocks",
    sender: "小熊",
    icon: "🐻",
    title: "积木被碰倒了",
    event: "小熊的积木被别人碰倒了，它很生气。",
    clue: "它攥紧了小拳头，大吼了一声，脸都气红了。",
    emotion: "angry",
    emotionLabel: "生气",
    destinationName: "森林操场",
    options: [
      { text: "我知道你很生气，我们可以告诉朋友：请小心一点。", correct: true },
      { text: "你也去推倒他的积木。", correct: false },
      { text: "不要说话，自己走开。", correct: false }
    ],
    skills: ["emotionRecognition", "friendlyReply", "cooperation", "empathy", "turnTaking"]
  },
  {
    id: "doubleToyHouse",
    sender: "小猫",
    icon: "🐱",
    title: "想和大家一起玩",
    event: "小猫想和大家一起玩，但是不知道怎么开口，它有点难过。",
    clue: "它抱着尾巴站在一旁，眼巴巴地看着大家，叹了口气。",
    emotion: "sad",
    emotionLabel: "难过",
    destinationName: "玩具屋",
    options: [
      { text: "你可以说：我可以和你们一起玩吗？", correct: true },
      { text: "你就抢一个玩具。", correct: false },
      { text: "你不要和他们玩了。", correct: false }
    ],
    skills: ["emotionRecognition", "friendlyReply", "cooperation", "empathy", "turnTaking"]
  }
];

const stamps = [
  {
    id: "need-expression",
    name: "表达需求邮票",
    icon: "💬",
    ability: "表达需求",
    description: "能把自己的需要用清楚、温和的话说出来。",
  },
  {
    id: "active-talk",
    name: "主动沟通邮票",
    icon: "🐱",
    ability: "礼貌沟通",
    description: "想加入游戏时，会先问问朋友的想法。",
  },
  {
    id: "patience",
    name: "耐心等待邮票",
    icon: "⏳",
    ability: "耐心等待",
    description: "等待时能用深呼吸、数数帮助自己冷静。",
  },
  {
    id: "empathy",
    name: "共情关心邮票",
    icon: "🫶",
    ability: "共情关心",
    description: "看到别人难过时，会先关心和陪伴。",
  },
  {
    id: "emotion-detective",
    name: "情绪识别邮票",
    icon: "🔎",
    ability: "情绪识别",
    description: "能从表情、动作和故事线索里判断情绪。",
  },
];

const emotionMailboxes = [
  { id: "sad", label: "难过邮箱", icon: "💧" },
  { id: "angry", label: "生气邮箱", icon: "🔥" },
  { id: "anxious", label: "着急邮箱", icon: "⏳" },
  { id: "scared", label: "害怕邮箱", icon: "🌙" },
];

const letters = [
  {
    id: "rabbitToy",
    sender: "小兔",
    icon: "🐰",
    title: "积木被拿走了",
    event: "小兔正在玩积木，小熊突然把积木拿走了。",
    clue: "小兔低下头，声音小小的，眼眶红红的。",
    emotion: "sad",
    emotionLabel: "难过",
    destination: "toyHouse",
    destinationName: "玩具屋",
    stampId: "need-expression",
    skills: ["emotion", "need", "polite"],
    reply:
      "我有点难过，我还想玩一会儿，可以等我玩完再给你吗？",
  },
  {
    id: "foxBlocks",
    sender: "小狐狸",
    icon: "🦊",
    title: "作品被碰倒了",
    event: "小狐狸刚搭好的高塔被朋友不小心碰倒了。",
    clue: "它皱着眉，手攥得紧紧的，说话声音变大了。",
    emotion: "angry",
    emotionLabel: "生气",
    destination: "playground",
    destinationName: "森林操场",
    stampId: "active-talk",
    skills: ["emotion", "polite", "need"],
    reply:
      "我有点生气，因为我很认真地搭了高塔。下次可以小心一点吗？",
  },
  {
    id: "bearQueue",
    sender: "小熊",
    icon: "🐻",
    title: "排队等太久了",
    event: "小熊在排队玩滑梯，可是队伍一直没有往前走。",
    clue: "它跺脚、看来看去，一直问：什么时候轮到我？",
    emotion: "anxious",
    emotionLabel: "着急",
    destination: "queueStation",
    destinationName: "排队小站",
    stampId: "patience",
    skills: ["patience", "emotion"],
    reply: "我有点着急，我可以先深呼吸，再安静等一等。",
  },
  {
    id: "deerCorner",
    sender: "小鹿",
    icon: "🦌",
    title: "不敢加入大家",
    event: "小鹿看到大家在玩新游戏，可是不知道规则。",
    clue: "它站在角落，抱着书包，小声说：我怕做错。",
    emotion: "scared",
    emotionLabel: "害怕",
    destination: "quietCorner",
    destinationName: "安静角落",
    stampId: "empathy",
    skills: ["emotion", "empathy", "polite"],
    reply: "我有点害怕，可以先告诉我规则，再陪我试一次吗？",
  },
  {
    id: "panda3d",
    sender: "小熊猫",
    icon: "🐼",
    title: "广场里找不到朋友",
    event: "小熊猫在 3D 友谊广场转了很久，还没找到能一起玩的朋友。",
    clue: "它慢慢走来走去，耳朵垂着，不太敢开口。",
    emotion: "sad",
    emotionLabel: "难过",
    destination: "threeD",
    destinationName: "3D探索区",
    stampId: "emotion-detective",
    skills: ["emotion", "polite"],
    reply: "我有点孤单，可以和你一起在广场里找朋友吗？",
  },
];

const deliveryLocations = [
  {
    id: "toyHouse",
    name: "玩具屋",
    icon: "🏠",
    training: "表达需求、轮流分享",
  },
  {
    id: "playground",
    name: "森林操场",
    icon: "🌳",
    training: "角色扮演、礼貌沟通",
  },
  {
    id: "queueStation",
    name: "排队小站",
    icon: "🚏",
    training: "冷静等待、调节着急",
  },
  {
    id: "quietCorner",
    name: "安静角落",
    icon: "🌙",
    training: "识别情绪、安慰朋友",
  },
  {
    id: "threeD",
    name: "3D探索区",
    icon: "🧭",
    training: "预留 Three.js 场景入口",
  },
];

const freshState = {
  currentScene: "home",
  activeLetterId: "rabbitToy",
  sortedLetters: {},
  deliveredLetters: [],
  replies: {},
  collectedStamps: [],
  completedTasks: [],
  stampBursts: [],
  skillScores: {
    emotion: 0,
    need: 0,
    polite: 0,
    patience: 0,
    empathy: 0,
  },
};

function loadSingleState() {
  try {
    const saved = localStorage.getItem(SINGLE_STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!saved) return freshState;
    const parsed = JSON.parse(saved);
    return {
      ...freshState,
      ...parsed,
      currentScene: ["home", "postOffice", "sort", "map", "toyHouse", "playground", "queueStation", "quietCorner", "threeD", "stamps", "report"].includes(parsed.currentScene)
        ? parsed.currentScene
        : "home"
    };
  } catch {
    return freshState;
  }
}

const initialDoubleState = {
  currentScene: "doubleHome",
  currentPlayer: "A",
  doubleStep: "intro",
  activeLetterId: "doubleQueue",
  playerAChoice: null,
  playerBReply: null,
  collectedStamps: [],
  completedTasks: [],
  replies: {},
  stampBursts: [],
  teamReport: {
    emotionRecognition: 0,
    friendlyReply: 0,
    cooperation: 0,
    empathy: 0,
    turnTaking: 0
  }
};

function loadDoubleState() {
  try {
    const saved = localStorage.getItem(DOUBLE_STORAGE_KEY);
    if (!saved) return initialDoubleState;
    const parsed = JSON.parse(saved);
    return {
      ...initialDoubleState,
      ...parsed,
      currentScene: ["doubleHome", "doubleTask", "doubleStamps", "doubleReport"].includes(parsed.currentScene)
        ? parsed.currentScene
        : "doubleHome",
      teamReport: {
        ...initialDoubleState.teamReport,
        ...(parsed.teamReport || {})
      }
    };
  } catch {
    return initialDoubleState;
  }
}

function doubleReducer(state, action) {
  switch (action.type) {
    case "NAVIGATE":
      return {
        ...state,
        currentScene: action.scene,
        activeLetterId: action.letterId ?? state.activeLetterId,
      };
    case "START_DOUBLE":
      return {
        ...state,
        doubleStep: "intro"
      };
    case "GO_TO_MAILBAG":
      return {
        ...state,
        doubleStep: "choice",
        currentPlayer: "A",
        playerAChoice: null,
        playerBReply: null
      };
    case "SELECT_LETTER":
      return {
        ...state,
        activeLetterId: action.letterId,
        doubleStep: "emotion",
        currentPlayer: "A",
        playerAChoice: null,
        playerBReply: null,
      };
    case "PLAYER_A_CHOOSE":
      return {
        ...state,
        playerAChoice: action.emotion,
      };
    case "GO_TO_PLAYER_B":
      return {
        ...state,
        currentPlayer: "B",
        doubleStep: "reply",
      };
    case "PLAYER_B_CHOOSE":
      return {
        ...state,
        playerBReply: action.reply,
      };
    case "GO_TO_CONFIRM":
      return {
        ...state,
        doubleStep: "confirm"
      };
    case "CONFIRM_HELP": {
      const letter = doubleLetters.find(l => l.id === state.activeLetterId);
      const taskId = letter.id;
      const alreadyDone = state.completedTasks.includes(taskId);
      
      let nextStamps = [...state.collectedStamps];
      const stampId = letter.id === "doubleQueue" ? "coop-patience" :
                      letter.id === "doubleBlocks" ? "coop-polite" :
                      "coop-share";
      if (!nextStamps.includes(stampId)) {
        nextStamps.push(stampId);
      }
      
      const teamReport = { ...state.teamReport };
      if (!alreadyDone) {
        teamReport.emotionRecognition = Math.min(100, teamReport.emotionRecognition + 34);
        teamReport.friendlyReply = Math.min(100, teamReport.friendlyReply + 34);
        teamReport.cooperation = Math.min(100, teamReport.cooperation + 34);
        teamReport.empathy = Math.min(100, teamReport.empathy + 34);
        teamReport.turnTaking = Math.min(100, teamReport.turnTaking + 34);
      }

      const stampBursts = [
        ...state.stampBursts,
        {
          id: `${taskId}-${Date.now()}`,
          stampId: stampId
        }
      ];

      return {
        ...state,
        completedTasks: alreadyDone ? state.completedTasks : [...state.completedTasks, taskId],
        replies: {
          ...state.replies,
          [state.activeLetterId]: state.playerBReply
        },
        collectedStamps: nextStamps,
        teamReport,
        doubleStep: "complete",
        stampBursts
      };
    }
    case "CLEAR_STAMP_BURST":
      return {
        ...state,
        stampBursts: state.stampBursts.filter((item) => item.id !== action.id),
      };
    case "RESET_DAY":
      return {
        ...initialDoubleState,
        currentScene: state.currentScene
      };
    case "DEBUG_UNLOCK_ALL":
      return {
        ...state,
        completedTasks: [],
      };
    case "DEBUG_COMPLETE_ALL": {
      const allCompleted = doubleLetters.map(l => l.id);
      const allReplies = {};
      doubleLetters.forEach(l => {
        allReplies[l.id] = l.options.find(o => o.correct).text;
      });
      const allStamps = ["coop-patience", "coop-polite", "coop-share"];
      return {
        ...state,
        completedTasks: allCompleted,
        replies: allReplies,
        collectedStamps: allStamps,
        teamReport: {
          emotionRecognition: 100,
          friendlyReply: 100,
          cooperation: 100,
          empathy: 100,
          turnTaking: 100
        }
      };
    }
    default:
      return state;
  }
}

function gameReducer(state, action) {
  switch (action.type) {
    case "NAVIGATE":
      return {
        ...state,
        currentScene: action.scene,
        activeLetterId: action.letterId ?? state.activeLetterId,
      };
    case "OPEN_LETTER":
      return { ...state, activeLetterId: action.letterId };
    case "SORT_LETTER":
      return {
        ...state,
        activeLetterId: action.letterId,
        sortedLetters: {
          ...state.sortedLetters,
          [action.letterId]: action.mailboxId,
        },
      };
    case "DELIVER_LETTER":
      return {
        ...state,
        activeLetterId: action.letterId,
        deliveredLetters: state.deliveredLetters.includes(action.letterId)
          ? state.deliveredLetters
          : [...state.deliveredLetters, action.letterId],
        currentScene: action.scene,
      };
    case "COMPLETE_TASK": {
      const alreadyDone = state.completedTasks.includes(action.taskId);
      const nextStamps = action.stampIds.reduce((list, stampId) => {
        return list.includes(stampId) ? list : [...list, stampId];
      }, state.collectedStamps);
      const skillScores = { ...state.skillScores };

      if (!alreadyDone) {
        action.skills.forEach((skill) => {
          skillScores[skill] = Math.min(100, (skillScores[skill] ?? 0) + 25);
        });
      }

      return {
        ...state,
        replies: action.reply
          ? { ...state.replies, [action.letterId]: action.reply }
          : state.replies,
        collectedStamps: nextStamps,
        completedTasks: alreadyDone
          ? state.completedTasks
          : [...state.completedTasks, action.taskId],
        stampBursts:
          alreadyDone || !action.stampIds.length
            ? state.stampBursts
            : [
                ...state.stampBursts,
                {
                  id: `${action.taskId}-${Date.now()}`,
                  stampId: action.stampIds[0],
                },
              ],
      };
    }
    case "CLEAR_STAMP_BURST":
      return {
        ...state,
        stampBursts: state.stampBursts.filter((item) => item.id !== action.id),
      };
    case "RESET_DAY":
      return freshState;
    default:
      return state;
  }
}

function getLetter(id) {
  return letters.find((letter) => letter.id === id) ?? letters[0];
}

function App() {
  const [gameMode, setGameMode] = useState(() => {
    return localStorage.getItem("emotion-post-office-mode") || "choice";
  });
  const [singleState, singleDispatch] = useReducer(gameReducer, undefined, loadSingleState);
  const [doubleState, doubleDispatch] = useReducer(doubleReducer, undefined, loadDoubleState);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    localStorage.setItem("emotion-post-office-mode", gameMode);
  }, [gameMode]);

  useEffect(() => {
    if (gameMode === "single") {
      localStorage.setItem(SINGLE_STORAGE_KEY, JSON.stringify(singleState));
    }
  }, [singleState, gameMode]);

  useEffect(() => {
    if (gameMode === "double") {
      localStorage.setItem(DOUBLE_STORAGE_KEY, JSON.stringify(doubleState));
    }
  }, [doubleState, gameMode]);

  const isDouble = gameMode === "double";
  const state = isDouble ? doubleState : singleState;
  const dispatch = isDouble ? doubleDispatch : singleDispatch;
  const activeLetter = isDouble 
    ? (doubleLetters.find(l => l.id === doubleState.activeLetterId) || doubleLetters[0]) 
    : getLetter(singleState.activeLetterId);

  const sortedCount = Object.keys(state.sortedLetters || {}).length;
  const deliveredCount = (state.completedTasks || []).length;

  const navigate = (scene, letterId = state.activeLetterId) => {
    dispatch({ type: "NAVIGATE", scene, letterId });
  };

  const completeTask = (payload) => {
    dispatch({
      type: "COMPLETE_TASK",
      letterId: state.activeLetterId,
      taskId: payload.taskId ?? state.activeLetterId,
      stampIds: [],
      skills: [],
      ...payload,
    });
  };

  const sceneTitle = useMemo(() => {
    if (gameMode === "double") {
      if (doubleState.currentScene === "doubleHome") {
        return doubleState.doubleStep === "intro" ? "协作角色说明" : "双人协作邮局";
      }
      if (doubleState.currentScene === "doubleTask") return "双人任务合作区";
      if (doubleState.currentScene === "doubleStamps") return "合作邮票册";
      if (doubleState.currentScene === "doubleReport") return "双人合作成长报告";
      return "双人协作";
    }
    const location = deliveryLocations.find((item) => item.id === singleState.currentScene);
    if (singleState.currentScene === "home") return "情绪信件的一天";
    if (singleState.currentScene === "postOffice") return "情绪邮局";
    if (singleState.currentScene === "sort") return "信件分拣台";
    if (singleState.currentScene === "map") return "派送路线";
    if (singleState.currentScene === "stamps") return "邮票册";
    if (singleState.currentScene === "report") return "学习报告";
    return location?.name ?? "情绪任务";
  }, [gameMode, singleState.currentScene, doubleState.currentScene, doubleState.doubleStep]);

  const renderScene = () => {
    if (state.currentScene === "home") {
      return (
        <HomeScene
          activeLetter={activeLetter}
          sortedCount={sortedCount}
          deliveredCount={deliveredCount}
          onStart={() => navigate("postOffice")}
          onOpenLetter={(letterId) => dispatch({ type: "OPEN_LETTER", letterId })}
          onOpenStamps={() => navigate("stamps")}
          onOpenReport={() => navigate("report")}
        />
      );
    }

    if (state.currentScene === "postOffice") {
      return (
        <PostOfficeScene
          state={state}
          activeLetter={activeLetter}
          onOpenLetter={(letterId) => dispatch({ type: "OPEN_LETTER", letterId })}
          onSort={() => navigate("sort")}
        />
      );
    }

    if (state.currentScene === "sort") {
      return (
        <SortScene
          state={state}
          activeLetter={activeLetter}
          onOpenLetter={(letterId) => dispatch({ type: "OPEN_LETTER", letterId })}
          onSort={(letterId, mailboxId) =>
            dispatch({ type: "SORT_LETTER", letterId, mailboxId })
          }
          onRoute={() => navigate("map")}
        />
      );
    }

    if (state.currentScene === "map") {
      return (
        <RouteScene
          state={state}
          onDeliver={(letter) =>
            dispatch({
              type: "DELIVER_LETTER",
              letterId: letter.id,
              scene: letter.destination,
            })
          }
          onPostOffice={() => navigate("postOffice")}
          onSort={() => navigate("sort")}
          onOpenStamps={() => navigate("stamps")}
          onOpenReport={() => navigate("report")}
        />
      );
    }

    if (state.currentScene === "toyHouse") {
      return (
        <ToyHouseScene
          letter={activeLetter}
          completeTask={completeTask}
          state={state}
        />
      );
    }

    if (state.currentScene === "playground") {
      return (
        <PlaygroundScene
          letter={activeLetter}
          completeTask={completeTask}
          state={state}
        />
      );
    }

    if (state.currentScene === "queueStation") {
      return (
        <QueueStationScene
          letter={activeLetter}
          completeTask={completeTask}
          state={state}
        />
      );
    }

    if (state.currentScene === "quietCorner") {
      return (
        <QuietCornerScene
          letter={activeLetter}
          completeTask={completeTask}
          state={state}
        />
      );
    }

    if (state.currentScene === "threeD") {
      return (
        <ThreeDScene
          completeTask={completeTask}
          state={state}
          navigate={navigate}
          letter={activeLetter}
        />
      );
    }

    if (state.currentScene === "stamps") {
      return <StampBookScene collectedStamps={state.collectedStamps} />;
    }

    if (state.currentScene === "report") {
      return <ReportScene state={state} />;
    }

    return null;
  };

  const showBackToRoute = !isDouble && !["home", "postOffice", "sort", "map"].includes(
    singleState.currentScene,
  );

  if (gameMode === "choice") {
    return (
      <main className="app-shell">
        <section className="tablet">
          <ModeChoiceScene
            onChooseSingle={() => setGameMode("single")}
            onChooseDouble={() => setGameMode("double")}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="tablet">
        <header className="top-bar">
          <div>
            <span className="eyebrow">
              {isDouble ? "👥 情绪小邮局 5.0 (双人协作版)" : "🎒 情绪小邮局 5.0"}
            </span>
            <h1>{sceneTitle}</h1>
          </div>
          <div className="global-stats" aria-label="今日邮局进度">
            {isDouble ? (
              <>
                <span>📬 {doubleState.completedTasks.length}/{doubleLetters.length}</span>
                <span>🤝 {doubleState.collectedStamps.length}/3</span>
              </>
            ) : (
              <>
                <span>📬 {sortedCount}/{letters.length}</span>
                <span>🎫 {singleState.collectedStamps.length}/{stamps.length}</span>
                <span>✅ {deliveredCount}</span>
              </>
            )}
          </div>
        </header>

        <nav className="quick-nav" aria-label="邮局流程">
          {isDouble ? (
            <>
              <button onClick={() => doubleDispatch({ type: "NAVIGATE", scene: "doubleHome" })}>双人邮局</button>
              <button onClick={() => doubleDispatch({ type: "NAVIGATE", scene: "doubleStamps" })}>合作邮票册</button>
              <button onClick={() => doubleDispatch({ type: "NAVIGATE", scene: "doubleReport" })}>合作报告</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("postOffice")}>收信</button>
              <button onClick={() => navigate("sort")}>分拣</button>
              <button onClick={() => navigate("map")}>派送</button>
              <button onClick={() => navigate("stamps")}>邮票册</button>
              <button onClick={() => navigate("report")}>报告</button>
            </>
          )}
          <button onClick={() => dispatch({ type: "RESET_DAY" })}>重置今日</button>
          <button onClick={() => setGameMode("choice")} style={{ background: "#e2e8f0", color: "#475569", fontWeight: "900" }}>切换模式</button>
          <button onClick={() => setShowDebug(!showDebug)} style={{ background: "#ffccd5", color: "#8b0000", fontWeight: "900" }}>🛠️ 调试面板</button>
        </nav>

        {showDebug && (
          <div className="debug-drawer fade-in">
            <h3>🛠️ 开发者调试工具</h3>
            {isDouble ? (
              <div className="debug-section">
                <h4>双人模式快捷操作：</h4>
                <div className="debug-buttons">
                  <button onClick={() => doubleDispatch({ type: "DEBUG_COMPLETE_ALL" })} style={{ background: "#dff4ff" }}>👑 一键送达全通关</button>
                  <button onClick={() => doubleDispatch({ type: "RESET_DAY" })} style={{ background: "#ffd6d6" }}>🗑️ 清空双人进度</button>
                </div>
              </div>
            ) : (
              <>
                <div className="debug-section">
                  <h4>快捷场景跳转：</h4>
                  <div className="debug-buttons">
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "home" })}>🏠 首页</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "postOffice" })}>💌 收信（今日邮袋）</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "sort" })}>📬 信件分拣台</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "map" })}>🗺️ 派送路线地图</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "toyHouse" })}>🐰 玩具屋（卡牌游戏）</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "playground" })}>🌳 森林操场（角色扮演）</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "queueStation" })}>🚏 排队小站（冷静进度）</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "quietCorner" })}>🌙 安静角落（情绪识别）</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "threeD" })}>🧭 3D探索区</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "stamps" })}>🎫 邮票册</button>
                    <button onClick={() => dispatch({ type: "DEBUG_JUMP", scene: "report" })}>📊 学习报告</button>
                  </div>
                </div>
                <div className="debug-section">
                  <h4>快捷作弊与重置：</h4>
                  <div className="debug-buttons">
                    <button onClick={() => dispatch({ type: "DEBUG_UNLOCK_ALL" })} style={{ background: "#def8e9" }}>🔓 一键分拣（解锁地图）</button>
                    <button onClick={() => dispatch({ type: "DEBUG_COMPLETE_ALL" })} style={{ background: "#dff4ff" }}>👑 一键送达全通关</button>
                    <button onClick={() => dispatch({ type: "RESET_DAY" })} style={{ background: "#ffd6d6" }}>🗑️ 清空今日进度</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {showBackToRoute && (
          <button className="map-back-button" onClick={() => navigate("map")}>
            返回派送路线
          </button>
        )}

        <section className="scene-card">{renderScene()}</section>
      </section>

      {state.stampBursts && state.stampBursts.map((burst) => (
        <StampBurst
          key={burst.id}
          burst={burst}
          onDone={() => dispatch({ type: "CLEAR_STAMP_BURST", id: burst.id })}
        />
      ))}
    </main>
  );
}

function HomeScene({
  activeLetter,
  sortedCount,
  deliveredCount,
  onStart,
  onOpenLetter,
  onOpenStamps,
  onOpenReport,
}) {
  return (
    <div className="post-day-home fade-in">
      <section className="post-office-hero">
        <div className="mailbag-visual" aria-hidden="true">
          <div className="mailbag-body">邮袋</div>
          <div className="flying-envelope envelope-a">✉</div>
          <div className="flying-envelope envelope-b">✉</div>
          <div className="flying-envelope envelope-c">✉</div>
        </div>
        <div className="home-copy">
          <h2>情绪信件的一天</h2>
          <p>从今日邮袋收信，分进情绪邮箱，再沿派送路线送到小动物身边。</p>
          <div className="home-actions">
            <button className="primary-button" onClick={onStart}>
              打开今日邮袋
            </button>
            <button className="secondary-button" onClick={onOpenStamps}>
              查看邮票册
            </button>
            <button className="secondary-button" onClick={onOpenReport}>
              学习报告
            </button>
          </div>
        </div>
      </section>

      <section className="today-board">
        <div>
          <h3>今日任务单</h3>
          <p>收信 → 分拣 → 派送 → 读信 → 回信 → 盖邮戳 → 收集邮票</p>
        </div>
        <div className="task-meters">
          <span>已分拣 {sortedCount}/{letters.length}</span>
          <span>已送达 {deliveredCount}/{letters.length}</span>
          <span>当前信件：{activeLetter.sender}</span>
        </div>
      </section>

      <TodayMailbag activeLetter={activeLetter} onOpenLetter={onOpenLetter} />
    </div>
  );
}

function TodayMailbag({ activeLetter, onOpenLetter, sortedLetters = {}, replies = {} }) {
  return (
    <section className="today-mailbag">
      <div className="section-title">
        <span>📮</span>
        <div>
          <h3>今日邮袋</h3>
          <p>点击信封，查看寄信人、情绪线索和目的地。</p>
        </div>
      </div>
      <div className="mailbag-grid">
        {letters.slice(0, 3).map((letter) => (
          <button
            className={`letter-card ${activeLetter.id === letter.id ? "open" : ""}`}
            key={letter.id}
            onClick={() => onOpenLetter(letter.id)}
          >
            <span className="letter-sticker">{letter.icon}</span>
            <strong>{letter.sender}的信</strong>
            <small>{letter.title}</small>
            <em>{sortedLetters[letter.id] ? "已分拣" : "待分拣"}</em>
            {replies[letter.id] && <b>已回信</b>}
          </button>
        ))}
      </div>
      <LetterReader letter={activeLetter} />
    </section>
  );
}

function LetterReader({ letter }) {
  const handleSpeak = () => {
    const textToSpeak = `来自${letter.sender}。信件标题：${letter.title}。发生的事情：${letter.event}。情绪线索：${letter.clue}。目的地：${letter.destinationName}。`;
    speakText(textToSpeak);
  };

  return (
    <article className="letter-reader">
      <div className="title-with-audio">
        <span className="big-emoji">{letter.icon}</span>
        <button
          className="audio-speak-btn"
          onClick={handleSpeak}
          title="语音朗读"
          aria-label="朗读这封信"
        >
          🔊
        </button>
      </div>
      <h3>来自{letter.sender}：{letter.title}</h3>
      <p><strong>发生的事情：</strong>{letter.event}</p>
      <p><strong>情绪线索：</strong>{letter.clue}</p>
      <p><strong>目的地：</strong>{letter.destinationName}</p>
    </article>
  );
}

function PostOfficeScene({ state, activeLetter, onOpenLetter, onSort }) {
  return (
    <div className="post-office-scene fade-in">
      <div className="scene-heading">
        <span>💌</span>
        <div>
          <h2>收信：今日邮袋</h2>
          <p>先读信，再去分拣台判断它属于哪一种情绪。</p>
        </div>
      </div>
      <TodayMailbag
        activeLetter={activeLetter}
        onOpenLetter={onOpenLetter}
        sortedLetters={state.sortedLetters}
        replies={state.replies}
      />
      <div className="post-office-next">
        <button className="primary-button" onClick={onSort}>
          去信件分拣台
        </button>
      </div>
    </div>
  );
}

function SortScene({ state, activeLetter, onOpenLetter, onSort, onRoute }) {
  const [feedback, setFeedback] = useState("");
  const selectedMailbox = state.sortedLetters[activeLetter.id];

  const chooseMailbox = (mailboxId) => {
    if (mailboxId === activeLetter.emotion) {
      onSort(activeLetter.id, mailboxId);
      setFeedback(`分拣正确！${activeLetter.sender}的信可以送往${activeLetter.destinationName}。`);
    } else {
      const mailbox = emotionMailboxes.find((item) => item.id === mailboxId);
      setFeedback(`${mailbox.label}还不太合适，再看看信里的情绪线索。`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < emotionMailboxes.length) {
          chooseMailbox(emotionMailboxes[index].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLetter, chooseMailbox]);

  return (
    <div className="sort-scene fade-in">
      <div className="scene-heading">
        <span>📬</span>
        <div>
          <h2>信件分拣小游戏</h2>
          <p>读懂线索，把信分到正确的情绪邮箱（支持按 1-4 数字键快捷分拣）。</p>
        </div>
      </div>
      <div className="sort-layout">
        <aside className="sort-letter-list">
          {letters.map((letter) => (
            <button
              className={`letter-envelope ${activeLetter.id === letter.id ? "open" : ""}`}
              key={letter.id}
              onClick={() => {
                setFeedback("");
                onOpenLetter(letter.id);
              }}
            >
              <span>{letter.icon}</span>
              <strong>{letter.sender}</strong>
              <small>{state.sortedLetters[letter.id] ? "已分拣" : "待分拣"}</small>
            </button>
          ))}
        </aside>
        <LetterReader letter={activeLetter} />
        <section className="mailbox-sorter">
          {emotionMailboxes.map((mailbox, index) => (
            <button
              className={`emotion-mailbox choice-card ${
                selectedMailbox === mailbox.id ? "correct selected" : ""
              }`}
              key={mailbox.id}
              onClick={() => chooseMailbox(mailbox.id)}
            >
              <span className="key-badge">{index + 1}</span>
              <span>{mailbox.icon}</span>
              <strong>{mailbox.label}</strong>
            </button>
          ))}
          {feedback && (
            <div
              className={`feedback-box ${
                feedback.startsWith("分拣正确") ? "success" : "gentle"
              }`}
            >
              {feedback}
            </div>
          )}
          <button
            className="primary-button"
            disabled={Object.keys(state.sortedLetters).length === 0}
            onClick={onRoute}
          >
            查看派送路线
          </button>
        </section>
      </div>
    </div>
  );
}

function RouteScene({
  state,
  onDeliver,
  onPostOffice,
  onSort,
  onOpenStamps,
  onOpenReport,
}) {
  return (
    <div className="map-scene route-scene fade-in">
      <div className="scene-heading">
        <span>🗺️</span>
        <div>
          <h2>派送路线</h2>
          <p>只有已经分拣正确的信件，才能送往对应目的地。</p>
        </div>
      </div>
      <div className="route-board">
        <div className="map-path route-path" />
        {deliveryLocations.map((location) => {
          const letter = letters.find((item) => item.destination === location.id);
          const sorted = letter && state.sortedLetters[letter.id] === letter.emotion;
          const complete = letter && state.completedTasks.includes(letter.id);
          return (
            <button
              className={`map-location location-${location.id} ${
                sorted ? "ready" : "locked-route"
              } ${complete ? "delivered-route" : ""}`}
              key={location.id}
              disabled={!sorted}
              onClick={() => sorted && onDeliver(letter)}
            >
              <span className="location-icon">{location.icon}</span>
              <strong>{location.name}</strong>
              <span className="location-tooltip">
                {letter
                  ? `${letter.sender}的信：${complete ? "已送达" : sorted ? "可派送" : "先分拣"}`
                  : location.training}
              </span>
            </button>
          );
        })}
      </div>
      <footer className="map-actions">
        <button className="secondary-button" onClick={onPostOffice}>收信</button>
        <button className="secondary-button" onClick={onSort}>分拣台</button>
        <button className="secondary-button" onClick={onOpenStamps}>邮票册</button>
        <button className="secondary-button" onClick={onOpenReport}>学习报告</button>
      </footer>
    </div>
  );
}

function TaskShell({ letter, title, children, replyReady, onReply }) {
  const handleSpeak = () => {
    const textToSpeak = `已送达：${letter.sender}的信。发生的事情：${letter.event}。回信目标：${letter.reply}。`;
    speakText(textToSpeak);
  };

  return (
    <div className="task-shell">
      <section className="delivery-letter">
        <span>{letter.icon}</span>
        <div>
          <div className="title-with-audio">
            <h3 style={{ margin: 0 }}>已送达：{letter.sender}的信</h3>
            <button
              className="audio-speak-btn"
              onClick={handleSpeak}
              title="语音朗读"
              aria-label="朗读这封信"
            >
              🔊
            </button>
          </div>
          <p>{letter.event}</p>
          <small>回信目标：{letter.reply}</small>
        </div>
      </section>
      <h2>{title}</h2>
      {children}
      {replyReady && (
        <ReplyPanel letter={letter} onReply={onReply} />
      )}
    </div>
  );
}

function ReplyPanel({ letter, onReply }) {
  const [selected, setSelected] = useState("");
  const options = useMemo(() => [
    letter.reply,
    "你不要这样了，我不想理你。",
    "算了，什么都不用说。",
  ], [letter.reply]);

  const handleSpeak = () => {
    const textToSpeak = `情绪回信。请选择一句友好的回信。选项一：${options[0]}。选项二：${options[1]}。选项三：${options[2]}。`;
    speakText(textToSpeak);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["1", "2", "3"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < options.length) {
          setSelected(options[index]);
        }
      }
      if (e.key === "Enter" && selected === letter.reply) {
        onReply(letter.reply);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, options, letter.reply, onReply]);

  return (
    <section className="reply-panel">
      <div className="section-title">
        <span>✉️</span>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>情绪回信</h3>
            <p>选择一句友好的回信，完成盖邮戳（支持按数字键 1-3 选择，Enter 提交）。</p>
          </div>
          <button
            className="audio-speak-btn"
            onClick={handleSpeak}
            title="语音朗读"
            aria-label="朗读情绪回信选项"
          >
            🔊
          </button>
        </div>
      </div>
      <div className="reply-options">
        {options.map((option, index) => (
          <button
            className={`choice-card ${selected === option ? "selected" : ""}`}
            key={option}
            onClick={() => setSelected(option)}
          >
            <span className="key-badge">{index + 1}</span>
            {option}
          </button>
        ))}
      </div>
      <button
        className="primary-button stamp-button"
        disabled={selected !== letter.reply}
        onClick={() => onReply(letter.reply)}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        盖邮戳并送达 <span className="key-badge" style={{ marginLeft: "12px", marginRight: 0, background: "#fff", borderColor: "#bbb" }}>Enter</span>
      </button>
    </section>
  );
}

function ToyHouseScene({ letter, completeTask, state }) {
  const [selected, setSelected] = useState({
    emotion: "",
    need: "",
    expression: "",
  });
  const [feedback, setFeedback] = useState("");
  const taskDone = state.completedTasks.includes(letter.id);

  const cards = {
    emotion: ["难过", "生气", "着急", "害怕"],
    need: ["我还想玩一会儿", "我想抢回来", "我想不说话"],
    expression: [
      "可以等我玩完再给你吗",
      "你真讨厌",
      "我再也不要玩了",
    ],
  };

  const checkCombination = () => {
    const correct =
      selected.emotion === "难过" &&
      selected.need === "我还想玩一会儿" &&
      selected.expression === "可以等我玩完再给你吗";
    setFeedback(
      correct
        ? "组合成功，可以帮小兔写一封友好的回信。"
        : "这组卡牌还不够温和，再试试把情绪、需求和礼貌表达连起来。",
    );
  };

  const finishReply = (reply) => {
    completeTask({
      letterId: letter.id,
      taskId: letter.id,
      stampIds: [letter.stampId],
      skills: letter.skills,
      reply,
    });
    setFeedback("情绪信成功送达！");
  };

  return (
    <TaskShell
      letter={letter}
      title="玩具屋：卡牌组合游戏"
      replyReady={feedback.startsWith("组合成功") || taskDone}
      onReply={finishReply}
    >
      <div className="mini-game toy-house">
        <div className="story-side">
          <div className="room-visual">
            <span>🐰</span>
            <span>🧱</span>
            <span>🐻</span>
          </div>
          <p>把情绪卡、需求卡、表达卡组合成一句友好的话。</p>
        </div>
        <div className="cards-side">
          {Object.entries(cards).map(([type, list]) => (
            <CardGroup
              key={type}
              title={{ emotion: "情绪卡", need: "需求卡", expression: "表达卡" }[type]}
              type={type}
              cards={list}
              selected={selected[type]}
              onSelect={(cardType, value) =>
                setSelected((current) => ({ ...current, [cardType]: value }))
              }
            />
          ))}
          <button className="primary-button" onClick={checkCombination}>
            组合回信
          </button>
          {feedback && (
            <div className={`feedback-box ${feedback.startsWith("组合成功") || feedback.startsWith("情绪信") ? "success" : "gentle"}`}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </TaskShell>
  );
}

function CardGroup({ title, type, cards, selected, onSelect }) {
  return (
    <section className="card-group">
      <h3>{title}</h3>
      <div className="choice-card-row">
        {cards.map((card) => (
          <button
            className={`choice-card ${selected === card ? "selected" : ""}`}
            key={card}
            onClick={() => onSelect(type, card)}
          >
            {card}
          </button>
        ))}
      </div>
    </section>
  );
}

function PlaygroundScene({ letter, completeTask, state }) {
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState("");
  const taskDone = state.completedTasks.includes(letter.id);

  const round1Options = useMemo(() => [
    "我有点生气，因为高塔倒了。",
    "你太坏了！",
    "我再也不玩了。",
  ], []);

  const round2Options = useMemo(() => [
    "下次可以小心一点吗？",
    "你必须帮我重搭。",
    "不要碰我的东西！",
  ], []);

  const handleSpeak = () => {
    let textToSpeak = "森林操场，角色扮演对话。小狐狸说：我的高塔倒了，我好生气。";
    if (round === 1) {
      textToSpeak += "第一步：帮小狐狸说出感受。选项一：我有点生气，因为高塔倒了。选项二：你太坏了。选项三：我再也不玩了。";
    } else if (round === 2) {
      textToSpeak += "第二步：提出礼貌请求。选项一：下次可以小心一点吗？选项二：你必须帮我重搭。选项三：不要碰我的东西。";
    } else {
      textToSpeak += "小游戏已完成，请在下方写回信。";
    }
    speakText(textToSpeak);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (taskDone) return;
      if (["1", "2", "3"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (round === 1) {
          const option = round1Options[index];
          if (option) {
            if (option.startsWith("我有点")) {
              setRound(2);
              setFeedback("朋友听懂了小狐狸的感受。");
            } else {
              setFeedback("这句话会让朋友更紧张，试试先说自己的感受。");
            }
          }
        } else if (round === 2) {
          const option = round2Options[index];
          if (option) {
            if (option.startsWith("下次")) {
              setRound(3);
              setFeedback("可以开始写回信了。");
            } else {
              setFeedback("把要求说温柔一点，会更容易被朋友接受。");
            }
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [round, round1Options, round2Options, taskDone]);

  const finishReply = (reply) => {
    completeTask({
      letterId: letter.id,
      taskId: letter.id,
      stampIds: [letter.stampId],
      skills: letter.skills,
      reply,
    });
    setFeedback("情绪信成功送达！");
  };

  return (
    <TaskShell
      letter={letter}
      title="森林操场：角色扮演对话"
      replyReady={round === 3 || taskDone}
      onReply={finishReply}
    >
      <div className="playground-stage">
        <div className="character cat">🦊</div>
        <div className="character rabbit">🐰</div>
        <div className="character bear">🐻</div>
        <div className="ball">🏗️</div>
        <div className="dialogue cat-bubble">我的高塔倒了，我好生气。</div>
        {feedback && <div className="dialogue friend-bubble">{feedback}</div>}
      </div>
      <div className="question-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>
            {round === 1 && "第一步：帮小狐狸说出感受"}
            {round === 2 && "第二步：提出礼貌请求"}
            {round === 3 && "第三步：已完成扮演"}
          </h3>
          {round < 3 && (
            <button
              className="audio-speak-btn"
              onClick={handleSpeak}
              title="语音朗读"
              aria-label="语音朗读选项"
            >
              🔊
            </button>
          )}
        </div>
        {round === 1 && round1Options.map((option, index) => (
          <button
            className="choice-card"
            key={option}
            onClick={() => {
              if (option.startsWith("我有点")) {
                setRound(2);
                setFeedback("朋友听懂了小狐狸的感受。");
              } else {
                setFeedback("这句话会让朋友更紧张，试试先说自己的感受。");
              }
            }}
          >
            <span className="key-badge">{index + 1}</span>
            {option}
          </button>
        ))}
        {round === 2 && round2Options.map((option, index) => (
          <button
            className="choice-card"
            key={option}
            onClick={() => {
              if (option.startsWith("下次")) {
                setRound(3);
                setFeedback("可以开始写回信了。");
              } else {
                setFeedback("把要求说温柔一点，会更容易被朋友接受。");
              }
            }}
          >
            <span className="key-badge">{index + 1}</span>
            {option}
          </button>
        ))}
      </div>
    </TaskShell>
  );
}

function QueueStationScene({ letter, completeTask, state }) {
  const calmSteps = useMemo(() => ["深呼吸三次", "数到 5", "说：我可以等一等"], []);
  const [doneSteps, setDoneSteps] = useState([]);
  const [feedback, setFeedback] = useState("");
  const taskDone = state.completedTasks.includes(letter.id);
  const progress = Math.round((doneSteps.length / calmSteps.length) * 100);

  const handleSpeak = () => {
    const textToSpeak = `排队小站：冷静进度条小游戏。要让小熊猫在等待时冷静下来，请按 1-3 选择并完成以下步骤。步骤一：${calmSteps[0]}。步骤二：${calmSteps[1]}。步骤三：${calmSteps[2]}。当前进度百分之${progress}。`;
    speakText(textToSpeak);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (taskDone) return;
      if (["1", "2", "3"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        const step = calmSteps[index];
        if (step && !doneSteps.includes(step)) {
          setDoneSteps((current) => [...current, step]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doneSteps, calmSteps, taskDone]);

  const finishReply = (reply) => {
    completeTask({
      letterId: letter.id,
      taskId: letter.id,
      stampIds: [letter.stampId],
      skills: letter.skills,
      reply,
    });
    setFeedback("情绪信成功送达！");
  };

  return (
    <TaskShell
      letter={letter}
      title="排队小站：冷静进度条小游戏"
      replyReady={progress === 100 || taskDone}
      onReply={finishReply}
    >
      <div className="queue-layout">
        <div className="queue-visual">
          <span>🐰</span>
          <span>🐱</span>
          <span>🐻</span>
          <div className="slide">🛝</div>
        </div>
        <div className="calm-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>冷静进度</h3>
            <button
              className="audio-speak-btn"
              onClick={handleSpeak}
              title="语音朗读"
              aria-label="朗读冷静步骤"
            >
              🔊
            </button>
          </div>
          <div className="calm-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p>{progress}%</p>
          <div className="calm-actions">
            {calmSteps.map((step, index) => (
              <button
                className={`choice-card ${doneSteps.includes(step) ? "selected" : ""}`}
                key={step}
                onClick={() => {
                  if (!doneSteps.includes(step)) {
                    setDoneSteps((current) => [...current, step]);
                  }
                }}
              >
                <span className="key-badge">{index + 1}</span>
                {step}
              </button>
            ))}
          </div>
          {progress === 100 && (
            <div className="feedback-box success">可以写一封耐心等待的回信了。</div>
          )}
          {feedback && <div className="feedback-box success">{feedback}</div>}
        </div>
      </div>
    </TaskShell>
  );
}

function QuietCornerScene({ letter, completeTask, state }) {
  const [stage, setStage] = useState("emotion");
  const [feedback, setFeedback] = useState("");
  const taskDone = state.completedTasks.includes(letter.id);

  const stageEmotionOptions = useMemo(() => ["开心", "害怕", "生气", "兴奋"], []);
  const stageComfortOptions = useMemo(() => [
    "可以先告诉我规则，再陪我试一次吗？",
    "别怕啦，这有什么好怕的。",
    "那你就别玩了。",
  ], []);

  const handleSpeak = () => {
    let textToSpeak = "安静角落：情绪识别与安慰方式选择小游戏。";
    if (stage === "emotion") {
      textToSpeak += "第一步：识别情绪。选项一：开心。选项二：害怕。选项三：生气。选项四：兴奋。";
    } else if (stage === "comfort") {
      textToSpeak += "第二步：选择安慰方式。选项一：可以先告诉我规则，再陪我试一次吗？选项二：别怕啦，这有什么好怕的。选项三：那你就别玩了。";
    } else {
      textToSpeak += "小游戏已完成，请在下方回信。";
    }
    speakText(textToSpeak);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (taskDone) return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (stage === "emotion") {
          const option = stageEmotionOptions[index];
          if (option) {
            if (option === "害怕") {
              setStage("comfort");
              setFeedback("你从线索里发现了小鹿害怕。");
            } else {
              setFeedback("再看看小鹿说的“我怕做错”。");
            }
          }
        } else if (stage === "comfort") {
          const option = stageComfortOptions[index];
          if (option) {
            if (option.startsWith("可以先")) {
              setStage("reply");
              setFeedback("这是一句温柔又具体的安慰。");
            } else {
              setFeedback("安慰别人时，要先接住对方的感受。");
            }
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, stageEmotionOptions, stageComfortOptions, taskDone]);

  const finishReply = (reply) => {
    completeTask({
      letterId: letter.id,
      taskId: letter.id,
      stampIds: [letter.stampId],
      skills: letter.skills,
      reply,
    });
    setFeedback("情绪信成功送达！");
  };

  return (
    <TaskShell
      letter={letter}
      title="安静角落：情绪识别 + 安慰方式选择"
      replyReady={stage === "reply" || taskDone}
      onReply={finishReply}
    >
      <div className="quiet-corner">
        <div className="comfort-visual">
          <div className="moon">🌙</div>
          <div className="deer">🦌</div>
          <div className="soft-light" />
        </div>
        <div className="comfort-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0 }}>
              {stage === "emotion" && "第一步：识别情绪"}
              {stage === "comfort" && "第二步：选择安慰方式"}
              {stage === "reply" && "第三步：已完成选择"}
            </h3>
            {stage !== "reply" && (
              <button
                className="audio-speak-btn"
                onClick={handleSpeak}
                title="语音朗读"
                aria-label="朗读当前关卡"
              >
                🔊
              </button>
            )}
          </div>
          {stage === "emotion" && stageEmotionOptions.map((option, index) => (
            <button
              className="choice-card"
              key={option}
              onClick={() => {
                if (option === "害怕") {
                  setStage("comfort");
                  setFeedback("你从线索里发现了小鹿害怕。");
                } else {
                  setFeedback("再看看小鹿说的“我怕做错”。");
                }
              }}
            >
              <span className="key-badge">{index + 1}</span>
              {option}
            </button>
          ))}
          {stage === "comfort" && stageComfortOptions.map((option, index) => (
            <button
              className="choice-card"
              key={option}
              onClick={() => {
                if (option.startsWith("可以先")) {
                  setStage("reply");
                  setFeedback("这是一句温柔又具体的安慰。");
                } else {
                  setFeedback("安慰别人时，要先接住对方的感受。");
                }
              }}
            >
              <span className="key-badge">{index + 1}</span>
              {option}
            </button>
          ))}
          {feedback && (
            <div className={`feedback-box ${feedback.startsWith("这是一句") || feedback.startsWith("你从") ? "success" : "gentle"}`}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </TaskShell>
  );
}

function ThreeDScene({ completeTask, state, navigate, letter }) {
  const taskDone = state.completedTasks.includes(letter.id);

  const finishReply = (reply) => {
    completeTask({
      letterId: letter.id,
      taskId: letter.id,
      stampIds: [letter.stampId],
      skills: letter.skills,
      reply,
    });
  };

  return (
    <div className="mini-game fade-in">
      <TaskShell
        letter={letter}
        title="3D探索区：Three.js 场景入口"
        replyReady={taskDone}
        onReply={finishReply}
      >
        <ThreeDFriendshipSquare
          stars={state.completedTasks.length}
          stampCount={state.collectedStamps.length}
          completedTasks={state.completedTasks}
          onBackToMap={() => navigate("map")}
          onReward={() => finishReply(letter.reply)}
        />
        {!taskDone && (
          <button className="primary-button stamp-button" onClick={() => finishReply(letter.reply)}>
            完成 3D 探索并盖邮戳
          </button>
        )}
      </TaskShell>
    </div>
  );
}

function StampBookScene({ collectedStamps }) {
  const [activeStamp, setActiveStamp] = useState(stamps[0]);

  return (
    <div className="stamp-book fade-in">
      <div className="scene-heading">
        <span>🎫</span>
        <div>
          <h2>邮票册</h2>
          <p>已获得 {collectedStamps.length} / {stamps.length}</p>
        </div>
      </div>
      <div className="stamp-layout">
        <div className="stamp-grid">
          {stamps.map((stamp) => {
            const collected = collectedStamps.includes(stamp.id);
            return (
              <button
                className={`stamp-card ${collected ? "collected" : "locked"}`}
                key={stamp.id}
                onClick={() => setActiveStamp(stamp)}
              >
                <span>{stamp.icon}</span>
                <strong>{stamp.name}</strong>
                <small>{collected ? "已盖邮戳" : "待收集"}</small>
              </button>
            );
          })}
        </div>
        <article className="stamp-detail">
          <span>{activeStamp.icon}</span>
          <h3>{activeStamp.name}</h3>
          <strong>{activeStamp.ability}</strong>
          <p>{activeStamp.description}</p>
        </article>
      </div>
    </div>
  );
}

function ReportScene({ state }) {
  const practicedSkills = [
    ["need", "表达需求"],
    ["polite", "礼貌沟通"],
    ["patience", "耐心等待"],
    ["empathy", "共情关心"],
    ["emotion", "情绪识别"],
  ];

  return (
    <div className="report-scene fade-in">
      <div className="scene-heading">
        <span>📊</span>
        <div>
          <h2>学习报告</h2>
          <p>数据由今日信件、邮戳和邮票收集自动记录在本机。</p>
        </div>
      </div>
      <div className="report-stats">
        <article>
          <strong>{Object.keys(state.sortedLetters).length}</strong>
          <span>已分拣信件</span>
        </article>
        <article>
          <strong>{state.completedTasks.length}</strong>
          <span>成功送达</span>
        </article>
        <article>
          <strong>{state.collectedStamps.length}</strong>
          <span>获得邮票</span>
        </article>
      </div>
      <section className="skill-report">
        <h3>能力对应邮票</h3>
        {practicedSkills.map(([key, label]) => (
          <div className="skill-row" key={key}>
            <span>{label}</span>
            <div className="skill-track">
              <div style={{ width: `${state.skillScores[key] ?? 0}%` }} />
            </div>
            <strong>{state.skillScores[key] ?? 0}%</strong>
          </div>
        ))}
      </section>
      <section className="suggestion-panel">
        <h3>今日回信记录</h3>
        {letters.map((letter) => (
          <p key={letter.id}>
            {state.replies[letter.id]
              ? `${letter.sender}：${state.replies[letter.id]}`
              : `${letter.sender}：还没有完成回信`}
          </p>
        ))}
      </section>
    </div>
  );
}

function StampBurst({ burst, onDone }) {
  const stamp = stamps.find((item) => item.id === burst.stampId) || doubleStamps.find((item) => item.id === burst.stampId);

  useEffect(() => {
    const timer = window.setTimeout(onDone, 1700);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  if (!stamp) return null;

  return (
    <div className="stamp-burst" role="status">
      <div className="stamp-mark">已盖邮戳</div>
      <strong>{stamp.name}</strong>
      <span>情绪信成功送达！</span>
    </div>
  );
}

// ==================== 双人模式全新场景与组件 ====================

function ModeChoiceScene({ onChooseSingle, onChooseDouble }) {
  return (
    <div className="mode-choice-scene fade-in">
      <header className="mode-choice-header">
        <h1>选择游戏模式</h1>
        <p>欢迎来到情绪邮局！请选择你今天的邮递员冒险方式：</p>
      </header>
      <div className="mode-cards-grid">
        <button className="mode-card single-card" onClick={onChooseSingle}>
          <span className="mode-card-badge">🏠 单人模式</span>
          <div className="mode-card-icon">🎒</div>
          <h2>单人小邮递员</h2>
          <p>自己独立完成情绪信件的分拣与派送，练习情绪识别和友好表达。</p>
          <div className="mode-card-btn">开始单人模式 &rarr;</div>
        </button>

        <button className="mode-card double-card" onClick={onChooseDouble}>
          <span className="mode-card-badge double">🤝 双人协作</span>
          <div className="mode-card-icon">👥</div>
          <h2>双人协作邮局</h2>
          <p>两位小朋友扮演不同角色，共同协作解决情绪挑战，练习分工与共情。</p>
          <div className="mode-card-btn">进入双人协作 &rarr;</div>
        </button>
      </div>
    </div>
  );
}

function DoubleIntroScene({ onNext }) {
  return (
    <div className="double-intro fade-in">
      <div className="scene-heading">
        <span>🤝</span>
        <div>
          <h2>双人协作模式：小小侦探与回信员</h2>
          <p>两位小朋友需要分工合作，一起帮助小动物解决情绪问题哦！</p>
        </div>
      </div>

      <div className="role-cards-container">
        <div className="role-intro-card player-a-card">
          <span className="role-avatar">🔍</span>
          <h3>玩家 A：情绪侦探</h3>
          <p>职责：</p>
          <ul>
            <li>认真阅读信件。</li>
            <li>找出信里隐藏的情绪线索。</li>
            <li>帮助小动物诊断它此刻的情绪。</li>
          </ul>
        </div>

        <div className="role-intro-card player-b-card">
          <span className="role-avatar">✉️</span>
          <h3>玩家 B：友好回信员</h3>
          <p>职责：</p>
          <ul>
            <li>根据侦探判断的情绪寻找回应方式。</li>
            <li>选择一句最温暖、最友好的回信。</li>
            <li>帮助小动物表达需求或解决问题。</li>
          </ul>
        </div>
      </div>

      <div className="coop-rule-box">
        <h4>📢 合作法则：</h4>
        <p>情绪判断与回信选择完成后，需要**两个小朋友一起点击确认**才能成功投递哦！</p>
      </div>

      <div style={{ textAlign: "center", marginTop: "24px" }}>
        <button className="primary-button" onClick={onNext} style={{ minWidth: "220px" }}>
          我们准备好了，出发！
        </button>
      </div>
    </div>
  );
}

function DoubleMailbagScene({ state, onSelectLetter }) {
  return (
    <div className="double-mailbag fade-in">
      <div className="scene-heading">
        <span>📮</span>
        <div>
          <h2>今日协作邮袋</h2>
          <p>请点击选择一封情绪信，两位小邮递员一起出发吧！</p>
        </div>
      </div>

      <div className="mailbag-grid">
        {doubleLetters.map((letter) => {
          const completed = state.completedTasks.includes(letter.id);
          return (
            <button
              className={`letter-card ${completed ? "delivered-route" : ""}`}
              key={letter.id}
              onClick={() => onSelectLetter(letter.id)}
            >
              <span className="letter-sticker">{letter.icon}</span>
              <strong>{letter.sender}的信</strong>
              <small>{letter.title}</small>
              <em>{completed ? "✅ 合作送达" : "⏳ 待合作"}</em>
            </button>
          );
        })}
      </div>

      <div className="double-home-tip">
        <p>💡 每完成一封信，都能获得一枚特制的**双人合作邮票**，并点亮协作报告！</p>
      </div>
    </div>
  );
}

function DoubleTaskScene({ state, dispatch, activeLetter, onBackToHome }) {
  const [feedback, setFeedback] = useState("");
  const taskDone = state.completedTasks.includes(activeLetter.id);
  const chosenReply = state.replies[activeLetter.id] || activeLetter.options.find(o => o.correct).text;

  const handleSelectEmotion = (emotionId) => {
    if (emotionId === activeLetter.emotion) {
      dispatch({ type: "PLAYER_A_CHOOSE", emotion: emotionId });
      setFeedback("正确识别情绪！小侦探真棒。现在请点击下方按钮交给玩家 B 吧！");
    } else {
      setFeedback(`小动物看起来不像是在${getEmotionLabel(emotionId)}，仔细看看它发生的事或情绪线索吧。`);
    }
  };

  const handleSelectReply = (replyText, isCorrect) => {
    if (isCorrect) {
      dispatch({ type: "PLAYER_B_CHOOSE", reply: replyText });
      setFeedback("这是一句非常友好的回信！可以邀请玩家 A 一起进行最终盖戳确认了！");
    } else {
      setFeedback("这句话听起来可能会让小动物更难过或生气，再换个温暖的说法吧。");
    }
  };

  const getEmotionLabel = (id) => {
    if (id === "sad") return "难过";
    if (id === "angry") return "生气";
    if (id === "anxious") return "着急";
    if (id === "scared") return "害怕";
    return id;
  };

  return (
    <div className="double-task-area fade-in">
      <header className="double-task-header">
        <button className="secondary-button" onClick={onBackToHome}>返回双人邮包</button>
        <div className="role-indicators">
          <span className={`role-tag player-a ${state.currentPlayer === "A" && state.doubleStep !== "confirm" && state.doubleStep !== "complete" && !taskDone ? "active" : ""}`}>
            🔍 玩家 A：情绪侦探
          </span>
          <span className={`role-tag player-b ${state.currentPlayer === "B" && state.doubleStep !== "confirm" && state.doubleStep !== "complete" && !taskDone ? "active" : ""}`}>
            ✉️ 玩家 B：友好回信员
          </span>
          {state.doubleStep === "confirm" && !taskDone && <span className="role-tag confirm-tag active">🤝 双人确认</span>}
        </div>
      </header>

      <section className="delivery-letter">
        <span>{activeLetter.icon}</span>
        <div>
          <h3>合作送达：{activeLetter.sender}的信</h3>
          <p>{activeLetter.event}</p>
          <small><strong>线索：</strong>{activeLetter.clue}</small>
        </div>
      </section>

      {taskDone || state.doubleStep === "complete" ? (
        <div className="double-task-complete-card">
          <div className="stamp-mark">🤝 合作成功</div>
          <h2>小动物非常开心！</h2>
          <p>由于你们的齐心协力，{activeLetter.sender}的问题得到了解决！</p>
          <div className="coop-summary-box">
            <p><strong>🕵️ 侦探 A 发现：</strong>它当时感到 <strong>{activeLetter.emotionLabel}</strong></p>
            <p><strong>✍️ 回信员 B 回信：</strong>“{chosenReply}”</p>
          </div>
          <button className="primary-button" onClick={onBackToHome} style={{ marginTop: "20px" }}>
            返回双人邮包 📮
          </button>
        </div>
      ) : state.doubleStep === "emotion" ? (
        <div className="coop-step-panel player-a-step">
          <div className="step-instruction">
            <h4>第一步：请玩家 A 识别情绪</h4>
            <p>观察上方的信件与线索，选择小动物此刻的真实心情：</p>
          </div>

          <div className="choice-card-row">
            {["sad", "angry", "anxious", "scared"].map((emotionId) => (
              <button
                className={`choice-card ${state.playerAChoice === emotionId ? "selected" : ""}`}
                key={emotionId}
                onClick={() => handleSelectEmotion(emotionId)}
              >
                <span>{emotionId === "sad" ? "💧" : emotionId === "angry" ? "🔥" : emotionId === "anxious" ? "⏳" : "🌙"}</span>
                <strong>{getEmotionLabel(emotionId)}</strong>
              </button>
            ))}
          </div>

          {feedback && (
            <div className={`feedback-box ${state.playerAChoice ? "success" : "gentle"}`}>
              {feedback}
            </div>
          )}

          {state.playerAChoice && (
            <button
              className="primary-button next-step-btn"
              onClick={() => {
                setFeedback("");
                dispatch({ type: "GO_TO_PLAYER_B" });
              }}
            >
              交给玩家 B 回信 ➡️
            </button>
          )}
        </div>
      ) : state.doubleStep === "reply" ? (
        <div className="coop-step-panel player-b-step">
          <div className="step-instruction">
            <h4>第二步：请玩家 B 选择温暖回信</h4>
            <p>玩家 A 判定情绪是：<strong>{getEmotionLabel(state.playerAChoice)}</strong>。请选择一句话安慰它并解决问题：</p>
          </div>

          <div className="reply-options-list">
            {activeLetter.options.map((option) => (
              <button
                className={`choice-card reply-option-card ${state.playerBReply === option.text ? "selected" : ""}`}
                key={option.text}
                onClick={() => handleSelectReply(option.text, option.correct)}
              >
                {option.text}
              </button>
            ))}
          </div>

          {feedback && (
            <div className={`feedback-box ${state.playerBReply ? "success" : "gentle"}`}>
              {feedback}
            </div>
          )}

          {state.playerBReply && (
            <button
              className="primary-button next-step-btn"
              onClick={() => {
                setFeedback("");
                dispatch({ type: "GO_TO_CONFIRM" });
              }}
            >
              去双人确认盖邮戳 🤝
            </button>
          )}
        </div>
      ) : state.doubleStep === "confirm" ? (
        <div className="coop-step-panel confirm-step">
          <div className="step-instruction">
            <h4>第三步：两位小朋友一起来确认吧！</h4>
            <p>点击“我们确认帮助它”按钮，为信件盖上双人协作邮戳并送出！</p>
          </div>

          <div className="double-confirm-preview">
            <div className="confirm-col">
              <span className="col-icon">🔍</span>
              <strong>情绪侦探 A</strong>
              <p>诊断小动物心情：</p>
              <div className="col-result">{getEmotionLabel(state.playerAChoice)}</div>
            </div>
            <div className="confirm-arrow">🤝</div>
            <div className="confirm-col">
              <span className="col-icon">✉️</span>
              <strong>友好回信员 B</strong>
              <p>发送温暖回信：</p>
              <div className="col-result-reply">“{state.playerBReply}”</div>
            </div>
          </div>

          <button
            className="primary-button stamp-button large-btn"
            onClick={() => dispatch({ type: "CONFIRM_HELP" })}
          >
            💖 我们确认帮助它！
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DoubleStampsScene({ collectedStamps }) {
  const [activeStamp, setActiveStamp] = useState(doubleStamps[0]);

  return (
    <div className="stamp-book fade-in">
      <div className="scene-heading">
        <span>🎫</span>
        <div>
          <h2>双人合作邮票册</h2>
          <p>齐心协力，共同收集！已获得 {collectedStamps.length} / {doubleStamps.length}</p>
        </div>
      </div>
      <div className="stamp-layout">
        <div className="stamp-grid">
          {doubleStamps.map((stamp) => {
            const collected = collectedStamps.includes(stamp.id);
            return (
              <button
                className={`stamp-card ${collected ? "collected double-stamp" : "locked"}`}
                key={stamp.id}
                onClick={() => setActiveStamp(stamp)}
              >
                <span>{stamp.icon}</span>
                <strong>{stamp.name}</strong>
                <small>{collected ? "🤝 共同获得" : "待收集"}</small>
              </button>
            );
          })}
        </div>
        <article className="stamp-detail">
          <span>{activeStamp.icon}</span>
          <h3>{activeStamp.name}</h3>
          <strong>{activeStamp.ability}</strong>
          <p>{activeStamp.description}</p>
        </article>
      </div>
    </div>
  );
}

function DoubleReportScene({ state }) {
  const practicedSkills = [
    ["emotionRecognition", "情绪识别", "玩家 A 正确判断小动物的情绪感受。"],
    ["friendlyReply", "友好回应", "玩家 B 为小动物选出合适的安慰和回应。"],
    ["cooperation", "合作解决", "两个小朋友通过分工与讨论做出最终决定。"],
    ["empathy", "共情关心", "回信选择体现了对他人处境的理解与关怀。"],
    ["turnTaking", "轮流合作", "按照角色分工与轮流阶段共同完成。"]
  ];

  return (
    <div className="report-scene fade-in" style={{ padding: "20px" }}>
      <div className="scene-heading">
        <span>📊</span>
        <div>
          <h2>双人合作成长报告</h2>
          <p>这是你们两位小小邮递员共同努力、精诚合作获得的成长轨迹！</p>
        </div>
      </div>

      <div className="report-stats">
        <article style={{ borderLeftColor: "#ffd3df" }}>
          <strong>{state.completedTasks.length}</strong>
          <span>合作处理信件</span>
        </article>
        <article style={{ borderLeftColor: "#bfe8ff" }}>
          <strong>{state.collectedStamps.length}</strong>
          <span>收集合作邮票</span>
        </article>
        <article style={{ borderLeftColor: "#fff2bd" }}>
          <strong>{Math.round(state.completedTasks.length * 33.3)}%</strong>
          <span>今日协作进度</span>
        </article>
      </div>

      <section className="skill-report">
        <h3>双人协作五维指标</h3>
        {practicedSkills.map(([key, label, desc]) => (
          <div className="skill-row" key={key} style={{ display: "block", marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", marginBottom: "4px" }}>
              <span>{label}</span>
              <strong>{state.teamReport[key] ?? 0}%</strong>
            </div>
            <div className="skill-track" style={{ height: "16px", borderRadius: "8px" }}>
              <div style={{ width: `${state.teamReport[key] ?? 0}%`, height: "100%", borderRadius: "8px", background: "#fbd38d" }} />
            </div>
            <small style={{ color: "#6c5d56", fontSize: "14px", marginTop: "2px", display: "block" }}>{desc}</small>
          </div>
        ))}
      </section>

      <section className="suggestion-panel">
        <h3>今日合作寄信记录</h3>
        {doubleLetters.map((letter) => (
          <p key={letter.id} style={{ fontSize: "16px", lineHeight: "1.6" }}>
            {state.replies[letter.id]
              ? `🤝 成功帮助了【${letter.sender}】：回信说“${state.replies[letter.id]}”`
              : `⏳ 还未合作处理【${letter.sender}】的信件`}
          </p>
        ))}
      </section>
    </div>
  );
}

function DoubleModeScene({ state, dispatch, onBackToModeChoice }) {
  const activeLetter = doubleLetters.find(l => l.id === state.activeLetterId) || doubleLetters[0];

  const handleSelectLetter = (letterId) => {
    dispatch({ type: "SELECT_LETTER", letterId });
    dispatch({ type: "NAVIGATE", scene: "doubleTask" });
  };

  if (state.currentScene === "doubleHome") {
    if (state.doubleStep === "intro") {
      return (
        <DoubleIntroScene
          onNext={() => dispatch({ type: "GO_TO_MAILBAG" })}
        />
      );
    }
    return (
      <DoubleMailbagScene
        state={state}
        onSelectLetter={handleSelectLetter}
      />
    );
  }

  if (state.currentScene === "doubleTask") {
    return (
      <DoubleTaskScene
        state={state}
        dispatch={dispatch}
        activeLetter={activeLetter}
        onBackToHome={() => dispatch({ type: "NAVIGATE", scene: "doubleHome" })}
      />
    );
  }

  if (state.currentScene === "doubleStamps") {
    return (
      <DoubleStampsScene
        collectedStamps={state.collectedStamps}
      />
    );
  }

  if (state.currentScene === "doubleReport") {
    return (
      <DoubleReportScene
        state={state}
      />
    );
  }

  return null;
}

export default App;
