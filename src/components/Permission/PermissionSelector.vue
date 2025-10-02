<template>
  <div class="permissions-selector">
    <!-- 主输入区域 -->
    <div
      class="selector-input"
      :class="{ 'is-focus': dialogVisible }"
      @click="openDialog"
    >
      <div class="selected-display">
        <template v-if="modelValue.length > 0">
          <el-tag
            v-for="permission in modelValue"
            :key="permission.id"
            closable
            class="selected-tag"
            @close="removePermission(permission)"
          >
            {{ permission.action }}
          </el-tag>
        </template>
        <span v-else class="placeholder">{{ placeholder }}</span>
      </div>
      <el-icon class="selector-icon">
        <ArrowDown />
      </el-icon>
    </div>

    <!-- 选择对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择权限"
      width="800px"
      :before-close="handleClose"
    >
      <div class="dialog-content">
        <!-- 搜索表单 -->
        <el-form
          :model="searchForm"
          inline
          class="search-form"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="权限名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入权限名称"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="权限操作">
            <el-input
              v-model="searchForm.action"
              placeholder="请输入权限操作"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <!-- 是否公共 -->
          <el-form-item label="公共权限">
            <el-select
              v-model="searchForm.isPublic"
              placeholder="请选择"
              clearable
              style="width: 120px"
            >
              <el-option :label="'是'" :value="true" />
              <el-option :label="'否'" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
            <el-button type="success" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              创建新权限
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 权限列表 -->
        <div class="permissions-list">
          <el-table
            ref="permissionTable"
            v-loading="loading"
            row-key="id"
            :data="permissions"
            height="300"
            @selection-change="handleSelectionChange"
          >
            <el-table-column
              type="selection"
              width="55"
              :reserve-selection="true"
            />
            <el-table-column prop="name" label="权限名称" />
            <el-table-column prop="action" label="权限操作" />
            <!-- 是否公开 -->
            <el-table-column
              prop="isPublic"
              label="公共权限"
              width="100"
              :formatter="row => (row.isPublic ? '是' : '否')"
            />
            <el-table-column
              prop="description"
              label="描述"
              show-overflow-tooltip
            />
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            class="pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <!-- 已选择区域 -->
        <div class="selected-section">
          <div class="selected-header">
            <span>已选择 ({{ selectedPermissions.size }})</span>
            <el-button
              v-if="selectedPermissions.size > 0"
              type="text"
              @click="clearSelected"
            >
              清空
            </el-button>
          </div>
          <div class="selected-content">
            <el-tag
              v-for="permission in Array.from(selectedPermissions.values())"
              :key="permission.id"
              closable
              class="selected-tag"
              @close="togglePermission(permission)"
            >
              {{ permission.action }}
            </el-tag>
            <div v-if="selectedPermissions.size === 0" class="empty-selected">
              暂无选择
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="confirmSelection">
            确定 ({{ selectedPermissions.size }})
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建权限对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建新权限"
      width="500px"
      :before-close="handleCreateClose"
      class="create-dialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限操作" prop="action">
          <el-input v-model="createForm.action" placeholder="请输入权限操作" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        <!-- 是否公共 -->
        <el-form-item label="公共权限" prop="isPublic">
          <el-switch
            v-model="createForm.isPublic"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCreateClose">取消</el-button>
          <el-button
            type="primary"
            :loading="createLoading"
            @click="handleCreate"
          >
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown, Plus } from "@element-plus/icons-vue";
import {
  getPermissions,
  createPermission,
  type Permission,
  type CreatePermissionRequest
} from "qc-admin-api-common/rbac";

interface Props {
  modelValue: Permission[];
  placeholder?: string;
}

interface Emits {
  (e: "update:modelValue", value: Permission[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 对话框状态
const dialogVisible = ref(false);
const createDialogVisible = ref(false);

// 列表数据
const permissions = ref<Permission[]>([]);
const loading = ref(false);
const createLoading = ref(false);

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

// 搜索表单
const searchForm = reactive({
  name: "",
  action: "",
  isPublic: null as boolean | null
});

// 创建表单
const createForm = reactive<CreatePermissionRequest>({
  name: "",
  action: "",
  description: "",
  isPublic: false
});

const createFormRef = ref();

// 创建表单验证规则
const createRules = {
  name: [{ required: true, message: "请输入权限名称", trigger: "blur" }],
  action: [{ required: true, message: "请输入权限操作", trigger: "blur" }]
};

// 选中的权限（使用Map来保持状态）
const selectedPermissions = ref(new Map<string, Permission>());

// 表格引用
const permissionTable = ref();

// 初始化选中状态
const initSelectedPermissions = () => {
  selectedPermissions.value.clear();
  props.modelValue.forEach(permission => {
    selectedPermissions.value.set(permission.id, permission);
  });
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 加载权限列表
const loadPermissions = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };

    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === "") {
        delete params[key];
      }
    });

    const response = await getPermissions(params);
    if (response.success) {
      permissions.value = response.data;
      pagination.total = response.pagination.total;

      // 恢复表格选中状态
      await nextTick();
      restoreTableSelection();
    }
  } catch (error) {
    console.error("加载权限列表失败:", error);
    ElMessage.error("加载权限列表失败");
  } finally {
    loading.value = false;
  }
};

