<template>
  <div class="menu-table-container">
    <el-table
      ref="tableRef"
      :data="dataList"
      :loading="loading"
      row-key="id"
      :tree-props="{
        children: 'children',
        hasChildren: 'hasChildren'
      }"
      :header-cell-style="{
        background: 'var(--el-table-row-hover-bg-color)',
        color: 'var(--el-text-color-primary)',
        fontWeight: '600'
      }"
      default-expand-all
      stripe
      :row-style="getRowStyle"
      class="menu-tree-table"
    >
      <!-- 菜单名称列 -->
      <el-table-column
        prop="name"
        label="菜单名称"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="menu-name-content">
            <component
              :is="getIconComponent(row.icon)"
              v-if="row.icon"
              class="menu-icon"
              :class="{ 'has-children': row.children && row.children.length }"
            />
            <span class="menu-text">{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- 类型列 -->
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)" size="small" effect="light">
            {{ getTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 路径列 -->
      <el-table-column
        prop="path"
        label="路径"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <code v-if="row.path" class="path-code">{{ row.path }}</code>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>

      <!-- 组件列 -->
      <el-table-column
        prop="component"
        label="组件"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <code v-if="row.component" class="component-code">
            {{ row.component }}
          </code>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>

      <!-- 排序列 -->
      <el-table-column prop="order" label="排序" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info" effect="plain">
            {{ row.order }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 状态列 -->
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <div class="status-column">
            <el-tag
              v-if="row.hidden"
              type="warning"
              size="small"
              effect="light"
            >
              隐藏
            </el-tag>
            <el-tag
              v-if="row.disabled"
              type="danger"
              size="small"
              effect="light"
            >
              禁用
            </el-tag>
            <el-tag
              v-if="!row.hidden && !row.disabled"
              type="success"
              size="small"
              effect="light"
            >
              正常
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 创建时间列 -->
      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">
          <span class="create-time">{{ row.createTime }}</span>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" fixed="right" width="240" align="center">
        <template #default="{ row }">
          <div class="operation-buttons">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              <el-icon class="mr-1"><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              v-if="row.type === 'menu' || row.type === 'page'"
              link
              type="success"
              size="small"
              @click="handleAddChild(row)"
            >
              <el-icon class="mr-1"><Plus /></el-icon>
              {{ row.type === "menu" ? "添加子菜单" : "添加按钮" }}
            </el-button>
            <el-button link type="info" size="small" @click="handleView(row)">
              <el-icon class="mr-1"><View /></el-icon>
              查看
            </el-button>
            <el-popconfirm
              width="200"
              :title="`是否确认删除菜单「${row.name}」?`"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger" size="small">
                  <el-icon class="mr-1"><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElTag, ElIcon } from "element-plus";
import { Edit, Plus, View, Delete } from "@element-plus/icons-vue";
import type { Scope } from "qc-admin-api-common/rbac";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

// 定义 props
const props = defineProps<{
  dataList: Scope[];
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [menu: Scope];
  view: [menu: Scope];
  delete: [menu: Scope];
  "add-child": [parent: Scope];
}>();

const tableRef = ref();

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap = {
    menu: "primary",
    page: "success",
    button: "warning"
  };
  return typeMap[type] || "info";
};

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap = {
    menu: "菜单",
    page: "页面",
    button: "按钮"
  };
  return typeMap[type] || type;
};

// 获取行样式
const getRowStyle = ({ row, rowIndex }) => {
  // 根据层级添加不同的背景色
  const level = getNodeLevel(row);
  const baseStyle = {
    transition: "all 0.2s ease-in-out"
  };

  if (level === 0) {
    return {
      ...baseStyle,
      backgroundColor: "var(--el-table-tr-bg-color)"
    };
  } else if (level === 1) {
    return {
      ...baseStyle,
      backgroundColor: "var(--el-color-primary-light-9)"
    };
  } else {
    return {
      ...baseStyle,
      backgroundColor: "var(--el-color-info-light-9)"
    };
  }
};

