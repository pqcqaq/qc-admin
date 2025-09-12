<template>
  <el-form
    ref="searchFormRef"
    :inline="true"
    :model="searchForm"
    class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
  >
    <el-form-item label="菜单名称：" prop="name">
      <el-input
        v-model="searchForm.name"
        placeholder="请输入菜单名称"
        clearable
        class="!w-[180px]"
      />
    </el-form-item>

    <el-form-item label="菜单类型：" prop="type">
      <el-select
        v-model="searchForm.type"
        placeholder="请选择菜单类型"
        clearable
        class="!w-[180px]"
      >
        <el-option label="菜单" value="menu" />
        <el-option label="页面" value="page" />
        <el-option label="按钮" value="button" />
      </el-select>
    </el-form-item>

    <el-form-item label="是否隐藏：" prop="hidden">
      <el-select
        v-model="searchForm.hidden"
        placeholder="请选择"
        clearable
        class="!w-[120px]"
      >
        <el-option label="是" :value="true" />
        <el-option label="否" :value="false" />
      </el-select>
    </el-form-item>

    <el-form-item label="是否禁用：" prop="disabled">
      <el-select
        v-model="searchForm.disabled"
        placeholder="请选择"
        clearable
        class="!w-[120px]"
      >
        <el-option label="是" :value="true" />
        <el-option label="否" :value="false" />
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button
        type="primary"
        :icon="Search"
        :loading="loading"
        @click="handleSearch"
      >
        搜索
      </el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";

const emit = defineEmits<{
  search: [params: any];
  reset: [];
}>();

const searchFormRef = ref();
const loading = ref(false);

const searchForm = reactive({
  name: "",
  type: "",
  hidden: null as boolean | null,
  disabled: null as boolean | null
});

const handleSearch = () => {
  emit("search", { ...searchForm });
};

const handleReset = () => {
  searchFormRef.value?.resetFields();
  emit("reset");
};
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
