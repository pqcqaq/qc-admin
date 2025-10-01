<template>
  <div class="rbac-management">
    <el-card shadow="never" class="rbac-card">
      <template #header>
        <div class="card-header">
          <span class="font-medium">RBAC 权限管理</span>
        </div>
      </template>

      <div class="rbac-content">
        <!-- 左侧角色树 -->
        <div class="left-panel">
          <div class="panel-header">
            <span class="panel-title">角色树</span>
            <el-button
              type="primary"
              size="small"
              :icon="Plus"
              @click="handleCreateRootRole"
            >
              新增根角色
            </el-button>
          </div>
          <div class="tree-container">
            <RoleTree
              ref="roleTreeRef"
              :loading="treeLoading"
              @role-select="handleRoleSelect"
              @role-create="handleRoleCreate"
              @role-edit="handleRoleEdit"
              @role-delete="handleRoleDelete"
              @create-child="handleCreateChild"
              @remove-parent="handleRemoveParent"
            />
          </div>
        </div>

        <div class="right-panel">
          <el-tabs v-model="activeTab" class="panel-tabs">
            <!-- 用户视图 -->
            <el-tab-pane label="用户视图" name="users">
              <AllUsersView
                v-if="!selectedRole"
                :loading="usersLoading"
                @refresh="refreshRoleUsers"
              />
              <RoleSpecificUsersView
                v-else
                :selected-role="selectedRole"
                :loading="usersLoading"
                @refresh="refreshRoleUsers"
              />
            </el-tab-pane>

            <!-- 权限视图 -->
            <el-tab-pane label="权限视图" name="permissions">
              <AllPermissionsView
                v-if="!selectedRole"
                :loading="permissionsLoading"
                @refresh="refreshRolePermissions"
              />
              <RoleSpecificPermissionsView
                v-else
                :selected-role="selectedRole"
                :loading="permissionsLoading"
                @refresh="refreshRolePermissions"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-card>

    <!-- 角色创建/编辑对话框 -->
    <RoleFormDialog
      v-model:visible="roleDialogVisible"
      :type="roleDialogType"
      :role-data="currentRole"
      :parent-role="parentRole"
      :loading="roleFormLoading"
      @submit="handleRoleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Role } from "@/api/rbac";
import {
  getRoleTree,
  createRole,
  createChildRole,
  updateRole,
  deleteRole,
  removeParentRole
} from "@/api/rbac";
import {
  RoleTree,
  RoleFormDialog,
  AllUsersView,
  RoleSpecificUsersView,
  AllPermissionsView,
  RoleSpecificPermissionsView
} from "./components";

defineOptions({
  name: "RbacManagement"
});

// 响应式数据
const activeTab = ref("users");
const selectedRole = ref<Role | null>(null);
const treeLoading = ref(false);
const usersLoading = ref(false);
const permissionsLoading = ref(false);
const roleFormLoading = ref(false);

// 角色对话框
const roleDialogVisible = ref(false);
const roleDialogType = ref<"create" | "edit" | "createChild">("create");
const currentRole = ref<Role | null>(null);
const parentRole = ref<Role | null>(null);

// 组件引用
const roleTreeRef = ref();

// 处理角色选择
const handleRoleSelect = (role: Role | null) => {
  // 如果已经选中，则取消选中
  if (selectedRole.value?.id === role?.id) {
    selectedRole.value = null;
    // 清除树形组件的选中高亮状态
    roleTreeRef.value?.clearSelection();
    return;
  }
  selectedRole.value = role;
  // 移除了强制重置tab的逻辑，保持用户当前选择的标签页
};

// 处理创建根角色
const handleCreateRootRole = () => {
  roleDialogType.value = "create";
  currentRole.value = null;
  parentRole.value = null;
  roleDialogVisible.value = true;
};

// 处理角色创建
const handleRoleCreate = () => {
  roleDialogType.value = "create";
  currentRole.value = null;
  parentRole.value = null;
  roleDialogVisible.value = true;
};

// 处理角色编辑
const handleRoleEdit = (role: Role) => {
  roleDialogType.value = "edit";
  currentRole.value = role;
  parentRole.value = null;
  roleDialogVisible.value = true;
};

// 处理创建子角色
const handleCreateChild = (parentRoleData: Role) => {
  roleDialogType.value = "createChild";
  currentRole.value = null;
  parentRole.value = parentRoleData;
  roleDialogVisible.value = true;
};

