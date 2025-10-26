<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    draggable
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="地区名称" prop="name">
            <el-input
              v-model="form.name"
              placeholder="请输入地区名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="层级类型" prop="level">
            <el-select
              v-model="form.level"
              placeholder="请选择层级类型"
              @change="handleLevelChange"
            >
              <el-option label="国家" value="country" />
              <el-option label="省份" value="province" />
              <el-option label="城市" value="city" />
              <el-option label="区县" value="district" />
              <el-option label="街道" value="street" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="深度" prop="depth">
            <el-input-number
              v-model="form.depth"
              :min="0"
              :max="10"
              placeholder="请输入深度"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地区编码" prop="code">
            <el-input
              v-model="form.code"
              placeholder="请输入地区编码"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="纬度" prop="latitude">
            <el-input-number
              v-model="form.latitude"
              :precision="6"
              :min="-90"
              :max="90"
              placeholder="请输入纬度"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="经度" prop="longitude">
            <el-input-number
              v-model="form.longitude"
              :precision="6"
              :min="-180"
              :max="180"
              placeholder="请输入经度"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="父级地区" prop="parentId">
            <el-input
              v-model="form.parentId"
              placeholder="请输入父级地区ID"
              clearable
            />
            <div class="form-tip">留空表示顶级地区</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="颜色" prop="color">
            <div style="display: flex; gap: 8px; width: 100%">
              <el-color-picker v-model="form.color" show-alpha />
              <el-input
                v-model="form.color"
                placeholder="请选择或输入颜色"
                clearable
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ loading ? "提交中..." : "确定" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { Area } from "qc-admin-api-common/area";

interface AreaFormData {
  id?: string;
  name: string;
  spell: string;
  level: "country" | "province" | "city" | "district" | "street" | "";
  depth: number;
  code: string;
  latitude?: number;
  longitude?: number;
  parentId?: string;
  color?: string;
}

const props = defineProps<{
  visible: boolean;
  type: "add" | "edit";
  data?: Area;
  loading: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [data: AreaFormData];
}>();

const formRef = ref<FormInstance>();

// 对话框显示状态的计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => {
    emit("update:visible", val);
    if (!val) {
      resetForm();
    }
  }
});

// 表单数据
const form = ref<AreaFormData>({
  name: "",
  spell: "",
  level: "",
  depth: 0,
  code: "",
  latitude: undefined,
  longitude: undefined,
  parentId: "",
  color: ""
});

// 对话框标题
const dialogTitle = computed(() => {
  return props.type === "add" ? "新增地区" : "编辑地区";
});

// 表单验证规则
const rules: FormRules = {
  name: [{ required: true, message: "请输入地区名称", trigger: "blur" }],
  level: [{ required: true, message: "请选择层级类型", trigger: "change" }],
  depth: [
    { required: true, message: "请输入深度", trigger: "blur" },
    {
      type: "number",
      min: 0,
      max: 10,
      message: "深度范围为0-10",
      trigger: "blur"
    }
  ],
  code: [{ required: true, message: "请输入地区编码", trigger: "blur" }]
};

// 监听对话框显示状态
watch(
  () => props.visible,
  val => {
    if (val) {
      if (props.type === "edit" && props.data) {
        // 编辑模式，填充数据
        form.value = {
          id: props.data.id,
          name: props.data.name,
          spell: props.data.spell || "",
          level: props.data.level,
          depth: props.data.depth,
          code: props.data.code,
          latitude: props.data.latitude,
          longitude: props.data.longitude,
          parentId: props.data.parentId || "",
          color: props.data.color || ""
        };
      } else {
        // 新增模式，重置表单
        resetForm();
      }
    }
  }
);

// 层级类型改变时，自动设置深度
const handleLevelChange = (level: string) => {
  const levelDepthMap = {
    country: 0,
    province: 1,
    city: 2,
    district: 3,
    street: 4
  };
  form.value.depth = levelDepthMap[level] ?? 0;
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 重置表单
const resetForm = () => {
  form.value = {
    name: "",
    spell: "",
    level: "",
    depth: 0,
    code: "",
    latitude: undefined,
    longitude: undefined,
    parentId: "",
    color: ""
  };
  formRef.value?.clearValidate();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(valid => {
    if (valid) {
      const submitData: any = { ...form.value };

      // 处理空值
      Object.keys(submitData).forEach(key => {
        if (
          submitData[key] === "" ||
          submitData[key] === null ||
          submitData[key] === undefined
        ) {
          delete submitData[key];
        }
      });

      emit("submit", submitData);
    }
  });
};
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
