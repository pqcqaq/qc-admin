// WebSocket 消息类型定义
export interface ClientMessage {
  action: "subscribe" | "unsubscribe" | "ping" | "pong";
  topic: string;
  data?: string;
}

// 服务器发送的消息类型
export interface SocketMessagePayload {
  topic: string;
  userId: number;
  data: any;
  timestamp?: number;
}

// 消息处理器类型
export type MessageHandler<T = any> = (data: T, topic: string) => void;

// WebSocket 连接状态
export enum WebSocketState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  ERROR = "error"
}

// 订阅配置
export interface SubscriptionConfig {
  topic: string;
  handler: MessageHandler;
}

// WebSocket 连接选项
export interface SocketOptions {
  url?: string;
  token?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

// 取消订阅函数类型
export type UnsubscribeFunction = () => void;

// WebSocket 实例接口
export interface ISocketClient {
  // 连接状态
  readonly state: WebSocketState;

  // 连接方法
  connect(token?: string): Promise<void>;

  // 断开连接
  disconnect(): void;

  // 订阅主题
  subscribe<T = any>(
    topic: string,
    handler: MessageHandler<T>
  ): UnsubscribeFunction;

  // 取消订阅
  unsubscribe(topic: string, handler?: MessageHandler): void;

  // 取消所有订阅
  unsubscribeAll(): void;

  // 监听连接状态变化
  onStateChange(callback: (state: WebSocketState) => void): () => void;
}

// 内部订阅记录
export interface SubscriptionRecord {
  topic: string;
  handler: MessageHandler;
  id: string;
}
