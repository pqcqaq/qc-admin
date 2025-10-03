import {
  type ISocketClient,
  type SocketOptions,
  type MessageHandler,
  type UnsubscribeFunction,
  type SubscriptionRecord,
  type ClientMessage,
  type SocketMessagePayload,
  WebSocketState
} from "./types";
import { matchTopic } from "./topic";

/**
 * WebSocket 客户端实现
 * 支持主题订阅、自动重连、消息分发等功能
 */
export class SocketClient implements ISocketClient {
  private ws: WebSocket | null = null;
  private _state: WebSocketState = WebSocketState.DISCONNECTED;
  private subscriptions: Map<string, SubscriptionRecord[]> = new Map();
  private stateChangeCallbacks: Set<(state: WebSocketState) => void> =
    new Set();

  private readonly options: Required<SocketOptions>;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private currentReconnectAttempts = 0;

  constructor(options: SocketOptions = {}) {
    this.options = {
      url: options.url || import.meta.env.VITE_SOCKET_URL || "",
      token: options.token || "",
      reconnectAttempts: options.reconnectAttempts ?? 5,
      reconnectInterval: options.reconnectInterval ?? 3000,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      debug: options.debug ?? false
    };
  }

  public get state(): WebSocketState {
    return this._state;
  }

  /**
   * 连接 WebSocket 服务器
   */
  public async connect(token?: string): Promise<void> {
    if (this._state === WebSocketState.CONNECTED) {
      this.log("Already connected");
      return;
    }

    if (this._state === WebSocketState.CONNECTING) {
      this.log("Already connecting");
      return;
    }

    const authToken = token || this.options.token;
    if (!authToken) {
      throw new Error("Token is required for WebSocket connection");
    }

    if (!this.options.url) {
      throw new Error("WebSocket URL is required");
    }

    this.setState(WebSocketState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.options.url}?token=${encodeURIComponent(
          authToken
        )}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.log("WebSocket connected");
          this.setState(WebSocketState.CONNECTED);
          this.currentReconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribeAll();
          resolve();
        };

        this.ws.onmessage = event => {
          this.handleMessage(event);
        };

        this.ws.onclose = event => {
          this.log(`WebSocket closed: ${event.code} ${event.reason}`);
          this.setState(WebSocketState.DISCONNECTED);
          this.stopHeartbeat();
          this.scheduleReconnect();
        };

