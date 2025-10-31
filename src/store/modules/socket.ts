import {
  type Channel,
  type MessageHandler,
  SocketClient,
  type UnsubscribeFunction
} from "qc-admin-api-common/socket";
import { createBrowserAdapter } from "qc-admin-api-common/adaptor/browser";
import { defineStore } from "pinia";
import { onMounted, onUnmounted, type Ref, ref } from "vue";
import { getToken, setToken } from "@/utils/auth";
import { useUserStore } from "./user";

export const useSocketStore = defineStore("socket", () => {
  const socketClient = ref<SocketClient | null>(null);

  const start = () => {
    if (!import.meta.env.VITE_SOCKET_URL) {
      console.warn("socket is not enabled");
      return;
    }
    if (socketClient.value) {
      socketClient.value.connect();
      return;
    }
    socketClient.value = new SocketClient({
      url: import.meta.env.VITE_SOCKET_URL,
      token: getToken().accessToken,
      heartbeatInterval: 45000,
      adapter: createBrowserAdapter(),
      refreshToken: () => {
        const userStore = useUserStore();
        return userStore
          .handRefreshToken({
            refreshToken: getToken().refreshToken || ""
          })
          .then(res => {
            if (res.success && res.data.token) {
              setToken({
                accessToken: res.data.token.accessToken,
                refreshToken: res.data.token.refreshToken,
                expires: res.data.token.accessExpiredIn
              });
              return res.data.token.accessToken;
            }
            throw new Error(res.data.message || "刷新token失败");
          });
      },
      debug: !!import.meta.env.DEV,
      errorHandler: msg => {
        console.error("WebSocket error:", msg);
      }
    });
    socketClient.value.connect();
  };

  return {
    start,
    connect: start,
    disConnect: () => {
      if (socketClient.value) {
        socketClient.value.disconnect();
        socketClient.value = null;
      }
    },
    hookOnMounted: (...params) => {
      const dispose: Ref<UnsubscribeFunction | null> = ref(null);

      // 清理之前的订阅（如果存在）
      const cleanup = () => {
        if (dispose.value) {
          dispose.value();
          dispose.value = null;
        }
      };

      onMounted(() => {
        // 先清理可能存在的旧订阅
        cleanup();
        if (!socketClient.value) {
          console.warn("socketClient is not initialized");
          return;
        }
        dispose.value = socketClient.value.subscribe(...params);
      });

      onUnmounted(() => {
        cleanup();
      });
    },
    subscribe: (...params) => {
      if (!socketClient.value) {
        console.warn("socketClient is not initialized");
        return;
      }
      return socketClient.value.subscribe(...params);
    },
    unsubscribe: (...params) => {
      if (!socketClient.value) {
        console.warn("socketClient is not initialized");
        return;
      }
      return socketClient.value.unsubscribe(...params);
    },
    unsubscribeAll: () => {
      if (!socketClient.value) {
        console.warn("socketClient is not initialized");
        return;
      }
    },
    sendMessage: (...params) => {
      if (!socketClient.value) {
        console.warn("socketClient is not initialized");
        return;
      }
      return socketClient.value.sendMessage(...params);
    },
    createChannel: (...params) => {
      if (!socketClient.value) {
        console.warn("socketClient is not initialized");
        return;
      }
      return socketClient.value.createChannel(...params);
    },
    registerChannelOpen: (...params) => {
      if (!socketClient.value) {
        console.warn("socketClient is not initialized");
        return;
      }
      return socketClient.value.registerChannelOpen(...params);
    },
    registerChannelOpenHook: (...params) => {
      let dispose: UnsubscribeFunction | null = null;

      // 清理之前的订阅（如果存在）
      const cleanup = () => {
        if (dispose) {
          dispose();
          dispose = null;
        }
      };

      onMounted(() => {
        // 先清理可能存在的旧订阅
        cleanup();
        if (!socketClient.value) {
          console.warn("socketClient is not initialized");
          return;
        }
        dispose = socketClient.value.registerChannelOpen(...params);
      });

      onUnmounted(() => {
        cleanup();
      });
    }
  } satisfies {
    start: () => void;
    connect: () => void;
    disConnect: () => void;
    subscribe: SocketClient["subscribe"];
    unsubscribe: SocketClient["unsubscribe"];
    unsubscribeAll: SocketClient["unsubscribeAll"];
    hookOnMounted: <T>(
      topic: string,
      handler: MessageHandler<T>,
      errHandler?: (err: any) => void,
      init?: MessageHandler<any[]>
    ) => void;
    sendMessage: SocketClient["sendMessage"];
    createChannel: SocketClient["createChannel"];
    registerChannelOpen: SocketClient["registerChannelOpen"];
    registerChannelOpenHook: <T>(
      topic: string,
      handler: (channel: Channel<T>) => void
    ) => void;
  };
});
