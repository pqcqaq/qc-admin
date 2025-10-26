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
        :title="`是否确认删除地区 ${row.name}?`"
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
import type { Area } from "qc-admin-api-common/area";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: Area[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [data: Area];
  view: [data: Area];
  delete: [data: Area];
  "page-size-change": [size: number];
  "page-current-change": [page: number];
}>();

const tableRef = ref();

// 层级类型配置
const getLevelConfig = (level: string) => {
  const levelMap = {
    country: { type: "danger", text: "国家" },
    province: { type: "warning", text: "省份" },
    city: { type: "success", text: "城市" },
    district: { type: "primary", text: "区县" },
    street: { type: "info", text: "街道" }
  };
  return (
    levelMap[level] || {
      type: "info",
      text: level
    }
  );
};

// 表格列配置
const columns: TableColumnList = [
  {
    label: "地区ID",
    prop: "id",
    minWidth: 100
  },
  {
    label: "地区名称",
    prop: "name",
    minWidth: 120
  },
  {
    label: "层级类型",
    prop: "level",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const config = getLevelConfig(row.level);
      return <ElTag type={config.type}>{config.text}</ElTag>;
    }
  },
  {
    label: "深度",
    prop: "depth",
    minWidth: 80
  },
  {
    label: "地区编码",
    prop: "code",
    minWidth: 120
  },
  {
    label: "经纬度",
    prop: "location",
    minWidth: 180,
    cellRenderer: ({ row }) => {
      if (row.latitude && row.longitude) {
        return (
          <span>
            {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}
          </span>
        );
      }
      return (
        <span style="color: var(--el-text-color-placeholder)">未设置</span>
      );
    }
  },
  {
    label: "父级ID",
    prop: "parentId",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      return (
        row.parentId || (
          <span style="color: var(--el-text-color-placeholder)">无</span>
        )
      );
    }
  },
  {
    label: "颜色",
    prop: "color",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      if (row.color) {
        return (
          <div style="display: flex; align-items: center; gap: 8px;">
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                backgroundColor: row.color,
                border: "1px solid var(--el-border-color)"
              }}
            />
            <span>{row.color}</span>
          </div>
        );
      }
      return (
        <span style="color: var(--el-text-color-placeholder)">未设置</span>
      );
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
    width: 200,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: Area) => {
  emit("edit", row);
};

const handleView = (row: Area) => {
  emit("view", row);
};

const handleDelete = (row: Area) => {
  emit("delete", row);
};

const handleSizeChange = (size: number) => {
  emit("page-size-change", size);
};

const handleCurrentChange = (page: number) => {
  emit("page-current-change", page);
};
</script>

<style scoped lang="scss">
.reset-margin {
  margin-left: 0 !important;
}
</style>
