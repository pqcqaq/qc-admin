<template>
  <el-dialog
    :model-value="visible"
    title="添加权限到角色"
    width="800px"
    :before-close="handleClose"
    @update:model-value="updateVisible"
  >
    <div class="dialog-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索权限名称或描述"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" />
          </template>
        </el-input>

        <el-button
          type="primary"
          :icon="Plus"
          style="margin-left: 12px"
          @click="handleOpenCreatePermission"
        >
          新增权限
        </el-button>

        <!-- <el-select
          v-model="selectedScope"
          placeholder="筛选权限域"
          clearable
          style="width: 200px; margin-left: 12px"
          @change="handleSearch"
        >
          <el-option
            v-for="scope in scopeList"
            :key="scope.id"
            :label="scope.name"
            :value="scope.id"
          />
        </el-select> -->
      </div>

      <!-- 权限列表 -->
      <div class="permission-list">
        <el-table
          ref="tableRef"
          :data="permissionList"
          :loading="tableLoading"
          stripe
          height="400px"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column prop="name" label="权限名称" min-width="150" />

          <el-table-column prop="action" label="权限操作" width="120" />

          <el-table-column
            prop="isPublic"
            label="公共权限"
            width="100"
            :formatter="row => (row.isPublic ? '是' : '否')"
          />

          <el-table-column prop="scope.name" label="权限域" width="120" />

          <el-table-column
            prop="description"
            label="描述"
            min-width="200"
            show-overflow-tooltip
          />

          <el-table-column prop="createTime" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 已选择的权限 -->
      <div v-if="selectedPermissions.length" class="selected-permissions">
        <div class="selected-title">
          已选择 {{ selectedPermissions.length }} 个权限：
        </div>
        <div class="selected-list">
          <el-tag
            v-for="permission in selectedPermissions"
            :key="permission.id"
            type="success"
            closable
            @close="handleRemoveSelected(permission)"
          >
            {{ permission.name }}
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!selectedPermissions.length"
          @click="handleSubmit"
        >
          确定添加 ({{ selectedPermissions.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 新增权限弹窗 -->
  <PermissionDialog
    v-model:visible="showCreatePermission"
    type="add"
    :loading="createPermissionLoading"
    @submit="handleCreatePermission"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { Search, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Role, Permission, Scope } from "@/api/rbac";
import {
  getAssignablePermissions,
  assignRolePermissions,
  getAllScopes,
  createPermission,
  type CreatePermissionRequest
} from "@/api/rbac";
import PermissionDialog from "../../permission/components/PermissionDialog.vue";

interface Props {
  visible: boolean;
  role?: Role | null;
  loading?: boolean;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "submit"): void;
}

const props = withDefaults(defineProps<Props>(), {
  role: null,
  loading: false
});

const emit = defineEmits<Emits>();

// 响应式数据
const tableRef = ref();
const permissionList = ref<Permission[]>([]);
const selectedPermissions = ref<Permission[]>([]);
const scopeList = ref<Scope[]>([]);
const searchKeyword = ref("");
const selectedScope = ref("");
const tableLoading = ref(false);
const showCreatePermission = ref(false);
const createPermissionLoading = ref(false);

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

// 更新可见性
const updateVisible = (value: boolean) => {
  emit("update:visible", value);
};

// 处理关闭
const handleClose = () => {
  resetData();
  updateVisible(false);
};

// 重置数据
const resetData = () => {
  selectedPermissions.value = [];
  searchKeyword.value = "";
  selectedScope.value = "";
  pagination.currentPage = 1;
  permissionList.value = [];
  showCreatePermission.value = false;
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  loadPermissions();
};

// 处理分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadPermissions();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadPermissions();
};

// 处理选择变化
const handleSelectionChange = (selection: Permission[]) => {
  selectedPermissions.value = selection;
};

// 移除已选择的权限
const handleRemoveSelected = (permission: Permission) => {
  const index = selectedPermissions.value.findIndex(
    p => p.id === permission.id
  );
  if (index > -1) {
    selectedPermissions.value.splice(index, 1);
    // 同时取消表格中的选择
    tableRef.value?.toggleRowSelection(permission, false);
  }
};

// 加载可分配的权限（排除已有的直接权限和继承权限）
const loadPermissions = async () => {
  if (!props.role) return;

  tableLoading.value = true;
  try {
    const response = await getAssignablePermissions(props.role.id);
    let permissions = response.data || [];

    // 根据搜索条件过滤
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase();
      permissions = permissions.filter(
        p =>
          p.name.toLowerCase().includes(keyword) ||
          p.description?.toLowerCase().includes(keyword) ||
          p.action.toLowerCase().includes(keyword)
      );
    }

    // 根据权限域过滤
    if (selectedScope.value) {
      permissions = permissions.filter(
        p => p.scope?.id === selectedScope.value
      );
    }

    // 手动分页
    pagination.total = permissions.length;
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    permissionList.value = permissions.slice(start, end);
  } catch (error) {
    console.error("加载可分配权限失败:", error);
    ElMessage.error("加载可分配权限失败");
  } finally {
    tableLoading.value = false;
  }
};

// 加载权限域列表
const loadScopes = async () => {
  try {
    const response = await getAllScopes();
    scopeList.value = response.data || [];
  } catch (error) {
    console.error("加载权限域列表失败:", error);
  }
};

// 处理提交
const handleSubmit = async () => {
  if (!props.role || !selectedPermissions.value.length) return;

  try {
    const permissionIds = selectedPermissions.value.map(
      permission => permission.id
    );
    await assignRolePermissions(props.role.id, { permissionIds });

    ElMessage.success(
      `成功添加 ${selectedPermissions.value.length} 个权限到角色`
    );
    emit("submit");
  } catch (error) {
    console.error("添加权限失败:", error);
    ElMessage.error("添加权限失败");
  }
};

// 打开新增权限弹窗
const handleOpenCreatePermission = () => {
  showCreatePermission.value = true;
};

// 处理新增权限
const handleCreatePermission = async (data: CreatePermissionRequest) => {
  createPermissionLoading.value = true;
  try {
    const response = await createPermission(data);

    if (response.success && response.data) {
      ElMessage.success("权限创建成功");
      showCreatePermission.value = false;

      // 重新加载权限列表
      await loadPermissions();

      // 自动选中新创建的权限
      const newPermission = response.data;
      const existingSelection = selectedPermissions.value.find(
        p => p.id === newPermission.id
      );

      if (!existingSelection) {
        selectedPermissions.value.push(newPermission);

        // 如果新权限在当前页面中，也要在表格中选中
        const permissionInCurrentPage = permissionList.value.find(
          p => p.id === newPermission.id
        );
        if (permissionInCurrentPage) {
          tableRef.value?.toggleRowSelection(permissionInCurrentPage, true);
        }
      }
    }
  } catch (error) {
    console.error("创建权限失败:", error);
    ElMessage.error("创建权限失败");
  } finally {
    createPermissionLoading.value = false;
  }
};

// 监听显示状态变化
watch(
  () => props.visible,
  newVal => {
    if (newVal && props.role) {
      loadPermissions();
      loadScopes();
    } else {
      resetData();
    }
  }
);

onMounted(() => {
  if (props.visible && props.role) {
    loadPermissions();
    loadScopes();
  }
});
</script>

<style lang="scss" scoped>
.dialog-content {
  .search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .el-input {
      width: 300px;
    }
  }

  .permission-list {
    margin-bottom: 16px;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .selected-permissions {
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    .selected-title {
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .selected-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
