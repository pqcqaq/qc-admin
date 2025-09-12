<template>
  <el-form
    ref="searchFormRef"
    :inline="true"
    :model="searchForm"
    class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
  >
    <el-form-item label="角色名称：" prop="name">
      <el-input
        v-model="searchForm.name"
        placeholder="请输入角色名称"
        clearable
        class="!w-[180px]"
      />
    </el-form-item>

    <el-form-item label="角色描述：" prop="description">
      <el-input
        v-model="searchForm.description"
        placeholder="请输入角色描述"
        clearable
        class="!w-[180px]"
      />
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
  description: ""
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
