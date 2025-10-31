<template>
  <div class="decision-node" :style="{ backgroundColor: data.color }">
    <Handle
      :id="`${id}-top`"
      type="target"
      :position="Position.Top"
      class="node-handle"
    />
    <div class="node-content">
      <span class="node-label">{{ data.label }}</span>
      <span v-if="data.description" class="node-description">{{
        data.description
      }}</span>
    </div>
    <Handle
      :id="`${id}-left`"
      type="source"
      :position="Position.Left"
      class="node-handle"
    />
    <Handle
      :id="`${id}-right`"
      type="source"
      :position="Position.Right"
      class="node-handle"
    />
    <Handle
      :id="`${id}-bottom`"
      type="source"
      :position="Position.Bottom"
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
.decision-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  color: white;
  background-color: #e6a23c;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  transform: rotate(45deg);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
    transform: rotate(45deg) scale(1.05);
  }
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  max-width: 80px;
  text-align: center;
  transform: rotate(-45deg);
}

.node-label {
  font-size: 14px;
  font-weight: 600;
}

.node-description {
  font-size: 11px;
  opacity: 0.9;
}

.node-handle {
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid currentcolor;
}
</style>
