<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEditing ? '编辑应用' : '新建应用'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="应用名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入应用名称" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入应用描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";

// Props
interface Props {
  visible: boolean;
  isEditing?: boolean;
  initialData?: {
    name: string;
    description: string;
  };
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  submitting: false,
  initialData: () => ({
    name: "",
    description: ""
  })
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [data: { name: string; description: string }];
  cancel: [];
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = ref({
  name: "",
  description: ""
});

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "请输入应用名称", trigger: "blur" }]
};

// 对话框可见性（双向绑定）
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 监听初始数据变化
watch(
  () => props.initialData,
  newData => {
    if (newData) {
      formData.value = { ...newData };
    }
  },
  { immediate: true, deep: true }
);

// 监听对话框打开
watch(
  () => props.visible,
  visible => {
    if (visible) {
      // 对话框打开时，重置表单数据
      formData.value = { ...props.initialData };
      // 清除验证状态
      formRef.value?.clearValidate();
    }
  }
);

// 事件处理
async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(valid => {
    if (valid) {
      emit("submit", { ...formData.value });
    }
  });
}

function handleCancel() {
  emit("cancel");
  emit("update:visible", false);
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<style lang="scss" scoped>
// 可以添加自定义样式
</style>
