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
      <el-button
        class="reset-margin"
        link
        type="success"
        size="small"
        @click="handleManageRoles(row)"
      >
        管理角色
      </el-button>
      <el-popconfirm
        :title="`是否确认删除设备 ${row.name}?`"
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
import { ElMessage, ElTag, ElTooltip } from "element-plus";
import { PureTable } from "@pureadmin/table";
import type { ClientDevice } from "@/api/client_devices";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: ClientDevice[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [data: ClientDevice];
  view: [data: ClientDevice];
  delete: [data: ClientDevice];
  "manage-roles": [data: ClientDevice];
  "page-size-change": [size: number];
  "page-current-change": [page: number];
}>();

const tableRef = ref();

// 格式化时间
const formatTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟`;
  } else {
    return `${seconds}秒`;
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 表格列配置
const columns: TableColumnList = [
  {
    label: "设备名称",
    prop: "name",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "设备备注",
    prop: "description",
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: "设备标识",
    prop: "code",
    minWidth: 180,
    cellRenderer: ({ row }) => (
      <ElTooltip content={"点击复制: " + row.code} placement="top">
        <span
          style={{
            cursor: "pointer",
            color: "#409EFF",
            textDecoration: "underline"
          }}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(row.code);
              ElMessage.success("复制成功！");
            } catch (err) {
              ElMessage.error("复制失败，请重试");
              console.error("复制失败:", err);
            }
          }}
        >
          {row.code.length > 18 ? `${row.code.substring(0, 18)}...` : row.code}
        </span>
      </ElTooltip>
    )
  },
  {
    label: "状态",
    prop: "enabled",
    minWidth: 80,
    cellRenderer: ({ row }) => (
      <ElTag type={row.enabled ? "success" : "danger"}>
        {row.enabled ? "启用" : "禁用"}
      </ElTag>
    )
  },
  {
    label: "登录模式",
    prop: "anonymous",
    minWidth: 100,
    cellRenderer: ({ row }) => (
      <ElTag type={row.anonymous ? "warning" : "primary"}>
        {row.anonymous ? "匿名登录" : "角色限制"}
      </ElTag>
    )
  },
  {
    label: "关联角色",
    prop: "roles",
    minWidth: 200,
    cellRenderer: ({ row }) => {
      if (row.anonymous) {
        return <span style="color: #909399;">允许所有角色</span>;
      }

      if (!row.roles || row.roles.length === 0) {
        return <span style="color: #909399;">未设置角色</span>;
      }

      return (
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          {row.roles.slice(0, 3).map(role => (
            <ElTag key={role.id} size="small" type="info">
              {role.name}
            </ElTag>
          ))}
          {row.roles.length > 3 && (
            <ElTag size="small" type="info">
              +{row.roles.length - 3}
            </ElTag>
          )}
        </div>
      );
    }
  },
  {
    label: "AccessToken过期时间",
    prop: "accessTokenExpiry",
    minWidth: 150,
    cellRenderer: ({ row }) => formatTime(row.accessTokenExpiry)
  },
  {
    label: "RefreshToken过期时间",
    prop: "refreshTokenExpiry",
    minWidth: 150,
    cellRenderer: ({ row }) => formatTime(row.refreshTokenExpiry)
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 180,
    cellRenderer: ({ row }) => formatDate(row.createTime)
  },
  {
    label: "更新时间",
    prop: "updateTime",
    minWidth: 180,
    cellRenderer: ({ row }) => formatDate(row.updateTime)
  },
  {
    label: "操作",
    fixed: "right",
    width: 260,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: ClientDevice) => {
  emit("edit", row);
};

const handleView = (row: ClientDevice) => {
  emit("view", row);
};

const handleDelete = (row: ClientDevice) => {
  emit("delete", row);
};

const handleManageRoles = (row: ClientDevice) => {
  emit("manage-roles", row);
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
