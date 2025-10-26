<template>
  <div class="area-selector">
    <el-cascader
      :key="cascaderKey"
      ref="cascaderRef"
      v-model="selectedIds"
      :props="cascaderProps"
      :placeholder="placeholder"
      :clearable="clearable"
      :filterable="filterable"
      :disabled="disabled"
      :show-all-levels="showAllLevels"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      :max-collapse-tags="maxCollapseTags"
      :separator="separator"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { getAreasByParentId, type Area } from "qc-admin-api-common/area";

interface AreaSelectorProps {
  /** v-model绑定的地区ID列表 */
  modelValue?: string[];
  /** v-model:current绑定的当前最后一级地区ID */
  current?: string;
  /** 选择级别限制，如设置为3表示最多选择到第3级(city) */
  maxLevel?: number;
  /** 限制在某个地区下的子项选择 */
  parentAreaId?: string;
  /** 是否可以选择任意一级，不必选到最后一级 */
  checkStrictly?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否可搜索 */
  filterable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示完整路径 */
  showAllLevels?: boolean;
  /** 是否折叠标签 */
  collapseTags?: boolean;
  /** 是否显示折叠标签的提示 */
  collapseTagsTooltip?: boolean;
  /** 最大折叠标签数量 */
  maxCollapseTags?: number;
  /** 分隔符 */
  separator?: string;
}

const props = withDefaults(defineProps<AreaSelectorProps>(), {
  modelValue: () => [],
  current: "",
  maxLevel: undefined,
  parentAreaId: "",
  checkStrictly: false,
  placeholder: "请选择地区",
  clearable: true,
  filterable: true,
  disabled: false,
  showAllLevels: true,
  collapseTags: false,
  collapseTagsTooltip: true,
  maxCollapseTags: 1,
  separator: " / "
});

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  "update:current": [value: string];
  change: [value: string[], currentId: string];
}>();

// 选中的ID列表
const selectedIds = ref<string[]>([]);
const loading = ref(false);
const cascaderRef = ref();
const cascaderKey = ref(0);

// 级别映射
const levelMap = {
  country: 0,
  province: 1,
  city: 2,
  district: 3,
  street: 4
};

// Cascader配置 - 始终使用懒加载
const cascaderProps = computed(() => ({
  value: "id",
  label: "name",
  lazy: true,
  lazyLoad: lazyLoad,
  checkStrictly: props.checkStrictly,
  emitPath: true
}));

// 懒加载函数
const lazyLoad = async (node: any, resolve: any) => {
  const { level, value } = node;

  // 检查是否达到最大级别
  if (props.maxLevel !== undefined && level >= props.maxLevel) {
    resolve([]);
    return;
  }

  try {
    let areas: Area[] = [];

    if (level === 0) {
      // 根节点,加载顶层地区
      // 如果指定了父级ID,加载该父级的子项
      const response = await getAreasByParentId(props.parentAreaId || "");
      areas = response.data || [];
    } else {
      // 加载子节点
      const response = await getAreasByParentId(value);
      areas = response.data || [];
    }

    // 转换数据格式
    const nodes = areas.map(area => {
      const isLeaf = shouldBeLeaf(area);

      return {
        id: area.id,
        name: area.name,
        level: area.level,
        code: area.code,
        leaf: isLeaf
      };
    });

    resolve(nodes);
  } catch (error) {
    console.error("加载地区数据失败:", error);
    ElMessage.error("加载地区数据失败");
    resolve([]);
  }
};

// 判断节点是否应该为叶子节点
const shouldBeLeaf = (area: Area): boolean => {
  // 如果设置了最大级别
  if (props.maxLevel !== undefined) {
    const currentLevel = levelMap[area.level];
    return currentLevel >= props.maxLevel - 1;
  }

  // 街道级别是叶子节点
  return area.level === "street";
};

// 监听modelValue变化
watch(
  () => props.modelValue,
  val => {
    if (JSON.stringify(val) !== JSON.stringify(selectedIds.value)) {
      selectedIds.value = val || [];
    }
  },
  { immediate: true }
);

// 监听parentAreaId变化,清空选择并重置组件
watch(
  () => props.parentAreaId,
  async (newVal, oldVal) => {
    // 只有在真正变化时才处理(避免初始化时也触发)
    if (newVal !== oldVal) {
      // 父级ID变化时清空选择
      selectedIds.value = [];
      emit("update:modelValue", []);
      emit("update:current", "");

      // 通过改变 key 强制重新渲染 cascader 组件
      cascaderKey.value++;
    }
  }
);

// 处理选择变化
const handleChange = (value: string[]) => {
  selectedIds.value = value || [];
  const currentId = value && value.length > 0 ? value[value.length - 1] : "";

  emit("update:modelValue", selectedIds.value);
  emit("update:current", currentId);
  emit("change", selectedIds.value, currentId);
};
</script>

<style scoped lang="scss">
.area-selector {
  width: 100%;

  :deep(.el-cascader) {
    width: 100%;
  }
}
</style>
