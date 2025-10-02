<template>
  <div class="role-specific-permissions-view">
    <div class="view-header">
      <div class="header-left">
        <span class="view-title"> 角色 "{{ selectedRole.name }}" 的权限 </span>
        <span v-if="pagination.total" class="permission-count">
          ({{ pagination.total }} 个权限)
        </span>
      </div>
      <div class="header-right">
        <el-button
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
          :loading="actualLoading"
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
      <ContextMenu @show="handlePermissionContextMenuShow">
        <template #menu="{ close }">
          <div v-if="currentContextPermission" class="context-menu-content">
            <MenuGroup title="权限操作">
              <MenuItem
                :icon="View"
                variant="primary"
                @click="handleMenuCommand('view', close)"
              >
                查看权限详情
              </MenuItem>
              <MenuItem
                v-if="currentContextPermission.source === 'direct'"
                :icon="Remove"
                variant="danger"
                @click="handleMenuCommand('remove', close)"
              >
                移除权限
              </MenuItem>
            </MenuGroup>
          </div>
        </template>

        <el-table
          :data="permissionList"
          :loading="actualLoading"
          stripe
          height="100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column
            type="selection"
            width="55"
            :selectable="isSelectable"
          />

          <el-table-column prop="name" label="权限名称" min-width="100" />

          <el-table-column prop="action" label="权限操作" width="220" />

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
                <el-tag
                  v-else-if="row.source === 'public'"
                  size="small"
                  type="info"
                  class="source-tag"
                >
                  公共权限
                </el-tag>
                <el-tag v-else size="small" type="info" class="source-tag">
                  {{ row.source || "未知" }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.description || "暂无描述" }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="分配时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
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
              <template v-else>
                <span v-if="row.source === 'inherit'" class="inherited-tip">
                  <el-tooltip
                    class="box-item"
                    effect="dark"
                    content="不可操作继承的权限"
                    placement="top-start"
                  >
                    继承权限
                  </el-tooltip>
                </span>
                <span v-else-if="row.source === 'public'" class="inherited-tip">
                  公共权限
                </span>
                <span v-else class="inherited-tip">不可操作</span>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </ContextMenu>
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
    <div v-if="selectedPermissions.length" class="batch-toolbar">
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
import { ref, reactive, watch, onMounted, computed } from "vue";
import { Plus, Refresh, Search, View, Remove } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ContextMenu, MenuItem, MenuGroup } from "@/components/Menu";
import type { Role, Permission } from "qc-admin-api-common/rbac";
import {
  getRoleWithPermissions,
  revokeRolePermission
} from "qc-admin-api-common/rbac";
import AddPermissionsDialog from "./AddPermissionsDialog.vue";

interface RolePermission extends Permission {
  source?: string; // 权限来源：直接分配、角色继承
  sourceRole?: Role; // 来源角色
}

interface Props {
  selectedRole: Role;
  loading?: boolean;
}

interface Emits {
  (e: "refresh"): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const emit = defineEmits<Emits>();

// 响应式数据
const permissionList = ref<RolePermission[]>([]);
const selectedPermissions = ref<RolePermission[]>([]);
const addPermissionsDialogVisible = ref(false);
const internalLoading = ref(false);

// 计算实际的loading状态（内部loading或父组件传入的loading）
const actualLoading = computed(() => props.loading || internalLoading.value);

// 右键菜单相关
const currentContextPermission = ref<RolePermission | null>(null);

// 右键菜单显示处理
const handlePermissionContextMenuShow = (data: {
  event: MouseEvent;
  targetRef: HTMLElement;
  contextData: any;
}) => {
  const target = data.contextData.target as HTMLElement;
  const row = target.closest("tr");

  if (row && row.parentNode) {
    // 查找tbody中的所有tr元素（排除thead）
    const tbody = row.closest("tbody");
    if (tbody) {
      const dataRows = Array.from(tbody.querySelectorAll("tr"));
      const index = dataRows.indexOf(row);

      if (index >= 0 && index < permissionList.value.length) {
        currentContextPermission.value = permissionList.value[index];
        console.log(
          "Selected permission:",
          currentContextPermission.value,
          "at index:",
          index
        );
      }
    }
  }
};

// 菜单命令处理
const handleMenuCommand = async (command: string, close: () => void) => {
  if (!currentContextPermission.value) return;

  close();
  const permission = currentContextPermission.value;

  switch (command) {
    case "view":
      ElMessage.info(`查看权限：${permission.name}`);
      break;
    case "remove":
      if (permission.source === "direct") {
        try {
          await ElMessageBox.confirm(
            `确定要移除权限 "${permission.name}" 吗？`,
            "确认操作",
            {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning"
            }
          );
          await revokeRolePermission(props.selectedRole.id, permission.id);
          ElMessage.success("权限移除成功");
          await loadData();
        } catch (error: any) {
          if (error !== "cancel") {
            ElMessage.error("权限移除失败");
          }
        }
      }
      break;
  }

  currentContextPermission.value = null;
};
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
    internalLoading.value = true;
    // 获取指定角色的权限详情
    const response = await getRoleWithPermissions(props.selectedRole.id);
    const { publicPermissions, directPermissions, inheritedPermissions } =
      response.data;

    // 合并直接权限和继承权限
    const allPermissions: RolePermission[] = [
      // 处理公共权限
      ...(publicPermissions || []).map((item: any) => ({
        ...item.permission,
        source: "public",
        sourceRole: null
      })),
      // 处理直接权限
      ...(directPermissions || []).map((item: any) => ({
        ...item.permission,
        source: "direct",
        sourceRole: item.sourceRole
      })),
      // 处理继承权限
      ...(inheritedPermissions || []).map((item: any) => ({
        ...item.permission,
        source: "inherit",
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
  } catch (error) {
    console.error("加载权限数据失败:", error);
    ElMessage.error("加载权限数据失败");
  } finally {
    internalLoading.value = false;
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
  if (permission.source !== "direct") return;

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
  if (!selectedPermissions.value.length) return;

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
      revokeRolePermission(props.selectedRole.id, permission.id)
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
.role-specific-permissions-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  overflow: hidden; // 防止内容溢出

  .view-header {
    display: flex;
    flex-shrink: 0; // 防止header被压缩
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      gap: 8px;
      align-items: center;

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
    flex-shrink: 0; // 防止搜索栏被压缩
    margin-bottom: 16px;

    .el-input {
      width: 100%;
      max-width: 400px;
    }
  }

  .table-container {
    flex: 1;
    min-height: 0; // 确保可以正确收缩
    overflow: hidden;

    .permission-source {
      .source-tag {
        margin: 0;
      }
    }

    .inherited-tip {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }

  .pagination-container {
    display: flex;
    flex-shrink: 0; // 防止分页被压缩
    justify-content: center;
    margin-top: 16px;
  }

  .batch-toolbar {
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-top: 16px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9),
      var(--el-color-primary-light-8)
    );
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);

    .toolbar-left {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-color-primary);
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
