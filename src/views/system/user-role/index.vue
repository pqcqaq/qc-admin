<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">用户角色管理</span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openAssignDialog">
              分配角色
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 用户角色表格组件 -->
      <UserRoleTable
        :data-list="dataList"
        :pagination="pagination"
        :loading="loading"
        @revoke="handleRevoke"
        @view-user-roles="handleViewUserRoles"
        @view-role-users="handleViewRoleUsers"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 分配角色对话框 -->
    <AssignRoleDialog
      v-model:visible="assignDialogVisible"
      :loading="assignLoading"
      @submit="handleAssignSubmit"
    />

    <!-- 查看用户角色对话框 -->
    <UserRolesDialog
      v-model:visible="userRolesDialogVisible"
      :user-id="selectedUserId"
    />

    <!-- 查看角色用户对话框 -->
    <RoleUsersDialog
      v-model:visible="roleUsersDialogVisible"
      :role-id="selectedRoleId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  assignUserRole,
  revokeUserRole,
  getUserRoleList,
  type UserRole
} from "@/api/rbac";
import {
  SearchForm,
  UserRoleTable,
  AssignRoleDialog,
  UserRolesDialog,
  RoleUsersDialog
} from "./components";

defineOptions({
  name: "SystemUserRole"
});

const loading = ref(false);
const assignLoading = ref(false);
const assignDialogVisible = ref(false);
const userRolesDialogVisible = ref(false);
const roleUsersDialogVisible = ref(false);
const selectedUserId = ref("");
const selectedRoleId = ref("");

// 搜索表单数据
const searchParams = reactive({
  userId: "",
  roleId: ""
});

// 表格数据
const dataList = ref<UserRole[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取用户角色列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchParams
    };

    const response = await getUserRoleList(params);

    if (response.success) {
      dataList.value = response.data || [];
      pagination.total = response.pagination?.total || 0;
      pagination.pageSize = response.pagination?.pageSize || 10;
      pagination.currentPage = response.pagination?.page || 1;
    } else {
      ElMessage.error("获取用户角色列表失败");
    }
  } catch (error) {
    console.error("获取用户角色列表失败:", error);
    ElMessage.error("获取用户角色列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = (params: typeof searchParams) => {
  Object.assign(searchParams, params);
  pagination.currentPage = 1;
  getTableData();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchParams, {
    userId: "",
    roleId: ""
  });
  pagination.currentPage = 1;
  getTableData();
};

// 分页改变
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getTableData();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getTableData();
};

// 打开分配角色对话框
const openAssignDialog = () => {
  assignDialogVisible.value = true;
};

// 分配角色提交
const handleAssignSubmit = async (data: { userId: string; roleId: string }) => {
  assignLoading.value = true;
  try {
    await assignUserRole(data);
    ElMessage.success("分配角色成功");
    assignDialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("分配角色失败:", error);
    ElMessage.error("分配角色失败");
  } finally {
    assignLoading.value = false;
  }
};

// 撤销角色
const handleRevoke = async (row: UserRole) => {
  try {
    await ElMessageBox.confirm(`确定要撤销该用户的角色权限吗？`, "确认撤销", {
      type: "warning"
    });

    loading.value = true;
    await revokeUserRole(row.userId, row.roleId);
    ElMessage.success("撤销角色成功");
    await getTableData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("撤销角色失败:", error);
      ElMessage.error("撤销角色失败");
    }
    loading.value = false;
  }
};

// 查看用户角色
const handleViewUserRoles = (userId: string) => {
  selectedUserId.value = userId;
  userRolesDialogVisible.value = true;
};

// 查看角色用户
const handleViewRoleUsers = (roleId: string) => {
  selectedRoleId.value = roleId;
  roleUsersDialogVisible.value = true;
};

onMounted(() => {
  getTableData();
});
</script>

<style lang="scss" scoped>
.main {
  margin: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
