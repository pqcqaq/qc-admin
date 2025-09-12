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
      <el-form-item label="权限名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入权限名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="操作类型" prop="action">
        <el-input
          v-model="formData.action"
          placeholder="请输入操作类型，如：read、write、delete"
          clearable
        />
      </el-form-item>

      <el-form-item label="权限描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
          clearable
        />
      </el-form-item>

      <el-form-item label="权限域" prop="scopeId">
        <el-select
          v-model="formData.scopeId"
          placeholder="请选择权限域"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="scope in scopeOptions"
            :key="scope.id"
            :label="scope.name"
            :value="scope.id"
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
import { getAllScopes, type Permission, type Scope } from "@/api/rbac";

interface Props {
  visible: boolean;
  type: "add" | "edit";
  permissionData?: Permission;
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
const scopeOptions = ref<Scope[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增权限" : "编辑权限";
});

const formData = reactive({
  id: "",
  name: "",
  action: "",
  description: "",
  scopeId: ""
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入权限名称", trigger: "blur" }],
  action: [{ required: true, message: "请输入操作类型", trigger: "blur" }]
});

// 获取权限域选项
const getScopeOptions = async () => {
  try {
    const response = await getAllScopes();
    scopeOptions.value = response.data || [];
  } catch (error) {
    console.error("获取权限域列表失败:", error);
  }
};

// 重置表单
const resetForm = () => {
  formData.name = "";
  formData.action = "";
  formData.description = "";
  formData.scopeId = "";
};

// 填充表单数据
const fillFormData = () => {
  if (props.permissionData) {
    formData.name = props.permissionData.name || "";
    formData.action = props.permissionData.action || "";
    formData.description = props.permissionData.description || "";
    formData.scopeId = props.permissionData.scope?.id || "";
  }
};

// 监听数据变化
watch(
  () => props.visible,
  val => {
    if (val) {
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
      if (props.type === "edit" && props.permissionData) {
        submitData.id = props.permissionData.id;
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
  getScopeOptions();
});
</script>
