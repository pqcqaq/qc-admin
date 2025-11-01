<template>
  <div class="application-list-view">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>工作流应用</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建应用
        </el-button>
      </div>
    </div>

    <!-- 应用列表 -->
    <div class="application-list dark:bg-dark">
      <el-table
        v-loading="loading"
        :data="applications"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="应用名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleClone(row)">
              克隆
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="currentPageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus } from "@element-plus/icons-vue";
import type { WorkflowApplicationResponse } from "qc-admin-api-common/workflow";

// Props
interface Props {
  applications: WorkflowApplicationResponse[];
  loading?: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

// Emits
const emit = defineEmits<{
  create: [];
  edit: [app: WorkflowApplicationResponse];
  clone: [app: WorkflowApplicationResponse];
  delete: [app: WorkflowApplicationResponse];
  pageChange: [page: number];
  sizeChange: [size: number];
}>();

// 本地分页状态（用于 v-model）
const currentPage = computed({
  get: () => props.pagination.page,
  set: value => emit("pageChange", value)
});

const currentPageSize = computed({
  get: () => props.pagination.pageSize,
  set: value => emit("sizeChange", value)
});

const total = computed(() => props.pagination.total);

// 工具函数
function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN");
}

// 事件处理
function handleCreate() {
  emit("create");
}

function handleEdit(app: WorkflowApplicationResponse) {
  emit("edit", app);
}

function handleClone(app: WorkflowApplicationResponse) {
  emit("clone", app);
}

function handleDelete(app: WorkflowApplicationResponse) {
  emit("delete", app);
}

function handlePageChange(page: number) {
  emit("pageChange", page);
}

function handleSizeChange(size: number) {
  emit("sizeChange", size);
}
</script>

<style lang="scss" scoped>
.application-list-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .toolbar-left {
      h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .application-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);

    :deep(.el-table) {
      flex: 1;
      overflow: auto;
    }

    .pagination {
      display: flex;
      flex-shrink: 0;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
