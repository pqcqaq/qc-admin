# Workflow Application 架构说明

## 📁 文件结构

```
src/composables/workflowApplication/
├── useWorkflowApplication.ts      # 主业务逻辑
├── diff.ts                        # Diff 算法和快照管理
├── edgeValidation.ts              # 边验证逻辑（规则矩阵）
├── connectionMatrixGenerator.ts   # 连接矩阵生成器（可视化工具）
└── README.md                      # 本文档
```

## 🎯 核心职责分离

### 1. `useWorkflowApplication.ts` - 业务逻辑层

**职责：**

- 工作流应用的 CRUD 操作
- 节点和边的加载与保存
- Diff 计算和批量保存
- 注册业务回调（边验证、节点验证等）

**关键功能：**

- `loadApplication()` - 加载应用及其节点和边
- `saveWorkflow()` - 批量保存工作流变更
- `createApplication()` - 创建新应用
- `updateApplicationInfo()` - 更新应用信息
- `deleteApplication()` - 删除应用
- `cloneApplication()` - 克隆应用

### 2. `diff.ts` - Diff 算法层

**职责：**

- 计算节点和边的变更（新增、修改、删除）
- 管理快照（Snapshot）
- 字段级别的变更检测
- Hash 计算和比较

**关键功能：**

- `calculateWorkflowDiff()` - 计算完整的工作流 diff
- `getNodeFieldChanges()` - 获取节点字段级别的变更
- `getEdgeFieldChanges()` - 获取边字段级别的变更
- `getNodeHash()` - 计算节点 hash
- `getEdgeHash()` - 计算边 hash
- `calculateBranchNodesFromNode()` - 计算条件节点的分支信息

### 3. `edgeValidation.ts` - 边验证层（Handle 类型兼容性矩阵）

**职责：**

- 定义 Handle 类型枚举和兼容性矩阵
- 基于 Handle 类型验证连接是否允许
- 提供边验证逻辑
- 定义节点输出和输入规则（用于数量限制）

**核心数据结构：**

```typescript
// Handle 类型枚举
enum HandleType {
  INPUT = "input", // 普通输入
  OUTPUT = "output", // 普通输出
  BRANCH_OUTPUT = "branch_output", // 分支输出
  PARALLEL_INPUT = "parallel_input", // 并行输入
  PARALLEL_OUTPUT = "parallel_output", // 并行输出
  LOOP_INPUT = "loop_input", // 循环输入（预留）
  LOOP_OUTPUT = "loop_output" // 循环输出（预留）
}

// Handle 兼容性矩阵（7×7）
const HANDLE_COMPATIBILITY: Record<HandleType, Record<HandleType, boolean>> = {
  [HandleType.OUTPUT]: {
    [HandleType.INPUT]: true, // ✅ 普通输出 → 普通输入
    [HandleType.PARALLEL_INPUT]: false // ❌ 普通输出 → 并行输入
    // ...
  },
  [HandleType.BRANCH_OUTPUT]: {
    [HandleType.INPUT]: true // ✅ 分支输出 → 普通输入
    // ...
  }
  // ...
};

// 节点输出规则（用于数量限制）
interface NodeOutputRule {
  canHaveNormalOutput: boolean;
  canHaveBranchOutput: boolean;
  canHaveParallelOutput: boolean;
  maxNormalOutputs: number;
  maxBranchOutputs: number;
  maxParallelOutputs: number;
}

// 节点输入规则（用于数量限制）
interface NodeInputRule {
  canBeTarget: boolean;
  maxInputs: number;
}
```

**关键功能：**

- `getHandleTypeFromHandleId()` - 从 Handle ID 提取 HandleType
- `checkHandleCompatibility()` - 检查两个 Handle 类型是否兼容
- `validateEdgeConnection()` - 验证边是否可以添加（5步验证流程）
- `validateEdgeDeletion()` - 验证边是否可以删除
- `getNodeOutputRule()` - 获取节点输出规则
- `getNodeInputRule()` - 获取节点输入规则

**架构优势：**

- ✅ **更加框架化**：基于 Handle 类型的兼容性矩阵，一眼就能看懂规则
- ✅ **更加直观**：7×7 矩阵清晰展示哪些 Handle 可以连接
- ✅ **更加健壮**：Handle 类型在创建时就确定，不依赖字符串匹配
- ✅ **易于扩展**：添加新的 Handle 类型只需在矩阵中添加一行和一列

### 4. `connectionMatrixGenerator.ts` - 可视化工具

**职责：**

- 生成完整的连接矩阵（用于调试和文档）
- 导出 Markdown 表格
- 打印控制台表格

**关键功能：**

- `generateFullConnectionMatrix()` - 生成完整矩阵
- `printConnectionMatrix()` - 打印到控制台
- `exportConnectionMatrixAsMarkdown()` - 导出为 Markdown

**使用示例：**

```typescript
import { printConnectionMatrix } from "./connectionMatrixGenerator";

// 在控制台打印连接矩阵
printConnectionMatrix();
```

## 🔄 边验证流程

### 旧架构（分散在 FlowApp 组件中）

```
FlowApp.vue
  └── onConnect()
      ├── 验证自连接
      ├── 验证重复连接
      ├── 验证节点规则
      ├── 验证输出连接数
      └── 验证分支连接
```

**问题：**

- ❌ 验证逻辑分散在组件中
- ❌ 难以复用和测试
- ❌ 规则不清晰，难以维护

### 新架构（集中在 edgeValidation.ts）

