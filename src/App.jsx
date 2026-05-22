import { useEffect, useMemo, useReducer, useState } from "react";
import ThreeDFriendshipSquare from "./scenes/ThreeDFriendshipSquare.jsx";

const STORAGE_KEY = "emotion-post-office-day";

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

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return freshState;
    return { ...freshState, ...JSON.parse(saved) };
  } catch {
    return freshState;
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
  const [state, dispatch] = useReducer(gameReducer, undefined, loadInitialState);
  const activeLetter = getLetter(state.activeLetterId);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const sortedCount = Object.keys(state.sortedLetters).length;
  const deliveredCount = state.completedTasks.length;

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
    const location = deliveryLocations.find((item) => item.id === state.currentScene);
    if (state.currentScene === "home") return "情绪信件的一天";
    if (state.currentScene === "postOffice") return "情绪邮局";
    if (state.currentScene === "sort") return "信件分拣台";
    if (state.currentScene === "map") return "派送路线";
    if (state.currentScene === "stamps") return "邮票册";
    if (state.currentScene === "report") return "学习报告";
    return location?.name ?? "情绪任务";
  }, [state.currentScene]);

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

  const showBackToRoute = !["home", "postOffice", "sort", "map"].includes(
    state.currentScene,
  );

  return (
    <main className="app-shell">
      <section className="tablet">
        <header className="top-bar">
          <div>
            <span className="eyebrow">情绪小邮局 3.0</span>
            <h1>{sceneTitle}</h1>
          </div>
          <div className="global-stats" aria-label="今日邮局进度">
            <span>📬 {sortedCount}/{letters.length}</span>
            <span>🎫 {state.collectedStamps.length}/{stamps.length}</span>
            <span>✅ {deliveredCount}</span>
          </div>
        </header>

        <nav className="quick-nav" aria-label="邮局流程">
          <button onClick={() => navigate("postOffice")}>收信</button>
          <button onClick={() => navigate("sort")}>分拣</button>
          <button onClick={() => navigate("map")}>派送</button>
          <button onClick={() => navigate("stamps")}>邮票册</button>
          <button onClick={() => navigate("report")}>报告</button>
          <button onClick={() => dispatch({ type: "RESET_DAY" })}>重置今日</button>
        </nav>

        {showBackToRoute && (
          <button className="map-back-button" onClick={() => navigate("map")}>
            返回派送路线
          </button>
        )}

        <section className="scene-card">{renderScene()}</section>
      </section>

      {state.stampBursts.map((burst) => (
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
  return (
    <article className="letter-reader">
      <span className="big-emoji">{letter.icon}</span>
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

  return (
    <div className="sort-scene fade-in">
      <div className="scene-heading">
        <span>📬</span>
        <div>
          <h2>信件分拣小游戏</h2>
          <p>读懂线索，把信分到正确的情绪邮箱。</p>
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
          {emotionMailboxes.map((mailbox) => (
            <button
              className={`emotion-mailbox ${
                selectedMailbox === mailbox.id ? "correct" : ""
              }`}
              key={mailbox.id}
              onClick={() => chooseMailbox(mailbox.id)}
            >
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
  return (
    <div className="task-shell">
      <section className="delivery-letter">
        <span>{letter.icon}</span>
        <div>
          <h3>已送达：{letter.sender}的信</h3>
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
  const options = [
    letter.reply,
    "你不要这样了，我不想理你。",
    "算了，什么都不用说。",
  ];

  return (
    <section className="reply-panel">
      <div className="section-title">
        <span>✉️</span>
        <div>
          <h3>情绪回信</h3>
          <p>选择一句友好的回信，完成盖邮戳。</p>
        </div>
      </div>
      <div className="reply-options">
        {options.map((option) => (
          <button
            className={`choice-card ${selected === option ? "selected" : ""}`}
            key={option}
            onClick={() => setSelected(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        className="primary-button stamp-button"
        disabled={selected !== letter.reply}
        onClick={() => onReply(letter.reply)}
      >
        盖邮戳并送达
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
        {round === 1 && (
          <>
            <h3>第一步：帮小狐狸说出感受</h3>
            {[
              "我有点生气，因为高塔倒了。",
              "你太坏了！",
              "我再也不玩了。",
            ].map((option) => (
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
                {option}
              </button>
            ))}
          </>
        )}
        {round === 2 && (
          <>
            <h3>第二步：提出礼貌请求</h3>
            {[
              "下次可以小心一点吗？",
              "你必须帮我重搭。",
              "不要碰我的东西！",
            ].map((option) => (
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
                {option}
              </button>
            ))}
          </>
        )}
      </div>
    </TaskShell>
  );
}

function QueueStationScene({ letter, completeTask, state }) {
  const calmSteps = ["深呼吸三次", "数到 5", "说：我可以等一等"];
  const [doneSteps, setDoneSteps] = useState([]);
  const [feedback, setFeedback] = useState("");
  const taskDone = state.completedTasks.includes(letter.id);
  const progress = Math.round((doneSteps.length / calmSteps.length) * 100);

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
          <h3>冷静进度</h3>
          <div className="calm-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p>{progress}%</p>
          <div className="calm-actions">
            {calmSteps.map((step) => (
              <button
                className={`choice-card ${doneSteps.includes(step) ? "selected" : ""}`}
                key={step}
                onClick={() => {
                  if (!doneSteps.includes(step)) {
                    setDoneSteps((current) => [...current, step]);
                  }
                }}
              >
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
          {stage === "emotion" ? (
            <>
              <h3>第一步：识别情绪</h3>
              {["开心", "害怕", "生气", "兴奋"].map((option) => (
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
                  {option}
                </button>
              ))}
            </>
          ) : (
            <>
              <h3>第二步：选择安慰方式</h3>
              {[
                "可以先告诉我规则，再陪我试一次吗？",
                "别怕啦，这有什么好怕的。",
                "那你就别玩了。",
              ].map((option) => (
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
                  {option}
                </button>
              ))}
            </>
          )}
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
  const stamp = stamps.find((item) => item.id === burst.stampId);

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

export default App;
