# useWorkflow Composable

## 📖 简介

`useWorkflow` 是一个用于管理 Vue Flow 工作流数据的 Composable 函数。它提供了完整的节点和连线的增删改查操作，并支持在每个操作前执行自定义的业务逻辑。

## ✨ 特性

- 🎯 **完整的 CRUD 操作** - 节点和连线的增删改查
- 🔒 **业务逻辑控制** - 每个操作都支持前置业务逻辑回调
- ✅ **操作结果反馈** - 统一的操作结果类型，包含成功/失败状态和错误信息
- 📝 **TypeScript 支持** - 完整的类型定义
- 🎨 **自动消息提示** - 集成 Element Plus 消息提示
- 🔍 **丰富的查询方法** - 支持多种查询方式

## 🚀 快速开始

### 基本使用

```typescript
import { useWorkflow } from "./composables/useWorkflow";
import { NodeTypeEnum } from "./components/types";

// 在组件中使用
const workflow = useWorkflow();

// 添加节点
await workflow.addNode(NodeTypeEnum.PROCESS, { x: 100, y: 100 });

// 更新节点
await workflow.updateNode("node-1", { data: { label: "新名称" } });

// 删除节点
await workflow.deleteNode("node-1");

// 查询节点
const allNodes = workflow.getAllNodes();
const selectedNode = workflow.selectedNode.value;
```

### 带业务逻辑的使用

```typescript
// 添加节点前需要用户确认
await workflow.addNode(NodeTypeEnum.PROCESS, { x: 100, y: 100 }, async () => {
  try {
    await ElMessageBox.confirm("确定要添加新节点吗？", "提示");
    return { success: true };
  } catch {
    return { success: false, error: "用户取消操作" };
  }
});

// 删除节点前检查连接
await workflow.deleteNode("node-1", async () => {
  const edges = workflow.getAllEdges();
  const hasConnections = edges.some(
    edge => edge.source === "node-1" || edge.target === "node-1"
  );

  if (hasConnections) {
    return { success: false, error: "节点存在连接，无法删除" };
  }

  return { success: true };
});
```

## 📚 API 文档

### 类型定义

#### OperationResult

操作结果类型：

```typescript
interface OperationResult<T = any> {
  success: boolean; // 操作是否成功
  data?: T; // 操作返回的数据
  error?: string; // 错误信息
}
```

#### OperationCallback

操作回调类型：

```typescript
type OperationCallback<T = any> = () =>
  | Promise<OperationResult<T>>
  | OperationResult<T>;
```

### 状态

#### selectedNodeId

- **类型**: `Ref<string | null>`
- **说明**: 当前选中的节点 ID

#### selectedNode

- **类型**: `ComputedRef<Node | null>`
- **说明**: 当前选中的节点对象

#### nodeTypes

- **类型**: `Ref<Record<NodeTypeEnum, Component>>`
- **说明**: 节点类型注册表

### 节点操作

#### addNode

添加节点

```typescript
addNode(
  nodeType: NodeTypeEnum,
  position: { x: number; y: number },
  beforeAdd?: OperationCallback<Node>
): Promise<OperationResult<Node>>
```

**参数**:

- `nodeType`: 节点类型
- `position`: 节点位置
- `beforeAdd`: 添加前的业务逻辑回调（可选）

**返回**: 操作结果，包含新创建的节点

**示例**:

```typescript
const result = await workflow.addNode(
  NodeTypeEnum.PROCESS,
  { x: 100, y: 100 },
  async () => {
    // 业务逻辑：检查节点数量
    if (workflow.getAllNodes().length >= 10) {
      return { success: false, error: "节点数量已达上限" };
    }
    return { success: true };
  }
);

if (result.success) {
  console.log("节点添加成功", result.data);
}
```

#### updateNode

更新节点

```typescript
updateNode(
  nodeId: string,
  updates: Partial<Node>,
  beforeUpdate?: OperationCallback<Node>
): Promise<OperationResult<Node>>
```

**参数**:

- `nodeId`: 节点 ID
- `updates`: 更新内容
- `beforeUpdate`: 更新前的业务逻辑回调（可选）

**示例**:

```typescript
await workflow.updateNode(
  "node-1",
  { data: { label: "新名称", description: "新描述" } },
  async () => {
    // 业务逻辑：验证数据
    return { success: true };
  }
);
```

#### deleteNode

删除节点

```typescript
deleteNode(
  nodeId: string | string[],
  beforeDelete?: OperationCallback<void>
): Promise<OperationResult<void>>
```

**参数**:

- `nodeId`: 节点 ID 或 ID 数组
- `beforeDelete`: 删除前的业务逻辑回调（可选）

**示例**:

```typescript
await workflow.deleteNode("node-1", async () => {
  // 业务逻辑：确认删除
  try {
    await ElMessageBox.confirm("确定删除吗？", "警告");
    return { success: true };
  } catch {
    return { success: false, error: "用户取消" };
  }
});
```

#### batchDeleteNodes

批量删除节点

```typescript
batchDeleteNodes(
  nodeIds: string[],
  beforeDelete?: OperationCallback<void>
): Promise<OperationResult<void>>
```

