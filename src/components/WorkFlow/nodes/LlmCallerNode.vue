<template>
  <div class="llm-caller-node">
    <Handle
      type="target"
      :position="Position.Top"
      class="node-handle target-handle"
    />

    <div class="node-header">
      <div class="node-icon-wrapper">
        <div class="node-icon">🤖</div>
      </div>
      <div class="node-title">{{ data.label || "LLM调用" }}</div>
    </div>

    <div class="node-body">
      <div v-if="data.description" class="node-description">
        {{ data.description }}
      </div>
      <div v-if="data.config?.model" class="node-info">
        <span class="info-label">模型</span>
        <span class="info-value">{{ data.config.model }}</span>
      </div>
      <div v-if="data.prompt" class="node-info">
        <span class="info-label">提示词</span>
        <span class="info-value">{{ promptPreview }}</span>
      </div>
      <div v-if="data.config?.temperature !== undefined" class="node-info">
        <span class="info-label">温度</span>
        <span class="info-value">{{ data.config.temperature }}</span>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Bottom"
      class="node-handle source-handle"
    />
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
  position: relative;
  min-width: 200px;
  padding: 14px 16px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  box-shadow: 0 4px 15px rgb(102 126 234 / 35%);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgb(102 126 234 / 45%);
  }
}

.node-header {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.node-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgb(255 255 255 / 20%);
  border-radius: 50%;
  backdrop-filter: blur(4px);
}

.node-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 20%));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-title {
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgb(0 0 0 / 20%);
}

.node-body {
  position: relative;
  z-index: 1;
  font-size: 12px;
}

.node-description {
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.4;
  opacity: 0.95;
}

.node-info {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 4px 8px;
  margin-top: 6px;
  font-size: 11px;
  background: rgb(255 255 255 / 15%);
  border-radius: 6px;
  backdrop-filter: blur(4px);

  .info-label {
    font-weight: 500;
    opacity: 0.9;
  }

  .info-value {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    white-space: nowrap;
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
    box-shadow: 0 2px 8px rgb(103 194 58 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(103 194 58 / 70%);
    }
  }

  &.source-handle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 8px rgb(102 126 234 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(102 126 234 / 70%);
    }
  }
}
</style>
