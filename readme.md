# 情绪小邮局 5.0：儿童情绪教育交互平台

一个基于 React + Vite 的儿童情绪教育交互应用。本项目为前端单页应用原型，无需复杂后端，用户的游戏进度会自动保存在浏览器的 `localStorage` 中。

---

## 🎨 核心玩法与模式介绍

平台支持以下两种独立的游戏模式，均配备了**拟物化果冻动效**与**移动端触控优化**：

### 🎒 1. 单人小邮递员模式 (Single Player)
- **流程**：`今日收信` &rarr; `信件分拣` &rarr; `大地图派送` &rarr; `读信与冷静游戏` &rarr; `情绪回信` &rarr; `盖邮戳` &rarr; `收集邮票` &rarr; `学习报告`。
- **特色**：包含 **3D 探索区 (Three.js 友谊广场)**，儿童可通过键盘或屏幕 D-pad 控制角色寻找小动物开启对话，进行情绪分拣与卡牌互动。

### 👥 2. 双人协作邮局模式 (Cooperative Double Player)
- **职责分工**：
  - **🕵️ 玩家 A (情绪侦探)**：仔细阅读情绪信件及隐藏的情绪线索（表情/肢体动作），帮小动物诊断其心情（着急/生气/难过/害怕）。
  - **✍️ 玩家 B (友好回信员)**：根据侦探 A 判定的情绪，选择温暖友好的应对和安慰方式。
  - **🤝 双人确认**：在最终决策预览中，两位小朋友需要讨论并共同确认帮助，才能盖上双人专属邮戳。
- **特色**：
  - 包含 3 个协作任务（排队等滑梯、积木被碰倒、想加入朋友游戏）。
  - 收集特制的“合作邮票册”。
  - 生成独立的**“双人合作成长报告”**（包含情绪识别、友好回应、合作解决、共共情关心、轮流合作五维指标）。

---

## 📂 项目依赖与开发运行

运行本项目前，请确保您已安装 [Node.js](https://nodejs.org/) 环境。

### 1. 运行本地开发调试 (Web)
```bash
npm install
npm run dev
```
启动后可在浏览器中直接测试单人和双人模式：
🔗 **[http://localhost:5173/](http://localhost:5173/)**

### 2. 构建生产环境静态资源
```bash
npm run build
```
编译产物将输出至根目录的 `/dist` 文件夹下。

---

## 📱 Capacitor 移动端封装打包

平台集成了 **Capacitor 跨平台封装支持**，可将网页一键同步到 Android Studio 或 Xcode 工程，打包为 iOS (iPad) / Android 原生 App。

### 1. 编译并同步资源 (Sync)
在每次修改网页代码后，运行该命令自动编译并把最新 assets 同步给 iOS 和 Android 目录：
```bash
npm run cap:sync
```

### 2. 安卓打包与模拟器调试 (Android)
```bash
npm run cap:android
```
> **注意**：需要在您的电脑上配置好 Android SDK 和 Android Studio。

### 3. iOS/iPadOS 编译与 Xcode 调试 (iOS)
```bash
npm run cap:ios
```
> **⚠️ 平台限制**：iOS 打包与调试必须运行在 **macOS** 系统下，并确保安装了 **Xcode**、CocoaPods 依赖及 Apple 开发者签名环境。

---

## 🔒 数据存储与安全边距
- **数据隔离**：单人模式进度 (`emotion-post-office-single`) 和双人模式进度 (`emotion-post-office-double`) 采用 localStorage 彻底隔离保存，互不影响。
- **安全边距**：容器已经全面适配 iOS 刘海屏与底部 Home Indicator，采用了 `env(safe-area-inset)` 规则。
- **触控优化**：主要动作按钮高度不低于 `48px`，主要界面字号为 `18px` 起步，完美契合平板横/竖屏触控。
