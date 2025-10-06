<template>
  <div class="main">
    <el-button type="primary" @click="handleClick">
      测试发送socket消息
    </el-button>
    <div style="margin-top: 20px">
      <el-input v-model="input" placeholder="输入消息内容" />
      <el-button type="success" style="margin-top: 10px" @click="handleSend">
        发送消息
      </el-button>
      <div>当前输入: {{ input }}</div>
    </div>
    <!-- 测试创建聊天室 -->
    <el-button type="primary" @click="handleCreateChannel">
      测试创建Channel
    </el-button>
    <!-- 测试创建多个channel并关闭 -->
    <el-button type="primary" @click="handleCreateMulti">
      测试创建多个Channel
    </el-button>
    <!-- 测试交互 -->
    <el-button type="primary" @click="handleTest"> 测试交互 </el-button>
    <el-button type="primary" @click="handleTestMulti">
      测试多频道交互
    </el-button>

    <!-- 测试panic -->
    <el-button type="primary" @click="handleTestPanic"> 测试Panic </el-button>

    <!-- 聊天室组件 -->
    <div
      style="
        padding: 20px;
        margin-top: 30px;
        border: 1px solid #ccc;
        border-radius: 8px;
      "
    >
      <h3>聊天室测试</h3>
      <div style="display: flex; gap: 20px; margin-bottom: 20px">
        <div style="flex: 1">
          <h4>输入消息</h4>
          <el-input
            v-model="chatInput"
            type="textarea"
            :rows="10"
            placeholder="按回车发送消息..."
            :disabled="!isChatConnected"
            @keyup.enter="sendChatMessage"
          />
        </div>
        <div style="flex: 1">
          <h4>服务器响应</h4>
          <el-input
            v-model="chatOutput"
            type="textarea"
            :rows="10"
            readonly
            placeholder="服务器响应将显示在这里..."
          />
        </div>
      </div>
      <div style="display: flex; gap: 10px">
        <el-button
          type="primary"
          :disabled="isChatConnected"
          @click="startChat"
        >
          开始聊天
        </el-button>
        <el-button type="danger" :disabled="!isChatConnected" @click="stopChat">
          结束聊天
        </el-button>
        <el-button type="info" @click="clearChat"> 清空内容 </el-button>
      </div>
      <div style="margin-top: 10px">
        <span :style="{ color: isChatConnected ? 'green' : 'red' }">
          状态: {{ isChatConnected ? "已连接" : "未连接" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSocketStore } from "@/store/modules/socket";
import { message } from "@/utils/message";
import { sendUserSocketMsg } from "qc-admin-api-common/test";
import { ref } from "vue";

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

const input = ref("");
const handleSend = () => {
  if (input.value.trim() === "") {
    message("请输入消息内容", { type: "warning" });
    return;
  }
  socketStore.sendMessage("test_chat", input.value);
  message("消息已发送", { type: "success" });
  input.value = "";
};

// 聊天室相关状态
const chatInput = ref("");
const chatOutput = ref("");
const isChatConnected = ref(false);
let chatChannel: any = null;

// 开始聊天
const startChat = () => {
  socketStore
    .createChannel<string, any>("chat_room/1", msg => {
      // 处理服务器返回的5字节数据
      chatOutput.value += msg;
    })
    .then(({ send, close, onClose }) => {
      chatChannel = { send, close };
      isChatConnected.value = true;
      message("聊天室连接成功", { type: "success" });

      // 监听频道关闭
      onClose(() => {
        isChatConnected.value = false;
        chatChannel = null;
        message("聊天室连接已断开", { type: "warning" });
      });
    })
    .catch(err => {
      message(`聊天室连接失败: ${err.message}`, { type: "error" });
    });
};

// 发送聊天消息
const sendChatMessage = () => {
  if (!isChatConnected.value || !chatChannel) {
    message("聊天室未连接", { type: "warning" });
    return;
  }

  if (chatInput.value.trim() === "") {
    return;
  }

  // 将消息转换为字节数组发送
  chatChannel.send(chatInput.value);

  // 清空输入框
  chatInput.value = "";
};

// 停止聊天
const stopChat = () => {
  if (chatChannel) {
    chatChannel.close();
    chatChannel = null;
  }
  isChatConnected.value = false;
  message("聊天室已断开", { type: "info" });
};

// 清空聊天内容
const clearChat = () => {
  chatInput.value = "";
  chatOutput.value = "";
};

const handleCreateChannel = () => {
  socketStore
    .createChannel<string, string>("test_channel", msg => {
      message(`频道消息: ${msg}`, { type: "info" });
    })
    .then(({ send, close, onClose }) => {
      message("频道创建成功", { type: "success" });

      const id = setInterval(() => {
        send("hello from client");
      }, 3000);

      // 监听频道关闭
      onClose(() => {
        message("频道已关闭", { type: "warning" });
      });
      // 15秒后关闭频道
      setTimeout(() => {
        clearInterval(id);
        close();
      }, 15000);
    })
    .catch(err => {
      message(`频道创建失败: ${err.message}`, { type: "error" });
    });
};

const handleCreateMulti = () => {
  for (let i = 0; i < 15; i++) {
    const topic = `multi_channel_${i}`;
    socketStore
      .createChannel<string, string>(topic, msg => {
        message(`频道 ${topic} 消息: ${msg}`, { type: "info" });
      })
      .then(({ send, close, onClose }) => {
        message(`频道 ${topic} 创建成功`, { type: "success" });

        const id = setInterval(() => {
          send(`hello from client on ${topic}`);
        }, 100);

        // 监听频道关闭
        onClose(() => {
          message(`频道 ${topic} 已关闭`, { type: "warning" });
        });
        // 20秒后关闭频道
        setTimeout(() => {
          clearInterval(id);
          close();
        }, 1500);
      })
      .catch(err => {
        message(`频道 ${topic} 创建失败: ${err.message}`, { type: "error" });
      });
  }
};

const handleTest = () => {
  socketStore
    .createChannel<string, string>("test_handler/1", msg => {
      message(`频道消息: ${msg}`, { type: "info" });
    })
    .then(({ send, onClose }) => {
      message("频道创建成功", { type: "success" });

      let count = 0;
      const id = setInterval(() => {
        count++;
        send(`hello from client ${count}`);
      }, 1000);

      // 监听频道关闭
      onClose(() => {
        message("频道已关闭", { type: "warning" });
        clearInterval(id);
      });
    })
    .catch(err => {
      message(`频道创建失败: ${err.message}`, { type: "error" });
    });
};

const handleTestMulti = () => {
  for (let i = 0; i < 15; i++) {
    const topic = `test_handler/${i}`;
    socketStore
      .createChannel<string, string>(topic, msg => {
        console.log(`频道 ${topic} 消息: ${msg}`, { type: "info" });
      })
      .then(({ send, onClose }) => {
        message(`频道 ${topic} 创建成功`, { type: "success" });

        let count = 0;
        const id = setInterval(() => {
          count++;
          send(`hello from client on ${topic} - ${count}`);
        }, 100);

        // 监听频道关闭
        onClose(() => {
          message(`频道 ${topic} 已关闭`, { type: "warning" });
          clearInterval(id);
        });
      })
      .catch(err => {
        message(`频道 ${topic} 创建失败: ${err.message}`, { type: "error" });
      });
  }
};

const handleTestPanic = () => {
  socketStore
    .createChannel<string, string>(
      "test_panic/1",
      msg => {
        message(`频道消息: ${msg}`, { type: "info" });
      },
      err => {
        message(`频道错误: ${err.detail}`, { type: "error" });
      }
    )
    .then(({ send, onClose }) => {
      message("频道创建成功", { type: "success" });

      let count = 0;
      const id = setInterval(() => {
        count++;
        send(`hello from client ${count}`);
      }, 1000);

      // 监听频道关闭
      onClose(() => {
        message("频道已关闭", { type: "warning" });
        clearInterval(id);
      });
    })
    .catch(err => {
      message(`频道创建失败: ${err.message}`, { type: "error" });
    });
};
</script>

<style scoped lang="scss">
.main {
  padding: 20px;
}
</style>
