<template>
  <el-collapse-item name="condition" title="分支配置">
    <template #title>
      <div class="section-title">
        <el-icon><Guide /></el-icon>
        <span>分支配置</span>
        <el-tag size="small" type="warning" style="margin-left: auto">
          {{ branches.length }} 个分支
        </el-tag>
      </div>
    </template>

    <div class="branch-list">
      <div v-for="(branch, index) in branches" :key="index" class="branch-item">
        <div class="branch-header">
          <span class="branch-index">分支 {{ index + 1 }}</span>
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            :disabled="branches.length <= 1"
            @click="handleRemoveBranch(index)"
          />
        </div>

        <el-form label-width="80px" label-position="top">
          <el-form-item label="分支名称">
            <el-input
              :model-value="branch.name"
              placeholder="如: true, false, case1"
              @input="handleUpdateBranchName(index, $event)"
            />
          </el-form-item>

          <el-form-item label="条件表达式">
            <el-input
              :model-value="branch.condition"
              type="textarea"
              :rows="2"
              placeholder="如: result === true"
              @input="handleUpdateBranchCondition(index, $event)"
            />
          </el-form-item>

          <el-form-item label="目标节点">
            <el-tag v-if="branch.targetNodeId" type="success">
              {{ getTargetNodeLabel(branch.targetNodeId) }}
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
      @click="handleAddBranch"
    >
      <el-icon><Plus /></el-icon>
      添加分支
    </el-button>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { Delete, Plus, Guide } from "@element-plus/icons-vue";
import type { BranchConfig } from "../types";

interface Props {
  branches: BranchConfig[];
  getTargetNodeLabel: (nodeId: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  addBranch: [];
  removeBranch: [index: number];
  updateBranchName: [index: number, name: string];
  updateBranchCondition: [index: number, condition: string];
}>();

const handleAddBranch = () => {
  emit("addBranch");
};

const handleRemoveBranch = (index: number) => {
  emit("removeBranch", index);
};

const handleUpdateBranchName = (index: number, name: string) => {
  emit("updateBranchName", index, name);
};

const handleUpdateBranchCondition = (index: number, condition: string) => {
  emit("updateBranchCondition", index, condition);
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #e6a23c;
  }
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.branch-item {
  padding: 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #e6a23c;
    box-shadow: 0 2px 8px rgb(230 162 60 / 10%);
  }
}

.branch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.branch-index {
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