```
useWorkflowApplication.ts
  └── useWorkflow({
      // 边添加验证
      beforeAddEdge: (context) => {
        return validateEdgeConnection(
          context.connection,
          context.sourceNode,
          context.targetNode,
          context.allEdges
        );
      },

      // 边删除验证
      beforeDeleteEdge: (context) => {
        for (const edge of context.edgesToDelete) {
          const sourceNode = workflow.getNodeById(edge.source);
          const targetNode = workflow.getNodeById(edge.target);
          const result = validateEdgeDeletion(edge, sourceNode, targetNode);
          if (!result.success) return result;
        }
        return { success: true };
      }
    })

edgeValidation.ts
  ├── validateEdgeConnection()
  │   ├── 1. 检查节点是否存在
  │   ├── 2. 防止自连接
  │   ├── 3. 获取节点连接规则
  │   ├── 4. 检查目标节点是否可以被连接
  │   ├── 5. 检查源节点是否可以有输出连接
  │   ├── 6. 判断连接类型（普通/分支/并行）
  │   ├── 7. 检查是否是重复连接
  │   ├── 8. 普通连接验证
  │   ├── 9. 分支连接验证
  │   ├── 10. 并行子节点连接验证
  │   └── 11. 检查目标节点的输入连接数量限制
  │
  └── validateEdgeDeletion()
      ├── 示例1：防止删除开始节点的唯一输出连接
      ├── 示例2：防止删除条件节点的最后一个分支
      └── 示例3：删除关键连接前需要确认
```

**优势：**

- ✅ 验证逻辑集中管理
- ✅ 易于测试和维护
- ✅ 规则清晰，一目了然
- ✅ 可复用于其他场景

## 📊 节点连接规则示例

### 用户输入节点（开始节点）

```typescript
{
  canHaveNextNode: true,
  canHaveBranches: false,
  canBeParallel: false,
  canBeTarget: false,        // ⚠️ 不能被其他节点连接
  maxOutputConnections: 1,
  maxInputConnections: 0
}
```

### 条件检查器

```typescript
{
  canHaveNextNode: false,    // ⚠️ 只能通过分支连接
  canHaveBranches: true,
  canBeParallel: true,
  canBeTarget: true,
  maxOutputConnections: -1,  // 可以有多个分支
  maxInputConnections: -1
}
```

### 结束节点

```typescript
{
  canHaveNextNode: false,    // ⚠️ 不能有输出
  canHaveBranches: false,
  canBeParallel: true,
  canBeTarget: true,
  maxOutputConnections: 0,
  maxInputConnections: -1
}
```

## 🔧 如何添加新的验证规则

### 1. 修改节点连接规则矩阵

在 `edgeValidation.ts` 中添加或修改规则：

```typescript
const NODE_CONNECTION_RULES: Record<string, NodeConnectionRule> = {
  // 添加新节点类型的规则
  [NodeTypeEnum.NEW_NODE_TYPE]: {
    canHaveNextNode: true,
    canHaveBranches: false,
    canBeParallel: true,
    canBeTarget: true,
    maxOutputConnections: 1,
    maxInputConnections: -1
  }
};
```

### 2. 添加自定义验证逻辑

在 `validateEdgeConnection()` 函数中添加特殊验证：

```typescript
export function validateEdgeConnection(
  connection: Connection,
  sourceNode: Node | undefined,
  targetNode: Node | undefined,
  allEdges: Edge[]
): EdgeValidationResult {
  // ... 现有验证逻辑

  // 添加自定义验证
  if (
    sourceNode.type === "special_node" &&
    targetNode.type === "another_node"
  ) {
    return { success: false, error: "这两种节点不能连接" };
  }

  return { success: true };
}
```

### 3. 添加新的回调

在 `useWorkflowApplication.ts` 中注册新的回调：

```typescript
const workflow = useWorkflow({
  vueFlowId,

  // 边添加前的验证
  beforeAddEdge: async context => {
    return validateEdgeConnection(
      context.connection,
      context.sourceNode,
      context.targetNode,
      context.allEdges
    );
  },

  // 边删除前的验证（可选）
  beforeDeleteEdge: async context => {
    // 自定义删除验证逻辑
    return { success: true };
  }
});
```

## 🎨 最佳实践

### 1. 保持验证逻辑的单一职责

每个验证函数只负责一种验证：

- ✅ `validateEdgeConnection()` - 验证边是否可以添加
- ✅ `validateEdgeDeletion()` - 验证边是否可以删除
- ✅ `validateNodeConnection()` - 验证节点连接规则

### 2. 使用声明式规则矩阵

优先使用规则矩阵而不是命令式的 if-else：

```typescript
// ✅ 好的做法
const rule = NODE_CONNECTION_RULES[nodeType];
if (!rule.canBeTarget) {
  return { success: false, error: "不能被连接" };
}

// ❌ 不好的做法
if (nodeType === "user_input" || nodeType === "start") {
  return { success: false, error: "不能被连接" };
}
```

### 3. 提供清晰的错误消息

错误消息应该告诉用户：

- 什么操作被阻止了
- 为什么被阻止
- 如何解决（如果适用）

```typescript
return {
  success: false,
  error: `${sourceNode.data?.label || "该节点"}已达到最大输出连接数（${sourceRule.maxOutputConnections}），请先断开现有连接`
};
```

## 📝 总结

通过将边验证逻辑从 FlowApp 组件中抽离到 `edgeValidation.ts`，我们实现了：

1. **关注点分离** - 业务逻辑、验证逻辑、UI 逻辑各司其职
2. **可测试性** - 验证逻辑可以独立测试
3. **可维护性** - 规则集中管理，易于修改和扩展
4. **可复用性** - 验证逻辑可以在多个地方复用

这是一个更加清晰、可维护的架构！🎉
