<template>
  <pure-table
    ref="tableRef"
    :data="dataList"
    :columns="columns"
    :pagination="pagination"
    :paginationSmall="true"
    :loading="loading"
    :header-cell-style="{
      background: 'var(--el-table-row-hover-bg-color)',
      color: 'var(--el-text-color-primary)'
    }"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #operation="{ row }">
      <el-button
        class="reset-margin"
        link
        type="primary"
        size="small"
        @click="handleViewUserRoles(row.userId)"
      >
        查看用户角色
      </el-button>
      <el-button
        class="reset-margin"
        link
        type="success"
        size="small"
        @click="handleViewRoleUsers(row.roleId)"
      >
        查看角色用户
      </el-button>
      <el-popconfirm
        title="是否确认撤销该用户角色关联?"
        @confirm="handleRevoke(row)"
      >
        <template #reference>
          <el-button class="reset-margin" link type="danger" size="small">
            撤销
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </pure-table>
</template>

<script setup lang="tsx">
import { ref } from "vue";
import { PureTable } from "@pureadmin/table";
import type { UserRole } from "qc-admin-api-common/rbac";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: UserRole[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  revoke: [userRole: UserRole];
  "view-user-roles": [userId: string];
  "view-role-users": [roleId: string];
  "page-size-change": [size: number];
  "page-current-change": [page: number];
}>();

const tableRef = ref();

// 表格列配置
const columns: TableColumnList = [
  {
    label: "序号",
    type: "index",
    width: 70,
    hide: false
  },
  {
    label: "用户ID",
    prop: "userId",
    minWidth: 120
  },
  {
    label: "用户信息",
    prop: "user",
    minWidth: 150,
    cellRenderer: ({ row }) => {
      return row.user ? (
        <span>{row.user.name}</span>
      ) : (
        <span class="text-gray-400">-</span>
      );
    }
  },
  {
    label: "角色ID",
    prop: "roleId",
    minWidth: 120
  },
  {
    label: "角色信息",
    prop: "role",
    minWidth: 150,
    cellRenderer: ({ row }) => {
      return row.role ? (
        <span>{row.role.name}</span>
      ) : (
        <span class="text-gray-400">-</span>
      );
    }
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 180
  },
  {
    label: "操作",
    fixed: "right",
    width: 280,
    slot: "operation"
  }
];

// 事件处理
const handleRevoke = (row: UserRole) => {
  emit("revoke", row);
};

const handleViewUserRoles = (userId: string) => {
  emit("view-user-roles", userId);
};

const handleViewRoleUsers = (roleId: string) => {
  emit("view-role-users", roleId);
};

const handleSizeChange = (val: number) => {
  emit("page-size-change", val);
};

const handleCurrentChange = (val: number) => {
  emit("page-current-change", val);
};
</script>

<style lang="scss" scoped>
.reset-margin {
  margin: 0;
}
</style>
