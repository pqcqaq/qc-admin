<template>
  <div class="flowapp-container">
    <!-- 应用列表视图 -->
    <Transition name="view-fade" mode="out-in">
      <ApplicationList
        v-if="!currentApplication"
        key="list-view"
        :applications="applications"
        :loading="loading"
        :pagination="pagination"
        @create="handleCreateApplication"
        @edit="handleEditApplication"
        @clone="handleCloneApplication"
        @delete="handleDeleteApplication"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <!-- 工作流编辑器视图 -->
      <div
        v-else
        key="editor-view"
        v-loading="loading"
        element-loading-text="正在加载应用数据..."
        class="editor-container"
      >
        <EditorToolbar
          :application-name="currentApplication.name"
          :has-unsaved-changes="hasUnsavedChanges"
          :saving="saving"
          :dark-mode="darkMode"
          :realtime-mode="realtimeMode"
          :loading="loading"
          @back="handleBackToList"
          @save="handleSaveWorkflow"
          @toggle-realtime="toggleRealtimeMode"
        />
        <WorkflowEditor v-model:dark-mode="darkMode" :workflow="workflow" />
      </div>
    </Transition>

    <!-- 创建/编辑应用对话框 -->
    <ApplicationDialog
      v-model:visible="applicationDialogVisible"
      :is-editing="isEditingApplication"
      :initial-data="applicationForm"
      :submitting="saving"
      @submit="handleSubmitApplication"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import type { WorkflowApplicationResponse } from "qc-admin-api-common/workflow";

// 导入组件
import ApplicationList from "./components/ApplicationList.vue";
import ApplicationDialog from "./components/ApplicationDialog.vue";
import EditorToolbar from "./components/EditorToolbar.vue";
import WorkflowEditor from "./components/WorkflowEditor.vue";

// 导入 composable
import { useWorkflowApplication } from "./composables/useWorkflowApplication";

// 使用 workflow application composable
const workflowApp = useWorkflowApplication();
const {
  currentApplication,
  applications,
  loading,
  saving,
  hasUnsavedChanges,
  realtimeMode,
  loadApplications,
  loadApplication,
  createApplication,
  updateApplicationInfo,
  deleteApplication,
  cloneApplication,
  saveWorkflow,
  toggleRealtimeMode,
  saveViewportIfChanged,
  workflow
} = workflowApp;

// 状态管理
const darkMode = ref(false);

// 分页状态
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
});

// 应用对话框状态
const applicationDialogVisible = ref(false);
const isEditingApplication = ref(false);
const applicationForm = ref({
  name: "",
  description: ""
});

/**
 * 应用列表操作
 */
async function handleCreateApplication() {
  isEditingApplication.value = false;
  applicationForm.value = {
    name: "",
    description: ""
  };
  applicationDialogVisible.value = true;
}

async function handleEditApplication(app: WorkflowApplicationResponse) {
  // 加载应用数据
  await loadApplication(app.id);
}

async function handleCloneApplication(app: WorkflowApplicationResponse) {
  await cloneApplication(app.id);
  await loadApplications();
}

async function handleDeleteApplication(app: WorkflowApplicationResponse) {
  await deleteApplication(app.id);
}

async function handleSubmitApplication(data: {
  name: string;
  description: string;
}) {
  if (isEditingApplication.value) {
    // 更新应用
    await updateApplicationInfo(currentApplication.value!.id, {
      ...data,
      startNodeId: currentApplication.value!.startNodeId
    });
  } else {
    // 创建应用 - 后端会自动创建默认开始节点
    const newApp = await createApplication({
      ...data,
      status: "draft",
      startNodeId: ""
    });
    if (newApp) {
      // 创建成功后加载应用（会加载后端创建的默认开始节点）
      await loadApplication(newApp.id);
    }
  }
  applicationDialogVisible.value = false;
}

async function handleBackToList() {
  // 返回列表前可以提示保存
  if (hasUnsavedChanges.value) {
    ElMessageBox.confirm("是否保存当前工作流？", "提示", {
      confirmButtonText: "保存",
      cancelButtonText: "不保存",
      distinguishCancelAndClose: true,
      type: "warning"
    })
      .then(async () => {
        await saveWorkflow();
        // 保存视口配置（如果发生变化）
        await saveViewportIfChanged();
        // 清空画布，让用户重新打开应用
        // 这样可以避免 Vue Flow 内部状态混乱导致的渲染问题
        workflow.clearCanvas(true);
        currentApplication.value = null;
      })
      .catch(async action => {
        if (action === "cancel") {
          // 保存视口配置（如果发生变化）
          await saveViewportIfChanged();
          currentApplication.value = null;
          // 清空画布，让用户重新打开应用
          // 这样可以避免 Vue Flow 内部状态混乱导致的渲染问题
          workflow.clearCanvas(true);
          currentApplication.value = null;
        }
      });
  } else {
    // 保存视口配置（如果发生变化）
    await saveViewportIfChanged();
    // 清空画布，让用户重新打开应用
    // 这样可以避免 Vue Flow 内部状态混乱导致的渲染问题
    workflow.clearCanvas(true);
    currentApplication.value = null;
  }
}

async function handleSaveWorkflow() {
  await saveWorkflow();
}

async function handlePageChange(page: number) {
  pagination.value.page = page;
  const result = await loadApplications({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  if (result) {
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  }
}

async function handleSizeChange(size: number) {
  pagination.value.pageSize = size;
  pagination.value.page = 1;
  const result = await loadApplications({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  if (result) {
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  }
}

// 在组件挂载后初始化
onMounted(async () => {
  // 加载应用列表
  const result = await loadApplications({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  if (result) {
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  }
});
</script>

<style lang="scss" scoped>
.flowapp-container {
  display: flex;
  flex-direction: column;
  width: calc(100% - 35px);
  height: calc(100% - 35px);
}

.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

/* 页面切换动画 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.3s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.view-fade-enter-to,
.view-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
