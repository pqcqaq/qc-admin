<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    draggable
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <!-- 头像 -->
      <el-form-item label="头像">
        <UploadFormItem
          v-model="form.avatarId"
          :url="form.avatar"
          type="avatar"
          :limit="1"
          :auto-upload="true"
          placeholder="上传头像"
          :tip="'建议上传尺寸 512x512px 的图片，支持 jpg/png 格式，大小不超过 2MB'"
        />
      </el-form-item>
      <el-form-item label="用户名" prop="name">
        <el-input v-model="form.name" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="年龄" prop="age">
        <el-input-number
          v-model="form.age"
          :min="1"
          :max="150"
          placeholder="请输入年龄"
        />
      </el-form-item>
      <el-form-item label="性别" prop="sex">
        <el-select v-model="form.sex" placeholder="请选择性别">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option label="激活" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, watch } from "vue";
import { type FormInstance } from "element-plus";
import type { User } from "@/api/user";
import UploadFormItem from "@/components/Upload/UploadFormItem.vue";

interface UserFormData {
  id: string;
  name: string;
  age?: number;
  sex: string;
  status: string;
  avatarId?: string;
  avatar: string;
}

// 定义 props
const props = defineProps<{
  visible: boolean;
  type: "add" | "edit";
  userData?: User;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [formData: UserFormData];
}>();

const formRef = ref<FormInstance>();

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增用户" : "编辑用户";
});

// 表单数据
const form = reactive<UserFormData>({
  id: "",
  name: "",
  age: undefined,
  sex: "",
  status: "active",
  avatarId: undefined,
  avatar: ""
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 20, message: "用户名长度在 2 到 20 个字符", trigger: "blur" }
  ],
  age: [
    { type: "number" as const, message: "年龄必须是数字", trigger: "blur" }
  ],
  sex: [{ required: false, message: "请选择性别", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: "",
    name: "",
    age: undefined,
    sex: "",
    status: "active"
  });
};

// 监听弹窗显示和用户数据变化
watch(
  [() => props.visible, () => props.userData],
  ([newVisible, newData]) => {
    if (newVisible && newData && props.type === "edit") {
      Object.assign(form, {
        id: newData.id,
        name: newData.name,
        age: newData.age,
        sex: newData.sex,
        status: newData.status || "active",
        avatarId: newData.avatarId,
        avatar: newData.avatar
      });
    } else if (newVisible && props.type === "add") {
      resetForm();
    }
  },
  { immediate: true }
);

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVisible => {
    if (newVisible) {
      nextTick(() => {
        formRef.value?.clearValidate();
      });
    }
  }
);

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;
    emit("submit", { ...form });
  });
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
  resetForm();
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}
</style>
