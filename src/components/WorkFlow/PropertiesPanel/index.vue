<template>
  <div
    class="properties-panel"
    :class="{ collapsed: isCollapsed, dark: darkMode }"
  >
    <!-- 收起/展开按钮 -->
    <div class="panel-toggle" @click="toggleCollapse">
      <el-icon :class="{ rotated: isCollapsed }">
        <ArrowRight />
      </el-icon>
    </div>

    <!-- 面板内容 -->
    <transition name="slide-left">
      <div v-show="!isCollapsed" class="panel-content">
        <div class="panel-header">
          <h3 class="panel-title">
            {{
              selectedNode ? "节点配置" : selectedEdge ? "连线配置" : "属性配置"
            }}
          </h3>
          <el-button
            v-if="selectedNode"
            type="danger"
            size="small"
            :icon="Delete"
            circle
            @click="handleDeleteNode"
          />
          <el-button
            v-if="selectedEdge"
            type="danger"
            size="small"
            :icon="Delete"
            circle
            @click="handleDeleteEdge"
          />
        </div>

        <!-- 未选中节点或边时的提示 -->
        <div v-if="!selectedNode && !selectedEdge" class="empty-state">
          <el-icon class="empty-icon">
            <InfoFilled />
          </el-icon>
          <p class="empty-text">请选择一个节点或连线</p>
          <p class="empty-hint">点击画布中的节点或连线以编辑其属性</p>
        </div>

        <!-- 边属性表单 -->
        <div v-else-if="selectedEdge" class="properties-form">
          <el-collapse v-model="activeCollapse" class="compact-collapse">
            <EdgeConfigSection
              :edge="selectedEdge"
              @update-edge="handleUpdateEdge"
            />
          </el-collapse>
        </div>

        <!-- 节点属性表单 -->
        <div v-else-if="selectedNode" class="properties-form">
          <el-collapse v-model="activeCollapse" class="compact-collapse">
            <!-- 基础信息 -->
            <BasicInfoSection
              :node="selectedNode"
              @update-data="handleUpdateNodeData"
            />

            <!-- 位置信息 -->
            <PositionSection
              :node="selectedNode"
              @update-position="handleUpdateNodePosition"
            />

            <!-- 条件节点专用：分支配置 -->
            <ConditionSection
              v-if="selectedNode.type === NodeTypeEnum.CONDITION_CHECKER"
              :branches="branches"
              :get-target-node-label="getTargetNodeLabel"
              @add-branch="handleAddBranch"
              @remove-branch="handleRemoveBranch"
              @update-branch-name="handleUpdateBranchName"
              @update-branch-condition="handleUpdateBranchCondition"
            />

            <!-- 并行节点专用：并行任务配置 -->
            <ParallelSection
              v-if="selectedNode.type === NodeTypeEnum.PARALLEL_EXECUTOR"
              :parallel-children="parallelChildren"
              :parallel-config="parallelConfig"
              :get-target-node-label="getTargetNodeLabel"
              @add-child="handleAddParallelChild"
              @remove-child="handleRemoveParallelChild"
              @update-child-name="handleUpdateParallelChildName"
              @update-mode="handleUpdateParallelMode"
              @update-timeout="handleUpdateParallelTimeout"
            />

            <!-- LLM 节点专用：LLM 配置 -->
            <LlmConfigSection
              v-if="selectedNode.type === NodeTypeEnum.LLM_CALLER"
              :node="selectedNode"
              @update-data="handleUpdateNodeData"
            />

            <!-- API 调用节点专用：API 配置 -->
            <ApiConfigSection
              v-if="selectedNode.type === NodeTypeEnum.API_CALLER"
              :node="selectedNode"
              @update-data="handleUpdateNodeData"
            />

            <!-- 数据处理器节点专用：处理器配置 -->
            <ProcessorConfigSection
              v-if="selectedNode.type === NodeTypeEnum.DATA_PROCESSOR"
              :node="selectedNode"
              @update-data="handleUpdateNodeData"
            />

            <!-- 连接设置 -->
            <ConnectionSection
              :node="selectedNode"
              @update-connectable="handleUpdateNodeConnectable"
            />
          </el-collapse>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Node, Edge } from "@vue-flow/core";
