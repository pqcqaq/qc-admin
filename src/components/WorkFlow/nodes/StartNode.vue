<template>
  <div class="start-node">
    <div class="node-glow" />
    <div class="node-content">
      <div class="node-icon-wrapper">
        <span class="node-icon">▶</span>
      </div>
      <span class="node-label">{{ data.label }}</span>
    </div>
    <Handle
      :id="`${id}-bottom`"
      type="source"
      :position="Position.Bottom"
      class="node-handle source-handle"
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
.start-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 56px;
  padding: 0 20px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 28px;
  box-shadow: 0 4px 15px rgb(102 126 234 / 40%);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgb(102 126 234 / 50%);
  }
}

.node-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgb(255 255 255 / 30%) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.node-content {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  align-items: center;
}

.node-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgb(255 255 255 / 20%);
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-icon {
  font-size: 16px;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 20%));
}

.node-label {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.node-handle {
  width: 12px;
  height: 12px;
  border: 3px solid white;
  border-radius: 50%;
  transition: all 0.2s ease;

  &.source-handle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 8px rgb(102 126 234 / 40%);

    &:hover {
      box-shadow: 0 3px 12px rgb(102 126 234 / 60%);
    }
  }
}
</style>
