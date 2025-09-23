<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium"> 日志管理 </span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增日志
            </el-button>
            <el-button type="success" :icon="Download" @click="handleExport">
              导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 日志表格组件 -->
      <Table
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
    <EditDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :data="currentRecord"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <ViewDialog v-model:visible="viewDialogVisible" :data="viewData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getClientDeviceListWithPagination as getListApi,
  createClientDevice as createApi,
  updateClientDevice as updateApi,
  deleteClientDevice as deleteApi,
  exportClientDevicesToExcel as exportApi,
  type ClientDevice,
  type ClientDevicePageRequest
} from "@/api/client_devices";
import { SearchForm, Table, EditDialog, ViewDialog } from "./components";

defineOptions({
  name: "LoggingManagement"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentRecord = ref<ClientDevice>();

// 搜索表单数据
const searchParams = reactive<ClientDevicePageRequest>({
  name: "",
  code: "",
  enabled: true,
  anonymous: false,
  order: "desc",
  orderBy: "create_time",
  beginTime: "",
  endTime: ""
});

// 查看数据
const viewData = ref<ClientDevice>({} as ClientDevice);

// 表格数据
const dataList = ref<ClientDevice[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取日志列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params: ClientDevicePageRequest = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      order: "desc",
      orderBy: "create_time",
      ...searchParams
    };

    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await getListApi(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取日志列表失败:", error);
    ElMessage.error("获取日志列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = (params: ClientDevicePageRequest) => {
  Object.assign(searchParams, params);
  pagination.currentPage = 1;
  getTableData();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchParams, {
    level: "",
    type: "",
    message: "",
    method: "",
    path: "",
    ip: "",
    code: undefined,
    beginTime: "",
    endTime: ""
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
const openDialog = (type: "add" | "edit" = "add", row?: ClientDevice) => {
  dialogType.value = type;
  currentRecord.value = row;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createApi(formData);
      ElMessage.success("创建日志记录成功");
    } else {
      await updateApi(formData.id, formData);
      ElMessage.success("更新日志记录成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存日志记录失败:", error);
    ElMessage.error("保存日志记录失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看日志记录
const handleView = (row: ClientDevice) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除日志记录
const handleDelete = async (row: ClientDevice) => {
  try {
    loading.value = true;
    await deleteApi(row.id);
    ElMessage.success("删除日志记录成功");
    await getTableData();
  } catch (error) {
    console.error("删除日志记录失败:", error);
    ElMessage.error("删除日志记录失败");
    loading.value = false;
  }
};

// 导出Excel
const handleExport = async () => {
  try {
    loading.value = true;
    const params = {
      ...searchParams,
      page: 1,
      pageSize: 10000, // 导出大量数据
      order: "desc",
      orderBy: "create_time"
    } satisfies ClientDevicePageRequest;

    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await exportApi(params);

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `日志记录_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success("导出成功");
  } catch (error) {
    console.error("导出日志记录失败:", error);
    ElMessage.error("导出日志记录失败");
  } finally {
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