import { ArrowRight, Delete, InfoFilled } from "@element-plus/icons-vue";
import {
  BasicInfoSection,
  PositionSection,
  ConnectionSection,
  ConditionSection,
  ParallelSection
} from "./sections";
import LlmConfigSection from "./sections/LlmConfigSection.vue";
import ApiConfigSection from "./sections/ApiConfigSection.vue";
import ProcessorConfigSection from "./sections/ProcessorConfigSection.vue";
import EdgeConfigSection from "./sections/EdgeConfigSection.vue";
import { NodeTypeEnum } from "./types";
import { useNodeOperations } from "./composables/useNodeOperations";
import { type BranchConfig, type ParallelChildConfig } from "./types";
import { DEFAULT_PARALLEL_CONFIG } from "./constants";

interface Props {
  darkMode?: boolean;
  selectedNode: Node | null;
  selectedEdge?: Edge | null;
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  updateNode: [nodeId: string, updates: Partial<Node>];
  deleteNode: [nodeId: string];
  updateEdge: [edgeId: string, updates: Partial<Edge>];
  deleteEdge: [edgeId: string];
}>();

// 状态管理
const isCollapsed = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});
const activeCollapse = ref<string[]>([
  "basic",
  "llm-config",
  "api-config",
  "processor-config",
  "edge-config"
]);

// 使用节点操作 Composable
// 将 selectedNode 转换为响应式引用
const selectedNodeRef = computed(() => props.selectedNode);

const {
  updateNodeData,
  updateNodePosition,
  updateNodeConnectable,
  deleteNode,
  getTargetNodeLabel,
  branches,
  parallelChildren
} = useNodeOperations(selectedNodeRef, {
  updateNode: (nodeId: string, updates: Partial<Node>) =>
    emit("updateNode", nodeId, updates),
  deleteNode: (nodeId: string) => emit("deleteNode", nodeId)
});

// 计算并行配置（带默认值）
const parallelConfig = computed(() => {
  if (!props.selectedNode) return DEFAULT_PARALLEL_CONFIG;
  return {
    ...DEFAULT_PARALLEL_CONFIG,
    ...props.selectedNode.data.parallelConfig
  };
});

/**
 * 切换面板展开/收起状态
 */
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

/**
 * 更新边数据
 */
function handleUpdateEdge(edgeId: string, updates: Partial<Edge>) {
  emit("updateEdge", edgeId, updates);
}

/**
 * 删除边
 */
function handleDeleteEdge() {
  if (!props.selectedEdge) return;
  emit("deleteEdge", props.selectedEdge.id);
}

/**
 * 更新节点数据
 */
function handleUpdateNodeData(key: string, value: any) {
  updateNodeData(key, value);
}

/**
 * 更新节点位置
 */
function handleUpdateNodePosition(axis: "x" | "y", value: number) {
  updateNodePosition(axis, value);
}

/**
 * 更新节点可连接状态
 */
function handleUpdateNodeConnectable(value: boolean) {
  updateNodeConnectable(value);
}

/**
 * 删除节点
 */
function handleDeleteNode() {
  deleteNode();
}

// ==================== 分支相关 ====================
// 注意：branchNodes 保存到数据库，包含分支配置（name, condition, handlerId）
// targetNodeId 从 edges 中动态读取
// 实际的分支连接关系通过 edge 表的 sourceHandle 字段管理

/**
 * 添加分支
 * 在 branchNodes 中添加一个新的分支配置
 */
function handleAddBranch() {
  if (!props.selectedNode) return;

  const currentBranchNodes = props.selectedNode.data.branchNodes || {};
  const newBranchIndex = Object.keys(currentBranchNodes).length + 1;
  const newBranchName = `branch${newBranchIndex}`;

  const newBranchNodes = {
    ...currentBranchNodes,
    [newBranchName]: {
      name: newBranchName,
      condition: "",
      handlerId: undefined
    }
  };

  updateNodeData("branchNodes", newBranchNodes);
}

/**
 * 删除分支
 * 注意：删除分支时，需要同时删除对应的 edge
 */
function handleRemoveBranch(index: number) {
  if (!props.selectedNode) return;

  const branchesArray = branches.value;
  if (!branchesArray[index]) return;

  const branchToRemove = branchesArray[index];
  const currentBranchNodes = { ...props.selectedNode.data.branchNodes };

  // 删除对应的分支配置
  delete currentBranchNodes[branchToRemove.name];

  updateNodeData("branchNodes", currentBranchNodes);
}

