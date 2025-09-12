<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">角色管理</span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增角色
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 角色表格组件 -->
      <RoleTable
        :data-list="dataList"
        :pagination="pagination"
        :loading="loading"
        @edit="openDialog('edit', $event)"
        @view="handleView"
        @delete="handleDelete"
        @assign-permissions="handleAssignPermissions"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑对话框组件 -->
    <RoleDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :role-data="currentRole"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <RoleViewDialog v-model:visible="viewDialogVisible" :role-data="viewData" />

    <!-- 分配权限对话框组件 -->
    <AssignPermissionDialog
      v-model:visible="assignPermissionVisible"
      :role-data="currentRole"
      :loading="assignLoading"
      @submit="handleAssignPermissionsSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRolePermissions,
  type Role
} from "@/api/rbac";
import {
  SearchForm,
  RoleTable,
  RoleDialog,
  RoleViewDialog,
  AssignPermissionDialog
} from "./components";

defineOptions({
  name: "SystemRole"
});

const loading = ref(false);
const submitLoading = ref(false);
const assignLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const assignPermissionVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentRole = ref<Role>();

// 搜索表单数据
const searchParams = reactive({
  name: "",
  description: ""
});

// 查看数据
const viewData = ref<Role>({} as Role);

// 表格数据
const dataList = ref<Role[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取角色列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchParams
    };
    const response = await getRoles(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取角色列表失败:", error);
    ElMessage.error("获取角色列表失败");
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
    name: "",
    description: ""
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

// 打开对话框
const openDialog = (type: "add" | "edit" = "add", row?: Role) => {
  dialogType.value = type;
  currentRole.value = row;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createRole(formData);
      ElMessage.success("创建角色成功");
    } else {
      await updateRole(formData.id, formData);
      ElMessage.success("更新角色成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存角色失败:", error);
    ElMessage.error("保存角色失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看角色
const handleView = (row: Role) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除角色
const handleDelete = async (row: Role) => {
  try {
    loading.value = true;
    await deleteRole(row.id);
    ElMessage.success("删除角色成功");
    await getTableData();
  } catch (error) {
    console.error("删除角色失败:", error);
    ElMessage.error("删除角色失败");
    loading.value = false;
  }
};

// 分配权限
const handleAssignPermissions = (row: Role) => {
  currentRole.value = row;
  assignPermissionVisible.value = true;
};

// 分配权限提交
const handleAssignPermissionsSubmit = async (permissionIds: string[]) => {
  if (!currentRole.value) return;

  assignLoading.value = true;
  try {
    await assignRolePermissions(currentRole.value.id, { permissionIds });
    ElMessage.success("分配权限成功");
    assignPermissionVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("分配权限失败:", error);
    ElMessage.error("分配权限失败");
  } finally {
    assignLoading.value = false;
  }
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
