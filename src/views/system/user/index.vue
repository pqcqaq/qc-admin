<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium"> 用户管理 </span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增用户
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 用户表格组件 -->
      <UserTable
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
    <UserDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :user-data="currentUser"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <UserViewDialog v-model:visible="viewDialogVisible" :user-data="viewData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getUserListWithPagination,
  createUser,
  updateUser,
  deleteUser,
  type User
} from "qc-admin-api-common/user";
import {
  SearchForm,
  UserTable,
  UserDialog,
  UserViewDialog
} from "./components";

defineOptions({
  name: "SystemUser"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentUser = ref<User>();

// 搜索表单数据
const searchParams = reactive({
  name: "",
  sex: "",
  status: ""
});

// 查看数据
const viewData = ref<User>({} as User);

// 表格数据
const dataList = ref<User[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取用户列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchParams
    };
    const response = await getUserListWithPagination(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取用户列表失败:", error);
    ElMessage.error("获取用户列表失败");
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
    sex: "",
    status: ""
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
const openDialog = (type: "add" | "edit" = "add", row?: User) => {
  dialogType.value = type;
  currentUser.value = row;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createUser(formData);
      ElMessage.success("创建用户成功");
    } else {
      await updateUser(formData.id, formData);
      ElMessage.success("更新用户成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存用户失败:", error);
    ElMessage.error("保存用户失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看用户
const handleView = (row: User) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除用户
const handleDelete = async (row: User) => {
  try {
    loading.value = true;
    await deleteUser(row.id);
    ElMessage.success("删除用户成功");
    await getTableData();
  } catch (error) {
    console.error("删除用户失败:", error);
    ElMessage.error("删除用户失败");
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
