<template>
  <el-collapse-item name="connection" title="连接设置">
    <template #title>
      <div class="section-title">
        <el-icon><Connection /></el-icon>
        <span>连接设置</span>
      </div>
    </template>

    <el-form label-width="80px" label-position="top">
      <el-form-item label="可连接">
        <el-switch
          :model-value="node.connectable !== false"
          @change="updateConnectable"
        />
      </el-form-item>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import type { Node } from "@vue-flow/core";
import { Connection } from "@element-plus/icons-vue";

interface Props {
  node: Node;
}

defineProps<Props>();

const emit = defineEmits<{
  updateConnectable: [value: boolean];
}>();

const updateConnectable = (value: boolean | string | number) => {
  emit("updateConnectable", value as boolean);
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #909399;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
