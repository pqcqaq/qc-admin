<template>
  <el-collapse-item name="parallel" title="并行任务配置">
    <template #title>
      <div class="section-title">
        <el-icon><Operation /></el-icon>
        <span>并行任务配置</span>
        <el-tag size="small" type="info" style="margin-left: auto">
          {{ parallelChildren.length }} 个任务
        </el-tag>
      </div>
    </template>

    <el-form label-width="100px" label-position="top">
      <!-- 并行模式配置 -->
      <el-form-item label="并行模式">
        <el-select
          :model-value="parallelConfig.mode"
          placeholder="选择并行模式"
          style="width: 100%"
          @change="handleUpdateMode"
        >
          <el-option
            v-for="option in modeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="超时时间 (ms)">
        <el-input-number
          :model-value="parallelConfig.timeout"
          :min="0"
          :step="1000"
          style="width: 100%"
          placeholder="30000"
          @change="handleUpdateTimeout"
        />
      </el-form-item>
    </el-form>

    <!-- 并行子节点列表 -->
    <div class="parallel-children-list">
      <div
        v-for="(child, index) in parallelChildren"
        :key="index"
        class="parallel-child-item"
      >
        <div class="parallel-child-header">
          <span class="parallel-child-index">任务 {{ index + 1 }}</span>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            :disabled="parallelChildren.length <= 1"
            @click="handleRemoveChild(index)"
          />
        </div>

        <el-form label-width="80px" label-position="top">
          <el-form-item label="任务名称">
            <el-input
              :model-value="child.name"
              placeholder="如: 任务1, 数据处理"
              @input="handleUpdateChildName(index, $event)"
            />
          </el-form-item>

          <el-form-item label="目标节点">
            <el-tag v-if="child.targetNodeId" type="success">
              {{ getTargetNodeLabel(child.targetNodeId) }}
            </el-tag>
            <el-tag v-else type="info">未连接</el-tag>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <el-button
      type="primary"
      size="small"
      style="width: 100%; margin-top: 12px"
      @click="handleAddChild"
    >
      <el-icon><Plus /></el-icon>
      添加并行任务
    </el-button>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { Delete, Plus, Operation } from "@element-plus/icons-vue";
import type { ParallelChildConfig, ParallelConfig } from "../types";
import { PARALLEL_MODE_OPTIONS } from "../constants";

interface Props {
  parallelChildren: ParallelChildConfig[];
  parallelConfig: ParallelConfig;
  getTargetNodeLabel: (nodeId: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  addChild: [];
  removeChild: [index: number];
  updateChildName: [index: number, name: string];
  updateMode: [mode: string];
  updateTimeout: [timeout: number];
}>();

const modeOptions = PARALLEL_MODE_OPTIONS;

const handleAddChild = () => {
  emit("addChild");
};

const handleRemoveChild = (index: number) => {
  emit("removeChild", index);
};

const handleUpdateChildName = (index: number, name: string) => {
  emit("updateChildName", index, name);
};

const handleUpdateMode = (mode: string) => {
  emit("updateMode", mode);
};

const handleUpdateTimeout = (timeout: number | null) => {
  if (timeout !== null) {
    emit("updateTimeout", timeout);
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
    color: #909399;
  }
}

.parallel-children-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.parallel-child-item {
  padding: 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #909399;
    box-shadow: 0 2px 8px rgb(144 147 153 / 10%);
  }
}

.parallel-child-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.parallel-child-index {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

:deep(.el-form-item) {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
