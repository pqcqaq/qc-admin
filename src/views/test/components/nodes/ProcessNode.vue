<template>
  <div class="process-node" :style="{ backgroundColor: data.color }">
    <Handle
      :id="`${id}-top`"
      type="target"
      :position="Position.Top"
      class="node-handle"
    />
    <Handle
      :id="`${id}-left`"
      type="target"
      :position="Position.Left"
      class="node-handle"
    />
    <div class="node-content">
      <span v-if="data.loading" class="loading-spinner" />
      <span class="node-label">{{ data.label }}</span>
      <span v-if="data.description" class="node-description">{{
        data.description
      }}</span>
    </div>
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
.process-node {
  min-width: 140px;
  min-height: 60px;
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

.node-label {
  font-size: 14px;
  font-weight: 600;
}

.node-description {
  font-size: 12px;
  opacity: 0.9;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-bottom: 4px;
  border: 2px solid rgb(255 255 255 / 30%);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.node-handle {
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid currentcolor;
}
</style>
