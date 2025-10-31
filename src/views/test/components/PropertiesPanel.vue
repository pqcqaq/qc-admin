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
          <h3 class="panel-title">属性配置</h3>
          <el-button
            v-if="selectedNode"
            type="danger"
            size="small"
            :icon="Delete"
            circle
            @click="handleDeleteNode"
          />
        </div>

        <!-- 未选中节点时的提示 -->
        <div v-if="!selectedNode" class="empty-state">
          <el-icon class="empty-icon">
            <InfoFilled />
          </el-icon>
          <p class="empty-text">请选择一个节点</p>
          <p class="empty-hint">点击画布中的节点以编辑其属性</p>
        </div>

        <!-- 节点属性表单 -->
        <div v-else class="properties-form">
          <el-form label-width="80px" label-position="top">
            <!-- 节点ID -->
            <el-form-item label="节点ID">
              <el-input :model-value="selectedNode.id" disabled />
            </el-form-item>

            <!-- 节点类型 -->
            <el-form-item label="节点类型">
              <el-tag :type="getNodeTypeTag(selectedNode.type)">
                {{ getNodeTypeLabel(selectedNode.type) }}
              </el-tag>
            </el-form-item>

            <!-- 节点标签 -->
            <el-form-item label="节点名称">
              <el-input
                :model-value="selectedNode.data.label"
                placeholder="请输入节点名称"
                @input="updateNodeData('label', $event)"
              />
            </el-form-item>

            <!-- 节点描述 -->
            <el-form-item label="节点描述">
              <el-input
                :model-value="selectedNode.data.description"
                type="textarea"
                :rows="3"
                placeholder="请输入节点描述"
                @input="updateNodeData('description', $event)"
              />
            </el-form-item>

            <!-- 节点颜色 -->
            <el-form-item label="节点颜色">
              <el-color-picker
                :model-value="selectedNode.data.color"
                show-alpha
                @change="updateNodeData('color', $event)"
              />
            </el-form-item>

            <!-- 加载状态 -->
            <el-form-item label="加载状态">
              <el-switch
                :model-value="selectedNode.data.loading"
                @change="updateNodeData('loading', $event)"
              />
            </el-form-item>

            <!-- 位置信息 -->
            <el-divider content-position="left">位置信息</el-divider>
            <el-form-item label="X 坐标">
              <el-input-number
                :model-value="selectedNode.position.x"
                :step="10"
                @change="updateNodePosition('x', $event)"
              />
            </el-form-item>
            <el-form-item label="Y 坐标">
              <el-input-number
                :model-value="selectedNode.position.y"
                :step="10"
                @change="updateNodePosition('y', $event)"
              />
            </el-form-item>

            <!-- 判断节点专用：分支配置 -->
            <template
              v-if="selectedNode.type === NodeTypeEnum.CONDITION_CHECKER"
            >
              <el-divider content-position="left">分支配置</el-divider>

              <div class="branch-list">
                <div
                  v-for="(branch, index) in branches"
                  :key="index"
                  class="branch-item"
                >
                  <div class="branch-header">
                    <span class="branch-index">分支 {{ index + 1 }}</span>
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      circle
                      :disabled="branches.length <= 1"
                      @click="removeBranch(index)"
                    />
                  </div>

                  <el-form-item label="分支名称">
                    <el-input
                      :model-value="branch.name"
                      placeholder="如: true, false, case1"
                      @input="updateBranchName(index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="条件表达式">
                    <el-input
                      :model-value="branch.condition"
                      type="textarea"
                      :rows="2"
                      placeholder="如: result === true"
                      @input="updateBranchCondition(index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="目标节点">
                    <el-tag v-if="branch.targetNodeId" type="success">
                      {{ getTargetNodeLabel(branch.targetNodeId) }}
                    </el-tag>
                    <el-tag v-else type="info">未连接</el-tag>
                  </el-form-item>
                </div>
              </div>

              <el-button
                type="primary"
                size="small"
                style="width: 100%; margin-top: 12px"
                @click="addBranch"
              >
                <el-icon><Plus /></el-icon>
                添加分支
              </el-button>
            </template>

            <!-- 并行节点专用：并行子节点配置 -->
            <template
              v-if="selectedNode.type === NodeTypeEnum.PARALLEL_EXECUTOR"
            >
              <el-divider content-position="left">并行任务配置</el-divider>

              <!-- 并行模式配置 -->
              <el-form-item label="并行模式">
                <el-select
                  :model-value="selectedNode.data.parallelConfig?.mode || 'all'"
                  placeholder="选择并行模式"
                  style="width: 100%"
                  @change="updateParallelMode($event)"
                >
                  <el-option label="全部完成 (all)" value="all" />
                  <el-option label="任意完成 (any)" value="any" />
                  <el-option label="竞速模式 (race)" value="race" />
                </el-select>
              </el-form-item>

              <el-form-item label="超时时间 (ms)">
                <el-input
                  :model-value="
                    selectedNode.data.parallelConfig?.timeout || 30000
                  "
                  type="number"
                  placeholder="30000"
                  @input="updateParallelTimeout($event)"
                />
              </el-form-item>

              <!-- 并行子节点列表 -->
              <div class="parallel-children-list">
                <div
                  v-for="(child, index) in parallelChildren"
                  :key="index"
                  class="parallel-child-item"
                >
                  <div class="parallel-child-header">
                    <span class="parallel-child-index"
                      >任务 {{ index + 1 }}</span
                    >
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      circle
                      :disabled="parallelChildren.length <= 1"
                      @click="removeParallelChild(index)"
                    />
                  </div>

                  <el-form-item label="任务名称">
                    <el-input
                      :model-value="child.name"
                      placeholder="如: 任务1, 数据处理"
                      @input="updateParallelChildName(index, $event)"
                    />
                  </el-form-item>

                  <el-form-item label="目标节点">
                    <el-tag v-if="child.targetNodeId" type="success">
                      {{ getTargetNodeLabel(child.targetNodeId) }}
                    </el-tag>
                    <el-tag v-else type="info">未连接</el-tag>
                  </el-form-item>
                </div>
              </div>

              <el-button
                type="primary"
                size="small"
                style="width: 100%; margin-top: 12px"
                @click="addParallelChild"
              >
                <el-icon><Plus /></el-icon>
                添加并行任务
              </el-button>
            </template>

            <!-- 连接设置 -->
            <el-divider content-position="left">连接设置</el-divider>
            <el-form-item label="可连接">
              <el-switch
                :model-value="selectedNode.connectable !== false"
                @change="updateNodeConnectable($event)"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Node } from "@vue-flow/core";
