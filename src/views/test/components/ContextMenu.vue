<template>
  <Teleport to="body">
    <Transition name="context-menu-fade">
      <div
        v-if="visible"
        ref="menuRef"
        class="context-menu"
        :class="{ dark: darkMode }"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <!-- 画布菜单 -->
        <template v-if="menuType === 'canvas'">
          <div class="menu-item" @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
            <span>放大</span>
            <span class="shortcut">Ctrl +</span>
          </div>
          <div class="menu-item" @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
            <span>缩小</span>
            <span class="shortcut">Ctrl -</span>
          </div>
          <div class="menu-item" @click="handleFitView">
            <el-icon><FullScreen /></el-icon>
            <span>适应画布</span>
            <span class="shortcut">Ctrl 0</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item" @click="handleResetView">
            <el-icon><Refresh /></el-icon>
            <span>重置视图</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item" @click="handleSelectAll">
            <el-icon><Select /></el-icon>
            <span>全选</span>
            <span class="shortcut">Ctrl A</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item danger" @click="handleClearCanvas">
            <el-icon><Delete /></el-icon>
            <span>清空画布</span>
          </div>
        </template>

        <!-- 节点菜单 -->
        <template v-else-if="menuType === 'node'">
          <div class="menu-header">
            <el-icon><Box /></el-icon>
            <span>{{ targetNode?.data.label || "节点" }}</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item" @click="handleEditNode">
            <el-icon><Edit /></el-icon>
            <span>编辑属性</span>
          </div>
          <div class="menu-item" @click="handleCopyNode">
            <el-icon><CopyDocument /></el-icon>
            <span>复制节点</span>
            <span class="shortcut">Ctrl C</span>
          </div>
          <div class="menu-item" @click="handleDuplicateNode">
            <el-icon><DocumentCopy /></el-icon>
            <span>克隆节点</span>
            <span class="shortcut">Ctrl D</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item" @click="handleToggleConnectable">
            <el-icon><Connection /></el-icon>
            <span>{{ targetNode?.connectable ? "禁用连接" : "启用连接" }}</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item danger" @click="handleDeleteNode">
            <el-icon><Delete /></el-icon>
            <span>删除节点</span>
            <span class="shortcut">Delete</span>
          </div>
        </template>

        <!-- 连线菜单 -->
        <template v-else-if="menuType === 'edge'">
          <div class="menu-header">
            <el-icon><Connection /></el-icon>
            <span>{{ targetEdge?.label || "连接线" }}</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item" @click="handleEditEdge">
            <el-icon><Edit /></el-icon>
            <span>编辑标签</span>
          </div>
          <div class="menu-item" @click="handleToggleAnimation">
            <el-icon><VideoPlay /></el-icon>
            <span>{{ targetEdge?.animated ? "关闭动画" : "开启动画" }}</span>
          </div>
          <div class="menu-divider" />
          <div class="menu-item danger" @click="handleDeleteEdge">
            <el-icon><Delete /></el-icon>
            <span>删除连接</span>
            <span class="shortcut">Delete</span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  ZoomIn,
  ZoomOut,
  FullScreen,
  Refresh,
  Delete,
  Edit,
  CopyDocument,
  DocumentCopy,
  Connection,
  Select,
  Box,
  VideoPlay
} from "@element-plus/icons-vue";
import type { Node, Edge } from "@vue-flow/core";

// Props
interface Props {
  darkMode?: boolean;
  visible?: boolean;
  x?: number;
  y?: number;
  menuType?: "canvas" | "node" | "edge";
  targetNode?: Node | null;
  targetEdge?: Edge | null;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false,
  visible: false,
  x: 0,
  y: 0,
  menuType: "canvas",
  targetNode: null,
  targetEdge: null
});

// Emits
const emit = defineEmits<{
  close: [];
  zoomIn: [];
  zoomOut: [];
  fitView: [];
  resetView: [];
  selectAll: [];
  clearCanvas: [];
  editNode: [node: Node];
  copyNode: [node: Node];
  duplicateNode: [node: Node];
  deleteNode: [node: Node];
  toggleConnectable: [node: Node];
  editEdge: [edge: Edge];
  deleteEdge: [edge: Edge];
  toggleAnimation: [edge: Edge];
}>();

// Refs
const menuRef = ref<HTMLElement | null>(null);

