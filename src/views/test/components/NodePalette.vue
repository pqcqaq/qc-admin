<template>
  <div
    ref="paletteRef"
    class="node-palette"
    :class="{ collapsed: isCollapsed, dark: darkMode }"
    :style="{ left: goLeft ? '45%' : '50%' }"
    @dragover.prevent
    @drop="onDropToDelete"
  >
    <!-- 收起/展开按钮 -->
    <div class="palette-toggle" @click="toggleCollapse">
      <el-icon :class="{ rotated: !isCollapsed }">
        <ArrowUp />
      </el-icon>
      <span v-if="!isCollapsed">节点面板</span>
    </div>

    <!-- 节点列表 -->
    <transition name="slide-up">
      <div v-show="!isCollapsed" class="palette-content">
        <!-- <div class="palette-header">
          <span class="header-title">拖拽节点到画布</span>
          <span class="header-subtitle">或拖拽到此处删除</span>
        </div> -->
        <div class="node-list">
          <div
            v-for="template in nodeTemplates"
            :key="template.type"
            class="node-item"
            draggable="true"
            @dragstart="onDragStart($event, template)"
          >
            <div
              class="node-item-icon"
              :style="{ color: template.defaultData.color }"
            >
              {{ template.icon }}
            </div>
            <div class="node-item-info">
              <div class="node-item-label">{{ template.label }}</div>
              <div class="node-item-description">
                {{ template.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 删除区域提示 -->
    <transition name="fade">
      <div v-if="isDraggingOver && !isCollapsed" class="delete-zone">
        <el-icon class="delete-icon">
          <Delete />
        </el-icon>
        <span>释放以删除节点</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from "vue";
import { ArrowUp, Delete } from "@element-plus/icons-vue";
import { nodeTemplates } from "./nodeConfig";
import type { NodeTemplate } from "./types";

// Props
interface Props {
  darkMode?: boolean;
  draggingNodeId?: string | null;
  goLeft: boolean;
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false,
  draggingNodeId: null
});

const emit = defineEmits<{
  dragStart: [template: NodeTemplate];
  deleteNode: [nodeId: string];
  "update:modelValue": [modelValue: boolean];
}>();

const isCollapsed = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const isDraggingOver = ref(false);
const paletteRef = ref<HTMLElement | null>(null);

/**
 * 切换面板展开/收起状态
 */
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

/**
 * 开始拖拽节点
 */
function onDragStart(event: DragEvent, template: NodeTemplate) {
  if (!event.dataTransfer) return;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "application/vueflow-node",
    JSON.stringify(template)
  );

  emit("dragStart", template);
}

/**
 * 拖拽到删除区域
 */
function onDropToDelete(event: DragEvent) {
  event.preventDefault();
  isDraggingOver.value = false;

  // 检查是否是从画布拖拽过来的节点
  if (props.draggingNodeId) {
    emit("deleteNode", props.draggingNodeId);
    return;
  }

  // 兼容旧的方式（通过 dataTransfer）
  if (event.dataTransfer) {
    const nodeId = event.dataTransfer.getData("application/vueflow-node-id");
    if (nodeId) {
      emit("deleteNode", nodeId);
    }
  }
}

// 检查鼠标是否在面板区域内
function isMouseOverPalette(clientX: number, clientY: number): boolean {
  if (!paletteRef.value || isCollapsed.value) return false;

  const rect = paletteRef.value.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

// 鼠标移动监听器
function handleMouseMove(event: MouseEvent) {
  if (props.draggingNodeId) {
    const isOver = isMouseOverPalette(event.clientX, event.clientY);
    isDraggingOver.value = isOver;
  }
}

// 鼠标抬起监听器
function handleMouseUp() {
  isDraggingOver.value = false;
}

// 监听 draggingNodeId 的变化
watch(
  () => props.draggingNodeId,
  (newId, oldId) => {
    console.log("draggingNodeId changed:", oldId, "->", newId);

    if (newId) {
      // 开始拖拽，添加鼠标移动监听
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      // 结束拖拽，移除监听器并清除状态
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      isDraggingOver.value = false;
    }
  }
);

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});

// 暴露方法给父组件
defineExpose({
  toggleCollapse
});
</script>

<style scoped lang="scss">
.node-palette {
  position: absolute;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: 900px;
  max-width: calc(100% - 100px);
  max-height: 240px;
  background: white;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 12px rgb(0 0 0 / 10%);
  transform: translateX(-50%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed {
    max-height: 36px;
  }
}

.palette-toggle {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 36px;
  color: #606266;
  cursor: pointer;
  background: linear-gradient(to bottom, #f5f7fa, #fff);
  border-bottom: 1px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;

  &:hover {
    color: #409eff;
    background: linear-gradient(to bottom, #ecf5ff, #fff);
  }

  .el-icon {
    font-size: 14px;
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
  }
}

.palette-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  max-height: 204px; // 240px - 36px (toggle height)
  overflow: hidden;
}

.palette-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 20px 8px;
  border-bottom: 1px solid #e4e7ed;

  .header-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }

  .header-subtitle {
    font-size: 11px;
    color: #909399;
  }
}

.node-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  padding: 12px 20px;
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
}

.node-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  cursor: move;
  background: #f5f7fa;
  border: 2px dashed transparent;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    background: #ecf5ff;
    border-color: #409eff;
    box-shadow: 0 2px 8px rgb(64 158 255 / 20%);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.98);
  }
}

.node-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 20px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
}

.node-item-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.node-item-label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.node-item-description {
  font-size: 11px;
  color: #909399;
}

.delete-zone {
  position: absolute;
  top: 36px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100% - 36px);
  color: #f56c6c;
  pointer-events: none;
  background: rgb(245 108 108 / 10%);
  border: 2px dashed #f56c6c;
  border-radius: 0 0 8px 8px;

  .delete-icon {
    font-size: 36px;
  }

  span {
    font-size: 14px;
    font-weight: 600;
  }
}

// 动画
.slide-up-enter-active {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  max-height: 0 !important;
  opacity: 0;
}

.slide-up-leave-to {
  max-height: 0 !important;
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 暗黑模式
.node-palette.dark {
  background: #2d3748;
  box-shadow: 0 -2px 12px rgb(0 0 0 / 30%);

  .palette-toggle {
    color: #e2e8f0;
    background: linear-gradient(to bottom, #1a202c, #2d3748);
    border-bottom-color: #4a5568;

    &:hover {
      color: #409eff;
      background: linear-gradient(to bottom, #2c5282, #2d3748);
    }
  }

  .palette-header {
    border-bottom-color: #4a5568;

    .header-title {
      color: #e2e8f0;
    }

    .header-subtitle {
      color: #a0aec0;
    }
  }

  .node-item {
    background: #374151;
    border-color: #4a5568;

    &:hover {
      background: #4a5568;
      border-color: #409eff;
      box-shadow: 0 2px 8px rgb(66 153 225 / 30%);
    }

    .node-item-label {
      color: #e2e8f0;
    }

    .node-item-description {
      color: #a0aec0;
    }
  }

  .node-list {
    &::-webkit-scrollbar-track {
      background: #1a202c;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a5568;

      &:hover {
        background: #718096;
      }
    }
  }

  .delete-zone {
    background: rgb(127 29 29 / 95%);
    border-color: #fc8181;

    .el-icon {
      color: #fc8181;
    }

    span {
      color: #fef2f2;
    }
  }
}
</style>