import { ArrowRight, Delete, InfoFilled, Plus } from "@element-plus/icons-vue";
import {
  NodeTypeEnum,
  type BranchConfig,
  type ParallelChildConfig
} from "./types";
import { useVueFlow } from "@vue-flow/core";

interface Props {
  darkMode?: boolean;
  selectedNode: Node | null;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false
});

const emit = defineEmits<{
  updateNode: [nodeId: string, updates: Partial<Node>];
  deleteNode: [nodeId: string];
}>();

const isCollapsed = ref(false);

// 获取 VueFlow 实例以查询节点信息
const { getNodes, getEdges } = useVueFlow({ id: "workflow-canvas" });

// 计算当前节点的分支配置
const branches = computed<BranchConfig[]>(() => {
  if (
    !props.selectedNode ||
    props.selectedNode.type !== NodeTypeEnum.CONDITION_CHECKER
  ) {
    return [];
  }

  const nodeBranches = props.selectedNode.data.branches || [];

  // 从边中获取目标节点ID
  const edges = getEdges.value;
  return nodeBranches.map((branch: BranchConfig) => {
    // 查找该分支对应的边
    const edge = edges.find(
      e =>
        e.source === props.selectedNode!.id &&
        e.sourceHandle?.includes(`branch-${branch.name}`)
    );

    return {
      ...branch,
      targetNodeId: edge?.target
    };
  });
});

