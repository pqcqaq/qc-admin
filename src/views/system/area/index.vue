<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium"> 地区管理 </span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增地区
            </el-button>
            <el-button type="success" :icon="Refresh" @click="getTableData">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 地区表格组件 -->
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
import { Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getAreaListWithPagination as getListApi,
  createArea as createApi,
  updateArea as updateApi,
  deleteArea as deleteApi,
  type Area,
  type GetAreasParams
} from "qc-admin-api-common/area";
import { SearchForm, Table, EditDialog, ViewDialog } from "./components";

defineOptions({
  name: "AreaManagement"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentRecord = ref<Area>();

// 搜索表单数据
const searchParams = reactive<GetAreasParams>({
  name: "",
  level: undefined,
  code: "",
  depth: undefined,
  parentId: ""
});

// 查看数据
const viewData = ref<Area>({} as Area);

// 表格数据
const dataList = ref<Area[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取地区列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params: GetAreasParams = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      order: "asc",
      orderBy: "depth",
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
    console.error("获取地区列表失败:", error);
    ElMessage.error("获取地区列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = (params: GetAreasParams) => {
  Object.assign(searchParams, params);
  pagination.currentPage = 1;
  getTableData();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchParams, {
    name: "",
    level: undefined,
    code: "",
    depth: undefined,
    parentId: ""
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
const openDialog = (type: "add" | "edit" = "add", row?: Area) => {
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
      ElMessage.success("创建地区成功");
    } else {
      await updateApi(formData.id, formData);
      ElMessage.success("更新地区成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存地区失败:", error);
    ElMessage.error("保存地区失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看地区
const handleView = (row: Area) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除地区
const handleDelete = async (row: Area) => {
  try {
    loading.value = true;
    await deleteApi(row.id);
    ElMessage.success("删除地区成功");
    await getTableData();
  } catch (error) {
    console.error("删除地区失败:", error);
    ElMessage.error("删除地区失败");
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

.buttons {
  display: flex;
  gap: 10px;
}
</style>
