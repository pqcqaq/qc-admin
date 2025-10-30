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
import { ref } from "vue";
import type { Node } from "@vue-flow/core";
import { ArrowRight, Delete, InfoFilled } from "@element-plus/icons-vue";
import { NodeTypeEnum } from "./types";

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
 * 获取节点类型标签
 */
function getNodeTypeTag(
  type: string
): "primary" | "success" | "warning" | "info" | "danger" {
  const tagMap: Record<string, string> = {
    [NodeTypeEnum.START]: "success",
    [NodeTypeEnum.END]: "danger",
    [NodeTypeEnum.PROCESS]: "primary",
    [NodeTypeEnum.DECISION]: "warning",
    [NodeTypeEnum.PARALLEL]: "info",
    [NodeTypeEnum.CUSTOM]: ""
  };
  return (tagMap[type] ||
    ("" as "primary" | "success" | "warning" | "info" | "danger")) as any;
}

/**
 * 获取节点类型标签文本
 */
function getNodeTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    [NodeTypeEnum.START]: "开始节点",
    [NodeTypeEnum.END]: "结束节点",
    [NodeTypeEnum.PROCESS]: "流程节点",
    [NodeTypeEnum.DECISION]: "判断节点",
    [NodeTypeEnum.PARALLEL]: "并行节点",
    [NodeTypeEnum.CUSTOM]: "自定义节点"
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
}
</style>
