# Vue Flow 项目结构说明

## 📁 目录结构

```
src/views/test/
├── vueflow.vue                 # 主页面组件
├── CustomNode.vue              # 旧的自定义节点（保留用于兼容）
├── components/                 # 组件目录
│   ├── nodes/                  # 节点组件目录
│   │   ├── StartNode.vue      # 开始节点组件
│   │   ├── EndNode.vue        # 结束节点组件
│   │   ├── ProcessNode.vue    # 流程节点组件
│   │   ├── DecisionNode.vue   # 判断节点组件
│   │   ├── ParallelNode.vue   # 并行节点组件
│   │   └── CustomNode.vue     # 自定义节点组件
│   ├── NodePalette.vue        # 底部节点面板组件
│   ├── PropertiesPanel.vue    # 右侧属性面板组件
│   ├── types.ts               # TypeScript 类型定义
│   ├── nodeConfig.ts          # 节点配置和工具函数
│   ├── index.ts               # 组件导出文件
│   └── README.md              # 组件说明文档
├── USAGE.md                    # 使用指南
└── PROJECT_STRUCTURE.md        # 项目结构说明（本文件）
```

## 📄 文件说明

### 核心文件

#### `vueflow.vue`

**主页面组件**，整合了所有功能模块。

**主要功能：**

- Vue Flow 画布初始化
- 节点和边的状态管理
- 拖拽事件处理
- 节点连接处理
- 视图控制（缩放、平移、适应）
- 暗黑模式切换
- 数据导出

**关键代码段：**

```vue
<template>
  <div class="flow-container">
    <VueFlow>...</VueFlow>
    <NodePalette />
    <PropertiesPanel />
  </div>
</template>
```

---

### 组件文件

#### `components/NodePalette.vue`

**底部节点面板组件**

**功能：**

- 展示所有可用节点类型
- 支持展开/收起动画
- 拖拽节点到画布添加
- 拖拽画布节点到面板删除
- 删除区域高亮提示

**Props：** 无

**Emits：**

- `dragStart(template)` - 开始拖拽节点
- `deleteNode(nodeId)` - 删除节点

**样式特点：**

- 固定在底部居中
- 圆角卡片设计
- 网格布局展示节点
- 平滑展开/收起动画

---

#### `components/PropertiesPanel.vue`

**右侧属性面板组件**

**功能：**

- 显示选中节点的详细信息
- 编辑节点属性（名称、描述、颜色等）
- 调整节点位置坐标
- 设置节点连接状态
- 删除节点

**Props：**

- `selectedNode: FlowNode | null` - 当前选中的节点

**Emits：**

- `updateNode(nodeId, updates)` - 更新节点
- `deleteNode(nodeId)` - 删除节点

**样式特点：**

- 固定在右侧
- 表单式布局
- 平滑展开/收起动画
- 自定义滚动条

---

### 节点组件

所有节点组件都遵循统一的设计模式：

**通用 Props：**

```typescript
interface Props {
  id: string; // 节点唯一标识
  data: NodeData; // 节点数据
}
```

**通用特性：**

- 使用 Vue Flow 的 `Handle` 组件定义连接点
- 响应式颜色和样式
- 悬停效果
- 选中状态

#### `components/nodes/StartNode.vue`

