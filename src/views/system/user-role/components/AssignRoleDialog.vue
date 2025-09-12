<template>
  <el-dialog
    v-model="dialogVisible"
    title="分配角色"
    :width="500"
    draggable
    :before-close="handleClose"
  >
    <el-form
      ref="ruleFormRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      label-position="right"
    >
      <el-form-item label="选择用户" prop="userId">
        <el-select
          v-model="formData.userId"
          placeholder="请选择用户"
          filterable
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择角色" prop="roleId">
        <el-select
          v-model="formData.roleId"
          placeholder="请选择角色"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit(ruleFormRef)"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { getAllRoles, type Role } from "@/api/rbac";
import { getUserList, type User } from "@/api/user";

interface Props {
  visible: boolean;
  loading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [data: { userId: string; roleId: string }];
}>();

const ruleFormRef = ref<FormInstance>();
const userOptions = ref<User[]>([]);
const roleOptions = ref<Role[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

const formData = reactive({
  userId: "",
  roleId: ""
});

const formRules = reactive<FormRules>({
  userId: [{ required: true, message: "请选择用户", trigger: "change" }],
  roleId: [{ required: true, message: "请选择角色", trigger: "change" }]
});

// 获取用户选项
const getUserOptions = async () => {
  try {
    const response = await getUserList();
    userOptions.value = response.data || [];
  } catch (error) {
    console.error("获取用户列表失败:", error);
  }
};

// 获取角色选项
const getRoleOptions = async () => {
  try {
    const response = await getAllRoles();
    roleOptions.value = response.data || [];
  } catch (error) {
    console.error("获取角色列表失败:", error);
  }
};

// 重置表单
const resetForm = () => {
  formData.userId = "";
  formData.roleId = "";
};

// 监听数据变化
watch(
  () => props.visible,
  val => {
    if (val) {
      resetForm();
      getUserOptions();
      getRoleOptions();
    }
  }
);

// 提交表单
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(valid => {
    if (valid) {
      emit("submit", { ...formData });
    } else {
      ElMessage.error("请填写完整的表单数据");
    }
  });
};

// 关闭对话框
const handleClose = () => {
  ruleFormRef.value?.resetFields();
  emit("update:visible", false);
};

onMounted(() => {
  getUserOptions();
  getRoleOptions();
});
</script>