// 处理角色删除
const handleRoleDelete = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deleteRole(role.id);
    ElMessage.success("删除角色成功");

    // 如果删除的是当前选中的角色，清空选中状态
    if (selectedRole.value?.id === role.id) {
      selectedRole.value = null;
      // 清除树形组件的选中高亮状态
      roleTreeRef.value?.clearSelection();
    }

    // 刷新角色树
    await roleTreeRef.value?.refreshTree();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除角色失败:", error);
      ElMessage.error("删除角色失败");
    }
  }
};

// 处理解除父角色依赖
const handleRemoveParent = async (role: Role, parentRoleData: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要解除角色 "${role.name}" 对 "${parentRoleData.name}" 的继承关系吗？`,
      "解除继承确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await removeParentRole(role.id, parentRoleData.id);
    ElMessage.success("解除继承关系成功");

    // 刷新角色树和右侧内容
    await roleTreeRef.value?.refreshTree();
    if (selectedRole.value?.id === role.id) {
      refreshRolePermissions();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("解除继承关系失败:", error);
      ElMessage.error("解除继承关系失败");
    }
  }
};

// 处理角色表单提交
const handleRoleSubmit = async (formData: any) => {
  roleFormLoading.value = true;
  try {
    if (roleDialogType.value === "create") {
      await createRole(formData);
      ElMessage.success("创建角色成功");
    } else if (roleDialogType.value === "createChild" && parentRole.value) {
      console.log("创建子角色 - 父角色信息:", parentRole.value);
      console.log("创建子角色 - 父角色ID:", parentRole.value.id);
      await createChildRole(parentRole.value.id, formData);
      ElMessage.success("创建子角色成功");
    } else if (roleDialogType.value === "edit" && currentRole.value) {
      await updateRole(currentRole.value.id, formData);
      ElMessage.success("更新角色成功");
    }

    roleDialogVisible.value = false;
    await roleTreeRef.value?.refreshTree();
  } catch (error) {
    console.error("保存角色失败:", error);
    ElMessage.error("保存角色失败");
  } finally {
    roleFormLoading.value = false;
  }
};

// 刷新角色用户
const refreshRoleUsers = () => {
  // 触发用户视图组件刷新
};

// 刷新角色权限
const refreshRolePermissions = () => {
  // 触发权限视图组件刷新
};

onMounted(async () => {
  // 初始化加载
});
</script>

<style lang="scss" scoped>
.rbac-management {
  height: calc(100vh - 160px);
  margin: 20px;

  // 响应式布局
  @media (width <= 1200px) {
    .left-panel {
      width: 280px;
      min-width: 280px;
      max-width: 280px;
    }
  }

  @media (width <= 768px) {
    height: calc(100vh - 120px);
    margin: 10px;

    .rbac-content {
      flex-direction: column;
    }

    .left-panel {
      width: 100%;
      min-width: auto;
      max-width: none;
      height: 300px;
      border-right: none;
      border-bottom: 1px solid var(--el-border-color-light);
    }
  }

  .rbac-card {
    height: 100%;

    :deep(.el-card__body) {
      height: calc(100% - 60px);
      padding: 0;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .rbac-content {
    display: flex;
    height: 100%;
    min-height: 0; // 防止flex子项撑开容器
  }

  .left-panel {
    display: flex;
    flex-direction: column;
    width: 320px;
    min-width: 320px; // 防止压缩
    max-width: 320px; // 防止拉伸
    border-right: 1px solid var(--el-border-color-light);

    .panel-header {
      display: flex;
      flex-shrink: 0; // 防止header被压缩
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background-color: var(--el-fill-color-lighter);
      border-bottom: 1px solid var(--el-border-color-light);

      .panel-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .tree-container {
      flex: 1;
      min-height: 0; // 确保可以滚动
      padding: 8px;
      overflow: auto;
    }
  }

  .right-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0; // 允许收缩，但防止内容溢出

    .panel-tabs {
      height: 100%;

      :deep(.el-tabs__header) {
        padding: 0 16px;
        margin: 0;
        background-color: var(--el-fill-color-extra-light);
        border-bottom: 1px solid var(--el-border-color-light);
      }

      :deep(.el-tabs__nav-wrap) {
        padding: 0;
      }

      :deep(.el-tabs__content) {
        height: calc(100% - 54px);
        padding: 0;
        overflow: hidden; // 防止内容溢出
      }

      :deep(.el-tab-pane) {
        height: 100%;
        overflow: hidden; // 防止内容溢出
      }
    }
  }
}
</style>
