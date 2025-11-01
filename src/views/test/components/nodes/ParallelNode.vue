<template>
  <div class="parallel-node">
    <!-- 输入连接点（顶部） -->
    <Handle
      :id="`${id}-input`"
      type="target"
      :position="Position.Top"
      class="node-handle input-handle"
    />

    <div class="node-header">
      <div class="parallel-icon-wrapper">
        <div class="parallel-icon">⫴</div>
      </div>
    </div>

    <div class="node-content">
      <span class="node-label">{{ data.label }}</span>
      <span v-if="data.description" class="node-description">{{
        data.description
      }}</span>
      <span v-if="parallelThreads.length > 0" class="parallel-count">
        <span class="count-badge">{{ parallelThreads.length }}</span>
        并行任务
      </span>
    </div>

    <!-- 主输出连接点（右侧，用于 next_node） -->
    <!-- <Handle
      :id="`${id}-next`"
      type="source"
      :position="Position.Right"
      class="node-handle next-handle"
    /> -->

    <!-- 并行子节点连接点（底部） -->
    <!-- 使用 thread.id 作为 handle ID，而不是 index -->
    <Handle
      v-for="(thread, index) in parallelThreads"
      :id="`${id}-parallel-${thread.id}`"
      :key="thread.id"
      type="source"
      :position="Position.Bottom"
      :style="getParallelHandleStyle(index)"
      class="node-handle parallel-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { NodeData } from "../types";

interface Props {
  id: string;
  data: NodeData;
}

const props = defineProps<Props>();

// 从 parallelConfig.threads 读取并行任务配置
const parallelThreads = computed(() => {
  return props.data.parallelConfig?.threads || [];
});

// 计算并行子节点连接点的位置
const getParallelHandleStyle = (index: number) => {
  const total = parallelThreads.value.length;
  if (total === 0) return {};

  // 均匀分布在底部
  const spacing = 100 / (total + 1);
  const left = spacing * (index + 1);

  return {
    left: `${left}%`
  };
};
</script>

<style scoped lang="scss">
.parallel-node {
  position: relative;
  min-width: 180px;
  min-height: 100px;
  padding: 16px 20px;
  color: white;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgb(168 237 234 / 40%);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgb(168 237 234 / 50%);
  }
}

.node-header {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.parallel-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgb(255 255 255 / 30%);
  border-radius: 50%;
  backdrop-filter: blur(4px);
}

.parallel-icon {
  font-size: 24px;
  font-weight: bold;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 10%));
}

.node-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: center;
}

.node-label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  text-shadow: 0 1px 2px rgb(255 255 255 / 50%);
}

.node-description {
  font-size: 11px;
  line-height: 1.4;
  color: #34495e;
  text-align: center;
  opacity: 0.85;
}

.parallel-count {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #2c3e50;
  background: rgb(255 255 255 / 40%);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 10%);
  backdrop-filter: blur(4px);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgb(102 126 234 / 30%);
}

.node-handle {
  width: 12px;
  height: 12px;
  border: 3px solid white;
  border-radius: 50%;
  transition: all 0.2s ease;

  &.input-handle {
    background: #67c23a;
    box-shadow: 0 2px 8px rgb(103 194 58 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(103 194 58 / 70%);
    }
  }

  &.next-handle {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    box-shadow: 0 2px 8px rgb(79 172 254 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(79 172 254 / 70%);
    }
  }

  &.parallel-handle {
    background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%);
    box-shadow: 0 2px 8px rgb(255 167 81 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(255 167 81 / 70%);
    }
  }
}
</style>
