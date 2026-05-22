import { useEffect, useMemo, useState } from "react";

const npcs = [
  { id: "rabbit", name: "小兔", icon: "🐰", x: 24, y: 28 },
  { id: "cat", name: "小猫", icon: "🐱", x: 70, y: 34 },
  { id: "bear", name: "小熊", icon: "🐻", x: 52, y: 72 },
];

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function ThreeDPlaceholder({ onNpcTalk, alreadyRewarded }) {
  const [player, setPlayer] = useState({ x: 48, y: 50 });
  const [dialogue, setDialogue] = useState("");

  const nearestNpc = useMemo(() => {
    return npcs.find((npc) => distance(player, npc) < 14);
  }, [player]);

  useEffect(() => {
    const movePlayer = (event) => {
      const key = event.key.toLowerCase();
      const step = 4;

      if (["w", "arrowup"].includes(key)) {
        setPlayer((current) => ({ ...current, y: Math.max(8, current.y - step) }));
      }
      if (["s", "arrowdown"].includes(key)) {
        setPlayer((current) => ({ ...current, y: Math.min(88, current.y + step) }));
      }
      if (["a", "arrowleft"].includes(key)) {
        setPlayer((current) => ({ ...current, x: Math.max(8, current.x - step) }));
      }
      if (["d", "arrowright"].includes(key)) {
        setPlayer((current) => ({ ...current, x: Math.min(90, current.x + step) }));
      }
      if (key === "e" && nearestNpc) {
        setDialogue(`${nearestNpc.name}：你好，我们一起玩吧！`);
        onNpcTalk();
      }
    };

    window.addEventListener("keydown", movePlayer);
    return () => window.removeEventListener("keydown", movePlayer);
  }, [nearestNpc, onNpcTalk]);

  return (
    <div className="three-d-placeholder">
      <div className="scene-heading">
        <span>🧭</span>
        <div>
          <h2>3D友谊广场：未来可扩展场景</h2>
          <p>当前是 React 伪 3D / 俯视角占位 Demo，可用 WASD 或方向键移动。</p>
        </div>
      </div>

      {/* 这里是未来接入 Three.js / React Three Fiber 真实 3D 场景的入口。 */}
      <div className="fake-3d-stage" tabIndex={0} aria-label="友谊广场移动区域">
        <div className="plaza-road horizontal" />
        <div className="plaza-road vertical" />
        {npcs.map((npc) => (
          <div
            className="npc"
            key={npc.id}
            style={{ left: `${npc.x}%`, top: `${npc.y}%` }}
          >
            <span>{npc.icon}</span>
            <small>{npc.name}</small>
          </div>
        ))}
        <div
          className="player"
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
        >
          🎒
        </div>
        {nearestNpc && <div className="near-tip">按 E 开始对话</div>}
      </div>

      <div className="three-d-controls">
        <span>移动：WASD / 方向键</span>
        <span>互动：靠近 NPC 后按 E</span>
        {alreadyRewarded && <strong>已获得：礼貌表达邮票 + 合作分享邮票</strong>}
      </div>

      {dialogue && <div className="dialog-modal">{dialogue}</div>}
    </div>
  );
}

export default ThreeDPlaceholder;
