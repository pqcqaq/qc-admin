import { defineStore } from "pinia";
import { ref, watch } from "vue";
import {
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  type RefreshTokenResult,
  getLogin,
  refreshTokenApi
} from "qc-admin-api-common/auth";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  type DataInfo,
  setToken,
  removeToken,
  userKey,
  getToken
} from "@/utils/auth";
import { message } from "@/utils/message";
import { useSocketStore } from "./socket";

export const useUserStore = defineStore("pure-user", () => {
  // 状态
  const logginedIn = ref(false);
  // 用户信息
  const avatar = ref(
    storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? ""
  );
  const username = ref(
    storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? ""
  );
  const nickname = ref(
    storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? ""
  );
  const roles = ref(
    storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? []
  );
  const permissions = ref(
    storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? []
  );
  const verifyCode = ref("");
  const currentPage = ref(0);
  const isRemembered = ref(false);
  const loginDay = ref(7);

  // 方法
  /** 存储头像 */
  const SET_AVATAR = (value: string) => {
    avatar.value = value;
  };

  /** 存储用户名 */
  const SET_USERNAME = (value: string) => {
    username.value = value;
  };

  /** 存储昵称 */
  const SET_NICKNAME = (value: string) => {
    nickname.value = value;
  };

  /** 存储角色 */
  const SET_ROLES = (value: Array<string>) => {
    roles.value = value;
  };

  /** 存储按钮级别权限 */
  const SET_PERMS = (value: Array<string>) => {
    permissions.value = value;
  };

  /** 存储前端生成的验证码 */
  const SET_VERIFYCODE = (value: string) => {
    verifyCode.value = value;
  };

  /** 存储登录页面显示哪个组件 */
  const SET_CURRENTPAGE = (value: number) => {
    currentPage.value = value;
  };

  /** 存储是否勾选了登录页的免登录 */
  const SET_ISREMEMBERED = (bool: boolean) => {
    isRemembered.value = bool;
  };

  /** 设置登录页的免登录存储几天 */
  const SET_LOGINDAY = (value: number) => {
    loginDay.value = Number(value);
  };

  /** 登入 */
  const loginByUsername = async (data): Promise<UserResult> => {
    return new Promise<UserResult>((resolve, reject) => {
      getLogin(data)
        .then(async data => {
          if (data?.success) {
            // 更新用户信息
            username.value = data.data.user.name;
            nickname.value = data.data.user.name;
            roles.value = data.data.user.roles || [];
            permissions.value = data.data.user.permissions || [];

            // 保存Token（适配新的响应格式）
            const tokenData = {
              accessToken: data.data.token.accessToken,
              refreshToken: data.data.token.refreshToken, // 如果后端没有单独的refreshToken，暂时使用同一个
              expires: data.data.token.accessExpiredIn, // 24小时后过期
              username: data.data.user.name,
              nickname: data.data.user.name,
              avatar: data.data.user.avatar,
              roles: data.data.user.roles || [],
              permissions: data.data.user.permissions || []
            };
            setToken(tokenData);
          }
          resolve(data);
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  /** 前端登出（不调用接口） */
  const logOut = () => {
    avatar.value = "";
    nickname.value = "";
    verifyCode.value = "";
    currentPage.value = 0;
    isRemembered.value = false;
    loginDay.value = 7;
    logginedIn.value = false;
    username.value = "";
    roles.value = [];
    permissions.value = [];
    removeToken();
    useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
    resetRouter();
    router.push("/login");
  };

  /** 刷新`token` */
  const handRefreshToken = async (data): Promise<RefreshTokenResult> => {
    return new Promise<RefreshTokenResult>((resolve, reject) => {
      refreshTokenApi(data)
        .then(data => {
          if (data) {
            // 适配新的响应格式
            const tokenData = {
              accessToken: data.data.token.accessToken,
              refreshToken: data.data.token.refreshToken,
              expires: data.data.token.accessExpiredIn // 24小时后过期
            };
            setToken(tokenData);
            resolve(data);
          }
        })
        .catch(error => {
          message("刷新token失败，请重新登录", {
            type: "error"
          });
          logOut();
          reject(error);
        });
    });
  };

  watch(
    logginedIn,
    (newToken, oldToken) => {
      if (newToken) {
        // token 存在且发生变化 -> 连接 WebSocket
        console.log("Token changed, connecting WebSocket...");
        const socketStore = useSocketStore();
        socketStore.connect();
      } else if (!newToken && oldToken) {
        // token 被清空 -> 断开 WebSocket
        console.log("Token cleared, disconnecting WebSocket...");
        const socketStore = useSocketStore();
        socketStore.disConnect();
      } else if (!newToken && oldToken === undefined) {
        const token = getToken();
        if (token && token.accessToken) {
          logginedIn.value = true;
        }
      }
    },
    { immediate: true }
  ); // immediate: true 会在初始化时立即执行

  return {
    // 状态
    avatar,
    username,
    nickname,
    roles,
    permissions,
    verifyCode,
    currentPage,
    isRemembered,
    loginDay,
    logginedIn,
    // 方法
    SET_AVATAR,
    SET_USERNAME,
    SET_NICKNAME,
    SET_ROLES,
    SET_PERMS,
    SET_VERIFYCODE,
    SET_CURRENTPAGE,
    SET_ISREMEMBERED,
    SET_LOGINDAY,
    loginByUsername,
    logOut,
    handRefreshToken
  };
});

export function useUserStoreHook() {
  return useUserStore(store);
}
