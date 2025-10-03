<template>
  <div>
    <el-button type="primary" @click="handleClick">
      测试发送socket消息
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { sendUserSocketMsg } from "qc-admin-api-common/test";

const handleClick = () => {
  sendUserSocketMsg().then(() => {
    console.log("发送成功");
  });
};
</script>

<style scoped></style>
