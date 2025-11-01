# Handle ID 系统设计文档

## 🎯 设计理念

基于 VueFlow 官方文档的最佳实践，使用**语义化的 Handle ID** 来标识每个连接点，而不是基于位置的命名。

## 📐 Handle ID 命名规范

### 格式

```
{nodeId}:{handleType}[:{identifier}]
```

### 示例

```typescript
// 开始节点输出
"node-1:start-output";

// 任务生成器
"node-2:task-input";
"node-2:task-output";

// 条件检查器分支
"node-3:condition-input";
"node-3:branch:true";
"node-3:branch:false";

// 并行执行器
"node-4:parallel-input";
"node-4:thread:task1";
"node-4:thread:task2";

// 循环节点
"node-5:loop-input";
"node-5:loop-body";
"node-5:loop-continue";
"node-5:loop-feedback";
```

## 🔧 Handle ID 生成工具

### 统一生成函数

```typescript
function createHandleId(
  nodeId: string,
  handleType: string,
  identifier?: string
): string {
  if (identifier) {
    return `${nodeId}:${handleType}:${identifier}`;
  }
  return `${nodeId}:${handleType}`;
}
```

### 各节点类型的专用生成器

```typescript
// 开始节点
StartNodeHandles.output(nodeId);
// → "nodeId:start-output"

// 结束节点
EndNodeHandles.input(nodeId);
// → "nodeId:end-input"

// 任务生成器
TaskGeneratorHandles.input(nodeId);
TaskGeneratorHandles.output(nodeId);
// → "nodeId:task-input"
// → "nodeId:task-output"

// 条件检查器
ConditionHandles.input(nodeId);
ConditionHandles.branch(nodeId, "true");
// → "nodeId:condition-input"
// → "nodeId:branch:true"

// 并行执行器
ParallelHandles.input(nodeId);
ParallelHandles.thread(nodeId, "task1");
ParallelHandles.childInput(nodeId);
// → "nodeId:parallel-input"
// → "nodeId:thread:task1"
// → "nodeId:parallel-child-input"

// API调用器
ApiCallerHandles.input(nodeId);
ApiCallerHandles.output(nodeId);
// → "nodeId:api-input"
// → "nodeId:api-output"

// 数据处理器
DataProcessorHandles.input(nodeId);
DataProcessorHandles.output(nodeId);
// → "nodeId:data-input"
// → "nodeId:data-output"

// 循环节点
LoopHandles.input(nodeId);
LoopHandles.body(nodeId);
LoopHandles.continue(nodeId);
LoopHandles.feedback(nodeId);
// → "nodeId:loop-input"
// → "nodeId:loop-body"
// → "nodeId:loop-continue"
// → "nodeId:loop-feedback"

// LLM调用器
LlmCallerHandles.input(nodeId);
LlmCallerHandles.output(nodeId);
// → "nodeId:llm-input"
// → "nodeId:llm-output"

// 通用节点（兜底）
CommonHandles.input(nodeId);
CommonHandles.output(nodeId);
// → "nodeId:common-input"
// → "nodeId:common-output"
```

## 🎨 在节点组件中使用

### 示例：开始节点

```vue
<template>
  <div class="start-node">
    <Handle
      :id="StartNodeHandles.output(id)"
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { StartNodeHandles } from "@/composables/workflowApplication/handleIdUtils";

interface Props {
  id: string;
}

defineProps<Props>();
</script>
```

### 示例：条件检查器

```vue
<template>
  <div class="decision-node">
    <Handle
      :id="ConditionHandles.input(id)"
      type="target"
      :position="Position.Top"
    />

    <Handle
      v-for="branch in branches"
      :id="ConditionHandles.branch(id, branch.name)"
      :key="branch.name"
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { ConditionHandles } from "@/composables/workflowApplication/handleIdUtils";

interface Props {
  id: string;
  data: {
    branchNodes: Record<string, BranchConfig>;
  };
}

const props = defineProps<Props>();

const branches = computed(() => {
  return Object.values(props.data.branchNodes || {});
});
</script>
```

## 🔍 Handle ID 解析

### 解析函数

```typescript
function parseHandleId(handleId: string): HandleIdParts | null {
  const parts = handleId.split(":");

  if (parts.length < 2) {
    throw new Error(`Invalid handle ID format: "${handleId}"`);
  }

  return {
    nodeId: parts[0],
    handleType: parts[1],
    identifier: parts[2]
  };
}
```

### 提取 HandleType

```typescript
function getHandleTypeFromId(handleId: string): HandleType {
  const parts = parseHandleId(handleId);

  switch (parts.handleType) {
    case "start-output":
      return HandleType.START_OUTPUT;
    case "task-input":
      return HandleType.TASK_GENERATOR_INPUT;
    case "branch":
      return HandleType.CONDITION_BRANCH_OUTPUT;
    case "thread":
      return HandleType.PARALLEL_THREAD_OUTPUT;
    // ... 直接映射，无需复杂逻辑
  }
}
```

