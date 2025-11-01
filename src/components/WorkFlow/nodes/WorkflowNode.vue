<template>
  <div class="workflow-node">
    <div class="node-header">
      <el-icon class="node-icon"><Connection /></el-icon>
      <span class="node-title">{{ data.label }}</span>
    </div>

    <div class="node-body">
      <div v-if="workflowApplicationName" class="workflow-info">
        <el-tag type="info" size="small">
          <el-icon><Document /></el-icon>
          {{ workflowApplicationName }}
        </el-tag>
      </div>
      <div v-else class="workflow-info empty">
        <el-text type="info" size="small">未选择工作流</el-text>
      </div>

      <div v-if="data.description" class="node-description">
        {{ data.description }}
      </div>
    </div>

    <!-- 输入 Handle -->
    <Handle
      :id="inputHandleId"
      type="target"
      :position="Position.Top"
      class="custom-handle handle-input"
    />

    <!-- 输出 Handle -->
    <Handle
      :id="outputHandleId"
      type="source"
      :position="Position.Bottom"
      class="custom-handle handle-output"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Connection, Document } from "@element-plus/icons-vue";
import { WorkflowHandles } from "@/composables/workflowApplication/handleIdUtils";
import type { NodeData } from "../types";

interface Props {
  id: string;
  data: NodeData;
}

const props = defineProps<Props>();

// 生成 Handle ID
const inputHandleId = computed(() => WorkflowHandles.input(props.id));
const outputHandleId = computed(() => WorkflowHandles.output(props.id));

// 工作流应用名称（TODO: 从 API 获取）
const workflowApplicationName = computed(() => {
  // 这里应该根据 data.workflowApplicationId 从 API 获取工作流应用名称
  // 暂时返回 ID 或占位符
  if (props.data.workflowApplicationId) {
    return `工作流 #${props.data.workflowApplicationId}`;
  }
  return "";
});
</script>

<style scoped lang="scss">
.workflow-node {
  min-width: 200px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #5a67d8;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgb(0 0 0 / 15%);
    transform: translateY(-2px);
  }

  .node-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
    color: white;

    .node-icon {
      font-size: 18px;
    }

    .node-title {
      font-size: 14px;
      font-weight: 600;
    }
  }

  .node-body {
    padding: 10px;
    background: rgb(255 255 255 / 95%);
    border-radius: 6px;

    .workflow-info {
      margin-bottom: 8px;

      &.empty {
        padding: 4px 0;
        text-align: center;
      }

      .el-tag {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }
    }

    .node-description {
      padding-top: 8px;
      margin-top: 8px;
      font-size: 12px;
      line-height: 1.4;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
  }

  .custom-handle {
    width: 12px;
    height: 12px;
    background: #667eea;
    border: 2px solid white;

    &.handle-input {
      top: -6px;
    }

    &.handle-output {
      bottom: -6px;
    }

    &:hover {
      width: 14px;
      height: 14px;
      background: #5a67d8;
    }
  }
}
</style>
