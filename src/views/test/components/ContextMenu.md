# ContextMenu 右键菜单组件

## 📖 组件说明

`ContextMenu.vue` 是一个功能完善的右键菜单组件，支持画布、节点和连线三种不同的菜单类型。

## ✨ 特性

- 🎯 **三种菜单类型**：画布、节点、连线
- 🎨 **现代化设计**：圆角、阴影、动画效果
- 🌓 **暗黑模式**：自动适配系统主题
- 📍 **智能定位**：自动边界检测，防止超出视口
- ⌨️ **快捷键提示**：显示常用操作的快捷键
- 🔒 **类型安全**：完整的 TypeScript 支持

## 📦 Props

| 属性         | 类型                           | 默认值     | 说明                      |
| ------------ | ------------------------------ | ---------- | ------------------------- |
| `visible`    | `boolean`                      | `false`    | 是否显示菜单              |
| `x`          | `number`                       | `0`        | 菜单 X 坐标（相对于视口） |
| `y`          | `number`                       | `0`        | 菜单 Y 坐标（相对于视口） |
| `menuType`   | `'canvas' \| 'node' \| 'edge'` | `'canvas'` | 菜单类型                  |
| `targetNode` | `Node \| null`                 | `null`     | 目标节点（仅节点菜单）    |
| `targetEdge` | `Edge \| null`                 | `null`     | 目标连线（仅连线菜单）    |

## 📤 Events

### 通用事件

- `close` - 关闭菜单

### 画布菜单事件

- `zoomIn` - 放大
- `zoomOut` - 缩小
- `fitView` - 适应画布
- `resetView` - 重置视图
- `selectAll` - 全选
- `clearCanvas` - 清空画布

### 节点菜单事件

- `editNode(node: Node)` - 编辑节点
- `copyNode(node: Node)` - 复制节点
- `duplicateNode(node: Node)` - 克隆节点
- `deleteNode(node: Node)` - 删除节点
- `toggleConnectable(node: Node)` - 切换连接状态

### 连线菜单事件

- `editEdge(edge: Edge)` - 编辑连线
- `deleteEdge(edge: Edge)` - 删除连线
- `toggleAnimation(edge: Edge)` - 切换动画

## 🎯 使用示例

### 基础用法

```vue
<template>
  <div @contextmenu="onContextMenu">
    <VueFlow
      @pane-context-menu="onPaneContextMenu"
      @node-context-menu="onNodeContextMenu"
      @edge-context-menu="onEdgeContextMenu"
    />

    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :menu-type="contextMenu.type"
      :target-node="contextMenu.targetNode"
      :target-edge="contextMenu.targetEdge"
      @close="closeContextMenu"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @fit-view="handleFitView"
      @delete-node="handleDeleteNode"
      <!-- 其他事件处理 -->
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Node, Edge } from '@vue-flow/core';
import ContextMenu from './components/ContextMenu.vue';

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  type: 'canvas' as 'canvas' | 'node' | 'edge',
  targetNode: null as Node | null,
  targetEdge: null as Edge | null
});

// 阻止默认右键菜单
function onContextMenu(event: MouseEvent) {
  event.preventDefault();
}

// 画布右键
function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    type: 'canvas',
    targetNode: null,
    targetEdge: null
  };
}

// 节点右键
function onNodeContextMenu({ event, node }: any) {
  const mouseEvent = event as MouseEvent;
  mouseEvent.preventDefault();
  mouseEvent.stopPropagation();
  contextMenu.value = {
    visible: true,
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
    type: 'node',
    targetNode: node,
    targetEdge: null
  };
}

// 连线右键
function onEdgeContextMenu({ event, edge }: any) {
  const mouseEvent = event as MouseEvent;
  mouseEvent.preventDefault();
  mouseEvent.stopPropagation();
  contextMenu.value = {
    visible: true,
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
    type: 'edge',
    targetNode: null,
    targetEdge: edge
  };
}

// 关闭菜单
function closeContextMenu() {
  contextMenu.value.visible = false;
}

// 事件处理函数
function handleZoomIn() {
  // 放大逻辑
}

function handleDeleteNode(node: Node) {
  // 删除节点逻辑
}
</script>
```

