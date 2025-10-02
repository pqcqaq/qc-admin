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
        @click="handleEdit(row)"
      >
        编辑
      </el-button>
      <el-button
        class="reset-margin"
        link
        type="success"
        size="small"
        @click="handleAssignPermissions(row)"
      >
        分配权限
      </el-button>
      <el-button
        class="reset-margin"
        link
        type="primary"
        size="small"
        @click="handleView(row)"
      >
        查看
      </el-button>
      <el-popconfirm
        :title="`是否确认删除角色${row.name}?`"
        @confirm="handleDelete(row)"
      >
        <template #reference>
          <el-button class="reset-margin" link type="danger" size="small">
            删除
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </pure-table>
</template>

<script setup lang="tsx">
import { ref } from "vue";
import { ElTag } from "element-plus";
import { PureTable } from "@pureadmin/table";
import type { Role } from "qc-admin-api-common/rbac";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: Role[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [role: Role];
  view: [role: Role];
  delete: [role: Role];
  "assign-permissions": [role: Role];
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
    label: "角色名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "角色描述",
    prop: "description",
    minWidth: 200,
    showOverflowTooltip: true,
    cellRenderer: ({ row }) => {
      return row.description || <span class="text-gray-400">-</span>;
    }
  },
  {
    label: "继承角色",
    prop: "inheritsFrom",
    minWidth: 150,
    cellRenderer: ({ row }) => {
      if (!row.inheritsFrom || row.inheritsFrom.length === 0) {
        return <span class="text-gray-400">-</span>;
      }
      return (
        <div class="flex flex-wrap gap-1">
          {row.inheritsFrom.map(parent => (
            <ElTag key={parent.id} size="small" type="warning">
              {parent.name}
            </ElTag>
          ))}
        </div>
      );
    }
  },
  {
    label: "权限数量",
    prop: "permissions",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const count = row.permissions?.length || 0;
      return <ElTag type={count > 0 ? "success" : "info"}>{count}个权限</ElTag>;
    }
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 180
  },
  {
    label: "更新时间",
    prop: "updateTime",
    minWidth: 180
  },
  {
    label: "操作",
    fixed: "right",
    width: 240,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: Role) => {
  emit("edit", row);
};

const handleView = (row: Role) => {
  emit("view", row);
};

const handleDelete = (row: Role) => {
  emit("delete", row);
};

const handleAssignPermissions = (row: Role) => {
  emit("assign-permissions", row);
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
