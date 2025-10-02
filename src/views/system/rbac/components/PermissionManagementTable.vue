<template>
  <div class="permission-management-table">
    <ContextMenu @show="handlePermissionContextMenuShow">
      <template #menu="{ close }">
        <div v-if="currentContextPermission" class="context-menu-content">
          <MenuGroup title="权限操作">
            <MenuItem
              :icon="View"
              variant="primary"
              @click="handleMenuCommand('view', close)"
            >
              查看权限详情
            </MenuItem>
            <MenuItem
              :icon="Edit"
              variant="warning"
              @click="handleMenuCommand('edit', close)"
            >
              编辑权限
            </MenuItem>
          </MenuGroup>

          <MenuDivider />

          <MenuItem
            :icon="Delete"
            variant="danger"
            @click="handleMenuCommand('delete', close)"
          >
            删除权限
          </MenuItem>
        </div>
      </template>

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
    </ContextMenu>
  </div>
</template>

<script setup lang="tsx">
import { ref } from "vue";
import { ElTag } from "element-plus";
import { PureTable } from "@pureadmin/table";
import { View, Edit, Delete } from "@element-plus/icons-vue";
import {
  ContextMenu,
  MenuItem,
  MenuGroup,
  MenuDivider
} from "@/components/Menu";
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

// 右键菜单相关
const currentContextPermission = ref<Permission | null>(null);

// 右键菜单显示处理
const handlePermissionContextMenuShow = (data: {
  event: MouseEvent;
  targetRef: HTMLElement;
  contextData: any;
}) => {
  const target = data.contextData.target as HTMLElement;
  const row = target.closest("tr");

  if (row && row.parentNode) {
    // 查找tbody中的所有tr元素（排除thead）
    const tbody = row.closest("tbody");
    if (tbody) {
      const dataRows = Array.from(tbody.querySelectorAll("tr"));
      const index = dataRows.indexOf(row);

      if (index >= 0 && index < props.dataList.length) {
        currentContextPermission.value = props.dataList[index];
        console.log(
          "Selected permission:",
          currentContextPermission.value,
          "at index:",
          index
        );
      }
    }
  }
};

// 菜单命令处理
const handleMenuCommand = (command: string, close: () => void) => {
  if (!currentContextPermission.value) return;

  close();
  const permission = currentContextPermission.value;

  switch (command) {
    case "view":
      emit("view", permission);
      break;
    case "edit":
      emit("edit", permission);
      break;
    case "delete":
      emit("delete", permission);
      break;
  }

  currentContextPermission.value = null;
};

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
  // 使用该权限的角色
  {
    label: "使用该权限的角色",
    prop: "roles",
    minWidth: 200,
    cellRenderer: ({ row }) => {
      return row.roles && row.roles.length > 0 ? (
        row.roles.map((role: any) => (
          <ElTag key={role.id} type="success" style="margin-right: 4px;">
            {role.name}
          </ElTag>
        ))
      ) : (
        <ElTag type="info">无角色</ElTag>
      );
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