        this.ws.onerror = error => {
          this.log("WebSocket error:", error);
          this.setState(WebSocketState.ERROR);
          reject(new Error("WebSocket connection failed"));
        };
      } catch (error) {
        this.setState(WebSocketState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }

    this.setState(WebSocketState.DISCONNECTED);
  }

  /**
   * 订阅主题
   */
  public subscribe<T = any>(
    topic: string,
    handler: MessageHandler<T>
  ): UnsubscribeFunction {
    const id = this.generateId();
    const record: SubscriptionRecord = { topic, handler, id };

    // 检查是否是该主题的第一个订阅
    const isFirstSubscription = !this.subscriptions.has(topic);

    // 保存订阅记录
    if (isFirstSubscription) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic)!.push(record);

    // 只有在第一次订阅该主题且已连接时，才发送订阅请求到服务器
    if (isFirstSubscription && this._state === WebSocketState.CONNECTED) {
      this.sendSubscribeMessage(topic);
    }

    this.log(
      `Subscribed to topic: ${topic} (handlers: ${this.subscriptions.get(topic)!.length})`
    );

    // 返回取消订阅函数
    return () => {
      this.unsubscribeById(id);
    };
  }

  /**
   * 取消订阅
   */
  public unsubscribe(topic: string, handler?: MessageHandler): void {
    const records = this.subscriptions.get(topic);
    if (!records) return;

    if (handler) {
      // 取消特定处理器的订阅
      const index = records.findIndex(record => record.handler === handler);
      if (index !== -1) {
        records.splice(index, 1);
        if (records.length === 0) {
          this.subscriptions.delete(topic);
          this.sendUnsubscribeMessage(topic);
        }
      }
    } else {
      // 取消该主题的所有订阅
      this.subscriptions.delete(topic);
      this.sendUnsubscribeMessage(topic);
    }

    this.log(`Unsubscribed from topic: ${topic}`);
  }

  /**
   * 取消所有订阅
   */
  public unsubscribeAll(): void {
    for (const topic of this.subscriptions.keys()) {
      this.sendUnsubscribeMessage(topic);
    }
    this.subscriptions.clear();
    this.log("Unsubscribed from all topics");
  }

  /**
   * 监听连接状态变化
   */
  public onStateChange(callback: (state: WebSocketState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: SocketMessagePayload = JSON.parse(event.data);
      this.log("Received message:", message);

      // 获取所有订阅的主题
      const subscribedTopics = Array.from(this.subscriptions.keys());

      // 找到匹配的订阅并分发消息
      for (const subscribedTopic of subscribedTopics) {
        if (matchTopic(subscribedTopic, message.topic)) {
          const records = this.subscriptions.get(subscribedTopic);
          if (records) {
            for (const record of records) {
              try {
                record.handler(message.data, message.topic);
              } catch (error) {
                this.log("Error in message handler:", error);
              }
            }
          }
        }
      }
    } catch (error) {
      this.log("Error parsing message:", error);
    }
  }

  /**
   * 发送订阅消息到服务器
   */
  private sendSubscribeMessage(topic: string): void {
    const message: ClientMessage = {
      action: "subscribe",
      topic
    };
    this.sendMessage(message);
  }

  /**
   * 发送取消订阅消息到服务器
   */
  private sendUnsubscribeMessage(topic: string): void {
    const message: ClientMessage = {
      action: "unsubscribe",
      topic
    };
    this.sendMessage(message);
  }

  /**
   * 发送消息到服务器
   */
  private sendMessage(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log("Sent message:", message);
    } else {
      this.log("Cannot send message: WebSocket not connected");
    }
  }

  /**
   * 重新订阅所有主题（用于重连后）
   */
  private resubscribeAll(): void {
    for (const topic of this.subscriptions.keys()) {
      this.sendSubscribeMessage(topic);
    }
  }

  /**
   * 设置连接状态
   */
  private setState(state: WebSocketState): void {
    if (this._state !== state) {
      this._state = state;
      this.log(`State changed to: ${state}`);
      for (const callback of this.stateChangeCallbacks) {
        try {
          callback(state);
        } catch (error) {
          this.log("Error in state change callback:", error);
        }
      }
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (
      this.currentReconnectAttempts >= this.options.reconnectAttempts ||
      this._state === WebSocketState.DISCONNECTED
    ) {
      this.log("Max reconnect attempts reached or manually disconnected");
      return;
    }

    this.setState(WebSocketState.RECONNECTING);
    this.currentReconnectAttempts++;

    this.reconnectTimer = window.setTimeout(() => {
      this.log(
        `Attempting to reconnect (${this.currentReconnectAttempts}/${this.options.reconnectAttempts})`
      );
      this.connect().catch(error => {
        this.log("Reconnect failed:", error);
      });
    }, this.options.reconnectInterval);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // 发送心跳消息（可以是空的订阅消息）
        this.sendMessage({ action: "ping", topic: "" });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 根据ID取消订阅
   */
  private unsubscribeById(id: string): void {
    for (const [topic, records] of this.subscriptions.entries()) {
      const index = records.findIndex(record => record.id === id);
      if (index !== -1) {
        records.splice(index, 1);
        if (records.length === 0) {
          this.subscriptions.delete(topic);
          this.sendUnsubscribeMessage(topic);
        }
        this.log(`Unsubscribed by ID: ${id} from topic: ${topic}`);
        break;
      }
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 日志输出
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`[SocketClient] ${message}`, ...args);
    }
  }
}

// 创建全局单例实例
let socketInstance: SocketClient | null = null;

/**
 * 获取全局 WebSocket 客户端实例
 */
export function getSocketClient(options?: SocketOptions): SocketClient {
  if (!socketInstance) {
    socketInstance = new SocketClient(options);
  }
  return socketInstance;
}

/**
 * 便捷的订阅函数
 */
export function subscribe<T = any>(
  topic: string,
  handler: MessageHandler<T>,
  options?: SocketOptions
): UnsubscribeFunction {
  const client = getSocketClient(options);
  return client.subscribe(topic, handler);
}

/**
 * 便捷的取消订阅函数
 */
export function unsubscribe(
  topic: string,
  handler?: MessageHandler,
  options?: SocketOptions
): void {
  const client = getSocketClient(options);
  client.unsubscribe(topic, handler);
}

// 导出类型
export * from "./types";
export * from "./topic";
