<template>
  <el-dialog v-model="dialogVisible" title="查看菜单" :width="600" draggable>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="菜单ID">
        {{ menuData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="菜单名称">
        <div class="flex items-center">
          <el-icon v-if="menuData.icon" class="mr-2">
            <component :is="menuData.icon" />
          </el-icon>
          <span>{{ menuData.name }}</span>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="菜单类型">
        <el-tag :type="getTypeTagType(menuData.type)" size="small">
          {{ getTypeText(menuData.type) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="排序">
        {{ menuData.order }}
      </el-descriptions-item>
      <el-descriptions-item v-if="menuData.type !== 'button'" label="路径">
        {{ menuData.path || "-" }}
      </el-descriptions-item>
      <el-descriptions-item v-if="menuData.type !== 'button'" label="组件">
        {{ menuData.component || "-" }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="menuData.type !== 'button'"
        label="重定向"
        :span="2"
      >
        {{ menuData.redirect || "-" }}
      </el-descriptions-item>
      <el-descriptions-item v-if="menuData.type === 'button'" label="操作">
        <el-tag type="primary">{{ menuData.action || "-" }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态" :span="2">
        <div class="flex gap-2">
          <el-tag v-if="menuData.hidden" type="warning" size="small"
            >隐藏</el-tag
          >
          <el-tag v-if="menuData.disabled" type="danger" size="small"
            >禁用</el-tag
          >
          <el-tag
            v-if="!menuData.hidden && !menuData.disabled"
            type="success"
            size="small"
            >正常</el-tag
          >
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="父级菜单" :span="2">
        <el-tag v-if="menuData.parent" type="info">
          {{ menuData.parent.name }}
        </el-tag>
        <span v-else class="text-gray-400">根菜单</span>
      </el-descriptions-item>
      <el-descriptions-item label="子菜单" :span="2">
        <div
          v-if="menuData.children && menuData.children.length > 0"
          class="flex flex-wrap gap-1"
        >
          <el-tag
            v-for="child in menuData.children"
            :key="child.id"
            size="small"
            type="info"
          >
            {{ child.name }}
          </el-tag>
        </div>
        <span v-else class="text-gray-400">无子菜单</span>
      </el-descriptions-item>
      <el-descriptions-item label="关联权限" :span="2">
        <div
          v-if="menuData.permissions && menuData.permissions.length > 0"
          class="flex flex-wrap gap-1"
        >
          <el-tag
            v-for="permission in menuData.permissions"
            :key="permission.id"
            size="small"
            type="success"
          >
            {{ permission.name }}({{ permission.action }})
          </el-tag>
        </div>
        <span v-else class="text-gray-400">暂无权限</span>
      </el-descriptions-item>
      <el-descriptions-item label="菜单描述" :span="2">
        {{ menuData.description || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ menuData.createTime }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ menuData.updateTime }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Scope } from "@/api/rbac";

interface Props {
  visible: boolean;
  menuData: Scope;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  menuData: () => ({}) as Scope
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
}>();

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

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

const handleClose = () => {
  emit("update:visible", false);
};
</script>
