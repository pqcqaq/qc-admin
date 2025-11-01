<template>
  <el-collapse-item name="workflow-config">
    <template #title>
      <div class="section-title">
        <el-icon><Connection /></el-icon>
        <span>工作流配置</span>
      </div>
    </template>

    <el-form label-width="120px" label-position="top">
      <!-- 工作流应用选择 -->
      <el-form-item label="引用的工作流">
        <el-select
          :model-value="workflowApplicationId"
          placeholder="请选择要引用的工作流应用"
          style="width: 100%"
          filterable
          clearable
          :loading="loading"
          @change="handleWorkflowChange"
        >
          <el-option
            v-for="app in workflowApplications"
            :key="app.id"
            :label="app.name"
            :value="app.id"
          >
            <div class="workflow-option">
              <span class="workflow-name">{{ app.name }}</span>
              <el-tag
                v-if="app.status"
                :type="getStatusType(app.status)"
                size="small"
              >
                {{ getStatusLabel(app.status) }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
        <span class="form-hint">选择要在此节点中执行的工作流应用</span>
      </el-form-item>

      <!-- 选中的工作流详情 -->
      <div v-if="selectedWorkflow" class="workflow-details">
        <el-divider content-position="left">工作流详情</el-divider>

        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="名称">
            {{ selectedWorkflow.name }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedWorkflow.description"
            label="描述"
          >
            {{ selectedWorkflow.description }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedWorkflow.status)" size="small">
              {{ getStatusLabel(selectedWorkflow.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedWorkflow.version" label="版本">
            v{{ selectedWorkflow.version }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedWorkflow.createTime"
            label="创建时间"
          >
            {{ formatDate(selectedWorkflow.createTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 警告提示 -->
        <el-alert
          v-if="selectedWorkflow.status === 'draft'"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 12px"
        >
          <template #title> 此工作流尚未发布，可能会影响执行结果 </template>
        </el-alert>
      </div>

      <!-- 未选择工作流的提示 -->
      <el-alert
        v-else-if="!workflowApplicationId"
        type="info"
        :closable="false"
        show-icon
      >
        <template #title> 请选择要引用的工作流应用 </template>
      </el-alert>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { Node } from "@vue-flow/core";
import { Connection } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getWorkflowApplicationListWithPagination } from "qc-admin-api-common/workflow";
import type { WorkflowApplicationResponse } from "qc-admin-api-common/workflow";

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateData: [key: string, value: any];
}>();

// 工作流应用列表
const workflowApplications = ref<WorkflowApplicationResponse[]>([]);
const loading = ref(false);

// 当前选中的工作流应用 ID
const workflowApplicationId = computed(() => {
  return props.node.data.workflowApplicationId || "";
});

// 选中的工作流详情
const selectedWorkflow = computed(() => {
  if (!workflowApplicationId.value) return null;
  return workflowApplications.value.find(
    app => app.id === workflowApplicationId.value
  );
});

// 加载工作流应用列表
const loadWorkflowApplications = async () => {
  loading.value = true;
  try {
    const response = await getWorkflowApplicationListWithPagination({
      page: 1,
      pageSize: 1000 // 获取所有工作流应用
    });
    workflowApplications.value = response.data || [];
  } catch (error) {
    console.error("Failed to load workflow applications:", error);
    ElMessage.error("加载工作流应用列表失败");
  } finally {
    loading.value = false;
  }
};

// 处理工作流选择变化
const handleWorkflowChange = (value: string) => {
  emit("updateData", "workflowApplicationId", value);

  // 同时更新节点标签为选中的工作流名称
  const selectedApp = workflowApplications.value.find(app => app.id === value);
  if (selectedApp) {
    emit("updateData", "label", `工作流: ${selectedApp.name}`);
  }
};

// 获取状态类型
const getStatusType = (
  status: string
): "success" | "warning" | "info" | "danger" => {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "warning";
    case "archived":
      return "info";
    default:
      return "info";
  }
};

// 获取状态标签
const getStatusLabel = (status: string): string => {
  switch (status) {
    case "published":
      return "已发布";
    case "draft":
      return "草稿";
    case "archived":
      return "已归档";
    default:
      return status;
  }
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 组件挂载时加载工作流应用列表
onMounted(() => {
  loadWorkflowApplications();
});

// 监听节点变化，重新加载列表（可选）
watch(
  () => props.node.id,
  () => {
    // 如果需要在节点切换时重新加载，可以在这里调用
    // loadWorkflowApplications();
  }
);
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #667eea;
  }
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

.workflow-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .workflow-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.workflow-details {
  margin-top: 16px;

  .el-divider {
    margin: 12px 0;
  }

  :deep(.el-descriptions__label) {
    width: 80px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
