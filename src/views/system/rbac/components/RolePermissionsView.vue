<template>
  <div class="role-permissions-view">
    <div class="view-header">
      <div class="header-left">
        <span class="view-title">
          {{ selectedRole ? `角色 "${selectedRole.name}" 的权限` : "所有权限" }}
        </span>
        <span v-if="pagination.total" class="permission-count">
          ({{ pagination.total }} 个权限)
        </span>
      </div>
      <div class="header-right">
        <el-button
          v-if="selectedRole"
          type="primary"
          :icon="Plus"
          size="small"
          @click="handleAddPermissions"
        >
          添加权限
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
        placeholder="搜索权限名称或描述"
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
        :data="permissionList"
        :loading="loading"
        stripe
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="selectedRole"
          type="selection"
          width="55"
          :selectable="isSelectable"
        />

        <el-table-column prop="name" label="权限名称" min-width="150" />

        <el-table-column prop="action" label="权限操作" width="120" />

        <el-table-column label="权限来源" width="150">
          <template #default="{ row }">
            <div class="permission-source">
              <el-tag
                v-if="row.source === 'inherit'"
                size="small"
                type="warning"
                class="source-tag"
              >
                继承自 {{ row.sourceRole?.name }}
              </el-tag>
              <el-tag
                v-else-if="row.source === 'direct'"
                size="small"
                type="success"
                class="source-tag"
              >
                直接分配
              </el-tag>
              <el-tag v-else size="small" type="info" class="source-tag">
                {{ row.source || "未知" }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- <el-table-column label="权限域" width="120">
          <template #default="{ row }">
            <span>{{ row.scope?.name || "暂无" }}</span>
          </template>
        </el-table-column> -->

        <el-table-column label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.description || "暂无描述" }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="分配时间" width="160">
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
              v-if="row.source === 'direct'"
              type="danger"
              size="small"
              text
              @click="handleRemovePermission(row)"
            >
              移除
            </el-button>
            <span v-else class="inherited-tip"> 继承权限 </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 批量操作工具栏 -->
    <div
      v-if="selectedRole && selectedPermissions.length"
      class="batch-toolbar"
    >
      <div class="toolbar-left">
        <span>已选择 {{ selectedPermissions.length }} 个权限</span>
      </div>
      <div class="toolbar-right">
        <el-button type="danger" size="small" @click="handleBatchRemove">
          批量移除
        </el-button>
      </div>
    </div>

    <!-- 添加权限对话框 -->
    <AddPermissionsDialog
      v-model:visible="addPermissionsDialogVisible"
      :role="selectedRole"
      :loading="addPermissionsLoading"
      @submit="handleAddPermissionsSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from "vue";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Role, Permission } from "@/api/rbac";
import { getAllPermissions } from "@/api/rbac";
import { getRoleWithPermissions, revokeRolePermission } from "@/api/rbac";
import AddPermissionsDialog from "./AddPermissionsDialog.vue";

interface RolePermission extends Permission {
  source?: string; // 权限来源：直接分配、角色继承
  sourceRole?: Role; // 来源角色
}

// 定义后端实际返回的数据结构
interface DirectPermissionItem {
  permission: Permission;
  source: string; // "直接分配"
  sourceRole: Role;
}