## 📊 HandleType 枚举（20种类型）

```typescript
export enum HandleType {
  // 通用类型
  COMMON_INPUT = "common_input",
  COMMON_OUTPUT = "common_output",

  // 开始/结束节点
  START_OUTPUT = "start_output",
  END_INPUT = "end_input",

  // 任务生成器
  TASK_GENERATOR_INPUT = "task_generator_input",
  TASK_GENERATOR_OUTPUT = "task_generator_output",

  // 条件检查器
  CONDITION_INPUT = "condition_input",
  CONDITION_BRANCH_OUTPUT = "condition_branch_output",

  // 并行执行器
  PARALLEL_EXECUTOR_INPUT = "parallel_executor_input",
  PARALLEL_THREAD_OUTPUT = "parallel_thread_output",
  PARALLEL_CHILD_INPUT = "parallel_child_input",

  // API调用器
  API_CALLER_INPUT = "api_caller_input",
  API_CALLER_OUTPUT = "api_caller_output",

  // 数据处理器
  DATA_PROCESSOR_INPUT = "data_processor_input",
  DATA_PROCESSOR_OUTPUT = "data_processor_output",

  // 循环节点
  LOOP_INPUT = "loop_input",
  LOOP_BODY_OUTPUT = "loop_body_output",
  LOOP_CONTINUE_OUTPUT = "loop_continue_output",
  LOOP_FEEDBACK_INPUT = "loop_feedback_input",

  // LLM调用器
  LLM_CALLER_INPUT = "llm_caller_input",
  LLM_CALLER_OUTPUT = "llm_caller_output"
}
```

## ✅ 优势

### 1. 语义清晰

**旧格式（基于位置）：**

```typescript
`${nodeId}-top` // 什么节点的top？
`${nodeId}-bottom` // 什么节点的bottom？
`${nodeId}-branch-true`; // 还行，但不一致
```

**新格式（基于语义）：**

```typescript
`${nodeId}:task-input` // 一目了然：任务生成器的输入
`${nodeId}:task-output` // 一目了然：任务生成器的输出
`${nodeId}:branch:true`; // 一目了然：条件分支（true）
```

### 2. 类型提取简单

**旧方式：**

```typescript
function getHandleTypeFromHandleId(
  handleId: string,
  nodeType: string, // 需要额外的节点类型参数
  isSource: boolean // 需要额外的方向参数
): HandleType {
  // 复杂的if-else逻辑，依赖多个参数
  if (handleId.includes("-branch-")) return BRANCH_OUTPUT;
  if (handleId.includes("-top")) {
    if (nodeType === "USER_INPUT") return START_OUTPUT;
    if (nodeType === "END_NODE") return END_INPUT;
    // ...
  }
}
```

**新方式：**

```typescript
function getHandleTypeFromId(handleId: string): HandleType {
  const parts = parseHandleId(handleId);

  // 直接映射，无需额外参数
  switch (parts.handleType) {
    case "task-input":
      return HandleType.TASK_GENERATOR_INPUT;
    case "branch":
      return HandleType.CONDITION_BRANCH_OUTPUT;
    // ...
  }
}
```

### 3. 符合 VueFlow 官方最佳实践

VueFlow 官方文档明确指出：

> When using multiple handles of the same type (source or target), each handle needs to have a unique id.

我们的新格式完全符合这一要求，每个 Handle 都有唯一且语义化的 ID。

## 🚀 迁移指南

### 数据库数据迁移

由于我们从0开始，不需要迁移旧数据。所有新创建的工作流都将使用新的 Handle ID 格式。

### 代码迁移检查清单

- [x] 更新所有节点组件的 Handle ID
- [x] 更新 `useNodeOperations.ts` 中的分支和并行任务查找逻辑
- [x] 更新 `diff.ts` 中的分支处理逻辑
- [x] 更新 `WorkflowEditor.vue` 中的并行连接检测
- [x] 删除旧的 `getHandleTypeFromHandleId` 函数
- [x] 更新 `validateEdgeConnection` 使用新的 `getHandleTypeFromId`
- [x] 删除过时的文档

## 📝 总结

新的 Handle ID 系统：

✅ **语义化**：从 ID 就能看出是什么类型的 Handle  
✅ **简洁**：无需额外参数即可提取 HandleType  
✅ **一致**：所有节点使用统一的命名规范  
✅ **可读**：代码更易理解和维护  
✅ **符合标准**：遵循 VueFlow 官方最佳实践

这是一个从框架层面的彻底重构，为工作流系统提供了更加健壮和可维护的基础！
