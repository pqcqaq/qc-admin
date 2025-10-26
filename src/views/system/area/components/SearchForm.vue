<template>
  <div class="search-form">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="地区名称" prop="name">
        <el-input
          v-model="searchForm.name"
          placeholder="请输入地区名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="层级类型" prop="level">
        <el-select
          v-model="searchForm.level"
          placeholder="请选择层级类型"
          clearable
        >
          <el-option label="国家" value="country" />
          <el-option label="省份" value="province" />
          <el-option label="城市" value="city" />
          <el-option label="区县" value="district" />
          <el-option label="街道" value="street" />
        </el-select>
      </el-form-item>
      <el-form-item label="地区编码" prop="code">
        <el-input
          v-model="searchForm.code"
          placeholder="请输入地区编码"
          clearable
        />
      </el-form-item>
      <el-form-item label="深度" prop="depth">
        <el-input-number
          v-model="searchForm.depth"
          placeholder="请输入深度"
          :min="0"
          :max="10"
          controls-position="right"
          style="width: 120px"
        />
      </el-form-item>
      <el-form-item label="父级ID" prop="parentId">
        <el-input
          v-model="searchForm.parentId"
          placeholder="请输入父级ID"
          clearable
        />
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
  level?: "country" | "province" | "city" | "district" | "street" | "";
  code: string;
  depth?: number;
  parentId: string;
}

const emit = defineEmits<{
  search: [params: SearchFormData];
  reset: [];
}>();

const searchForm = reactive<SearchFormData>({
  name: "",
  level: "",
  code: "",
  depth: undefined,
  parentId: ""
});

const handleSearch = () => {
  const params: any = { ...searchForm };
  // 过滤空值
  Object.keys(params).forEach(key => {
    if (params[key] === "" || params[key] === undefined) {
      delete params[key];
    }
  });
  emit("search", params);
};

const resetSearch = () => {
  searchForm.name = "";
  searchForm.level = "";
  searchForm.code = "";
  searchForm.depth = undefined;
  searchForm.parentId = "";
  emit("reset");
};
</script>

<style scoped lang="scss">
.search-form {
  margin-bottom: 16px;
}

.demo-form-inline {
  :deep(.el-form-item) {
    margin-bottom: 15px;
  }
}
</style>
