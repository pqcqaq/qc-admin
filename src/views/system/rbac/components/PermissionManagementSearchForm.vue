<template>
  <el-form
    ref="searchFormRef"
    :inline="true"
    :model="searchForm"
    class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
  >
    <el-form-item label="权限名称：" prop="name">
      <el-input
        v-model="searchForm.name"
        placeholder="请输入权限名称"
        clearable
        class="!w-[180px]"
      />
    </el-form-item>

    <el-form-item label="操作类型：" prop="action">
      <el-input
        v-model="searchForm.action"
        placeholder="请输入操作类型"
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
import { reactive, ref, onMounted } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";
import { getAllScopes, type Scope } from "qc-admin-api-common/rbac";

const emit = defineEmits<{
  search: [params: any];
  reset: [];
}>();

const searchFormRef = ref();
const loading = ref(false);
const scopeOptions = ref<Scope[]>([]);

const searchForm = reactive({
  name: "",
  action: "",
  description: "",
  scopeId: ""
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

const handleSearch = () => {
  emit("search", { ...searchForm });
};

const handleReset = () => {
  searchFormRef.value?.resetFields();
  emit("reset");
};

onMounted(() => {
  getScopeOptions();
});
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
