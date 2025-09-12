<template>
  <el-dialog v-model="dialogVisible" title="角色用户" :width="600" draggable>
    <div v-loading="loading">
      <div class="mb-4">
        <span class="font-medium">角色ID：</span>
        <span>{{ roleId }}</span>
      </div>

      <el-table :data="roleUsers" stripe>
        <el-table-column label="用户ID" prop="id" width="120" />
        <el-table-column label="用户名" prop="name" />
        <el-table-column label="年龄" prop="age" width="80" />
        <el-table-column label="性别" prop="sex" width="80" />
        <el-table-column label="状态" prop="status" width="100" />
        <el-table-column label="创建时间" prop="createTime" width="180" />
      </el-table>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { getRoleUsers } from "@/api/rbac";

interface Props {
  visible: boolean;
  roleId: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  roleId: ""
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
}>();

const loading = ref(false);
const roleUsers = ref<any[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

// 获取角色用户
const loadRoleUsers = async () => {
  if (!props.roleId) return;

  loading.value = true;
  try {
    const response = await getRoleUsers(props.roleId);
    roleUsers.value = response.data || [];
  } catch (error) {
    console.error("获取角色用户失败:", error);
    ElMessage.error("获取角色用户失败");
  } finally {
    loading.value = false;
  }
};

// 监听显示状态
watch(
  () => props.visible,
  val => {
    if (val && props.roleId) {
      loadRoleUsers();
    }
  }
);

const handleClose = () => {
  emit("update:visible", false);
};
</script>
