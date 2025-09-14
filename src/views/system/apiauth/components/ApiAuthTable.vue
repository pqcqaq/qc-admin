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
        :title="`是否确认删除用户${row.name}?`"
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
import type { APIAuth } from "@/api/api_auth";
import { Permission } from "@/api/rbac";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: APIAuth[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [user: APIAuth];
  view: [user: APIAuth];
  delete: [user: APIAuth];
  "page-size-change": [size: number];
  "page-current-change": [page: number];
}>();

const tableRef = ref();

// 表格列配置
const columns: TableColumnList = [
  {
    label: "名称",
    prop: "name",
    minWidth: 150
  },
  {
    label: "简介",
    prop: "description",
    minWidth: 92,
    cellRenderer: ({ row }) => {
      if (!row.description) {
        return (
          <ElTag type="info" effect="plain">
            无
          </ElTag>
        );
      }
      // tooltip 显示完整描述
      return (
        <el-tooltip content={row.description} placement="top">
          <span>
            {row.description.length > 10
              ? row.description.slice(0, 10) + "..."
              : row.description}
          </span>
        </el-tooltip>
      );
    }
  },
  // 请求方式
  {
    label: "请求方式",
    prop: "method",
    minWidth: 50
  },
  // path
  {
    label: "请求地址",
    prop: "path",
    minWidth: 200
  },
  // 公开
  {
    label: "公开",
    prop: "isPublic",
    minWidth: 80,
    cellRenderer: ({ row }) => {
      return (
        <ElTag type={row.isPublic ? "success" : "danger"}>
          {row.isPublic ? "公开" : "私有"}
        </ElTag>
      );
    }
  },
  // 权限
  {
    label: "权限",
    prop: "isPublic",
    minWidth: 120,
    cellRenderer: ({ row }) => {
      if (row.isPublic) {
        return <ElTag type="success">Public</ElTag>;
      }
      if (!row.permissions || row.permissions.length === 0) {
        return (
          <ElTag type="info" effect="plain">
            无
          </ElTag>
        );
      }
      return (
        // 自动换行等
        <div style="display: flex; flex-wrap: wrap; max-width: 300px;">
          {row.permissions.map((perm: Permission) => (
            <ElTag type="info" key={perm.id} style="margin: 2px;">
              {perm.action}
            </ElTag>
          ))}
        </div>
      );
    }
  },
  // 启用
  {
    label: "启用",
    prop: "enabled",
    minWidth: 80,
    cellRenderer: ({ row }) => {
      return (
        <ElTag type={row.isActive ? "success" : "warning"}>
          {row.isActive ? "启用" : "禁用"}
        </ElTag>
      );
    }
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 150
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: APIAuth) => {
  emit("edit", row);
};

const handleView = (row: APIAuth) => {
  emit("view", row);
};

const handleDelete = (row: APIAuth) => {
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
