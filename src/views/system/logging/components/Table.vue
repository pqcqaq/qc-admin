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
        :title="`是否确认删除题目${row.id}?`"
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
import type { Logging } from "qc-admin-api-common/logging";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: Logging[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [data: Logging];
  view: [data: Logging];
  delete: [data: Logging];
  "page-size-change": [size: number];
  "page-current-change": [page: number];
}>();

const tableRef = ref();

// 表格列配置
const columns: TableColumnList = [
  {
    label: "日志级别",
    prop: "level",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const levelConfig = {
        debug: { type: "info", text: "DEBUG" },
        info: { type: "success", text: "INFO" },
        warn: { type: "warning", text: "WARN" },
        error: { type: "danger", text: "ERROR" },
        fatal: { type: "danger", text: "FATAL" }
      };
      const config = levelConfig[row.level] || {
        type: "info",
        text: row.level.toUpperCase()
      };
      return <ElTag type={config.type}>{config.text}</ElTag>;
    }
  },
  {
    label: "日志类型",
    prop: "type",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const typeConfig = {
        Error: { type: "danger", text: "错误" },
        Panic: { type: "danger", text: "崩溃" },
        manul: { type: "info", text: "手动" }
      };
      const config = typeConfig[row.type] || { type: "info", text: row.type };
      return <ElTag type={config.type}>{config.text}</ElTag>;
    }
  },
  {
    label: "消息内容",
    prop: "message",
    minWidth: 250,
    showOverflowTooltip: true
  },
  {
    label: "请求方法",
    prop: "method",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      if (!row.method) return "-";
      const methodColors = {
        GET: "success",
        POST: "primary",
        PUT: "warning",
        DELETE: "danger",
        PATCH: "info"
      };
      return (
        <ElTag type={methodColors[row.method] || "info"}>{row.method}</ElTag>
      );
    }
  },
  {
    label: "请求路径",
    prop: "path",
    minWidth: 200,
    showOverflowTooltip: true,
    cellRenderer: ({ row }) => row.path || "-"
  },
  {
    label: "IP地址",
    prop: "ip",
    minWidth: 120,
    cellRenderer: ({ row }) => row.ip || "-"
  },
  {
    label: "状态码",
    prop: "code",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      if (!row.code) return "-";
      const codeType =
        row.code >= 500
          ? "danger"
          : row.code >= 400
            ? "warning"
            : row.code >= 300
              ? "info"
              : "success";
      return <ElTag type={codeType}>{row.code}</ElTag>;
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
    width: 180,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: Logging) => {
  emit("edit", row);
};

const handleView = (row: Logging) => {
  emit("view", row);
};

const handleDelete = (row: Logging) => {
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
