<template>
  <el-dialog v-model="dialogVisible" title="查看角色" :width="600" draggable>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="角色ID">
        {{ roleData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="角色名称">
        {{ roleData.name }}
      </el-descriptions-item>
      <el-descriptions-item label="角色描述" :span="2">
        {{ roleData.description || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="继承角色" :span="2">
        <div
          v-if="roleData.inheritsFrom && roleData.inheritsFrom.length > 0"
          class="flex flex-wrap gap-1"
        >
          <el-tag
            v-for="parent in roleData.inheritsFrom"
            :key="parent.id"
            size="small"
            type="warning"
          >
            {{ parent.name }}
          </el-tag>
        </div>
        <span v-else class="text-gray-400">-</span>
      </el-descriptions-item>
      <el-descriptions-item label="子角色" :span="2">
        <div
          v-if="roleData.inheritedBy && roleData.inheritedBy.length > 0"
          class="flex flex-wrap gap-1"
        >
          <el-tag
            v-for="child in roleData.inheritedBy"
            :key="child.id"
            size="small"
            type="info"
          >
            {{ child.name }}
          </el-tag>
        </div>
        <span v-else class="text-gray-400">-</span>
      </el-descriptions-item>
      <el-descriptions-item label="拥有权限" :span="2">
        <div
          v-if="roleData.permissions && roleData.permissions.length > 0"
          class="flex flex-wrap gap-1"
        >
          <el-tag
            v-for="permission in roleData.permissions"
            :key="permission.id"
            size="small"
            type="success"
          >
            {{ permission.name }}({{ permission.action }})
          </el-tag>
        </div>
        <span v-else class="text-gray-400">暂无权限</span>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ roleData.createTime }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ roleData.updateTime }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Role } from "@/api/rbac";

interface Props {
  visible: boolean;
  roleData: Role;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  roleData: () => ({}) as Role
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

const handleClose = () => {
  emit("update:visible", false);
};
</script>
