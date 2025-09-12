<template>
  <el-dialog v-model="dialogVisible" title="查看权限" :width="500" draggable>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="权限ID">
        {{ permissionData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="权限名称">
        {{ permissionData.name }}
      </el-descriptions-item>
      <el-descriptions-item label="操作类型">
        <el-tag type="primary">{{ permissionData.action }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="权限域">
        <el-tag v-if="permissionData.scope" type="success">
          {{ permissionData.scope.name }}
        </el-tag>
        <span v-else class="text-gray-400">-</span>
      </el-descriptions-item>
      <el-descriptions-item label="权限描述" :span="2">
        {{ permissionData.description || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ permissionData.createTime }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ permissionData.updateTime }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Permission } from "@/api/rbac";

interface Props {
  visible: boolean;
  permissionData: Permission;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  permissionData: () => ({}) as Permission
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