## 🎨 菜单内容

### 画布菜单

```
┌─────────────────────────┐
│ 🔍 放大        Ctrl +   │
│ 🔍 缩小        Ctrl -   │
│ 📐 适应画布    Ctrl 0   │
├─────────────────────────┤
│ 🔄 重置视图             │
├─────────────────────────┤
│ ✅ 全选        Ctrl A   │
├─────────────────────────┤
│ 🗑️ 清空画布             │
└─────────────────────────┘
```

### 节点菜单

```
┌─────────────────────────┐
│ 📦 节点名称             │
├─────────────────────────┤
│ ✏️ 编辑属性             │
│ 📋 复制节点    Ctrl C   │
│ 📑 克隆节点    Ctrl D   │
├─────────────────────────┤
│ 🔌 启用/禁用连接        │
├─────────────────────────┤
│ 🗑️ 删除节点    Delete   │
└─────────────────────────┘
```

### 连线菜单

```
┌─────────────────────────┐
│ 🔗 连接线               │
├─────────────────────────┤
│ ✏️ 编辑标签             │
│ 🎬 开启/关闭动画        │
├─────────────────────────┤
│ 🗑️ 删除连接    Delete   │
└─────────────────────────┘
```

## 🎯 功能说明

### 画布操作

- **放大/缩小**：调整画布缩放级别
- **适应画布**：自动调整视图以显示所有节点
- **重置视图**：恢复到默认缩放和位置
- **全选**：选中所有节点
- **清空画布**：删除所有节点和连线

### 节点操作

- **编辑属性**：打开属性面板编辑节点
- **复制节点**：将节点数据复制到剪贴板
- **克隆节点**：在原位置附近创建节点副本
- **切换连接**：启用或禁用节点的连接功能
- **删除节点**：从画布中移除节点

### 连线操作

- **编辑标签**：修改连线上显示的文本
- **切换动画**：开启或关闭连线的流动动画
- **删除连接**：移除两个节点之间的连线

## 🎨 样式定制

组件支持暗黑模式，会自动根据系统主题切换样式：

```scss
// 亮色模式
.context-menu {
  background: white;
  border-color: #e4e7ed;
  color: #606266;
}

// 暗黑模式
@media (prefers-color-scheme: dark) {
  .context-menu {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
}
```

## 🔧 技术细节

### 边界检测

组件会自动检测菜单是否超出视口，并调整位置：

```typescript
const menuStyle = computed(() => {
  const style = {
    left: `${props.x}px`,
    top: `${props.y}px`
  };

  if (menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect();

    // 右边界检查
    if (props.x + rect.width > window.innerWidth) {
      style.left = `${window.innerWidth - rect.width - 10}px`;
    }

    // 下边界检查
    if (props.y + rect.height > window.innerHeight) {
      style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  }

  return style;
});
```

### 点击外部关闭

组件会监听全局点击事件，点击菜单外部时自动关闭：

```typescript
const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("contextmenu", handleClickOutside);
});
```

## 📝 注意事项

1. **Teleport 使用**：组件使用 `<Teleport to="body">` 渲染到 body，确保 z-index 正常工作
2. **事件冒泡**：节点和连线的右键事件会调用 `stopPropagation()` 防止触发画布菜单
3. **类型安全**：所有事件参数都有完整的类型定义
4. **性能优化**：菜单只在显示时渲染，隐藏时不占用 DOM

## 🚀 扩展建议

如需添加更多功能，可以：

1. **添加子菜单**：支持多级菜单
2. **添加分组**：将相关操作分组显示
3. **添加图标**：使用更多图标增强可视化
4. **添加快捷键**：实现键盘快捷键支持
5. **添加搜索**：在菜单中搜索功能
6. **添加最近使用**：显示最近使用的操作

## 📄 许可

MIT License