- **样式**：圆角矩形
- **颜色**：绿色 (#67C23A)
- **连接点**：底部输出
- **用途**：流程起点

#### `components/nodes/EndNode.vue`

- **样式**：圆角矩形
- **颜色**：红色 (#F56C6C)
- **连接点**：顶部输入
- **用途**：流程终点

#### `components/nodes/ProcessNode.vue`

- **样式**：矩形
- **颜色**：蓝色 (#409EFF)
- **连接点**：上下左右四个方向
- **特性**：支持加载状态、描述文本
- **用途**：普通处理步骤

#### `components/nodes/DecisionNode.vue`

- **样式**：菱形（45度旋转的正方形）
- **颜色**：橙色 (#E6A23C)
- **连接点**：顶部输入，左右下三个输出
- **用途**：条件判断分支

#### `components/nodes/ParallelNode.vue`

- **样式**：矩形
- **颜色**：灰色 (#909399)
- **连接点**：顶部输入，底部两个输出
- **特性**：并行图标显示
- **用途**：并行处理

#### `components/nodes/CustomNode.vue`

- **样式**：圆角矩形
- **颜色**：深灰色 (#606266)
- **连接点**：上下左右四个方向
- **特性**：支持加载状态、自定义图标
- **用途**：自定义功能节点

---

### 配置文件

#### `components/types.ts`

**TypeScript 类型定义文件**

**主要类型：**

```typescript
// 节点类型枚举
enum NodeTypeEnum {
  START = "start",
  END = "end",
  PROCESS = "process",
  DECISION = "decision",
  PARALLEL = "parallel",
  CUSTOM = "custom"
}

// 节点模板配置
interface NodeTemplate {
  type: NodeTypeEnum;
  label: string;
  icon: string;
  description: string;
  defaultData: Record<string, any>;
}

// 节点数据接口
interface NodeData {
  label: string;
  description?: string;
  loading?: boolean;
  color?: string;
  [key: string]: any;
}

// 节点配置接口
interface FlowNode {
  id: string;
  type: string;
  data: NodeData;
  position: { x: number; y: number };
  class?: string;
  connectable?: boolean;
}

// 边配置接口
interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  markerEnd?: any;
}
```

---

#### `components/nodeConfig.ts`

**节点配置和工具函数**

**主要内容：**

```typescript
// 节点模板配置数组
export const nodeTemplates: NodeTemplate[] = [...]

// 根据类型获取节点模板
export function getNodeTemplate(type: NodeTypeEnum): NodeTemplate | undefined

// 生成唯一节点ID
export function generateNodeId(type: string): string

// 创建新节点
export function createNode(
  type: NodeTypeEnum,
  position: { x: number; y: number }
): FlowNode
```

---

#### `components/index.ts`

**组件导出文件**

统一导出所有组件、类型和配置，方便外部引用：

```typescript
export * from "./nodes/StartNode.vue";
export * from "./NodePalette.vue";
export * from "./types";
export * from "./nodeConfig";
```

---

## 🔄 数据流

### 1. 添加节点流程

```
用户拖拽节点面板中的节点
    ↓
NodePalette 触发 dragStart 事件
    ↓
vueflow.vue 监听 drop 事件
    ↓
调用 createNode() 创建节点实例
    ↓
调用 addNodes() 添加到画布
    ↓
节点渲染到画布
```

### 2. 编辑节点流程

```
用户点击画布中的节点
    ↓
vueflow.vue 监听 node-click 事件
    ↓
更新 selectedNodeId
    ↓
selectedNode 计算属性更新
    ↓
PropertiesPanel 显示节点属性
    ↓
用户修改属性
    ↓
PropertiesPanel 触发 updateNode 事件
    ↓
vueflow.vue 调用 updateNode() 更新节点
```

### 3. 删除节点流程

```
方式一：属性面板删除
PropertiesPanel 触发 deleteNode 事件
    ↓
vueflow.vue 调用 removeNodes()

方式二：拖拽到面板删除
用户拖拽节点到 NodePalette
    ↓
NodePalette 触发 deleteNode 事件
    ↓
vueflow.vue 调用 removeNodes()
```

---

## 🎨 样式设计

### 设计原则

1. **一致性**：所有组件使用统一的颜色方案和间距
2. **响应式**：支持不同屏幕尺寸
3. **动画**：平滑的过渡和交互反馈
4. **可访问性**：清晰的视觉层次和对比度

### 颜色方案

- **主色调**：Element Plus 默认蓝色 (#409EFF)
- **成功色**：绿色 (#67C23A) - 开始节点
- **警告色**：橙色 (#E6A23C) - 判断节点
- **危险色**：红色 (#F56C6C) - 结束节点
- **信息色**：灰色 (#909399) - 并行节点

### 暗黑模式

- 背景色：#1a1a1a
- 组件背景：#2d3748
- 边框色：#4a5568
- 文字色：#fffffb

---

## 🔧 扩展指南

### 添加新节点类型

1. **创建节点组件**

```vue
<!-- components/nodes/NewNode.vue -->
<template>
  <div class="new-node">
    <Handle :id="`${id}-top`" type="target" :position="Position.Top" />
    <!-- 节点内容 -->
    <Handle :id="`${id}-bottom`" type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
defineProps<{ id: string; data: NodeData }>();
</script>
```

2. **添加类型枚举**

```typescript
// components/types.ts
export enum NodeTypeEnum {
  // ...
  NEW_TYPE = "newType"
}
```

3. **添加节点配置**

```typescript
// components/nodeConfig.ts
export const nodeTemplates: NodeTemplate[] = [
  // ...
  {
    type: NodeTypeEnum.NEW_TYPE,
    label: "新节点",
    icon: "🆕",
    description: "新节点描述",
    defaultData: {
      label: "新节点",
      color: "#000000"
    }
  }
];
```

4. **注册节点类型**

```typescript
// vueflow.vue
import NewNode from "./components/nodes/NewNode.vue";

const nodeTypes = ref({
  // ...
  [NodeTypeEnum.NEW_TYPE]: markRaw(NewNode)
});
```

---

## 📦 依赖说明

### 核心依赖

- **Vue 3**: 前端框架
- **@vue-flow/core**: Vue Flow 核心库
- **@vue-flow/background**: 背景网格
- **@vue-flow/controls**: 控制按钮
- **@vue-flow/minimap**: 小地图

### UI 依赖

- **Element Plus**: UI 组件库
- **@element-plus/icons-vue**: 图标库

### 开发依赖

- **TypeScript**: 类型支持
- **SCSS**: 样式预处理器

---

## 🐛 已知问题

目前没有已知的严重问题。

---

## 🚀 未来计划

- [ ] 添加撤销/重做功能
- [ ] 添加流程数据导入功能
- [ ] 添加节点搜索功能
- [ ] 添加节点分组功能
- [ ] 添加连接线样式自定义
- [ ] 添加节点对齐辅助线
- [ ] 添加快捷键支持
- [ ] 添加流程验证功能

---

**版本**: 1.0.0  
**创建日期**: 2025-10-30  
**维护者**: QC Admin Team
