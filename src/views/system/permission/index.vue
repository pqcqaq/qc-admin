<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">权限管理</span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增权限
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 权限表格组件 -->
      <PermissionTable
        :data-list="dataList"
        :pagination="pagination"
        :loading="loading"
        @edit="openDialog('edit', $event)"
        @view="handleView"
        @delete="handleDelete"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑对话框组件 -->
    <PermissionDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :permission-data="currentPermission"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <PermissionViewDialog
      v-model:visible="viewDialogVisible"
      :permission-data="viewData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  type Permission
} from "@/api/rbac";
import {
  SearchForm,
  PermissionTable,
  PermissionDialog,
  PermissionViewDialog
} from "./components";

defineOptions({
  name: "SystemPermission"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentPermission = ref<Permission>();

// 搜索表单数据
const searchParams = reactive({
  name: "",
  action: "",
  description: "",
  scopeId: ""
});

// 查看数据
const viewData = ref<Permission>({} as Permission);

// 表格数据
const dataList = ref<Permission[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取权限列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchParams
    };
    const response = await getPermissions(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取权限列表失败:", error);
    ElMessage.error("获取权限列表失败");
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
    action: "",
    description: "",
    scopeId: ""
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
const openDialog = (type: "add" | "edit" = "add", row?: Permission) => {
  dialogType.value = type;
  currentPermission.value = row;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createPermission(formData);
      ElMessage.success("创建权限成功");
    } else {
      await updatePermission(formData.id, formData);
      ElMessage.success("更新权限成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存权限失败:", error);
    ElMessage.error("保存权限失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看权限
const handleView = (row: Permission) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除权限
const handleDelete = async (row: Permission) => {
  try {
    loading.value = true;
    await deletePermission(row.id);
    ElMessage.success("删除权限成功");
    await getTableData();
  } catch (error) {
    console.error("删除权限失败:", error);
    ElMessage.error("删除权限失败");
    loading.value = false;
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