// 计算菜单位置
const menuStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${props.x}px`,
    top: `${props.y}px`
  };

  // 确保菜单不超出视口
  if (menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 右边界检查
    if (props.x + rect.width > viewportWidth) {
      style.left = `${viewportWidth - rect.width - 10}px`;
    }

    // 下边界检查
    if (props.y + rect.height > viewportHeight) {
      style.top = `${viewportHeight - rect.height - 10}px`;
    }
  }

  return style;
});

// 画布操作
const handleZoomIn = () => {
  emit("zoomIn");
  emit("close");
};

const handleZoomOut = () => {
  emit("zoomOut");
  emit("close");
};

const handleFitView = () => {
  emit("fitView");
  emit("close");
};

const handleResetView = () => {
  emit("resetView");
  emit("close");
};

const handleSelectAll = () => {
  emit("selectAll");
  emit("close");
};

const handleClearCanvas = () => {
  emit("clearCanvas");
  emit("close");
};

// 节点操作
const handleEditNode = () => {
  if (props.targetNode) {
    emit("editNode", props.targetNode);
    emit("close");
  }
};

const handleCopyNode = () => {
  if (props.targetNode) {
    emit("copyNode", props.targetNode);
    emit("close");
  }
};

const handleDuplicateNode = () => {
  if (props.targetNode) {
    emit("duplicateNode", props.targetNode);
    emit("close");
  }
};

const handleDeleteNode = () => {
  if (props.targetNode) {
    emit("deleteNode", props.targetNode);
    emit("close");
  }
};

const handleToggleConnectable = () => {
  if (props.targetNode) {
    emit("toggleConnectable", props.targetNode);
    emit("close");
  }
};

// 连线操作
const handleEditEdge = () => {
  if (props.targetEdge) {
    emit("editEdge", props.targetEdge);
    emit("close");
  }
};

const handleDeleteEdge = () => {
  if (props.targetEdge) {
    emit("deleteEdge", props.targetEdge);
    emit("close");
  }
};

const handleToggleAnimation = () => {
  if (props.targetEdge) {
    emit("toggleAnimation", props.targetEdge);
    emit("close");
  }
};

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (
    menuRef.value &&
    event.target instanceof HTMLElement &&
    !menuRef.value.contains(event.target)
  ) {
    emit("close");
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("contextmenu", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("contextmenu", handleClickOutside);
});
</script>

<style scoped lang="scss">
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  padding: 6px 0;
  user-select: none;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 15%);
}

.menu-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;

  .el-icon {
    font-size: 16px;
    color: #409eff;
  }
}

.menu-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 16px;
    color: #909399;
  }

  span:nth-child(2) {
    flex: 1;
  }

  .shortcut {
    font-size: 11px;
    color: #c0c4cc;
  }

  &:hover {
    color: #409eff;
    background: #f5f7fa;

    .el-icon {
      color: #409eff;
    }
  }

  &.danger {
    color: #f56c6c;

    .el-icon {
      color: #f56c6c;
    }

    &:hover {
      color: #f56c6c;
      background: #fef0f0;

      .el-icon {
        color: #f56c6c;
      }
    }
  }

  &:active {
    background: #ecf5ff;
  }
}

.menu-divider {
  height: 1px;
  margin: 6px 0;
  background: #e4e7ed;
}

// 动画
.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition: all 0.15s ease;
}

.context-menu-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
}

.context-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

// 暗黑模式支持
.context-menu.dark {
  background: #2d3748;
  border-color: #4a5568;
  box-shadow: 0 4px 16px rgb(0 0 0 / 40%);

  .menu-header {
    color: #fffffb;
  }

  .menu-item {
    color: #e2e8f0;

    .el-icon {
      color: #a0aec0;
    }

    .shortcut {
      color: #718096;
    }

    &:hover {
      color: #409eff;
      background: #4a5568;

      .el-icon {
        color: #409eff;
      }
    }

    &.danger {
      color: #fc8181;

      .el-icon {
        color: #fc8181;
      }

      &:hover {
        color: #fc8181;
        background: #742a2a;

        .el-icon {
          color: #fc8181;
        }
      }
    }

    &:active {
      background: #2c5282;
    }
  }

  .menu-divider {
    background: #4a5568;
  }
}
</style>
