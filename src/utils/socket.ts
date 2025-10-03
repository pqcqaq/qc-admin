/**
 * WebSocket 客户端主入口文件
 *
 * 使用示例：
 *
 * ```typescript
 * import { getSocketClient, subscribe, WebSocketState } from '@/utils/socket';
 *
 * // 获取客户端实例
 * const client = getSocketClient({ debug: true });
 *
 * // 连接到服务器
 * await client.connect(userToken);
 *
 * // 订阅消息
 * const unsubscribe = subscribe('user/123/notifications', (data, topic) => {
 *   console.log('收到通知:', data, '主题:', topic);
 * });
 *
 * // 订阅带通配符的主题
 * const unsubscribeAll = subscribe('system/#', (data, topic) => {
 *   console.log('系统消息:', data, '主题:', topic);
 * });
 *
 * // 监听连接状态
 * const removeStateListener = client.onStateChange((state) => {
 *   console.log('连接状态变化:', state);
 * });
 *
 * // 取消订阅
 * unsubscribe();
 *
 * // 断开连接
 * client.disconnect();
 * ```
 *
 * 主题匹配规则：
 * - 精确匹配: "user/123/message" 只匹配 "user/123/message"
 * - 单层通配符: "user/+/message" 匹配 "user/123/message", "user/456/message" 等
 * - 多层通配符: "system/#" 匹配 "system/alert", "system/alert/critical" 等
 */

// 重新导出所有功能
export {
  SocketClient,
  getSocketClient,
  subscribe,
  unsubscribe
} from "./socket/index";

export {
  WebSocketState,
  type ISocketClient,
  type SocketOptions,
  type MessageHandler,
  type UnsubscribeFunction,
  type SocketMessagePayload,
  type ClientMessage,
  type SubscriptionConfig,
  type SubscriptionRecord
} from "./socket/types";

export {
  matchTopic,
  isAnyMatch,
  isAllMatch,
  getMatchingSubscriptions
} from "./socket/topic";
