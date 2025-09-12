<template>
  <div class="search-form">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="用户名">
        <el-input
          v-model="searchForm.name"
          placeholder="请输入用户名"
          clearable
        />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="searchForm.sex" placeholder="请选择性别" clearable>
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="searchForm.status"
          placeholder="请选择状态"
          clearable
        >
          <el-option label="激活" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

interface SearchFormData {
  name: string;
  sex: string;
  status: string;
}

// 定义 emits
const emit = defineEmits<{
  search: [params: SearchFormData];
  reset: [];
}>();

// 搜索表单
const searchForm = reactive<SearchFormData>({
  name: "",
  sex: "",
  status: ""
});

// 搜索
const handleSearch = () => {
  emit("search", { ...searchForm });
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    sex: "",
    status: ""
  });
  emit("reset");
};

// 暴露方法给父组件
defineExpose({
  resetForm: () => {
    Object.assign(searchForm, {
      name: "",
      sex: "",
      status: ""
    });
  }
});
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
