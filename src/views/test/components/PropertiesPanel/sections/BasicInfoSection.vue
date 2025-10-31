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
          @input="updateData('label', $event)"
        />
      </el-form-item>

      <!-- 节点描述 -->
      <el-form-item label="节点描述">
        <el-input
          :model-value="node.data.description"
          type="textarea"
          :rows="3"
          placeholder="请输入节点描述"
          @input="updateData('description', $event)"
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

      <!-- 加载状态 -->
      <el-form-item label="加载状态">
        <el-switch
          :model-value="node.data.loading"
          @change="updateData('loading', $event)"
        />
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

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
