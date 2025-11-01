<template>
  <div class="data-processor-node" :class="{ selected: selected }">
    <Handle
      :id="DataProcessorHandles.input(id)"
      type="target"
      :position="Position.Top"
    />

    <div class="node-header">
      <div class="node-icon">⚙️</div>
      <div class="node-title">{{ data.label || "数据处理" }}</div>
    </div>

    <div class="node-body">
      <div v-if="data.description" class="node-description">
        {{ data.description }}
      </div>
      <div v-if="data.processorLanguage" class="node-info">
        <span class="info-label">语言:</span>
        <span class="info-value">{{ data.processorLanguage }}</span>
      </div>
      <div v-if="data.processorCode" class="node-info">
        <span class="info-label">代码:</span>
        <span class="info-value code-preview">{{ codePreview }}</span>
      </div>
    </div>

    <Handle
      :id="DataProcessorHandles.output(id)"
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { NodeProps } from "@vue-flow/core";
import { DataProcessorHandles } from "@/composables/workflowApplication/handleIdUtils";

interface Props extends NodeProps {
  id: string;
  selected: boolean;
}

const props = defineProps<Props>();

const codePreview = computed(() => {
  if (!props.data.processorCode) return "";
  const code = props.data.processorCode as string;
  return code.length > 30 ? code.substring(0, 30) + "..." : code;
});
</script>

<style scoped lang="scss">
.data-processor-node {
  min-width: 180px;
  padding: 12px;
  color: white;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: 2px solid #f093fb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(240 147 251 / 30%);
  transition: all 0.3s ease;

  &.selected {
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgb(240 147 251 / 30%);
  }

  &:hover {
    box-shadow: 0 4px 12px rgb(240 147 251 / 40%);
    transform: translateY(-2px);
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

    &.code-preview {
      padding: 2px 4px;
      font-family: "Courier New", monospace;
      background: rgb(0 0 0 / 20%);
      border-radius: 3px;
    }
  }
}
</style>
