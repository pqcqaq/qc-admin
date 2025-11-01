<template>
  <el-collapse-item name="llm-config">
    <template #title>
      <div class="section-title">
        <el-icon><ChatDotRound /></el-icon>
        <span>LLM 配置</span>
      </div>
    </template>

    <el-form label-width="100px" label-position="top">
      <!-- 提示词 -->
      <el-form-item label="提示词 (Prompt)">
        <el-input
          :model-value="node.data.prompt"
          type="textarea"
          :rows="10"
          placeholder="请输入 LLM 提示词..."
          @update:modelValue="updateData('prompt', $event)"
        />
        <span class="form-hint">LLM 的输入提示词，支持变量替换</span>
      </el-form-item>

      <!-- 模型配置 -->
      <el-form-item label="模型名称">
        <el-input
          :model-value="llmConfig.model"
          placeholder="gpt-4, claude-3-opus, etc."
          @update:modelValue="updateLlmConfig('model', $event)"
        />
        <span class="form-hint">使用的 LLM 模型名称</span>
      </el-form-item>

      <!-- 温度 -->
      <el-form-item label="温度 (Temperature)">
        <el-slider
          :model-value="llmConfig.temperature ?? 0.7"
          :min="0"
          :max="2"
          :step="0.1"
          show-input
          @change="updateLlmConfig('temperature', $event)"
        />
        <span class="form-hint">控制输出的随机性，0 = 确定性，2 = 最随机</span>
      </el-form-item>

      <!-- 最大 Token 数 -->
      <el-form-item label="最大 Token 数">
        <el-input-number
          :model-value="llmConfig.maxTokens"
          :min="1"
          :max="100000"
          :step="100"
          style="width: 100%"
          placeholder="4096"
          @change="updateLlmConfig('maxTokens', $event)"
        />
        <span class="form-hint">生成的最大 token 数量</span>
      </el-form-item>

      <!-- Top P -->
      <el-form-item label="Top P">
        <el-slider
          :model-value="llmConfig.topP ?? 1"
          :min="0"
          :max="1"
          :step="0.05"
          show-input
          @change="updateLlmConfig('topP', $event)"
        />
        <span class="form-hint">核采样参数，控制输出的多样性</span>
      </el-form-item>

      <!-- 系统提示词 -->
      <el-form-item label="系统提示词 (System)">
        <el-input
          :model-value="llmConfig.systemPrompt"
          type="textarea"
          :rows="4"
          placeholder="You are a helpful assistant..."
          @update:modelValue="updateLlmConfig('systemPrompt', $event)"
        />
        <span class="form-hint">系统级别的提示词，定义 AI 的角色和行为</span>
      </el-form-item>

      <!-- 变量说明 -->
      <el-alert
        title="变量替换"
        type="info"
        :closable="false"
        style="margin-top: 8px"
      >
        <template #default>
          <div class="variable-info">
            <p>在提示词中可以使用以下变量：</p>
            <ul>
              <li>
                <code>&#123;&#123;input&#125;&#125;</code> - 上游节点的输出
              </li>
              <li>
                <code>&#123;&#123;context.xxx&#125;&#125;</code> -
                工作流上下文变量
              </li>
              <li><code>&#123;&#123;env.xxx&#125;&#125;</code> - 环境变量</li>
            </ul>
            <p>
              示例：<code
                >请分析以下数据：&#123;&#123;input.data&#125;&#125;</code
              >
            </p>
          </div>
        </template>
      </el-alert>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Node } from "@vue-flow/core";
import { ChatDotRound } from "@element-plus/icons-vue";

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateData: [key: string, value: any];
}>();

// LLM 配置对象（存储在 config 中）
const llmConfig = computed(() => {
  return props.node.data.config || {};
});

// 更新节点数据
const updateData = (key: string, value: any) => {
  emit("updateData", key, value);
};

// 更新 LLM 配置
const updateLlmConfig = (key: string, value: any) => {
  const newConfig = {
    ...llmConfig.value,
    [key]: value
  };
  emit("updateData", "config", newConfig);
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #9c27b0;
  }
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

.variable-info {
  font-size: 13px;
  line-height: 1.6;

  p {
    margin: 8px 0 4px;
  }

  ul {
    padding-left: 20px;
    margin: 4px 0;
  }

  li {
    margin: 4px 0;
  }

  code {
    padding: 2px 6px;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 12px;
    color: #9c27b0;
    background: #f5f7fa;
    border-radius: 3px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