/**
 * 切换面板展开/收起状态
 */
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

/**
 * 更新节点数据
 */
function updateNodeData(key: string, value: any) {
  if (!props.selectedNode) return;

  emit("updateNode", props.selectedNode.id, {
    data: {
      ...props.selectedNode.data,
      [key]: value
    }
  });
}

/**
 * 更新节点位置
 */
function updateNodePosition(axis: "x" | "y", value: number) {
  if (!props.selectedNode) return;

  emit("updateNode", props.selectedNode.id, {
    position: {
      ...props.selectedNode.position,
      [axis]: value
    }
  });
}

/**
 * 更新节点可连接状态
 */
function updateNodeConnectable(value: boolean | string | number) {
  if (!props.selectedNode) return;

  emit("updateNode", props.selectedNode.id, {
    connectable: value as boolean
  });
}

/**
 * 删除节点
 */
function handleDeleteNode() {
  if (!props.selectedNode) return;
  emit("deleteNode", props.selectedNode.id);
}

/**
 * 添加分支
 */
function addBranch() {
  if (!props.selectedNode) return;

  const currentBranches = props.selectedNode.data.branches || [];
  const newBranchIndex = currentBranches.length + 1;

  const newBranch: BranchConfig = {
    name: `branch${newBranchIndex}`,
    condition: ""
  };

  updateNodeData("branches", [...currentBranches, newBranch]);
}

/**
 * 删除分支
 */
function removeBranch(index: number) {
  if (!props.selectedNode) return;

  const currentBranches = props.selectedNode.data.branches || [];
  if (currentBranches.length <= 1) return; // 至少保留一个分支

  const newBranches = currentBranches.filter(
    (_: any, i: number) => i !== index
  );
  updateNodeData("branches", newBranches);
}

/**
 * 更新分支名称
 */
function updateBranchName(index: number, name: string) {
  if (!props.selectedNode) return;

  const currentBranches = [...(props.selectedNode.data.branches || [])];
  if (currentBranches[index]) {
    currentBranches[index] = {
      ...currentBranches[index],
      name
    };
    updateNodeData("branches", currentBranches);
  }
}

/**
 * 更新分支条件
 */
function updateBranchCondition(index: number, condition: string) {
  if (!props.selectedNode) return;

  const currentBranches = [...(props.selectedNode.data.branches || [])];
  if (currentBranches[index]) {
    currentBranches[index] = {
      ...currentBranches[index],
      condition
    };
    updateNodeData("branches", currentBranches);
  }
}

/**
 * 获取目标节点的标签
 */
function getTargetNodeLabel(nodeId: string): string {
  const nodes = getNodes.value;
  const targetNode = nodes.find(n => n.id === nodeId);
  return targetNode?.data?.label || nodeId;
}

// ==================== 并行节点相关 ====================

/**
 * 计算当前节点的并行子节点配置
 */
const parallelChildren = computed<ParallelChildConfig[]>(() => {
  if (
    !props.selectedNode ||
    props.selectedNode.type !== NodeTypeEnum.PARALLEL_EXECUTOR
  ) {
    return [];
  }

  const nodeChildren = props.selectedNode.data.parallelChildren || [];

  // 从边中获取目标节点ID
  const edges = getEdges.value;
  return nodeChildren.map((child: ParallelChildConfig, index: number) => {
    // 查找该并行子节点对应的边
    const edge = edges.find(
      e =>
        e.source === props.selectedNode!.id &&
        e.sourceHandle?.includes(`parallel-${index}`)
    );

    return {
      ...child,
      targetNodeId: edge?.target
    };
  });
});

/**
 * 添加并行子节点
 */
function addParallelChild() {
  if (!props.selectedNode) return;

  const currentChildren = props.selectedNode.data.parallelChildren || [];
  const newChildIndex = currentChildren.length + 1;

  const newChild: ParallelChildConfig = {
    name: `任务${newChildIndex}`
  };

  updateNodeData("parallelChildren", [...currentChildren, newChild]);
}

