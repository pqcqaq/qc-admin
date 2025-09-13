<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :width="600"
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
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="菜单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入菜单名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="菜单类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择菜单类型"
              style="width: 100%"
              @change="handleTypeChange"
            >
              <el-option
                v-for="option in typeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type !== 'button'" :gutter="20">
        <el-col :span="12">
          <el-form-item label="图标" prop="icon">
            <IconSelect v-model="formData.icon" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="图标预览">
            <div class="icon-preview">
              <component
                :is="getIconComponent(formData.icon)"
                v-if="formData.icon"
                class="preview-icon"
              />
              <span v-else class="no-icon-text">未选择图标</span>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="排序" prop="order">
            <el-input-number
              v-model="formData.order"
              :min="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="菜单描述" prop="description">
            <el-input
              v-model="formData.description"
              placeholder="请输入菜单描述"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="关联权限" prop="permissionId">
            <el-select
              v-model="formData.permissionId"
              placeholder="请选择关联的权限"
              filterable
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="permission in permissionOptions"
                :key="permission.id"
                :label="`${permission.name} (${permission.action})`"
                :value="permission.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type !== 'button'" :gutter="20">
        <el-col :span="12">
          <el-form-item label="路径" prop="path">
            <el-input
              v-model="formData.path"
              placeholder="请输入路径"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="组件" prop="component">
            <el-select
              v-model="formData.component"
              placeholder="请选择组件"
              filterable
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="comp in componentOptions"
                :key="comp.value"
                :label="comp.label"
                :value="comp.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col v-if="formData.type !== 'button'" :span="12">
          <el-form-item label="重定向" prop="redirect">
            <el-input
              v-model="formData.redirect"
              placeholder="请输入重定向地址"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="formData.type !== 'button' ? 12 : 24">
          <el-form-item label="父级菜单" prop="parentId">
            <el-tree-select
              v-model="formData.parentId"
              :data="filteredMenuTreeOptions"
              placeholder="请选择父级菜单"
              clearable
              check-strictly
              :props="{ label: 'name', value: 'id' }"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type === 'button'" :gutter="20">
        <el-col :span="24">
          <el-form-item label="操作" prop="action">
            <el-input
              v-model="formData.action"
              placeholder="请输入操作类型，如：add、edit、delete"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type !== 'button'" :gutter="20">
        <el-col :span="12">
          <el-form-item label="是否隐藏">
            <el-switch v-model="formData.hidden" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否禁用">
            <el-switch v-model="formData.disabled" />
          </el-form-item>
        </el-col>
      </el-row>
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
import {
  getScopeTree,
  type Scope,
  getAllPermissions,
  type Permission
} from "@/api/rbac";
import { IconSelect } from "@/components/ReIcon";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

