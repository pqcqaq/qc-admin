<template>
  <div class="roles-selector">
    <!-- 主输入区域 -->
    <div
      class="selector-input"
      :class="{ 'is-focus': dialogVisible }"
      @click="openDialog"
    >
      <div class="selected-display">
        <template v-if="modelValue.length > 0">
          <el-tag
            v-for="role in modelValue"
            :key="role.id"
            closable
            class="selected-tag"
            @close="removeRole(role)"
          >
            {{ role.name }}
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
      title="选择角色"
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
          <el-form-item label="角色名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入角色名称"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="角色描述">
            <el-input
              v-model="searchForm.description"
              placeholder="请输入角色描述"
              clearable
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
            <el-button type="success" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              创建新角色
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 角色列表 -->
        <div class="roles-list">
          <el-table
            ref="roleTable"
            v-loading="loading"
            row-key="id"
            :data="roles"
            height="300"
            @selection-change="handleSelectionChange"
          >
            <el-table-column
              type="selection"
              width="55"
              :reserve-selection="true"
            />
            <el-table-column prop="name" label="角色名称" />
            <el-table-column
              prop="description"
              label="角色描述"
              show-overflow-tooltip
            />
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="继承关系" width="120">
              <template #default="{ row }">
                <div v-if="row.inheritsFrom && row.inheritsFrom.length > 0">
                  <el-tag
                    v-for="parent in row.inheritsFrom"
                    :key="parent.id"
                    size="small"
                    class="inheritance-tag"
                  >
                    继承: {{ parent.name }}
                  </el-tag>
                </div>
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
            <span>已选择 ({{ selectedRoles.size }})</span>
            <el-button
              v-if="selectedRoles.size > 0"
              type="text"
              @click="clearSelected"
            >
              清空
            </el-button>
          </div>
          <div class="selected-content">
            <el-tag
              v-for="role in Array.from(selectedRoles.values())"
              :key="role.id"
              closable
              class="selected-tag"
              @close="toggleRole(role)"
            >
              {{ role.name }}
            </el-tag>
            <div v-if="selectedRoles.size === 0" class="empty-selected">
              暂无选择
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="confirmSelection">
            确定 ({{ selectedRoles.size }})
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建角色对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建新角色"
      width="500px"
      :before-close="handleCreateClose"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        <el-form-item label="继承角色" prop="inheritsFrom">
          <el-select
            v-model="createForm.inheritsFrom"
            multiple
            placeholder="请选择要继承的父角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in availableParentRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
          <div class="form-tip">选择父角色后，新角色将继承父角色的所有权限</div>
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
  getRoles,
  getAllRoles,
  createRole,
  type Role,
  type CreateRoleRequest
} from "qc-admin-api-common/rbac";
import { RoleInfo } from "qc-admin-api-common/client_devices";

interface Props {
  modelValue: RoleInfo[];
  placeholder?: string;
}

interface Emits {
  (e: "update:modelValue", value: RoleInfo[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 对话框状态
const dialogVisible = ref(false);
const createDialogVisible = ref(false);

// 列表数据
const roles = ref<Role[]>([]);
const availableParentRoles = ref<Role[]>([]);
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
  description: ""
});

// 创建表单
const createForm = reactive<CreateRoleRequest>({
  name: "",
  description: "",
  inheritsFrom: []
});

const createFormRef = ref();

// 创建表单验证规则
const createRules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }]
};

// 选中的角色（使用Map来保持状态）
const selectedRoles = ref(new Map<string, RoleInfo>());

// 表格引用
const roleTable = ref();

// 初始化选中状态
const initSelectedRoles = () => {
  selectedRoles.value.clear();
  props.modelValue.forEach(role => {
    selectedRoles.value.set(role.id, role);
  });
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 加载角色列表
const loadRoles = async () => {
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

    const response = await getRoles(params);
    if (response.success) {
      roles.value = response.data;
      pagination.total = response.pagination.total;

      // 恢复表格选中状态
      await nextTick();
      restoreTableSelection();
    }
  } catch (error) {
    console.error("加载角色列表失败:", error);
    ElMessage.error("加载角色列表失败");
  } finally {
    loading.value = false;
  }
};

