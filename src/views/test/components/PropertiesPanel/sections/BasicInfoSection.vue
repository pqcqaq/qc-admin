<template>
  <el-collapse-item name="basic" title="基础信息">
    <template #title>
      <div class="section-title">
        <el-icon><InfoFilled /></el-icon>
        <span>基础信息</span>
      </div>
    </template>

    <el-form label-width="80px" label-position="top">
      <!-- 节点ID -->
      <el-form-item label="节点ID">
        <el-input :model-value="node.id" disabled />
      </el-form-item>

      <!-- 节点类型 -->
      <el-form-item label="节点类型">
        <el-tag :type="nodeTypeTag">
          {{ nodeTypeLabel }}
        </el-tag>
      </el-form-item>

      <!-- 节点名称 -->
      <el-form-item label="节点名称">
        <el-input
          :model-value="node.data.label"
          placeholder="请输入节点名称"
          @update:modelValue="updateData('label', $event)"
        />
      </el-form-item>

      <!-- 节点描述 -->
      <el-form-item label="节点描述">
        <el-input
          :model-value="node.data.description"
          type="textarea"
          :rows="3"
          placeholder="请输入节点描述"
          @update:modelValue="updateData('description', $event)"
        />
      </el-form-item>

      <!-- 节点颜色 -->
      <el-form-item label="节点颜色">
        <el-color-picker
          :model-value="node.data.color"
          show-alpha
          @change="updateData('color', $event)"
        />
      </el-form-item>

      <!-- 提示词（LLM节点） -->
      <el-form-item v-if="node.type === 'llm_caller'" label="提示词">
        <el-input
          :model-value="node.data.prompt"
          type="textarea"
          :rows="4"
          placeholder="请输入提示词"
          @update:modelValue="updateData('prompt', $event)"
        />
      </el-form-item>

      <!-- 异步执行 -->
      <el-form-item label="异步执行">
        <el-switch
          :model-value="node.data.async"
          @change="updateData('async', $event)"
        />
        <span class="form-hint">启用后，节点将异步执行，不阻塞工作流</span>
      </el-form-item>

      <!-- 超时时间 -->
      <el-form-item label="超时时间 (ms)">
        <el-input-number
          :model-value="node.data.timeout"
          :min="0"
          :step="1000"
          style="width: 100%"
          placeholder="30000"
          @change="updateData('timeout', $event)"
        />
        <span class="form-hint">节点执行的最大时间，超时将中断执行</span>
      </el-form-item>

      <!-- 重试次数 -->
      <el-form-item label="重试次数">
        <el-input-number
          :model-value="node.data.retryCount"
          :min="0"
          :max="10"
          :step="1"
          style="width: 100%"
          placeholder="0"
          @change="updateData('retryCount', $event)"
        />
        <span class="form-hint">节点执行失败时的重试次数</span>
      </el-form-item>

      <!-- 加载状态 -->
      <el-form-item label="加载状态">
        <el-switch
          :model-value="node.data.loading"
          @change="updateData('loading', $event)"
        />
        <span class="form-hint">仅用于 UI 显示</span>
      </el-form-item>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Node } from "@vue-flow/core";
import { InfoFilled } from "@element-plus/icons-vue";
import { NODE_TYPE_TAG_MAP, NODE_TYPE_LABEL_MAP } from "../constants";

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateData: [key: string, value: any];
}>();

const nodeTypeTag = computed(() => {
  return NODE_TYPE_TAG_MAP[props.node.type] || "info";
});

const nodeTypeLabel = computed(() => {
  return NODE_TYPE_LABEL_MAP[props.node.type] || props.node.type;
});

const updateData = (key: string, value: any) => {
  emit("updateData", key, value);
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #409eff;
  }
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