#### cloneNode

克隆节点

```typescript
cloneNode(
  node: Node,
  beforeClone?: OperationCallback<Node>
): Promise<OperationResult<Node>>
```

### 连线操作

#### addEdge

添加连线

```typescript
addEdge(
  connection: Connection,
  beforeAdd?: OperationCallback<Edge>
): Promise<OperationResult<Edge>>
```

**示例**:

```typescript
await workflow.addEdge({ source: "node-1", target: "node-2" }, async () => {
  // 业务逻辑：验证连接规则
  return { success: true };
});
```

#### updateEdge

更新连线

```typescript
updateEdge(
  edgeId: string,
  updates: Partial<Edge>,
  beforeUpdate?: OperationCallback<Edge>
): Promise<OperationResult<Edge>>
```

#### deleteEdge

删除连线

```typescript
deleteEdge(
  edgeId: string | string[],
  beforeDelete?: OperationCallback<void>
): Promise<OperationResult<void>>
```

### 批量操作

#### selectAllNodes

全选节点

```typescript
selectAllNodes(
  beforeSelect?: OperationCallback<Node[]>
): Promise<OperationResult<Node[]>>
```

#### clearCanvas

清空画布

```typescript
clearCanvas(
  beforeClear?: OperationCallback<void>
): Promise<OperationResult<void>>
```

#### importData

导入数据

```typescript
importData(
  data: { nodes: Node[]; edges: Edge[] },
  beforeImport?: OperationCallback<void>
): Promise<OperationResult<void>>
```

#### exportData

导出数据

```typescript
exportData(
  beforeExport?: OperationCallback<{ nodes: Node[]; edges: Edge[] }>
): Promise<OperationResult<{ nodes: Node[]; edges: Edge[] }>>
```

### 查询操作

#### getAllNodes

获取所有节点

```typescript
getAllNodes(): Node[]
```

#### getAllEdges

获取所有连线

```typescript
getAllEdges(): Edge[]
```

#### getNodeById

根据 ID 查找节点

```typescript
getNodeById(nodeId: string): Node | undefined
```

#### getEdgeById

根据 ID 查找连线

```typescript
getEdgeById(edgeId: string): Edge | undefined
```

#### getNodesByType

根据类型查找节点

```typescript
getNodesByType(nodeType: NodeTypeEnum): Node[]
```

#### getSelectedNodes

获取选中的节点

```typescript
getSelectedNodes(): Node[]
```

#### setSelectedNodeId

设置选中节点

```typescript
setSelectedNodeId(nodeId: string | null): void
```

## 💡 使用场景

### 场景1：添加节点前验证

```typescript
// 限制开始节点只能有一个
await workflow.addNode(NodeTypeEnum.START, { x: 100, y: 100 }, async () => {
  const startNodes = workflow.getNodesByType(NodeTypeEnum.START);
  if (startNodes.length >= 1) {
    return { success: false, error: "只能有一个开始节点" };
  }
  return { success: true };
});
```

### 场景2：删除节点前检查

```typescript
// 删除前检查是否有连接
await workflow.deleteNode("node-1", async () => {
  const edges = workflow.getAllEdges();
  const hasConnections = edges.some(
    edge => edge.source === "node-1" || edge.target === "node-1"
  );

  if (hasConnections) {
    try {
      await ElMessageBox.confirm(
        "该节点存在连接，删除后连接也会被移除，确定继续吗？",
        "警告"
      );
      return { success: true };
    } catch {
      return { success: false, error: "用户取消操作" };
    }
  }

  return { success: true };
});
```

### 场景3：添加连线前验证规则

```typescript
await workflow.addEdge(connection, async () => {
  const sourceNode = workflow.getNodeById(connection.source);
  const targetNode = workflow.getNodeById(connection.target);

  // 结束节点不能作为源节点
  if (sourceNode?.type === NodeTypeEnum.END) {
    return { success: false, error: "结束节点不能连接到其他节点" };
  }

  // 开始节点不能作为目标节点
  if (targetNode?.type === NodeTypeEnum.START) {
    return { success: false, error: "开始节点不能被其他节点连接" };
  }

  return { success: true };
});
```

## 📝 更多示例

详细的使用示例请参考 `useWorkflow.example.ts` 文件。

## 🔧 注意事项

1. **业务逻辑回调是可选的**：如果不需要前置业务逻辑，可以不传回调函数
2. **回调必须返回 OperationResult**：确保回调函数返回正确的结果格式
3. **异步操作**：所有操作方法都是异步的，需要使用 `await`
4. **错误处理**：操作失败时会自动显示错误消息，无需手动处理
5. **类型安全**：充分利用 TypeScript 类型检查，避免运行时错误

## 🎯 最佳实践

1. **统一的业务逻辑管理**：将所有业务逻辑集中在回调函数中
2. **错误信息友好**：返回清晰的错误信息，方便用户理解
3. **操作前确认**：对于危险操作（删除、清空等），建议添加确认对话框
4. **数据验证**：在操作前验证数据的有效性
5. **状态同步**：使用 `selectedNodeId` 和 `selectedNode` 管理选中状态
