<template>
  <div class="main">
    <el-button type="primary" @click="handleClick">
      测试发送socket消息
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from "@/store/modules/socket";
import { message } from "@/utils/message";
import { sendUserSocketMsg } from "qc-admin-api-common/test";

const handleClick = () => {
  sendUserSocketMsg().then(() => {
    console.log("发送成功");
  });
};

const socketStore = useSocketStore();
socketStore.hookOnMounted<string>("test_topic", msg => {
  message(`收到消息: ${msg}`, {
    type: "info"
  });
});
</script>

<style scoped lang="scss">
.main {
  padding: 20px;
}
</style>
