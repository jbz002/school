# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个**新能源汽车电池包装配工段电工技能实战教学系统** Demo，纯前端实现，旨在通过 3D 可视化和交互式仿真帮助学生建立产线认知、掌握电气元件知识和安全操作规范。

技术原则：无后端、无登录系统、无真实硬件连接，所有数据和逻辑均通过本地 JSON 和前端状态机实现。

## 开发命令

```bash
# 开发服务器（端口 3000，自动打开浏览器）
npm run dev

# 生产构建（先运行 TypeScript 类型检查，再 Vite 构建）
npm run build

# 预览生产构建
npm run preview
```

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: react-router-dom
- **3D 渲染**: Three.js
- **UI 组件**: Ant Design 5（中文 locale）
- **构建工具**: Vite 6
- **路径别名**: `@` → `./src`

## 项目架构

### 整体结构

```
src/
├── App.tsx              # 路由配置（HomePage → M2Page）
├── main.tsx             # 应用入口
├── assets/              # 静态资源
└── pages/
    ├── HomePage.tsx     # 首页
    └── M2/              # 产线电气结构与识图模块
        ├── M2Page.tsx           # 模块主页面
        ├── components/          # UI 组件
        ├── hooks/               # Three.js 相关 Hooks
        ├── types/               # TypeScript 类型定义
        ├── utils/               # Three.js 场景构建工具
        └── data/                # JSON 数据文件
```

### M2 模块架构

M2 模块采用**页面-组件-Hooks-工具函数**分层设计：

1. **M2Page.tsx**: 主容器，管理页面模式（探索/练习）、状态协调
2. **components/**: 展示组件
   - `ProductionLine3D.tsx`: 3D 场景容器组件
   - `ElectricalSchematic.tsx`: 电气原理图组件
   - `ComponentInfoDrawer.tsx`: 元件信息抽屉
   - `QuizMode.tsx`: 练习模式组件
3. **hooks/**: Three.js 逻辑封装
   - `useThreeScene.ts`: 场景初始化、渲染循环、元件更新
   - `useRaycaster.ts`: 鼠标交互、点击检测
4. **utils/sceneBuilder.ts**: Three.js 对象创建函数
5. **data/**: 元件数据、测验数据

### Three.js 集成模式

**关键原则**：Three.js 逻辑与 React 组件解耦，通过 Hooks 连接。

- `useThreeScene`: 负责场景生命周期（init → render → cleanup）
- `useRaycaster`: 负责用户交互（点击检测 → 回调触发）
- `sceneBuilder`: 纯函数工具，创建相机、灯光、几何体

**数据流向**:
```
JSON 数据 → M2Page state → useThreeScene → Three.js 场景
                ↓
        用户点击 → useRaycaster → handleComponentClick → 更新 state
```

### 数据驱动设计

所有元件和测验数据来自 `src/pages/M2/data/electrical-components.json`：

```json
{
  "components": [
    {
      "id": "QF1",
      "name": "主断路器",
      "position": { "x": -5, "y": 0, "z": 0 },
      "geometry": { "type": "box", "width": 1, "height": 2, "depth": 0.5 },
      "color": "#3498db",
      "schematicId": "sc-QF1"
    }
  ]
}
```

添加新元件只需修改 JSON，无需改动代码。

## 模块规划（按 PRD）

当前已实现：**M2: 产线电气结构与识图**

规划中（未实现）：
- **M3**: 电路安装与检测实训（Konva.js 接线仿真）
- **M4**: PLC 控制基础（I/O 面板 + 启停按钮）
- **M5**: 故障模拟与排查（决策树 + 评分系统）

## 代码约定

- 组件按功能分为页面级（pages/）和模块级（components/）
- 自定义 Hooks 统一放在模块的 `hooks/` 目录
- 类型定义集中管理在 `types/index.ts`
- Three.js 相关纯函数放在 `utils/` 目录
- 所有数据通过 JSON 驱动，避免硬编码
