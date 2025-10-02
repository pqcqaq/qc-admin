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
import type { User } from "qc-admin-api-common/user";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: User[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [user: User];
  view: [user: User];
  delete: [user: User];
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
  // {
  //   label: "用户ID",
  //   prop: "id",
  //   minWidth: 100
  // },
  // 头像
  {
    label: "头像",
    prop: "avatar",
    width: 80,
    cellRenderer: ({ row }) => {
      if (!row.avatar) {
        return (
          <ElTag type="info" effect="plain">
            无
          </ElTag>
        );
      }
      return (
        <img
          src={row.avatar || "https://via.placeholder.com/40"}
          alt="avatar"
          style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
        />
      );
    }
  },
  {
    label: "用户名",
    prop: "name",
    minWidth: 120
  },
  {
    label: "年龄",
    prop: "age",
    minWidth: 80
  },
  {
    label: "性别",
    prop: "sex",
    minWidth: 80,
    cellRenderer: ({ row }) => {
      const sexMap = {
        male: "男",
        female: "女",
        other: "其他"
      };
      return sexMap[row.sex as keyof typeof sexMap] || row.sex;
    }
  },
  {
    label: "角色",
    prop: "roles",
    minWidth: 200,
    cellRenderer: ({ row }) => {
      return row.roles?.map(role => (
        <ElTag type="info" key={role} style="margin-right: 4px;">
          {role}
        </ElTag>
      ));
    }
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      return (
        <ElTag type={row.status === "active" ? "success" : "danger"}>
          {row.status === "active" ? "激活" : "禁用"}
        </ElTag>
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
    width: 180,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: User) => {
  emit("edit", row);
};

const handleView = (row: User) => {
  emit("view", row);
};

const handleDelete = (row: User) => {
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