interface InheritedPermissionItem {
  permission: Permission;
  source: string; // "角色继承"
  sourceRole: Role;
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
const permissionList = ref<RolePermission[]>([]);
const selectedPermissions = ref<RolePermission[]>([]);
const addPermissionsDialogVisible = ref(false);
const addPermissionsLoading = ref(false);

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

// 判断是否可选择（只有直接分配的权限可以选择）
const isSelectable = (row: RolePermission) => {
  return row.source === "direct";
};

// 处理选择变化
const handleSelectionChange = (selection: RolePermission[]) => {
  selectedPermissions.value = selection;
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
    if (props.selectedRole) {
      // 获取指定角色的权限详情
      const response = await getRoleWithPermissions(props.selectedRole.id);
      const { directPermissions, inheritedPermissions } = response.data;

      // 合并直接权限和继承权限
      const allPermissions: RolePermission[] = [
        // 处理直接权限
        ...(directPermissions || []).map((item: any) => ({
          ...item.permission,
          source: item.source,
          sourceRole: item.sourceRole
        })),
        // 处理继承权限
        ...(inheritedPermissions || []).map((item: any) => ({
          ...item.permission,
          source: item.source,
          sourceRole: item.sourceRole
        }))
      ];

      // 根据搜索关键字过滤
      let filteredPermissions = allPermissions;
      if (searchParams.keyword) {
        const keyword = searchParams.keyword.toLowerCase();
        filteredPermissions = allPermissions.filter(
          p =>
            p.name.toLowerCase().includes(keyword) ||
            p.description?.toLowerCase().includes(keyword) ||
            p.action.toLowerCase().includes(keyword)
        );
      }

      // 手动分页
      pagination.total = filteredPermissions.length;
      const start = (pagination.currentPage - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      permissionList.value = filteredPermissions.slice(start, end);
    } else {
      // 获取所有权限
      const response = await getAllPermissions();
      let allPermissions = response.data || [];

      // 根据搜索关键字过滤
      if (searchParams.keyword) {
        const keyword = searchParams.keyword.toLowerCase();
        allPermissions = allPermissions.filter(
          p =>
            p.name.toLowerCase().includes(keyword) ||
            p.description?.toLowerCase().includes(keyword) ||
            p.action.toLowerCase().includes(keyword)
        );
      }

      // 手动分页
      pagination.total = allPermissions.length;
      const start = (pagination.currentPage - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      permissionList.value = allPermissions.slice(start, end);
    }
  } catch (error) {
    console.error("加载权限数据失败:", error);
    ElMessage.error("加载权限数据失败");
  }
};

// 刷新数据
const refreshData = () => {
  loadData();
  emit("refresh");
};

// 处理添加权限
const handleAddPermissions = () => {
  addPermissionsDialogVisible.value = true;
};

// 处理添加权限提交
const handleAddPermissionsSubmit = () => {
  addPermissionsDialogVisible.value = false;
  loadData();
};

// 处理移除单个权限
const handleRemovePermission = async (permission: RolePermission) => {
  if (!props.selectedRole || permission.source !== "direct") return;

  try {
    await ElMessageBox.confirm(
      `确定要从角色 "${props.selectedRole.name}" 中移除权限 "${permission.name}" 吗？`,
      "移除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await revokeRolePermission(props.selectedRole.id, permission.id);
    ElMessage.success("移除权限成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("移除权限失败:", error);
      ElMessage.error("移除权限失败");
    }
  }
};

// 处理批量移除
const handleBatchRemove = async () => {
  if (!props.selectedRole || !selectedPermissions.value.length) return;

  try {
    await ElMessageBox.confirm(
      `确定要从角色 "${props.selectedRole.name}" 中移除选中的 ${selectedPermissions.value.length} 个权限吗？`,
      "批量移除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    // 批量调用单个移除接口
    const promises = selectedPermissions.value.map(permission =>
      revokeRolePermission(props.selectedRole!.id, permission.id)
    );

    await Promise.all(promises);
    ElMessage.success("批量移除权限成功");
    selectedPermissions.value = [];
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量移除权限失败:", error);
      ElMessage.error("批量移除权限失败");
    }
  }
};

// 监听选中角色变化
watch(
  () => props.selectedRole,
  () => {
    pagination.currentPage = 1;
    selectedPermissions.value = [];
    loadData();
  },
  { immediate: true }
);

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.role-permissions-view {
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

      .permission-count {
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

    .permission-source {
      .source-tag {
        margin: 0;
      }
    }

    .inherited-tip {
      color: var(--el-text-color-placeholder);
      font-size: 12px;
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
