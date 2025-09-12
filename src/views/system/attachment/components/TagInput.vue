<template>
  <div class="tag-input-container">
    <div class="tag-list">
      <el-tag
        v-for="tag in modelValue"
        :key="tag"
        closable
        type="info"
        class="tag-item"
        @close="removeTag(tag)"
      >
        {{ tag }}
      </el-tag>
      <el-input
        v-if="inputVisible"
        ref="inputRef"
        v-model="inputValue"
        class="tag-input"
        size="small"
        placeholder="输入标签按回车确认"
        @blur="handleInputConfirm"
        @keyup.enter="handleInputConfirm"
      />
      <el-button
        v-else
        class="tag-add-button"
        size="small"
        type="primary"
        plain
        @click="showInput"
      >
        + 添加标签
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { ElInput } from "element-plus";

interface Props {
  modelValue: string[];
  maxTags?: number;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxTags: 10,
  placeholder: "输入标签按回车确认"
});

const emit = defineEmits<{
  "update:modelValue": [tags: string[]];
}>();

const inputVisible = ref(false);
const inputValue = ref("");
const inputRef = ref<InstanceType<typeof ElInput>>();

// 显示输入框
const showInput = () => {
  if (props.modelValue.length >= props.maxTags) {
    return;
  }
  inputVisible.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

// 确认输入
const handleInputConfirm = () => {
  const value = inputValue.value.trim();
  if (value && !props.modelValue.includes(value)) {
    const newTags = [...props.modelValue, value];
    emit("update:modelValue", newTags);
  }
  inputVisible.value = false;
  inputValue.value = "";
};

// 删除标签
const removeTag = (tag: string) => {
  const newTags = props.modelValue.filter(t => t !== tag);
  emit("update:modelValue", newTags);
};
</script>

<style lang="scss" scoped>
.tag-input-container {
  width: 100%;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 120px;
}

.tag-add-button {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  border-style: dashed;
}
</style>
