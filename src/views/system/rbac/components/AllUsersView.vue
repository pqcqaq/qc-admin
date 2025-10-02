<template>
  <div class="all-users-view">
    <div class="view-header">
      <div class="header-left">
        <span class="view-title"
          >所有用户 ({{ pagination.total || 0 }} 个)</span
        >
      </div>
      <div class="header-right">
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
      <ContextMenu @show="handleUserContextMenuShow">
        <template #menu="{ close }">
          <div v-if="currentContextUser" class="context-menu-content">
            <MenuGroup title="用户操作">
              <MenuItem
                :icon="View"
                variant="primary"
                @click="handleMenuCommand('view', close)"
              >
                查看用户详情
              </MenuItem>
              <MenuItem
                :icon="UserFilled"
                variant="success"
                @click="handleMenuCommand('roles', close)"
              >
                查看用户角色
              </MenuItem>
            </MenuGroup>
          </div>
        </template>

        <el-table
          :data="userList"
          :loading="actualLoading"
          stripe
          height="100%"
        >
          <el-table-column prop="id" label="用户ID" width="120" />

          <el-table-column prop="name" label="用户名" width="120" />

          <el-table-column prop="nickname" label="昵称" min-width="120" />

          <el-table-column label="用户角色" min-width="200">
            <template #default="{ row }">
              <div class="roles-tags">
                <el-tag
                  v-for="role in row.roles"
                  :key="role"
                  size="small"
                  type="primary"
                  class="role-tag"
                >
                  {{ role }}
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
      </ContextMenu>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { Refresh, View, UserFilled, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Role } from "qc-admin-api-common/rbac";
import { getUserListWithPagination, type User } from "qc-admin-api-common/user";
import { ContextMenu } from "@/components/Menu";
import { MenuItem, MenuDivider, MenuGroup } from "@/components/Menu";

interface Props {
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
const userList = ref<User[]>([]);
const internalLoading = ref(false);

// 计算实际的loading状态（内部loading或父组件传入的loading）
const actualLoading = computed(() => props.loading || internalLoading.value);

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

const currentContextUser = ref<any>(null);

// 右键菜单显示处理
const handleUserContextMenuShow = (data: {
  event: MouseEvent;
  targetRef: HTMLElement;
  contextData: any;
}) => {
  // 通过DOM元素查找对应的用户数据
  const target = data.contextData.target as HTMLElement;
  const row = target.closest("tr");

  if (row && row.parentNode) {
    // 查找tbody中的所有tr元素（排除thead）
    const tbody = row.closest("tbody");
    if (tbody) {
      const dataRows = Array.from(tbody.querySelectorAll("tr"));
      const index = dataRows.indexOf(row);

      if (index >= 0 && index < userList.value.length) {
        currentContextUser.value = userList.value[index];
        console.log(
          "Selected user:",
          currentContextUser.value,
          "at index:",
          index
        );
      }
    }
  }
};

// 菜单命令处理
const handleMenuCommand = (command: string, close: () => void) => {
  if (!currentContextUser.value) return;

  close();

  switch (command) {
    case "view":
      ElMessage.info(`查看用户：${currentContextUser.value.name}`);
      // 这里可以打开用户详情对话框
      break;
    case "roles":
      const roles =
        currentContextUser.value.roles?.map((r: any) => r.name).join(", ") ||
        "无角色";
      ElMessage.info(`用户 ${currentContextUser.value.name} 的角色：${roles}`);
      // 这里可以打开角色管理对话框
      break;
  }

  currentContextUser.value = null;
};

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

    const response = await getUserListWithPagination(params);

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

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.all-users-view {
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

    .roles-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .role-tag {
        margin: 0;
      }

      .no-roles {
        font-style: italic;
        color: var(--el-text-color-placeholder);
      }
    }
  }

  .pagination-container {
    display: flex;
    flex-shrink: 0; // 防止分页被压缩
    justify-content: center;
    margin-top: 16px;
  }
}
</style>
