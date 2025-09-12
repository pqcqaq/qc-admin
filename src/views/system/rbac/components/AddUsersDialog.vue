<template>
  <el-dialog
    :model-value="visible"
    title="添加用户到角色"
    width="800px"
    :before-close="handleClose"
    @update:model-value="updateVisible"
  >
    <div class="dialog-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
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

      <!-- 用户列表 -->
      <div class="user-list">
        <el-table
          ref="tableRef"
          :data="userList"
          :loading="tableLoading"
          stripe
          height="400px"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column prop="id" label="用户ID" width="120" />

          <el-table-column prop="name" label="用户名" width="120" />

          <el-table-column prop="nickname" label="昵称" min-width="120" />

          <el-table-column label="当前角色" min-width="200">
            <template #default="{ row }">
              <div class="roles-tags">
                <el-tag
                  v-for="userRole in row.roles"
                  :key="userRole.id"
                  size="small"
                  type="info"
                  class="role-tag"
                >
                  {{ userRole.name }}
                </el-tag>
                <span v-if="!row.roles?.length" class="no-roles"> 无角色 </span>
              </div>
            </template>
          </el-table-column>

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

      <!-- 已选择的用户 -->
      <div v-if="selectedUsers.length" class="selected-users">
        <div class="selected-title">
          已选择 {{ selectedUsers.length }} 个用户：
        </div>
        <div class="selected-list">
          <el-tag
            v-for="user in selectedUsers"
            :key="user.id"
            type="success"
            closable
            @close="handleRemoveSelected(user)"
          >
            {{ user.name }}
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
          :disabled="!selectedUsers.length"
          @click="handleSubmit"
        >
          确定添加 ({{ selectedUsers.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Role } from "@/api/rbac";
import { getUserList } from "@/api/user";
import { batchAssignUsersToRole, getUserRoles } from "@/api/rbac";

interface User {
  id: string;
  name: string;
  nickname?: string;
  roles?: Role[];
  createTime: string;
}

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
const userList = ref<User[]>([]);
const selectedUsers = ref<User[]>([]);
const searchKeyword = ref("");
const tableLoading = ref(false);

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
  selectedUsers.value = [];
  searchKeyword.value = "";
  pagination.currentPage = 1;
  userList.value = [];
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  loadUsers();
};

// 处理分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadUsers();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadUsers();
};

// 处理选择变化
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection;
};

// 移除已选择的用户
const handleRemoveSelected = (user: User) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
    // 同时取消表格中的选择
    tableRef.value?.toggleRowSelection(user, false);
  }
};

// 加载用户列表（排除已有该角色的用户）
const loadUsers = async () => {
  if (!props.role) return;

  tableLoading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      excludeRoleId: props.role.id // 排除已有该角色的用户
    };

    const response = await getUserList(params);

    // 获取每个用户的角色信息
    const usersWithRoles = await Promise.all(
      (response.data || []).map(async (user: any) => {
        try {
          const rolesResponse = await getUserRoles(user.id);
          return {
            ...user,
            roles: rolesResponse.data || []
          };
        } catch (error) {
          return {
            ...user,
            roles: []
          };
        }
      })
    );

    userList.value = usersWithRoles;

    if (response.pagination) {
      pagination.total = response.pagination.total;
      pagination.currentPage = response.pagination.page;
      pagination.pageSize = response.pagination.pageSize;
    }
  } catch (error) {
    console.error("加载用户列表失败:", error);
    ElMessage.error("加载用户列表失败");
  } finally {
    tableLoading.value = false;
  }
};

// 处理提交
const handleSubmit = async () => {
  if (!props.role || !selectedUsers.value.length) return;

  try {
    const userIds = selectedUsers.value.map(user => user.id);
    await batchAssignUsersToRole(props.role.id, { userIds });

    ElMessage.success(`成功添加 ${selectedUsers.value.length} 个用户到角色`);
    emit("submit");
  } catch (error) {
    console.error("添加用户失败:", error);
    ElMessage.error("添加用户失败");
  }
};

// 监听显示状态变化
watch(
  () => props.visible,
  newVal => {
    if (newVal && props.role) {
      loadUsers();
    } else {
      resetData();
    }
  }
);

onMounted(() => {
  if (props.visible && props.role) {
    loadUsers();
  }
});
</script>

<style lang="scss" scoped>
.dialog-content {
  .search-bar {
    margin-bottom: 16px;

    .el-input {
      width: 300px;
    }
  }

  .user-list {
    margin-bottom: 16px;

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
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }

  .selected-users {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 12px;
    background: var(--el-fill-color-lighter);

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
  justify-content: flex-end;
  gap: 12px;
}
</style>
