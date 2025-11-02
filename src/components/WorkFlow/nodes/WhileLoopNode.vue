<template>
  <div class="while-loop-node" :class="{ selected: selected }">
    <!-- 循环输入 -->
    <Handle
      :id="LoopHandles.input(id)"
      type="target"
      :position="Position.Top"
    />

    <div class="node-header">
      <div class="node-icon">🔄</div>
      <div class="node-title">{{ data.label || "循环" }}</div>
    </div>

    <div class="node-body">
      <div v-if="data.description" class="node-description">
        {{ data.description }}
      </div>
      <div v-if="data.config?.condition" class="node-info">
        <span class="info-label">条件:</span>
        <span class="info-value">{{ data.config.condition }}</span>
      </div>
      <div v-if="data.config?.maxIterations" class="node-info">
        <span class="info-label">最大迭代:</span>
        <span class="info-value">{{ data.config.maxIterations }}</span>
      </div>
    </div>

    <!-- 循环体输出（进入循环） -->
    <Handle
      :id="LoopHandles.body(id)"
      type="source"
      :position="Position.Bottom"
    />

    <!-- 循环继续输出（循环结束后） -->
    <Handle
      :id="LoopHandles.continue(id)"
      type="source"
      :position="Position.Right"
      style="top: 50%"
    />

    <!-- 循环反馈输入（循环体回到循环节点） -->
    <Handle
      :id="LoopHandles.feedback(id)"
      type="target"
      :position="Position.Left"
      style="top: 50%"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import type { NodeProps } from "@vue-flow/core";
import { LoopHandles } from "@/composables/workflowApplication/handleIdUtils";

interface Props extends NodeProps {
  id: string;
  selected: boolean;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.while-loop-node {
  min-width: 180px;
  padding: 12px;
  color: #333;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border: 2px solid #fa709a;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(250 112 154 / 30%);
  transition: all 0.3s ease;

  &.selected {
    border-color: #e91e63;
    box-shadow: 0 0 0 3px rgb(250 112 154 / 30%);
  }

  &:hover {
    box-shadow: 0 4px 12px rgb(250 112 154 / 40%);
  }
}

.node-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.node-icon {
  font-size: 20px;
}

.node-title {
  font-size: 14px;
  font-weight: 600;
}

.node-body {
  font-size: 12px;
}

.node-description {
  margin-bottom: 6px;
  opacity: 0.9;
}

.node-info {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;

  .info-label {
    opacity: 0.8;
  }

  .info-value {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    white-space: nowrap;
  }
}
</style>
