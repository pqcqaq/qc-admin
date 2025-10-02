<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium"> 附件管理 </span>
          <div class="buttons">
            <el-button type="success" :icon="Upload" @click="openUploadDialog">
              上传文件
            </el-button>
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增附件
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 附件表格组件 -->
      <AttachmentTable
        :data-list="dataList"
        :pagination="pagination"
        :loading="loading"
        @edit="openDialog('edit', $event)"
        @view="handleView"
        @delete="handleDelete"
        @download="handleDownload"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑对话框组件 -->
    <AttachmentDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :attachment-data="currentAttachment"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <AttachmentViewDialog
      v-model:visible="viewDialogVisible"
      :attachment-data="viewData"
    />

    <!-- 上传对话框组件 -->
    <UploadDialog
      v-model:visible="uploadDialogVisible"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus, Upload } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAttachmentListWithPagination,
  createAttachment,
  updateAttachment,
  deleteAttachment,
  getAttachmentURL,
  type Attachment
} from "qc-admin-api-common/attachment";
import {
  SearchForm,
  AttachmentTable,
  AttachmentDialog,
  AttachmentViewDialog,
  UploadDialog
} from "./components";

defineOptions({
  name: "SystemAttachment"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentAttachment = ref<Attachment>();

// 搜索表单数据
const searchParams = reactive({
  filename: "",
  contentType: "",
  storageProvider: "",
  status: "",
  tags: ""
});

// 查看数据
const viewData = ref<Attachment>({} as Attachment);

// 表格数据
const dataList = ref<Attachment[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 获取附件列表
const getTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchParams
    };
    const response = await getAttachmentListWithPagination(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取附件列表失败:", error);
    ElMessage.error("获取附件列表失败");
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
    filename: "",
    contentType: "",
    storageProvider: "",
    status: "",
    tags: ""
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
const openDialog = (type: "add" | "edit" = "add", row?: Attachment) => {
  dialogType.value = type;
  currentAttachment.value = row;
  dialogVisible.value = true;
};

// 打开上传对话框
const openUploadDialog = () => {
  uploadDialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createAttachment(formData);
      ElMessage.success("创建附件成功");
    } else {
      await updateAttachment(formData.id, formData);
      ElMessage.success("更新附件成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存附件失败:", error);
    ElMessage.error("保存附件失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看附件
const handleView = (row: Attachment) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 下载附件
const handleDownload = async (row: Attachment) => {
  try {
    const response = await getAttachmentURL(row.id);
    if (response.data.url) {
      const link = document.createElement("a");
      link.href = response.data.url;
      link.download = row.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      ElMessage.success("下载开始");
    } else {
      ElMessage.warning("无法获取下载链接");
    }
  } catch (error) {
    console.error("下载文件失败:", error);
    ElMessage.error("下载文件失败");
  }
};

// 删除附件
const handleDelete = async (row: Attachment) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${row.filename}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    loading.value = true;
    await deleteAttachment(row.id);
    ElMessage.success("删除附件成功");
    await getTableData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除附件失败:", error);
      ElMessage.error("删除附件失败");
    }
    loading.value = false;
  }
};

// 上传成功回调
const handleUploadSuccess = () => {
  ElMessage.success("文件上传成功");
  uploadDialogVisible.value = false;
  getTableData();
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
  gap: 8px;
}
</style>