/**
 * 更新分支名称
 */
function handleUpdateBranchName(index: number, name: string) {
  if (!props.selectedNode) return;

  const branchesArray = branches.value;
  if (!branchesArray[index]) return;

  const oldBranchName = branchesArray[index].name;
  const currentBranchNodes = { ...props.selectedNode.data.branchNodes };

  // 删除旧的 key，添加新的 key
  const branchConfig = currentBranchNodes[oldBranchName];
  delete currentBranchNodes[oldBranchName];
  currentBranchNodes[name] = {
    ...branchConfig,
    name
  };

  updateNodeData("branchNodes", currentBranchNodes);
}

/**
 * 更新分支条件
 */
function handleUpdateBranchCondition(index: number, condition: string) {
  if (!props.selectedNode) return;

  const branchesArray = branches.value;
  if (!branchesArray[index]) return;

  const branchName = branchesArray[index].name;
  const currentBranchNodes = { ...props.selectedNode.data.branchNodes };

  currentBranchNodes[branchName] = {
    ...currentBranchNodes[branchName],
    condition
  };

  updateNodeData("branchNodes", currentBranchNodes);
}

// ==================== 并行节点相关 ====================
// 注意：
// - parallelChildren 从 parallelConfig.threads 和 edges 计算得出，用于 UI 显示
// - parallelConfig.threads 保存任务信息（名称、handler ID 等），会保存到数据库
// - edges 保存连接关系，通过 sourceHandle 关联到 thread.id

/**
 * 添加并行子节点
 * 在 parallelConfig.threads 中添加一个新任务
 */
function handleAddParallelChild() {
  if (!props.selectedNode) return;

  const currentConfig = props.selectedNode.data.parallelConfig || {};
  const currentThreads = currentConfig.threads || [];
  const newThreadId = `thread-${Date.now()}`; // 生成唯一 ID
  const newThreadIndex = currentThreads.length + 1;

  const newThread = {
    id: newThreadId,
    name: `任务${newThreadIndex}`
  };

  updateNodeData("parallelConfig", {
    ...currentConfig,
    threads: [...currentThreads, newThread]
  });
}

/**
 * 删除并行子节点
 * 从 parallelConfig.threads 中删除任务
 * TODO: 应该同时删除对应的 edge 和清除子节点的 parent_node_id
 */
function handleRemoveParallelChild(index: number) {
  if (!props.selectedNode) return;

  const currentConfig = props.selectedNode.data.parallelConfig || {};
  const currentThreads = currentConfig.threads || [];
  if (currentThreads.length <= 1) return;

  // TODO: 删除对应的 edge 和清除子节点的 parent_node_id
  // const threadId = currentThreads[index].id;
  // 找到并删除 sourceHandle 包含 `parallel-${threadId}` 的 edge
  // 调用 API 清除对应子节点的 parent_node_id

  const newThreads = currentThreads.filter((_: any, i: number) => i !== index);

  updateNodeData("parallelConfig", {
    ...currentConfig,
    threads: newThreads
  });
}

/**
 * 更新并行子节点名称
 * 更新 parallelConfig.threads 中的任务名称
 */
function handleUpdateParallelChildName(index: number, name: string) {
  if (!props.selectedNode) return;

  const currentConfig = props.selectedNode.data.parallelConfig || {};
  const currentThreads = [...(currentConfig.threads || [])];

  if (currentThreads[index]) {
    currentThreads[index] = {
      ...currentThreads[index],
      name
    };

    updateNodeData("parallelConfig", {
      ...currentConfig,
      threads: currentThreads
    });
  }
}

/**
 * 更新并行模式
 */
function handleUpdateParallelMode(mode: string) {
  if (!props.selectedNode) return;

  const currentConfig = props.selectedNode.data.parallelConfig || {};
  updateNodeData("parallelConfig", {
    ...currentConfig,
    mode
  });
}

/**
 * 更新并行超时时间
 */
function handleUpdateParallelTimeout(timeout: number) {
  if (!props.selectedNode) return;

  const currentConfig = props.selectedNode.data.parallelConfig || {};
  updateNodeData("parallelConfig", {
    ...currentConfig,
    timeout
  });
}

// 暴露方法给父组件
defineExpose({
  toggleCollapse
});
</script>

<style scoped lang="scss">
.properties-panel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
  display: flex;
  width: 320px;
  height: 100%;
  background: white;
  box-shadow: -2px 0 12px rgb(0 0 0 / 10%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed {
    width: 32px;
  }
}

