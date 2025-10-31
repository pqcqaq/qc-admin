<template>
  <div class="llm-caller-node" :class="{ selected: selected }">
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <div class="node-icon">🤖</div>
      <div class="node-title">{{ data.label || "LLM调用" }}</div>
    </div>

    <div class="node-body">
      <div v-if="data.description" class="node-description">
        {{ data.description }}
      </div>
      <div v-if="data.config?.model" class="node-info">
        <span class="info-label">模型:</span>
        <span class="info-value">{{ data.config.model }}</span>
      </div>
      <div v-if="data.prompt" class="node-info">
        <span class="info-label">提示词:</span>
        <span class="info-value">{{ promptPreview }}</span>
      </div>
      <div v-if="data.config?.temperature !== undefined" class="node-info">
        <span class="info-label">温度:</span>
        <span class="info-value">{{ data.config.temperature }}</span>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { NodeProps } from "@vue-flow/core";

interface Props extends NodeProps {
  selected: boolean;
}

const props = defineProps<Props>();

const promptPreview = computed(() => {
  if (!props.data.prompt) return "";
  const prompt = props.data.prompt as string;
  return prompt.length > 40 ? prompt.substring(0, 40) + "..." : prompt;
});
</script>

<style scoped lang="scss">
.llm-caller-node {
  min-width: 180px;
  padding: 12px;
  color: #333;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border: 2px solid #a8edea;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(168 237 234 / 30%);
  transition: all 0.3s ease;

  &.selected {
    border-color: #00bcd4;
    box-shadow: 0 0 0 3px rgb(168 237 234 / 30%);
  }

  &:hover {
    box-shadow: 0 4px 12px rgb(168 237 234 / 40%);
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
  }
}
</style>