// 获取图标组件
const getIconComponent = (iconName: string) => {
  if (!iconName) return null;

  // 如果图标名称已经包含前缀，直接使用
  if (iconName.includes(":")) {
    return useRenderIcon(iconName);
  }

  // 否则添加默认的ep:前缀
  return useRenderIcon(`ep:${iconName}`);
};

// 获取节点层级
const getNodeLevel = (node: Scope, level = 0): number => {
  if (!node.parentId) {
    return level;
  }

  // 在实际使用中，这里需要根据parentId找到父节点
  // 简化处理，根据路径深度估算层级
  const pathDepth = node.path ? node.path.split("/").length - 1 : 0;
  return Math.min(pathDepth, 3); // 最多3层
};

// 事件处理
const handleEdit = (row: Scope) => {
  emit("edit", row);
};

const handleView = (row: Scope) => {
  emit("view", row);
};

const handleDelete = (row: Scope) => {
  emit("delete", row);
};

const handleAddChild = (row: Scope) => {
  emit("add-child", row);
};
</script>

<style lang="scss" scoped>
.menu-table-container {
  background: #fff;
  border-radius: 8px;
  // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .menu-tree-table {
    border: none;

    :deep(.el-table__header) {
      th {
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-9) 0%,
          var(--el-color-primary-light-8) 100%
        );
        border-bottom: 2px solid var(--el-color-primary-light-6);
      }
    }

    :deep(.el-table__body) {
      tr {
        // &:hover {
        //   background-color: var(--el-color-primary-light-9) !important;
        //   transform: translateY(-1px);
        //   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        // }

        td {
          border-bottom: 1px solid var(--el-border-color-lighter);
          padding: 8px 0;
        }
      }
    }

    // 树形表格的展开折叠图标样式
    :deep(.el-table__expand-icon) {
      color: var(--el-color-primary);
      font-size: 16px;
      transition: all 0.3s ease;
      margin-right: 8px;

      &.el-table__expand-icon--expanded {
        transform: rotate(90deg);
        color: var(--el-color-success);
      }
    }

    // 确保树形缩进正确显示
    :deep(.el-table__indent) {
      display: inline-block;
    }

    // 调整树形表格单元格内容的对齐
    :deep(.el-table__body) {
      .el-table__cell {
        .cell {
          display: flex;
          align-items: center;
        }
      }
    }
  }
}

.menu-name-content {
  display: flex;
  align-items: center;
  position: relative;
  height: 32px;

  .menu-icon {
    margin-right: 6px;
    font-size: 14px;
    color: var(--el-color-primary);
    transition: all 0.3s ease;
    flex-shrink: 0;

    &.has-children {
      color: var(--el-color-success);
    }
  }

  .menu-text {
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-size: 13px;
    transition: color 0.3s ease;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.path-code,
.component-code {
  padding: 2px 6px;
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  border-radius: 4px;
  font-family: "Fira Code", "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-color-info-dark-2);
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-color-info-light-8);
    border-color: var(--el-color-info-light-6);
  }
}

.status-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 32px;
  justify-content: center;
}

.create-time {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-family: "Fira Code", "Monaco", "Consolas", monospace;
}

.operation-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;

  .el-button {
    margin: 0;
    padding: 2px 6px;
    font-size: 12px;
    border-radius: 4px;
    transition: all 0.3s ease;

    .el-icon {
      margin-right: 2px !important;
      font-size: 12px;
    }

    // &:hover {
    //   transform: translateY(-1px);
    //   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    // }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .menu-tree-table {
    :deep(.el-table__header) {
      th {
        font-size: 12px;
        padding: 8px 4px;
      }
    }

    :deep(.el-table__body) {
      td {
        font-size: 12px;
        padding: 8px 4px;
      }
    }
  }

  .operation-buttons {
    gap: 4px;

    .el-button {
      padding: 2px 6px;
      font-size: 11px;

      .el-icon {
        font-size: 10px;
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .menu-table-container {
    background: var(--el-bg-color);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }

  .path-code,
  .component-code {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);
  }
}
</style>
