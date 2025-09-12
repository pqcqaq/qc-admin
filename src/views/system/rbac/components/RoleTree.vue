<template>
  <div class="role-tree">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :loading="loading"
      :expand-on-click-node="false"
      default-expand-all
      highlight-current
      node-key="id"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeRightClick"
    >
      <template #default="{ data }">
        <div class="tree-node">
          <el-icon class="node-icon">
            <User />
          </el-icon>
          <span class="node-label">{{ data.name }}</span>
          <span v-if="data.userCount !== undefined" class="node-count">
            ({{ data.userCount }})
          </span>
        </div>
      </template>
    </el-tree>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      :style="contextMenuStyle"
      class="context-menu"
      @click.stop
    >
      <div class="menu-item" @click="handleMenuCommand('edit')">
        <el-icon><Edit /></el-icon>
        <span>编辑角色</span>
      </div>
      <div class="menu-item" @click="handleMenuCommand('createChild')">
        <el-icon><Plus /></el-icon>
        <span>创建子角色</span>
      </div>
      <div
        v-if="contextMenuRole?.inheritsFrom?.length"
        class="menu-item"
        @click="handleMenuCommand('removeParent')"
      >
        <el-icon><Remove /></el-icon>
        <span>解除父角色依赖</span>
      </div>
      <div class="menu-item danger" @click="handleMenuCommand('delete')">
        <el-icon><Delete /></el-icon>
        <span>删除角色</span>
      </div>
    </div>
    <!-- 解除父角色依赖子菜单 -->
    <el-dialog
      v-model="removeParentDialogVisible"
      title="选择要解除的父角色"
      width="400px"
    >
      <div class="parent-roles-list">
        <el-button
          v-for="parentRole in contextMenuRole?.inheritsFrom"
          :key="parentRole.id"
          type="warning"
          plain
          class="parent-role-btn"
          @click="handleRemoveParentConfirm(parentRole)"
        >
          {{ parentRole.name }}
        </el-button>
      </div>
      <template #footer>
        <el-button @click="removeParentDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { User, Edit, Plus, Remove, Delete } from "@element-plus/icons-vue";
import type { Role } from "@/api/rbac";
import { getRoleTree } from "@/api/rbac";

interface TreeRole extends Role {
  children?: TreeRole[];
  userCount?: number;
}

interface Props {
  loading?: boolean;
}

interface Emits {
  (e: "role-select", role: Role | null): void;
  (e: "role-create"): void;
  (e: "role-edit", role: Role): void;
  (e: "role-delete", role: Role): void;
  (e: "create-child", parentRole: Role): void;
  (e: "remove-parent", role: Role, parentRole: Role): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<Emits>();

// 响应式数据
const treeRef = ref();
const contextMenuRef = ref();
const treeData = ref<TreeRole[]>([]);
const contextMenuTrigger = ref();
const contextMenuRole = ref<TreeRole | null>(null);
const removeParentDialogVisible = ref(false);
const showContextMenu = ref(false);
const contextMenuStyle = ref({});

// 树形组件配置
const treeProps = {
  children: "children",
  label: "name"
};

// 处理节点点击
const handleNodeClick = (data: TreeRole) => {
  emit("role-select", data);
};

// 处理节点右键点击
const handleNodeRightClick = (event: MouseEvent, data: TreeRole) => {
  event.preventDefault();
  event.stopPropagation();

  contextMenuRole.value = data;
  showContextMenu.value = true;

  contextMenuStyle.value = {
    position: "fixed",
    left: `${event.clientX}px`,
    top: `${event.clientY}px`,
    zIndex: 9999
  };
};

// 处理右键菜单命令
const handleMenuCommand = (command: string) => {
  if (!contextMenuRole.value) return;

  switch (command) {
    case "edit":
      emit("role-edit", contextMenuRole.value);
      break;
    case "createChild":
      emit("create-child", contextMenuRole.value);
      break;
    case "removeParent":
      if (contextMenuRole.value.inheritsFrom?.length === 1) {
        // 只有一个父角色，直接解除
        emit(
          "remove-parent",
          contextMenuRole.value,
          contextMenuRole.value.inheritsFrom[0]
        );
      } else if (contextMenuRole.value.inheritsFrom?.length > 1) {
        // 多个父角色，弹出选择框
        removeParentDialogVisible.value = true;
      }
      break;
    case "delete":
      emit("role-delete", contextMenuRole.value);
      break;
  }
};

// 处理解除父角色确认
const handleRemoveParentConfirm = (parentRole: Role) => {
  if (contextMenuRole.value) {
    emit("remove-parent", contextMenuRole.value, parentRole);
  }
  removeParentDialogVisible.value = false;
};

// 加载角色树数据
const loadTreeData = async () => {
  try {
    const response = await getRoleTree();
    treeData.value = response.data || [];
  } catch (error) {
    console.error("加载角色树失败:", error);
    treeData.value = [];
  }
};

// 刷新树数据
const refreshTree = async () => {
  await loadTreeData();
};

// 点击空白处关闭右键菜单
const handleDocumentClick = () => {
  showContextMenu.value = false;
};

// 暴露方法给父组件
defineExpose({
  refreshTree
});

onMounted(async () => {
  await loadTreeData();

  // 监听全局点击事件，关闭右键菜单
  document.addEventListener("click", handleDocumentClick);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style lang="scss" scoped>
.role-tree {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-tree) {
    background: transparent;
    flex: 1;
    overflow: auto;

    .el-tree-node {
      .el-tree-node__content {
        height: 42px;
        padding: 0 12px;
        border-radius: 6px;
        margin: 2px 0;
        transition: all 0.3s ease;

        &:hover {
          background-color: var(--el-fill-color-light);
          transform: translateX(2px);
        }

        &.is-current {
          background-color: var(--el-color-primary-light-9);
          border: 1px solid var(--el-color-primary-light-7);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }

      .el-tree-node__expand-icon {
        color: var(--el-color-primary);
        font-size: 14px;
      }
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 10px;
    min-width: 0; // 防止内容溢出

    .node-icon {
      color: var(--el-color-primary);
      flex-shrink: 0;
    }

    .node-label {
      flex: 1;
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-count {
      font-size: 12px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color);
      padding: 2px 8px;
      border-radius: 12px;
      flex-shrink: 0;
      min-width: 24px;
      text-align: center;
    }
  }

  .parent-roles-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .parent-role-btn {
      justify-content: flex-start;
    }
  }

  .context-menu {
    position: fixed;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
    padding: 8px 0;
    min-width: 150px;
    z-index: 9999;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      color: var(--el-text-color-primary);
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      &.danger {
        color: var(--el-color-danger);

        &:hover {
          background-color: var(--el-color-danger-light-9);
        }
      }

      .el-icon {
        margin-right: 10px;
        font-size: 16px;
        width: 16px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