.panel-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  color: #606266;
  cursor: pointer;
  background: linear-gradient(to right, #f5f7fa, #fff);
  border-left: 1px solid #e4e7ed;
  transition: all 0.3s ease;

  &:hover {
    color: #409eff;
    background: linear-gradient(to right, #ecf5ff, #fff);
  }

  .el-icon {
    font-size: 16px;
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.panel-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;

  .panel-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;

  .empty-icon {
    font-size: 48px;
    color: #dcdfe6;
  }

  .empty-text {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #606266;
  }

  .empty-hint {
    margin: 0;
    font-size: 12px;
    color: #909399;
  }
}

.properties-form {
  flex: 1;
  margin-top: 5px;
  margin-right: 5px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 2px;

    &:hover {
      background: #c0c4cc;
    }
  }

  :deep(.el-collapse) {
    border: none;
  }

  :deep(.el-collapse-item) {
    margin-bottom: 8px;
    overflow: hidden;
    border: 1px solid #e4e7ed;
    border-radius: 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-collapse-item__header) {
    padding: 12px 16px;
    font-weight: 500;
    background: #fafafa;
    border-bottom: none;
    transition: all 0.3s ease;

    &:hover {
      background: #f5f7fa;
    }

    &.is-active {
      border-bottom: 1px solid #e4e7ed;
    }
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 16px;
  }
}

// 动画
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// 暗黑模式
.properties-panel.dark {
  background: #2d3748;
  box-shadow: -2px 0 12px rgb(0 0 0 / 30%);

  .panel-toggle {
    background: #1a202c;
    border-left-color: #4a5568;

    &:hover {
      background: #2c5282;
    }

    .el-icon {
      color: #e2e8f0;
    }
  }

  .panel-content {
    background: #2d3748;
  }

  .panel-header {
    border-bottom-color: #4a5568;

    .panel-title {
      color: #e2e8f0;
    }
  }

  .empty-state {
    .empty-icon {
      color: #4a5568;
    }

    .empty-text {
      color: #e2e8f0;
    }

    .empty-hint {
      color: #a0aec0;
    }
  }

  .properties-form {
    &::-webkit-scrollbar-track {
      background: #1a202c;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a5568;

      &:hover {
        background: #718096;
      }
    }

    :deep(.el-collapse-item) {
      border-color: #4a5568;
    }

    :deep(.el-collapse-item__header) {
      color: #e2e8f0;
      background: #374151;

      &:hover {
        background: #4a5568;
      }

      &.is-active {
        border-bottom-color: #4a5568;
      }
    }

    :deep(.el-collapse-item__content) {
      background: #2d3748;
    }

    :deep(.el-form-item__label) {
      color: #e2e8f0;
    }

    :deep(.el-input__wrapper) {
      background-color: #374151;
      box-shadow: 0 0 0 1px #4a5568 inset;

      &:hover {
        box-shadow: 0 0 0 1px #718096 inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px #409eff inset;
      }
    }

    :deep(.el-input__inner) {
      color: #e2e8f0;

      &::placeholder {
        color: #718096;
      }
    }

    :deep(.el-textarea__inner) {
      color: #e2e8f0;
      background-color: #374151;
      border-color: #4a5568;

      &:hover {
        border-color: #718096;
      }

      &:focus {
        border-color: #409eff;
      }

      &::placeholder {
        color: #718096;
      }
    }

    :deep(.el-color-picker__trigger) {
      border-color: #4a5568;

      &:hover {
        border-color: #718096;
      }
    }

    :deep(.el-switch) {
      --el-switch-off-color: #4a5568;
    }

    :deep(.el-tag) {
      color: #e2e8f0;
      background-color: #374151;
      border-color: #4a5568;
    }

    :deep(.el-select) {
      .el-input__wrapper {
        background-color: #374151;
      }
    }

    :deep(.el-input-number) {
      .el-input__wrapper {
        background-color: #374151;
      }
    }
  }
}

:deep(.el-collapse-item__header) {
  height: 35px; /* 可选：设定最小高度 */
  padding: 4px 8px !important; /* 默认是 12px 16px，可以改小一点 */
  font-size: 13px; /* 调整字体大小 */
  line-height: 1.2; /* 紧凑行高 */
}
</style>
