<template>
  <el-form
    ref="searchFormRef"
    :inline="true"
    :model="searchForm"
    class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
  >
    <el-form-item label="用户：" prop="userId">
      <el-select
        v-model="searchForm.userId"
        placeholder="请选择用户"
        clearable
        filterable
        class="!w-[180px]"
      >
        <el-option
          v-for="user in userOptions"
          :key="user.id"
          :label="user.name"
          :value="user.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="角色：" prop="roleId">
      <el-select
        v-model="searchForm.roleId"
        placeholder="请选择角色"
        clearable
        class="!w-[180px]"
      >
        <el-option
          v-for="role in roleOptions"
          :key="role.id"
          :label="role.name"
          :value="role.id"
        />
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
import { reactive, ref, onMounted } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";
import { getAllRoles, type Role } from "qc-admin-api-common/rbac";
import { getUserList, type User } from "qc-admin-api-common/user";

const emit = defineEmits<{
  search: [params: any];
  reset: [];
}>();

const searchFormRef = ref();
const loading = ref(false);
const userOptions = ref<User[]>([]);
const roleOptions = ref<Role[]>([]);

const searchForm = reactive({
  userId: "",
  roleId: ""
});

// 获取用户选项
const getUserOptions = async () => {
  try {
    const response = await getUserList();
    userOptions.value = response.data || [];
  } catch (error) {
    console.error("获取用户列表失败:", error);
  }
};

// 获取角色选项
const getRoleOptions = async () => {
  try {
    const response = await getAllRoles();
    roleOptions.value = response.data || [];
  } catch (error) {
    console.error("获取角色列表失败:", error);
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
  getUserOptions();
  getRoleOptions();
});
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
