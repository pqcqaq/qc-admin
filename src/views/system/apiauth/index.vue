<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium"> 接口认证管理 </span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增接口认证
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 表格组件 -->
      <ApiAuthTable
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
    <ApiAuthDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :data="currentRecord"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <ApiAuthViewDialog v-model:visible="viewDialogVisible" :data="viewData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getAPIAuthListWithPagination,
  createAPIAuth,
  updateAPIAuth,
  deleteAPIAuth,
  type APIAuth
} from "qc-admin-api-common/api_auth";
import {
  SearchForm,
  ApiAuthTable,
  ApiAuthDialog,
  ApiAuthViewDialog
} from "./components";

defineOptions({
  name: "ApiAuthManagement"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentRecord = ref<APIAuth>();

// 搜索表单数据
const searchParams = reactive({
  name: "",
  method: "",
  path: "",
  isPublic: "",
  isActive: "",
  type: "http"
});

// 查看数据
const viewData = ref<APIAuth>({} as APIAuth);

// 表格数据
const dataList = ref<APIAuth[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      name: searchParams.name,
      method: searchParams.method,
      path: searchParams.path,
      isPublic:
        searchParams.isPublic === "true"
          ? true
          : searchParams.isPublic === "false"
            ? false
            : undefined,
      isActive:
        searchParams.isActive === "true"
          ? true
          : searchParams.isActive === "false"
            ? false
            : undefined,
      type: searchParams.type
    };
    const response = await getAPIAuthListWithPagination(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取接口列表失败:", error);
    ElMessage.error("获取接口列表失败");
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
const openDialog = (type: "add" | "edit" = "add", row?: APIAuth) => {
  dialogType.value = type;
  currentRecord.value = row;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createAPIAuth(formData);
      ElMessage.success("创建API权限成功");
    } else {
      await updateAPIAuth(formData.id, formData);
      ElMessage.success("更新API权限成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存接口认证失败:", error);
    ElMessage.error("保存接口认证失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看API权限
const handleView = (row: APIAuth) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除API权限
const handleDelete = async (row: APIAuth) => {
  try {
    loading.value = true;
    await deleteAPIAuth(row.id);
    ElMessage.success("删除API权限成功");
    await getTableData();
  } catch (error) {
    console.error("删除API权限失败:", error);
    ElMessage.error("删除API权限失败");
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
