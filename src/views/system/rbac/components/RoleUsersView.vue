<template>
  <div class="role-users-view">
    <div class="view-header">
      <div class="header-left">
        <span class="view-title">
          {{
            selectedRole
              ? `角色 "${selectedRole.name}" 的用户 (${pagination.total || 0} 个)`
              : `所有用户 (${pagination.total || 0} 个)`
          }}
        </span>
      </div>
      <div class="header-right">
        <el-button
          v-if="selectedRole"
          type="primary"
          :icon="Plus"
          size="small"
          @click="handleAddUsers"
        >
          添加用户
        </el-button>
        <el-button
          :icon="Refresh"
          size="small"
          :loading="loading"
          @click="refreshData"
        >
          刷新
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchParams.keyword"
        placeholder="搜索用户名或昵称"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
    </div>

    <div class="table-container">
      <el-table
        :data="userList"
        :loading="loading"
        stripe
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="selectedRole" type="selection" width="55" />

        <el-table-column prop="id" label="用户ID" width="120" />

        <el-table-column prop="name" label="用户名" width="120" />

        <el-table-column prop="nickname" label="昵称" min-width="120" />

        <el-table-column label="其他角色" min-width="200">
          <template #default="{ row }">
            <div class="roles-tags">
              <el-tag
                v-for="role in row.otherRoles"
                :key="role.id"
                size="small"
                type="info"
                class="role-tag"
              >
                {{ role.name }}
              </el-tag>
              <span v-if="!row.otherRoles?.length" class="no-roles">
                无其他角色
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="加入时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column
          v-if="selectedRole"
          label="操作"
          width="120"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              text
              @click="handleRemoveUser(row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[1, 10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedRole && selectedUsers.length" class="batch-toolbar">
      <div class="toolbar-left">
        <span>已选择 {{ selectedUsers.length }} 个用户</span>
      </div>
      <div class="toolbar-right">
        <el-button type="danger" size="small" @click="handleBatchRemove">
          批量移除
        </el-button>
      </div>
    </div>

    <!-- 添加用户对话框 -->
    <AddUsersDialog
      v-model:visible="addUsersDialogVisible"
      :role="selectedRole"
      :loading="addUsersLoading"
      @submit="handleAddUsersSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from "vue";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Role } from "@/api/rbac";
import { getUserListWithPagination } from "@/api/user";
import {
  getRoleUsersWithPagination,
  batchRemoveUsersFromRole,
  revokeUserRole
} from "@/api/rbac";
import AddUsersDialog from "./AddUsersDialog.vue";

interface RoleUser {
  id: string;
  name: string;
  nickname?: string;
  otherRoles?: Role[];
  createTime: string;
}

interface Props {
  selectedRole?: Role | null;
  loading?: boolean;
}

interface Emits {
  (e: "refresh"): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedRole: null,
  loading: false
});

const emit = defineEmits<Emits>();

// 响应式数据
const userList = ref<RoleUser[]>([]);
const selectedUsers = ref<RoleUser[]>([]);
const addUsersDialogVisible = ref(false);
const addUsersLoading = ref(false);

// 搜索参数
const searchParams = reactive({
  keyword: ""
});

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 计算属性
const loading = computed(() => props.loading);

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return "暂无时间";
  try {
    // 处理 "2025-09-12 19:38:30" 格式的时间
    const date = new Date(time.replace(" ", "T"));
    if (isNaN(date.getTime())) {
      return "无效时间";
    }
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch (error) {
    console.error("时间格式化错误:", error);
    return "时间格式错误";
  }
};

// 处理选择变化
const handleSelectionChange = (selection: RoleUser[]) => {
  selectedUsers.value = selection;
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  loadData();
};

// 处理分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadData();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadData();
};

// 加载数据
const loadData = async () => {
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchParams.keyword
    };

    let response;
    if (props.selectedRole) {
      // 获取指定角色的用户
      response = await getRoleUsersWithPagination(
        props.selectedRole.id,
        params
      );
    } else {
      // 获取所有用户
      response = await getUserListWithPagination(params);
    }

    userList.value = response.data || [];
    if (response.pagination) {
      pagination.total = response.pagination.total;
      pagination.currentPage = response.pagination.page;
      pagination.pageSize = response.pagination.pageSize;
    }
  } catch (error) {
    console.error("加载用户数据失败:", error);
    ElMessage.error("加载用户数据失败");
  }
};

// 刷新数据
const refreshData = () => {
  loadData();
  emit("refresh");
};

// 处理添加用户
const handleAddUsers = () => {
  addUsersDialogVisible.value = true;
};

// 处理添加用户提交
const handleAddUsersSubmit = () => {
  addUsersDialogVisible.value = false;
  loadData();
};

// 处理移除单个用户
const handleRemoveUser = async (user: RoleUser) => {
  if (!props.selectedRole) return;

  try {
    await ElMessageBox.confirm(
      `确定要将用户 "${user.name}" 从角色 "${props.selectedRole.name}" 中移除吗？`,
      "移除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await revokeUserRole(user.id, props.selectedRole.id);
    ElMessage.success("移除用户成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("移除用户失败:", error);
      ElMessage.error("移除用户失败");
    }
  }
};

// 处理批量移除
const handleBatchRemove = async () => {
  if (!props.selectedRole || !selectedUsers.value.length) return;

  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedUsers.value.length} 个用户从角色 "${props.selectedRole.name}" 中移除吗？`,
      "批量移除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const userIds = selectedUsers.value.map(user => user.id);
    await batchRemoveUsersFromRole(props.selectedRole.id, { userIds });
    ElMessage.success("批量移除用户成功");
    selectedUsers.value = [];
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量移除用户失败:", error);
      ElMessage.error("批量移除用户失败");
    }
  }
};

// 监听选中角色变化
watch(
  () => props.selectedRole,
  () => {
    pagination.currentPage = 1;
    selectedUsers.value = [];
    loadData();
  },
  { immediate: true }
);

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.role-users-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden; // 防止内容溢出

  .view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-shrink: 0; // 防止header被压缩

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .view-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .user-count {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  .search-bar {
    margin-bottom: 16px;
    flex-shrink: 0; // 防止搜索栏被压缩

    .el-input {
      width: 100%;
      max-width: 400px;
    }
  }

  .table-container {
    flex: 1;
    overflow: hidden;
    min-height: 0; // 确保可以正确收缩

    .roles-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .role-tag {
        margin: 0;
      }

      .no-roles {
        color: var(--el-text-color-placeholder);
        font-style: italic;
      }
    }
  }

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: center;
    flex-shrink: 0; // 防止分页被压缩
  }

  .batch-toolbar {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9),
      var(--el-color-primary-light-8)
    );
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    z-index: 100;

    .toolbar-left {
      font-size: 14px;
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
