# Vue Flow 组件说明

这是一个基于 Vue Flow 的流程图编辑器组件库，提供了完整的拖拽、编辑和配置功能。

## 目录结构

```
components/
├── nodes/                  # 节点组件
│   ├── StartNode.vue      # 开始节点
│   ├── EndNode.vue        # 结束节点
│   ├── ProcessNode.vue    # 流程节点
│   ├── DecisionNode.vue   # 判断节点
│   ├── ParallelNode.vue   # 并行节点
│   └── CustomNode.vue     # 自定义节点
├── NodePalette.vue        # 底部节点面板
├── PropertiesPanel.vue    # 右侧属性面板
├── types.ts               # 类型定义
├── nodeConfig.ts          # 节点配置
└── index.ts               # 导出文件
```

## 主要功能

### 1. 节点面板 (NodePalette)

- 位于页面底部的可收起面板
- 展示所有可用的节点类型
- 支持拖拽节点到画布
- 支持拖拽画布节点到面板删除

### 2. 属性面板 (PropertiesPanel)

- 位于页面右侧的可收起面板
- 显示选中节点的详细信息
- 支持编辑节点属性（名称、描述、颜色等）
- 支持调整节点位置
- 支持删除节点

### 3. 节点类型

#### StartNode (开始节点)

- 圆角矩形样式
- 绿色主题
- 只有底部输出连接点

#### EndNode (结束节点)

- 圆角矩形样式
- 红色主题
- 只有顶部输入连接点

#### ProcessNode (流程节点)

- 矩形样式
- 蓝色主题
- 四个方向的连接点
- 支持加载状态显示

#### DecisionNode (判断节点)

- 菱形样式
- 橙色主题
- 支持多分支输出

#### ParallelNode (并行节点)

- 矩形样式
- 灰色主题
- 支持多个并行输出

#### CustomNode (自定义节点)

- 可自定义样式
- 支持所有方向连接
- 支持加载状态

## 使用方法

### 基本使用

```vue
<template>
  <VueFlowEditor />
</template>

<script setup>
import VueFlowEditor from "./vueflow.vue";
</script>
```

### 自定义节点

1. 在 `nodes/` 目录下创建新的节点组件
2. 在 `nodeConfig.ts` 中添加节点配置
3. 在 `types.ts` 中添加节点类型枚举
4. 在主页面中注册节点类型

### 数据格式

#### 节点数据结构

```typescript
{
  id: string;              // 唯一标识
  type: NodeTypeEnum;      // 节点类型
  data: {
    label: string;         // 节点名称
    description?: string;  // 节点描述
    color?: string;        // 节点颜色
    loading?: boolean;     // 加载状态
    [key: string]: any;    // 其他自定义属性
  };
  position: {
    x: number;             // X 坐标
    y: number;             // Y 坐标
  };
  connectable?: boolean;   // 是否可连接
}
```

#### 边数据结构

```typescript
{
  id: string;              // 唯一标识
  source: string;          // 源节点 ID
  target: string;          // 目标节点 ID
  label?: string;          // 边标签
  type?: string;           // 边类型
  animated?: boolean;      // 是否动画
}
```

## 特性

### 拖拽功能

- ✅ 从节点面板拖拽节点到画布
- ✅ 在画布上拖动节点调整位置
- ✅ 拖拽节点到面板删除

### 编辑功能

- ✅ 点击节点查看/编辑属性
- ✅ 修改节点名称、描述
- ✅ 自定义节点颜色
- ✅ 调整节点位置坐标
- ✅ 设置节点连接状态

### 连接功能

- ✅ 拖拽连接点创建连接
- ✅ 自动箭头标记
- ✅ 平滑曲线动画
- ✅ 连接标签

### 视图控制

- ✅ 缩放画布
- ✅ 平移画布
- ✅ 重置视图
- ✅ 适应画布
- ✅ 小地图导航
- ✅ 暗黑模式

### 数据管理

- ✅ 导出流程数据
- ✅ 清空画布
- ✅ 删除节点/边

## 样式定制

所有组件都使用 SCSS 编写，支持自定义主题。主要的样式变量：

- 节点颜色：在 `nodeConfig.ts` 中配置
- 面板样式：在各组件的 `<style>` 中修改
- 暗黑模式：在主页面的 `.dark` 类中定义

## 注意事项

1. **性能优化**
   - 使用 `markRaw` 包装节点组件避免响应式开销
   - 大量节点时建议启用虚拟滚动

2. **类型安全**
   - 所有组件都使用 TypeScript 编写
   - 提供完整的类型定义

3. **扩展性**
   - 组件化设计，易于扩展
   - 支持自定义节点类型
   - 支持自定义边类型

4. **生产环境**
   - 代码经过严格测试
   - 无已知的严重 bug
   - 遵循 Vue 3 最佳实践

## 依赖

- Vue 3.x
- @vue-flow/core
- @vue-flow/background
- @vue-flow/controls
- @vue-flow/minimap
- Element Plus

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可

MIT License