// 恢复表格选中状态
const restoreTableSelection = () => {
  if (!permissionTable.value) return;

  permissions.value.forEach(permission => {
    if (selectedPermissions.value.has(permission.id)) {
      permissionTable.value.toggleRowSelection(permission, true);
    }
  });
};

// 处理表格选择变化
const handleSelectionChange = (selection: Permission[]) => {
  // 获取当前页面的所有权限ID
  const currentPageIds = new Set(permissions.value.map(p => p.id));

  // 移除当前页面已取消选择的权限
  for (const id of selectedPermissions.value.keys()) {
    if (currentPageIds.has(id)) {
      const found = selection.find(p => p.id === id);
      if (!found) {
        selectedPermissions.value.delete(id);
      }
    }
  }

  // 添加当前页面新选择的权限
  selection.forEach(permission => {
    selectedPermissions.value.set(permission.id, permission);
  });
};

// 切换单个权限选择状态
const togglePermission = (permission: Permission) => {
  if (selectedPermissions.value.has(permission.id)) {
    selectedPermissions.value.delete(permission.id);
  } else {
    selectedPermissions.value.set(permission.id, permission);
  }

  // 更新表格选中状态
  if (permissionTable.value) {
    const isSelected = selectedPermissions.value.has(permission.id);
    permissionTable.value.toggleRowSelection(permission, isSelected);
  }
};

// 清空选择
const clearSelected = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有选择吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    selectedPermissions.value.clear();
    if (permissionTable.value) {
      permissionTable.value.clearSelection();
    }
  } catch {
    // 用户取消
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadPermissions();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    action: ""
  });
  handleSearch();
};

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadPermissions();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadPermissions();
};

// 打开选择对话框
const openDialog = () => {
  dialogVisible.value = true;
  initSelectedPermissions();
  loadPermissions();
};

// 关闭选择对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 确认选择
const confirmSelection = () => {
  const selected = Array.from(selectedPermissions.value.values());
  emit("update:modelValue", selected);
  dialogVisible.value = false;
  ElMessage.success(`已选择 ${selected.length} 个权限`);
};

// 移除权限
const removePermission = (permission: Permission) => {
  const newValue = props.modelValue.filter(p => p.id !== permission.id);
  emit("update:modelValue", newValue);
};

// 打开创建对话框
const openCreateDialog = () => {
  createDialogVisible.value = true;
  resetCreateForm();
};

// 关闭创建对话框
const handleCreateClose = () => {
  createDialogVisible.value = false;
  resetCreateForm();
};

// 重置创建表单
const resetCreateForm = () => {
  Object.assign(createForm, {
    name: "",
    action: "",
    description: ""
  });
  createFormRef.value?.clearValidate();
};

// 创建权限
const handleCreate = async () => {
  try {
    const valid = await createFormRef.value?.validate();
    if (!valid) return;

    createLoading.value = true;
    const response = await createPermission(createForm);

    if (response.success) {
      ElMessage.success("权限创建成功");

      // 将新创建的权限添加到选中列表
      const newPermission = response.data;
      selectedPermissions.value.set(newPermission.id, newPermission);

      // 刷新权限列表
      await loadPermissions();

      // 关闭创建对话框
      createDialogVisible.value = false;
    }
  } catch (error) {
    console.error("创建权限失败:", error);
    ElMessage.error("创建权限失败");
  } finally {
    createLoading.value = false;
  }
};

// 监听modelValue变化，更新显示
watch(
  () => props.modelValue,
  newValue => {
    if (dialogVisible.value) {
      initSelectedPermissions();
      nextTick(() => {
        restoreTableSelection();
      });
    }
  },
  { deep: true }
);

onMounted(() => {
  initSelectedPermissions();
});
</script>

<style scoped>
.permissions-selector {
  width: 100%;
}

.selector-input {
  position: relative;
  min-height: 32px;
  padding: 4px 30px 4px 8px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.selector-input:hover {
  border-color: #c0c4cc;
}

.selector-input.is-focus {
  border-color: #409eff;
}

.selected-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-height: 24px;
}

.placeholder {
  font-size: 14px;
  color: #c0c4cc;
}

.selected-tag {
  margin: 0;
}

.selector-icon {
  position: absolute;
  top: 50%;
  right: 8px;
  color: #c0c4cc;
  transform: translateY(-50%);
}

.dialog-content {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.search-form {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.permissions-list {
  flex: 1;
  min-height: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.selected-section {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
}

.selected-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.selected-content {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: flex-start;
  align-items: flex-start;
  min-height: 60px;
  max-height: 120px;
  padding: 8px;
  overflow-y: auto;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-content .selected-tag {
  margin: 0;
}

.empty-selected {
  width: 100%;
  padding: 20px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.create-dialog {
  ::v-deep(.el-form-item) {
    padding: 6px;
  }
}
</style>
