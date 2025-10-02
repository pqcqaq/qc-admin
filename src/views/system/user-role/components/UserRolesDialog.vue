<template>
  <el-dialog v-model="dialogVisible" title="用户角色" :width="600" draggable>
    <div v-loading="loading">
      <div class="mb-4">
        <span class="font-medium">用户ID：</span>
        <span>{{ userId }}</span>
      </div>

      <el-table :data="userRoles" stripe>
        <el-table-column label="角色ID" prop="id" width="120" />
        <el-table-column label="角色名称" prop="name" />
        <el-table-column
          label="角色描述"
          prop="description"
          show-overflow-tooltip
        />
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
import { getUserRoles, type Role } from "qc-admin-api-common/rbac";

interface Props {
  visible: boolean;
  userId: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userId: ""
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
}>();

const loading = ref(false);
const userRoles = ref<Role[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

// 获取用户角色
const loadUserRoles = async () => {
  if (!props.userId) return;

  loading.value = true;
  try {
    const response = await getUserRoles(props.userId);
    userRoles.value = response.data || [];
  } catch (error) {
    console.error("获取用户角色失败:", error);
    ElMessage.error("获取用户角色失败");
  } finally {
    loading.value = false;
  }
};

// 监听显示状态
watch(
  () => props.visible,
  val => {
    if (val && props.userId) {
      loadUserRoles();
    }
  }
);

const handleClose = () => {
  emit("update:visible", false);
};
</script>
