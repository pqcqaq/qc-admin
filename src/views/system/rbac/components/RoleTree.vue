<template>
  <div class="role-tree">
    <ContextMenu @show="handleContextMenuShow">
      <template #menu="{ close }">
        <div v-if="currentContextRole" class="context-menu-content">
          <MenuGroup title="角色操作">
            <MenuItem
              :icon="Edit"
              variant="warning"
              @click="handleMenuCommand('edit', close)"
            >
              编辑角色
            </MenuItem>
            <MenuItem
              :icon="Plus"
              variant="success"
              @click="handleMenuCommand('createChild', close)"
            >
              创建子角色
            </MenuItem>
            <MenuItem
              v-if="currentContextRole.inheritsFrom?.length"
              :icon="Remove"
              variant="primary"
              @click="handleMenuCommand('removeParent', close)"
            >
              解除父角色依赖
            </MenuItem>
          </MenuGroup>

          <MenuDivider />

          <MenuItem
            :icon="Delete"
            variant="danger"
            @click="handleMenuCommand('delete', close)"
          >
            删除角色
          </MenuItem>
        </div>
      </template>
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
      >
        <template #default="{ data }">
          <div class="tree-node" :data-role-id="data.id">
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
    </ContextMenu>
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
import { ref, onMounted } from "vue";
import { User, Edit, Plus, Remove, Delete } from "@element-plus/icons-vue";
import type { Role } from "qc-admin-api-common/rbac";
import { getRoleTree } from "qc-admin-api-common/rbac";
import { ElTree } from "element-plus";
import { ContextMenu } from "@/components/Menu";
import { MenuItem, MenuDivider, MenuGroup } from "@/components/Menu";

interface TreeRole extends Role {
  children?: TreeRole[];
  inheritsFrom?: Role[];
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
const treeRef = ref<InstanceType<typeof ElTree>>();
const treeData = ref<TreeRole[]>([]);
const contextMenuRole = ref<TreeRole | null>(null);
const currentContextRole = ref<TreeRole | null>(null);
const removeParentDialogVisible = ref(false);

// 树形组件配置
const treeProps = {
  children: "children",
  label: "name"
};

// 处理节点点击
const handleNodeClick = (data: TreeRole) => {
  emit("role-select", data);
};

// 处理右键菜单显示
const handleContextMenuShow = (data: {
  event: MouseEvent;
  targetRef: any;
  contextData: any;
}) => {
  const { contextData } = data;

  // 通过DOM元素找到对应的角色数据
  const target = contextData.target as HTMLElement;
  const roleElement = target.closest("[data-role-id]") as HTMLElement;

  if (roleElement) {
    const roleId = roleElement.getAttribute("data-role-id");
    const role = findRoleById(treeData.value, roleId);

    if (role) {
      currentContextRole.value = role;
      contextMenuRole.value = role;
    }
  }
};

// 根据ID查找角色
const findRoleById = (roles: TreeRole[], id: string): TreeRole | null => {
  for (const role of roles) {
    if (role.id === id) return role;
    if (role.children) {
      const found = findRoleById(role.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 处理右键菜单命令
const handleMenuCommand = (command: string, closeMenu?: () => void) => {
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

  // 关闭菜单
  if (closeMenu) {
    closeMenu();
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

// 清除树形组件的选中状态
const clearSelection = () => {
  if (treeRef.value) {
    treeRef.value.setCurrentKey(null);
  }
};

// 暴露方法给父组件
defineExpose({
  refreshTree,
  clearSelection
});

onMounted(async () => {
  await loadTreeData();
});
</script>

<style lang="scss" scoped>
.role-tree {
  display: flex;
  flex-direction: column;
  height: 100%;

  :deep(.el-tree) {
    flex: 1;
    overflow: auto;
    background: transparent;

    .el-tree-node {
      .el-tree-node__content {
        height: 42px;
        padding: 0 12px;
        margin: 2px 0;
        border-radius: 6px;
        transition: all 0.3s ease;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        &.is-current {
          background-color: var(--el-color-primary-light-9);
          border: 1px solid var(--el-color-primary-light-7);
          box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
        }
      }

      .el-tree-node__expand-icon {
        font-size: 14px;
        color: var(--el-color-primary);
      }
    }
  }

  .tree-node {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: center;
    min-width: 0; // 防止内容溢出

    .node-icon {
      flex-shrink: 0;
      color: var(--el-color-primary);
    }

    .node-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }

    .node-count {
      flex-shrink: 0;
      min-width: 24px;
      padding: 2px 8px;
      font-size: 12px;
      color: var(--el-text-color-regular);
      text-align: center;
      background: var(--el-fill-color);
      border-radius: 12px;
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

  // 自定义右键菜单样式
  .context-menu-content {
    .context-menu-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(.context-menu-item--divider) {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &.context-menu-item--danger {
        color: var(--el-color-danger);

        &:hover {
          color: var(--el-color-danger);
          background: var(--el-color-danger-light-9);
        }
      }

      &.context-menu-item--divider {
        height: 1px;
        padding: 0;
        margin: 4px 0;
        cursor: default;
        background: var(--el-border-color-light);
      }

      .context-menu-icon {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        margin-right: 8px;
        font-size: 16px;
      }

      .context-menu-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