/**
 * 删除并行子节点
 */
function removeParallelChild(index: number) {
  if (!props.selectedNode) return;

  const currentChildren = props.selectedNode.data.parallelChildren || [];
  if (currentChildren.length <= 1) return; // 至少保留一个子节点

  const newChildren = currentChildren.filter(
    (_: any, i: number) => i !== index
  );
  updateNodeData("parallelChildren", newChildren);
}

/**
 * 更新并行子节点名称
 */
function updateParallelChildName(index: number, name: string) {
  if (!props.selectedNode) return;

  const currentChildren = [...(props.selectedNode.data.parallelChildren || [])];
  if (currentChildren[index]) {
    currentChildren[index] = {
      ...currentChildren[index],
      name
    };
    updateNodeData("parallelChildren", currentChildren);
  }
}

/**
 * 更新并行模式
 */
function updateParallelMode(mode: string) {
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
function updateParallelTimeout(timeout: string | number) {
  if (!props.selectedNode) return;

  const currentConfig = props.selectedNode.data.parallelConfig || {};
  updateNodeData("parallelConfig", {
    ...currentConfig,
    timeout: Number(timeout)
  });
}

/**
 * 获取节点类型标签
 */
function getNodeTypeTag(
  type: string
): "primary" | "success" | "warning" | "info" | "danger" {
  const tagMap: Record<string, string> = {
    [NodeTypeEnum.USER_INPUT]: "success",
    [NodeTypeEnum.END_NODE]: "danger",
    [NodeTypeEnum.DATA_PROCESSOR]: "primary",
    [NodeTypeEnum.CONDITION_CHECKER]: "warning",
    [NodeTypeEnum.PARALLEL_EXECUTOR]: "info",
    [NodeTypeEnum.API_CALLER]: "primary",
    // [NodeTypeEnum.DATA_PROCESSOR]: "warning",
    [NodeTypeEnum.WHILE_LOOP]: "info",
    [NodeTypeEnum.LLM_CALLER]: "primary"
  };
  return (tagMap[type] ||
    ("" as "primary" | "success" | "warning" | "info" | "danger")) as any;
}

/**
 * 获取节点类型标签文本
 */
function getNodeTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    [NodeTypeEnum.USER_INPUT]: "开始节点",
    [NodeTypeEnum.END_NODE]: "结束节点",
    [NodeTypeEnum.TODO_TASK_GENERATOR]: "待办任务生成节点",
    [NodeTypeEnum.CONDITION_CHECKER]: "条件检查节点",
    [NodeTypeEnum.PARALLEL_EXECUTOR]: "并行执行节点",
    [NodeTypeEnum.API_CALLER]: "API调用节点",
    [NodeTypeEnum.DATA_PROCESSOR]: "数据处理节点",
    [NodeTypeEnum.WHILE_LOOP]: "循环节点",
    [NodeTypeEnum.LLM_CALLER]: "LLM调用节点"
  };
  return labelMap[type] || type;
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
  padding: 20px;
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

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-divider) {
    margin: 20px 0 12px;
  }
}

// 分支列表样式
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
    border-color: #409eff;
    box-shadow: 0 2px 8px rgb(64 158 255 / 10%);
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

// 并行子节点列表样式
.parallel-children-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parallel-child-item {
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

    :deep(.el-divider) {
      border-color: #4a5568;
    }

    :deep(.el-tag) {
      color: #e2e8f0;
      background-color: #374151;
      border-color: #4a5568;
    }
  }

  .branch-item {
    background: #374151;
    border-color: #4a5568;

    &:hover {
      border-color: #409eff;
    }
  }

  .branch-index {
    color: #e2e8f0;
  }

  .parallel-child-item {
    background: #374151;
    border-color: #4a5568;

    &:hover {
      border-color: #e6a23c;
    }
  }

  .parallel-child-index {
    color: #e2e8f0;
  }
}
</style>
