<template>
  <div class="end-node" :style="{ backgroundColor: data.color }">
    <Handle
      :id="`${id}-top`"
      type="target"
      :position="Position.Top"
      class="node-handle"
    />
    <div class="node-content">
      <span class="node-icon">■</span>
      <span class="node-label">{{ data.label }}</span>
    </div>
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
.end-node {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 50px;
  padding: 0 16px;
  color: white;
  border-radius: 25px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
    transform: translateY(-2px);
  }
}

.node-content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  font-size: 14px;
  font-weight: 600;
}

.node-handle {
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid currentcolor;
}
</style>