interface Props {
  visible?: boolean;
  type?: "add" | "edit";
  menuData?: Scope;
  parentMenu?: Scope;
  loading?: boolean;
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
const menuTreeOptions = ref<Scope[]>([]);
const componentOptions = ref<{ label: string; value: string }[]>([]);
const permissionOptions = ref<Permission[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

const dialogTitle = computed(() => {
  if (props.type === "add") {
    if (props.parentMenu) {
      if (props.parentMenu.type === "page") {
        return `新增按钮 - ${props.parentMenu.name}`;
      } else {
        return `新增子菜单 - ${props.parentMenu.name}`;
      }
    }
    return "新增菜单";
  }
  return "编辑菜单";
});

// 计算可选的类型选项
const typeOptions = computed(() => {
  if (props.parentMenu?.type === "page") {
    // 如果父级是页面，只能添加按钮
    return [{ label: "按钮", value: "button" }];
  } else if (props.parentMenu?.type === "menu") {
    // 如果父级是菜单，可以添加菜单或页面
    return [
      { label: "菜单", value: "menu" },
      { label: "页面", value: "page" }
    ];
  } else {
    // 顶级菜单，可以是菜单或页面
    return [
      { label: "菜单", value: "menu" },
      { label: "页面", value: "page" }
    ];
  }
});

// 过滤后的菜单树选项（根据当前类型决定可选择的父级）
const filteredMenuTreeOptions = computed(() => {
  if (formData.type === "button") {
    // 按钮只能选择菜单或页面作为父级
    return filterMenuTree(menuTreeOptions.value, ["menu", "page"]);
  } else {
    // 菜单和页面可以选择菜单作为父级
    return filterMenuTree(menuTreeOptions.value, ["menu"]);
  }
});

// 递归过滤菜单树
const filterMenuTree = (menus: Scope[], allowedTypes: string[]): Scope[] => {
  return menus
    .filter(menu => allowedTypes.includes(menu.type))
    .map(menu => ({
      ...menu,
      children: menu.children ? filterMenuTree(menu.children, allowedTypes) : []
    }));
};

const formData = reactive({
  name: "",
  type: "menu",
  icon: "",
  description: "",
  action: "",
  path: "",
  component: "",
  redirect: "",
  order: 0,
  hidden: false,
  disabled: false,
  parentId: "",
  permissionId: ""
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择菜单类型", trigger: "change" }],
  order: [{ required: true, message: "请输入排序", trigger: "blur" }]
});

// 获取图标组件
const getIconComponent = (iconName: string) => {
  if (!iconName) return null;

  // 如果图标名称已经包含前缀，直接使用
  if (iconName.includes(":")) {
    return useRenderIcon(iconName);
  }

  // 否则添加默认的ep:前缀
  return useRenderIcon(`ep:${iconName}`);
};

// 获取所有Vue组件
const getComponentOptions = () => {
  // 使用import.meta.glob获取views目录下的所有vue文件
  const modules = import.meta.glob("@/views/**/*.vue");
  const options: { label: string; value: string }[] = [];

  for (const path in modules) {
    // 提取相对于views的路径
    const relativePath = path.replace("/src/views/", "").replace(".vue", "");
    // 生成标签名
    const label = relativePath.replace(/\//g, " / ");

    options.push({
      label: `views/${relativePath}.vue (${label})`,
      value: `views/${relativePath}.vue`
    });
  }

  // 添加Layout组件
  options.unshift({
    label: "Layout (布局组件)",
    value: "Layout"
  });

  componentOptions.value = options.sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

// 获取权限选项
const getPermissionOptions = async () => {
  try {
    const response = await getAllPermissions();
    permissionOptions.value = response.data || [];
  } catch (error) {
    console.error("获取权限列表失败:", error);
  }
};

// 获取菜单树选项
const getMenuTreeOptions = async () => {
  try {
    const response = await getScopeTree();
    menuTreeOptions.value = response.data || [];
  } catch (error) {
    console.error("获取菜单树失败:", error);
  }
};

// 类型改变处理
const handleTypeChange = (type: string) => {
  if (type === "button") {
    formData.path = "";
    formData.component = "";
    formData.redirect = "";
    // 按钮类型时，如果当前父级不是菜单或页面，则清空父级
    if (formData.parentId) {
      const parent = findMenuById(menuTreeOptions.value, formData.parentId);
      if (parent && !["menu", "page"].includes(parent.type)) {
        formData.parentId = "";
      }
    }
  } else {
    formData.action = "";
    // 菜单和页面类型时，如果当前父级不是菜单，则清空父级
    if (formData.parentId) {
      const parent = findMenuById(menuTreeOptions.value, formData.parentId);
      if (parent && parent.type !== "menu") {
        formData.parentId = "";
      }
    }
  }
};

// 根据ID查找菜单项
const findMenuById = (menus: Scope[], id: string): Scope | null => {
  for (const menu of menus) {
    if (menu.id === id) {
      return menu;
    }
    if (menu.children) {
      const found = findMenuById(menu.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 重置表单
const resetForm = () => {
  formData.name = "";
  // 根据父级菜单类型设置默认类型
  if (props.parentMenu?.type === "page") {
    formData.type = "button";
  } else {
    formData.type = "menu";
  }
  formData.icon = "";
  formData.description = "";
  formData.action = "";
  formData.path = "";
  formData.component = "";
  formData.redirect = "";
  formData.order = 0;
  formData.hidden = false;
  formData.disabled = false;
  formData.parentId = props.parentMenu?.id || "";
  formData.permissionId = "";
};

// 填充表单数据
const fillFormData = () => {
  if (props.menuData) {
    formData.name = props.menuData.name || "";
    formData.type = props.menuData.type || "menu";
    // 确保图标格式正确
    let iconValue = props.menuData.icon || "";
    if (iconValue && !iconValue.includes(":")) {
      iconValue = `ep:${iconValue}`;
    }
    formData.icon = iconValue;
    formData.description = props.menuData.description || "";
    formData.action = props.menuData.action || "";
    formData.path = props.menuData.path || "";
    formData.component = props.menuData.component || "";
    formData.redirect = props.menuData.redirect || "";
    formData.order = props.menuData.order || 0;
    formData.hidden = props.menuData.hidden || false;
    formData.disabled = props.menuData.disabled || false;
    formData.parentId = props.menuData.parentId || "";
    formData.permissionId = props.menuData.permission?.id || "";
  }
};

// 监听数据变化
watch(
  () => props.visible,
  val => {
    if (val) {
      getMenuTreeOptions();
      getPermissionOptions();
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
      const submitData = { ...formData, id: undefined };
      if (props.type === "edit" && props.menuData) {
        submitData.id = props.menuData.id;
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
  getComponentOptions();
  getMenuTreeOptions();
  getPermissionOptions();
});
</script>

<style lang="scss" scoped>
.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background-color: var(--el-bg-color-page);

  .preview-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .no-icon-text {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
