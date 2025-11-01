<template>
  <el-collapse-item name="position" title="位置信息">
    <template #title>
      <div class="section-title">
        <el-icon><Location /></el-icon>
        <span>位置信息</span>
      </div>
    </template>

    <el-form label-width="80px" label-position="top">
      <el-form-item label="X 坐标">
        <el-input-number
          :model-value="node.position.x"
          :step="10"
          style="width: 100%"
          @change="updatePosition('x', $event)"
        />
      </el-form-item>

      <el-form-item label="Y 坐标">
        <el-input-number
          :model-value="node.position.y"
          :step="10"
          style="width: 100%"
          @change="updatePosition('y', $event)"
        />
      </el-form-item>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import type { Node } from "@vue-flow/core";
import { Location } from "@element-plus/icons-vue";

interface Props {
  node: Node;
}

defineProps<Props>();

const emit = defineEmits<{
  updatePosition: [axis: "x" | "y", value: number];
}>();

const updatePosition = (axis: "x" | "y", value: number | null) => {
  if (value !== null) {
    emit("updatePosition", axis, value);
  }
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #67c23a;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
