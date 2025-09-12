<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="500px"
    :before-close="handleClose"
    @update:model-value="updateVisible"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
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

      <el-form-item
        v-if="type !== 'createChild'"
        label="继承角色"
        prop="inheritsFrom"
      >
        <el-select
          v-model="formData.inheritsFrom"
          multiple
          placeholder="选择要继承的角色"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="role in availableRoles"
            :key="role.id"
            :label="role.name"
            :value="role.id"
            :disabled="isRoleDisabled(role)"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="type === 'createChild'" label="父角色">
        <el-input :model-value="parentRole?.name" disabled />
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
import { ref, reactive, computed, watch, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { Role } from "@/api/rbac";
import { getAllRoles } from "@/api/rbac";

interface Props {
  visible: boolean;
  type: "create" | "edit" | "createChild";
  roleData?: Role | null;
  parentRole?: Role | null;
  loading?: boolean;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "submit", formData: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  roleData: null,
  parentRole: null,
  loading: false
});

const emit = defineEmits<Emits>();

// 响应式数据
const formRef = ref<FormInstance>();
const availableRoles = ref<Role[]>([]);

// 表单数据
const formData = reactive({
  name: "",
  description: "",
  inheritsFrom: [] as string[]
});

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: "请输入角色名称", trigger: "blur" },
    { min: 2, max: 50, message: "角色名称长度为 2-50 个字符", trigger: "blur" }
  ],
  description: [
    { max: 200, message: "角色描述不能超过 200 个字符", trigger: "blur" }
  ]
};

// 计算属性
const dialogTitle = computed(() => {
  switch (props.type) {
    case "create":
      return "创建角色";
    case "edit":
      return "编辑角色";
    case "createChild":
      return "创建子角色";
    default:
      return "角色表单";
  }
});

// 判断角色是否禁用（防止循环继承）
const isRoleDisabled = (role: Role) => {
  if (props.type === "edit" && props.roleData) {
    // 编辑时，不能选择自己
    if (role.id === props.roleData.id) return true;

    // 不能选择自己的子角色（防止循环继承）
    return isDescendant(role, props.roleData);
  }
  return false;
};

// 检查是否是后代角色
const isDescendant = (role: Role, ancestor: Role): boolean => {
  if (!role.inheritsFrom?.length) return false;

  return role.inheritsFrom.some(parent => {
    if (parent.id === ancestor.id) return true;
    return isDescendant(parent, ancestor);
  });
};

// 更新可见性
const updateVisible = (value: boolean) => {
  emit("update:visible", value);
};

// 处理关闭
const handleClose = () => {
  resetForm();
  updateVisible(false);
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    const submitData: any = {
      name: formData.name,
      description: formData.description
    };

    if (props.type === "createChild" && props.parentRole) {
      // 创建子角色时，自动继承父角色
      submitData.inheritsFrom = [props.parentRole.id];
    } else if (props.type !== "createChild") {
      // 其他情况使用表单选择的继承角色
      submitData.inheritsFrom = formData.inheritsFrom;
    }

    emit("submit", submitData);
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(formData, {
    name: "",
    description: "",
    inheritsFrom: []
  });
};

// 初始化表单数据
const initFormData = () => {
  if (props.type === "edit" && props.roleData) {
    formData.name = props.roleData.name;
    formData.description = props.roleData.description || "";
    formData.inheritsFrom =
      props.roleData.inheritsFrom?.map(role => role.id) || [];
  } else {
    resetForm();
  }
};

// 加载可用角色列表
const loadAvailableRoles = async () => {
  try {
    const response = await getAllRoles();
    availableRoles.value = response.data || [];
  } catch (error) {
    console.error("加载角色列表失败:", error);
    availableRoles.value = [];
  }
};

// 监听显示状态变化
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      initFormData();
      loadAvailableRoles();
    }
  }
);

onMounted(() => {
  if (props.visible) {
    initFormData();
    loadAvailableRoles();
  }
});
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
