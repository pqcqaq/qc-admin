<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">用户菜单树测试</span>
          <el-button type="primary" @click="fetchUserMenuTree">
            获取用户菜单树
          </el-button>
        </div>
      </template>

      <div class="tree-container">
        <h3>原始API响应数据：</h3>
        <el-scrollbar height="300px">
          <pre>{{ JSON.stringify(rawData, null, 2) }}</pre>
        </el-scrollbar>

        <h3>转换后的路由数据：</h3>
        <el-scrollbar height="300px">
          <pre>{{ JSON.stringify(transformedData, null, 2) }}</pre>
        </el-scrollbar>

        <h3>权限域树形结构：</h3>
        <el-tree
          v-if="treeData.length > 0"
          :data="treeData"
          :props="{ children: 'children', label: 'name' }"
          default-expand-all
          show-checkbox
        >
          <template #default="{ data }">
            <span class="tree-node">
              <el-icon v-if="data.icon">
                <component :is="data.icon" />
              </el-icon>
              <span>{{ data.name }}</span>
              <el-tag size="small" :type="getTypeColor(data.type)!">
                {{ data.type }}
              </el-tag>
              <el-tag v-if="data.hidden" size="small" type="warning">
                隐藏
              </el-tag>
              <el-tag v-if="data.disabled" size="small" type="danger">
                禁用
              </el-tag>
            </span>
          </template>
        </el-tree>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { getUserMenuTree } from "qc-admin-api-common/menu";

defineOptions({
  name: "TestMenuTree"
});

const rawData = ref({});
const transformedData = ref({});
const treeData = ref([]);

const getTypeColor = (type: string) => {
  switch (type) {
    case "menu":
      return "primary";
    case "page":
      return "success";
    case "button":
      return "info";
    default:
      return null;
  }
};

const fetchUserMenuTree = async () => {
  try {
    // 获取原始数据
    const response = await getUserMenuTree();
    rawData.value = response;

    if (response.success && response.data) {
      transformedData.value = response.data;

      // 同时获取原始树形数据用于显示
      const rawResponse = await fetch("/api/auth/user-menu-tree", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const rawResult = await rawResponse.json();

      if (rawResult.success) {
        treeData.value = rawResult.data;
      }

      ElMessage.success("获取用户菜单树成功");
    } else {
      ElMessage.error("获取用户菜单树失败");
    }
  } catch (error) {
    console.error("获取用户菜单树失败:", error);
    ElMessage.error("获取用户菜单树失败: " + error.message);
  }
};
</script>

<style lang="scss" scoped>
.main {
  margin: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tree-container {
  margin-top: 20px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

h3 {
  margin: 20px 0 10px 0;
  color: #409eff;
}

pre {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e1e4e8;
  font-size: 12px;
  overflow-x: auto;
}
</style>