// 加载所有角色（用于创建时选择父角色）
const loadAllRoles = async () => {
  try {
    const response = await getAllRoles();
    if (response.success) {
      availableParentRoles.value = response.data;
    }
  } catch (error) {
    console.error("加载所有角色失败:", error);
  }
};

// 恢复表格选中状态
const restoreTableSelection = () => {
  if (!roleTable.value) return;

  roles.value.forEach(role => {
    const roleInfo: RoleInfo = {
      id: role.id,
      name: role.name,
      description: role.description
    };
    if (selectedRoles.value.has(role.id)) {
      roleTable.value.toggleRowSelection(role, true);
    }
  });
};

// 处理表格选择变化
const handleSelectionChange = (selection: Role[]) => {
  // 获取当前页面的所有角色ID
  const currentPageIds = new Set(roles.value.map(r => r.id));

  // 移除当前页面已取消选择的角色
  for (const id of selectedRoles.value.keys()) {
    if (currentPageIds.has(id)) {
      const found = selection.find(r => r.id === id);
      if (!found) {
        selectedRoles.value.delete(id);
      }
    }
  }

  // 添加当前页面新选择的角色
  selection.forEach(role => {
    const roleInfo: RoleInfo = {
      id: role.id,
      name: role.name,
      description: role.description
    };
    selectedRoles.value.set(role.id, roleInfo);
  });
};

// 切换单个角色选择状态
const toggleRole = (role: RoleInfo) => {
  if (selectedRoles.value.has(role.id)) {
    selectedRoles.value.delete(role.id);
  } else {
    selectedRoles.value.set(role.id, role);
  }

  // 更新表格选中状态
  if (roleTable.value) {
    const tableRole = roles.value.find(r => r.id === role.id);
    if (tableRole) {
      const isSelected = selectedRoles.value.has(role.id);
      roleTable.value.toggleRowSelection(tableRole, isSelected);
    }
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

    selectedRoles.value.clear();
    if (roleTable.value) {
      roleTable.value.clearSelection();
    }
  } catch {
    // 用户取消
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadRoles();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    description: ""
  });
  handleSearch();
};

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadRoles();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadRoles();
};

// 打开选择对话框
const openDialog = () => {
  dialogVisible.value = true;
  initSelectedRoles();
  loadRoles();
};

// 关闭选择对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 确认选择
const confirmSelection = () => {
  const selected = Array.from(selectedRoles.value.values());
  emit("update:modelValue", selected);
  dialogVisible.value = false;
  ElMessage.success(`已选择 ${selected.length} 个角色`);
};

// 移除角色
const removeRole = (role: RoleInfo) => {
  const newValue = props.modelValue.filter(r => r.id !== role.id);
  emit("update:modelValue", newValue);
};

// 打开创建对话框
const openCreateDialog = () => {
  createDialogVisible.value = true;
  resetCreateForm();
  loadAllRoles();
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
    description: "",
    inheritsFrom: []
  });
  createFormRef.value?.clearValidate();
};

// 创建角色
const handleCreate = async () => {
  try {
    const valid = await createFormRef.value?.validate();
    if (!valid) return;

    createLoading.value = true;
    const response = await createRole(createForm);

    if (response.success) {
      ElMessage.success("角色创建成功");

      // 将新创建的角色添加到选中列表
      const newRole = response.data;
      const newRoleInfo: RoleInfo = {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description
      };
      selectedRoles.value.set(newRole.id, newRoleInfo);

      // 刷新角色列表
      await loadRoles();

      // 关闭创建对话框
      createDialogVisible.value = false;
    }
  } catch (error) {
    console.error("创建角色失败:", error);
    ElMessage.error("创建角色失败");
  } finally {
    createLoading.value = false;
  }
};

// 监听modelValue变化，更新显示
watch(
  () => props.modelValue,
  newValue => {
    if (dialogVisible.value) {
      initSelectedRoles();
      nextTick(() => {
        restoreTableSelection();
      });
    }
  },
  { deep: true }
);

onMounted(() => {
  initSelectedRoles();
});
</script>

<style scoped>
.roles-selector {
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

.roles-list {
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

.inheritance-tag {
  margin: 2px 0;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}
</style>
