<template>
  <div class="api-caller-node" :class="{ selected: selected }">
    <Handle
      :id="ApiCallerHandles.input(id)"
      type="target"
      :position="Position.Top"
    />

    <div class="node-header">
      <div class="node-icon">🌐</div>
      <div class="node-title">{{ data.label || "API调用" }}</div>
    </div>

    <div class="node-body">
      <div v-if="data.description" class="node-description">
        {{ data.description }}
      </div>
      <div v-if="data.apiConfig?.url" class="node-info">
        <span class="info-label">URL:</span>
        <span class="info-value">{{ data.apiConfig.url }}</span>
      </div>
      <div v-if="data.apiConfig?.method" class="node-info">
        <span class="info-label">方法:</span>
        <span class="info-value">{{ data.apiConfig.method }}</span>
      </div>
    </div>

    <Handle
      :id="ApiCallerHandles.output(id)"
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import type { NodeProps } from "@vue-flow/core";
import { ApiCallerHandles } from "@/composables/workflowApplication/handleIdUtils";

interface Props extends NodeProps {
  id: string;
  selected: boolean;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.api-caller-node {
  min-width: 180px;
  padding: 12px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #667eea;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(102 126 234 / 30%);
  transition: all 0.3s ease;

  &.selected {
    border-color: #4c51bf;
    box-shadow: 0 0 0 3px rgb(102 126 234 / 30%);
  }

  &:hover {
    box-shadow: 0 4px 12px rgb(102 126 234 / 40%);
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
