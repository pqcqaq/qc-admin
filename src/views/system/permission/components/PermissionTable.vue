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
        type="primary"
        size="small"
        @click="handleView(row)"
      >
        查看
      </el-button>
      <el-popconfirm
        :title="`是否确认删除权限${row.name}?`"
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
import type { Permission } from "qc-admin-api-common/rbac";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: Permission[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [permission: Permission];
  view: [permission: Permission];
  delete: [permission: Permission];
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
    label: "权限名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "操作类型",
    prop: "action",
    minWidth: 120,
    cellRenderer: ({ row }) => {
      return <ElTag type="primary">{row.action}</ElTag>;
    }
  },
  {
    label: "公共权限",
    prop: "isPublic",
    minWidth: 50,
    cellRenderer: ({ row }) => {
      return row.isPublic ? (
        <ElTag type="success">是</ElTag>
      ) : (
        <ElTag type="info">否</ElTag>
      );
    }
  },
  {
    label: "权限描述",
    prop: "description",
    minWidth: 200,
    showOverflowTooltip: true
  },
  // {
  //   label: "权限域",
  //   prop: "scope",
  //   minWidth: 150,
  //   cellRenderer: ({ row }) => {
  //     return row.scope ? (
  //       <ElTag type="success">{row.scope.name}</ElTag>
  //     ) : (
  //       <span class="text-gray-400">-</span>
  //     );
  //   }
  // },
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
    width: 180,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: Permission) => {
  emit("edit", row);
};

const handleView = (row: Permission) => {
  emit("view", row);
};

const handleDelete = (row: Permission) => {
  emit("delete", row);
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
