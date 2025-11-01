# Handle 类型验证使用示例

## 📝 基本用法

### 1. 在错误提示中使用 Handle 类型标签

```typescript
import {
  HandleType,
  HANDLE_TYPE_LABELS,
  getHandleTypeLabel,
  getHandleTypeFromHandleId,
  checkHandleCompatibility
} from "./edgeValidation";

// 示例：验证连接并显示友好的错误信息
function validateConnection(sourceHandleId: string, targetHandleId: string) {
  // 提取 Handle 类型
  const sourceType = getHandleTypeFromHandleId(sourceHandleId, true);
  const targetType = getHandleTypeFromHandleId(targetHandleId, false);

  // 获取中文标签
  const sourceLabel = getHandleTypeLabel(sourceType);
  const targetLabel = getHandleTypeLabel(targetType);

  console.log(`尝试连接：${sourceLabel} → ${targetLabel}`);

  // 检查兼容性
  const result = checkHandleCompatibility(sourceType, targetType);

  if (!result.allowed) {
    // ✅ 友好的错误提示
    console.error(result.reason);
    // 输出示例："普通输出 不能连接到 并行输入"
  }
}
```

### 2. 在 UI 中显示 Handle 类型

```vue
<template>
  <div class="handle-info">
    <span class="handle-type">{{ handleTypeLabel }}</span>
    <span class="handle-icon">{{ handleIcon }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  HandleType,
  HANDLE_TYPE_LABELS,
  getHandleTypeFromHandleId
} from "@/composables/workflowApplication/edgeValidation";

const props = defineProps<{
  handleId: string;
  isSource: boolean;
}>();

const handleType = computed(() =>
  getHandleTypeFromHandleId(props.handleId, props.isSource)
);

const handleTypeLabel = computed(() => HANDLE_TYPE_LABELS[handleType.value]);

const handleIcon = computed(() => {
  switch (handleType.value) {
    case HandleType.INPUT:
      return "⬇️";
    case HandleType.OUTPUT:
      return "⬆️";
    case HandleType.BRANCH_OUTPUT:
      return "🔀";
    case HandleType.PARALLEL_OUTPUT:
      return "⚡";
    case HandleType.PARALLEL_INPUT:
      return "⚡⬇️";
    case HandleType.LOOP_OUTPUT:
      return "🔄";
    case HandleType.LOOP_INPUT:
      return "🔄⬇️";
    default:
      return "●";
  }
});
</script>
```

### 3. 在日志中使用

```typescript
import {
  getHandleTypeLabel,
  getHandleTypeFromHandleId
} from "./edgeValidation";

function logConnectionAttempt(
  sourceNodeId: string,
  targetNodeId: string,
  sourceHandleId: string,
  targetHandleId: string
) {
  const sourceType = getHandleTypeFromHandleId(sourceHandleId, true);
  const targetType = getHandleTypeFromHandleId(targetHandleId, false);

  console.log(`
    连接尝试：
    - 源节点：${sourceNodeId}
    - 源 Handle：${getHandleTypeLabel(sourceType)} (${sourceHandleId})
    - 目标节点：${targetNodeId}
    - 目标 Handle：${getHandleTypeLabel(targetType)} (${targetHandleId})
  `);
}
```

## 🎯 实际场景示例

### 场景 1：用户尝试连接不兼容的 Handle

```typescript
// 用户尝试：普通输出 → 并行输入
const sourceHandleId = "node-123-bottom"; // 普通输出
const targetHandleId = "node-456-parallel-input"; // 并行输入

const sourceType = getHandleTypeFromHandleId(sourceHandleId, true);
const targetType = getHandleTypeFromHandleId(targetHandleId, false);

const result = checkHandleCompatibility(sourceType, targetType);

if (!result.allowed) {
  ElMessage.error(result.reason);
  // 显示："普通输出 不能连接到 并行输入"
}
```

### 场景 2：显示节点的可用连接类型

```typescript
import { HandleType, HANDLE_TYPE_LABELS } from "./edgeValidation";

function getAvailableOutputTypes(nodeType: NodeTypeEnum): string[] {
  const outputRule = getNodeOutputRule(nodeType);
  const types: string[] = [];

  if (outputRule.canHaveNormalOutput) {
    types.push(HANDLE_TYPE_LABELS[HandleType.OUTPUT]);
  }
  if (outputRule.canHaveBranchOutput) {
    types.push(HANDLE_TYPE_LABELS[HandleType.BRANCH_OUTPUT]);
  }
  if (outputRule.canHaveParallelOutput) {
    types.push(HANDLE_TYPE_LABELS[HandleType.PARALLEL_OUTPUT]);
  }

  return types;
}

// 使用示例
const types = getAvailableOutputTypes(NodeTypeEnum.CONDITION_CHECKER);
console.log(`条件节点支持的输出类型：${types.join("、")}`);
// 输出："条件节点支持的输出类型：分支输出"
```

### 场景 3：在工具提示中显示兼容性信息

```vue
<template>
  <el-tooltip :content="compatibilityHint" placement="top">
    <div class="handle" :class="handleClass"></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  HandleType,
  HANDLE_TYPE_LABELS,
  HANDLE_COMPATIBILITY
} from "@/composables/workflowApplication/edgeValidation";

const props = defineProps<{
  handleType: HandleType;
}>();

const compatibilityHint = computed(() => {
  const label = HANDLE_TYPE_LABELS[props.handleType];
  const compatibleTypes: string[] = [];

  // 查找所有兼容的目标类型
  for (const targetType of Object.values(HandleType)) {
    if (HANDLE_COMPATIBILITY[props.handleType]?.[targetType]) {
      compatibleTypes.push(HANDLE_TYPE_LABELS[targetType]);
    }
  }

  if (compatibleTypes.length === 0) {
    return `${label}（无法连接到其他节点）`;
  }

  return `${label}（可连接到：${compatibleTypes.join("、")}）`;
});
</script>
```

## 📊 错误提示对比

### ❌ 旧方式（不友好）

```typescript
// 错误提示：
"Cannot connect output to parallel_input";
"Invalid connection type: NORMAL -> PARALLEL";
```

### ✅ 新方式（友好）

```typescript
// 错误提示：
"普通输出 不能连接到 并行输入";
"分支输出 不能连接到 并行输入";
"输入 不能连接到 输出（反向连接）";
```

## 🎨 最佳实践

### 1. 始终使用 `getHandleTypeLabel()` 获取标签

```typescript
// ✅ 好的做法
const label = getHandleTypeLabel(handleType);

// ❌ 不好的做法
const label = handleType; // 显示 "output" 而不是 "普通输出"
```

### 2. 在错误消息中提供上下文

```typescript
// ✅ 好的做法
return {
  success: false,
  error: `${sourceLabel} 不能连接到 ${targetLabel}。提示：${sourceLabel}只能连接到普通输入。`
};

// ❌ 不好的做法
return {
  success: false,
  error: "不支持的连接类型"
};
```

### 3. 使用类型安全的方式访问标签

```typescript
// ✅ 好的做法
const label = HANDLE_TYPE_LABELS[handleType];

// ❌ 不好的做法
const label = {
  input: "输入",
  output: "输出"
}[handleType]; // 容易出错，不完整
```

## 🚀 总结

通过使用 `HANDLE_TYPE_LABELS` 和 `getHandleTypeLabel()`，我们可以：

1. ✅ **提供友好的中文错误提示**
2. ✅ **在 UI 中显示清晰的 Handle 类型信息**
3. ✅ **在日志中记录可读的连接信息**
4. ✅ **在工具提示中显示兼容性说明**

这大大提升了用户体验和开发调试效率！🎉
