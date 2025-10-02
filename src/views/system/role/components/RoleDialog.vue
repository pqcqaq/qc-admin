<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
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
      <el-form-item label="角色名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入角色名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="角色描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入角色描述"
          clearable
        />
      </el-form-item>

      <el-form-item label="继承角色" prop="inheritsFrom">
        <el-select
          v-model="formData.inheritsFrom"
          multiple
          placeholder="请选择继承的角色"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="role in availableRoles"
            :key="role.id"
            :label="role.name"
            :value="role.id"
            :disabled="role.id === currentRoleId"
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
import { getAllRoles, type Role } from "qc-admin-api-common/rbac";

interface Props {
  visible: boolean;
  type: "add" | "edit";
  roleData?: Role;
  loading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  type: "add",
  loading: false
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [data: any];
}>();

const ruleFormRef = ref<FormInstance>();
const availableRoles = ref<Role[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增角色" : "编辑角色";
});

const currentRoleId = computed(() => {
  return props.roleData?.id || "";
});

const formData = reactive({
  id: "",
  name: "",
  description: "",
  inheritsFrom: [] as string[]
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }]
});

// 获取可用角色选项
const getAvailableRoles = async () => {
  try {
    const response = await getAllRoles();
    availableRoles.value = response.data || [];
  } catch (error) {
    console.error("获取角色列表失败:", error);
  }
};

// 重置表单
const resetForm = () => {
  formData.name = "";
  formData.description = "";
  formData.inheritsFrom = [];
};

// 填充表单数据
const fillFormData = () => {
  if (props.roleData) {
    formData.name = props.roleData.name || "";
    formData.description = props.roleData.description || "";
    formData.inheritsFrom =
      props.roleData.inheritsFrom?.map(role => role.id) || [];
  }
};

// 监听数据变化
watch(
  () => props.visible,
  val => {
    if (val) {
      getAvailableRoles();
      if (props.type === "edit") {
        fillFormData();
      } else {
        resetForm();
      }
    }
  }
);

// 提交表单
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate(valid => {
    if (valid) {
      const submitData = { ...formData };
      if (props.type === "edit" && props.roleData) {
        submitData.id = props.roleData.id;
      }
      emit("submit", submitData);
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
  getAvailableRoles();
});
</script>
