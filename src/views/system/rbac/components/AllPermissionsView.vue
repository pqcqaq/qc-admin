<template>
  <div class="all-permissions-view">
    <div class="view-header">
      <div class="header-left">
        <span class="view-title"
          >所有权限 ({{ pagination.total || 0 }} 个)</span
        >
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Plus"
          size="small"
          @click="openDialog()"
        >
          新增权限
        </el-button>
        <el-button
          :icon="Refresh"
          size="small"
          :loading="tableLoading"
          @click="refreshData"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索表单组件 -->
    <PermissionManagementSearchForm
      @search="handleSearch"
      @reset="handleReset"
    />

    <div class="table-container">
      <!-- 权限表格组件 -->
      <ContextMenu
        :menu-items="permissionContextMenuItems"
        @item-click="handlePermissionContextMenuClick"
      >
        <PermissionManagementTable
          :data-list="dataList"
          :pagination="pagination"
          :loading="tableLoading"
          @edit="openDialog('edit', $event)"
          @view="handleView"
          @delete="handleDelete"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        />
      </ContextMenu>
    </div>

    <!-- 新增/编辑对话框组件 -->
    <PermissionManagementDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :permission-data="currentPermission"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <PermissionManagementViewDialog
      v-model:visible="viewDialogVisible"
      :permission-data="viewData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus, Refresh, Edit, View, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  type Permission
} from "@/api/rbac";
import { ContextMenu, type ContextMenuItem } from "@/components/Menu";
import PermissionManagementSearchForm from "./PermissionManagementSearchForm.vue";
import PermissionManagementTable from "./PermissionManagementTable.vue";
import PermissionManagementDialog from "./PermissionManagementDialog.vue";
import PermissionManagementViewDialog from "./PermissionManagementViewDialog.vue";

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
const tableLoading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentPermission = ref<Permission>();

// 搜索表单数据
const searchParams = reactive({
  name: "",
  action: "",
  description: "",
  scopeId: ""
});

// 查看数据
const viewData = ref<Permission>({} as Permission);

// 表格数据
const dataList = ref<Permission[]>([]);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  background: true
});

// 权限右键菜单项
const permissionContextMenuItems: ContextMenuItem[] = [
  {
    key: "edit",
    label: "编辑权限",
    icon: Edit
  },
  {
    key: "view",
    label: "查看权限",
    icon: View
  },
  { key: "divider1", label: "", divider: true },
  {
    key: "delete",
    label: "删除权限",
    icon: Delete
  }
];

// 处理权限右键菜单点击
const handlePermissionContextMenuClick = (data: {
  item: ContextMenuItem;
  targetRef: any;
  contextData: any;
}) => {
  const { item, contextData } = data;

  // 通过DOM元素查找对应的权限数据
  const target = contextData.target as HTMLElement;
  const row = target.closest("tr");

  if (row) {
    const index = Array.from(row.parentNode!.children).indexOf(row) - 1; // 减去表头
    if (index >= 0 && index < dataList.value.length) {
      const permission = dataList.value[index];

      switch (item.key) {
        case "edit":
          openDialog("edit", permission);
          break;
        case "view":
          handleView(permission);
          break;
        case "delete":
          handleDelete(permission);
          break;
      }
    }
  }
};

// 获取权限列表
const getTableData = async () => {
  tableLoading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchParams
    };
    const response = await getPermissions(params);
    dataList.value = response.data || [];
    pagination.total = response.pagination?.total || 0;
    pagination.pageSize = response.pagination?.pageSize || 10;
    pagination.currentPage = response.pagination?.page || 1;
  } catch (error) {
    console.error("获取权限列表失败:", error);
    ElMessage.error("获取权限列表失败");
  } finally {
    tableLoading.value = false;
  }
};

// 搜索处理
const handleSearch = (params: typeof searchParams) => {
  Object.assign(searchParams, params);
  pagination.currentPage = 1;
  getTableData();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchParams, {
    name: "",
    action: "",
    description: "",
    scopeId: ""
  });
  pagination.currentPage = 1;
  getTableData();
};

// 分页改变
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getTableData();
};

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  getTableData();
};

// 打开对话框
const openDialog = (type: "add" | "edit" = "add", row?: Permission) => {
  dialogType.value = type;
  currentPermission.value = row;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createPermission(formData);
      ElMessage.success("创建权限成功");
    } else {
      await updatePermission(formData.id, formData);
      ElMessage.success("更新权限成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存权限失败:", error);
    ElMessage.error("保存权限失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看权限
const handleView = (row: Permission) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除权限
const handleDelete = async (row: Permission) => {
  try {
    tableLoading.value = true;
    await deletePermission(row.id);
    ElMessage.success("删除权限成功");
    await getTableData();
  } catch (error) {
    console.error("删除权限失败:", error);
    ElMessage.error("删除权限失败");
    tableLoading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  getTableData();
  emit("refresh");
};

onMounted(() => {
  getTableData();
});
</script>

<style lang="scss" scoped>
.all-permissions-view {
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

  .table-container {
    flex: 1;
    min-height: 0; // 确保可以正确收缩
    overflow: hidden;
  }
}
</style>
