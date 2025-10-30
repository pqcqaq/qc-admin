<template>
  <div class="parallel-node" :style="{ backgroundColor: data.color }">
    <Handle
      :id="`${id}-top`"
      type="target"
      :position="Position.Top"
      class="node-handle"
    />
    <div class="node-content">
      <div class="parallel-icon">⫴</div>
      <span class="node-label">{{ data.label }}</span>
      <span v-if="data.description" class="node-description">{{
        data.description
      }}</span>
    </div>
    <Handle
      :id="`${id}-bottom-left`"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '30%' }"
      class="node-handle"
    />
    <Handle
      :id="`${id}-bottom-right`"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '70%' }"
      class="node-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import type { NodeData } from "../types";

interface Props {
  id: string;
  data: NodeData;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.parallel-node {
  min-width: 140px;
  min-height: 70px;
  padding: 12px 16px;
  color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
    transform: translateY(-2px);
  }
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.parallel-icon {
  font-size: 20px;
  font-weight: bold;
}

.node-label {
  font-size: 14px;
  font-weight: 600;
}

.node-description {
  font-size: 12px;
  opacity: 0.9;
}

.node-handle {
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid currentcolor;
}
</style>
