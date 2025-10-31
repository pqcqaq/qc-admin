<template>
  <div class="process-node">
    <Handle
      :id="`${id}-top`"
      type="target"
      :position="Position.Top"
      class="node-handle target-handle"
    />
    <Handle
      :id="`${id}-left`"
      type="target"
      :position="Position.Left"
      class="node-handle target-handle"
    />

    <div class="node-header">
      <div class="node-icon">⚙️</div>
      <div class="node-status">
        <span v-if="data.loading" class="loading-spinner" />
      </div>
    </div>

    <div class="node-content">
      <span class="node-label">{{ data.label }}</span>
      <span v-if="data.description" class="node-description">{{
        data.description
      }}</span>
    </div>

    <Handle
      :id="`${id}-right`"
      type="source"
      :position="Position.Right"
      class="node-handle source-handle"
    />
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
.process-node {
  position: relative;
  min-width: 160px;
  min-height: 80px;
  padding: 14px 18px;
  overflow: hidden;
  color: white;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgb(79 172 254 / 30%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    position: absolute;
    inset: 0;
    content: "";
    background: linear-gradient(
      135deg,
      rgb(255 255 255 / 15%) 0%,
      rgb(255 255 255 / 0%) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    box-shadow: 0 6px 20px rgb(79 172 254 / 40%);
    transform: translateY(-2px) scale(1.02);

    &::before {
      opacity: 1;
    }

    .node-icon {
      transform: rotate(180deg);
    }
  }
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.node-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 20%));
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-status {
  min-width: 16px;
  min-height: 16px;
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
  text-align: center;
  text-shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.node-description {
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  opacity: 0.9;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
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
  width: 12px;
  height: 12px;
  border: 3px solid white;
  border-radius: 50%;
  transition: all 0.2s ease;

  &.target-handle {
    background: #67c23a;
    box-shadow: 0 2px 8px rgb(103 194 58 / 40%);

    &:hover {
      box-shadow: 0 3px 12px rgb(103 194 58 / 60%);
      transform: scale(1.3);
    }
  }

  &.source-handle {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    box-shadow: 0 2px 8px rgb(79 172 254 / 40%);

    &:hover {
      box-shadow: 0 3px 12px rgb(79 172 254 / 60%);
      transform: scale(1.3);
    }
  }
}
</style>
