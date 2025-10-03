/**
 * Topic 匹配工具类
 * 基于后端 topic.go 的实现，支持 MQTT 风格的主题匹配
 *
 * 通配符规则：
 * + : 单层通配符，匹配一个层级
 * # : 多层通配符，匹配剩余所有层级，只能出现在最后
 */

/**
 * 检查消息topic是否匹配订阅pattern
 * @param subPattern 订阅模式 (如: "user/+/message", "system/#")
 * @param msgTopic 消息主题 (如: "user/123/message", "system/alert/critical")
 * @returns 是否匹配
 */
export function matchTopic(subPattern: string, msgTopic: string): boolean {
  // 分割topic为层级
  const subLevels = subPattern.split("/");
  const msgLevels = msgTopic.split("/");

  const subLen = subLevels.length;
  const msgLen = msgLevels.length;

  // 遍历订阅pattern的每一层
  for (let i = 0; i < subLen; i++) {
    // 如果遇到多层通配符 #
    if (subLevels[i] === "#") {
      // # 必须是最后一层
      if (i === subLen - 1) {
        return true;
      }
      return false; // # 不在最后,pattern无效
    }

    // 如果消息topic层级已用完,但订阅pattern还有(且不是#)
    if (i >= msgLen) {
      return false;
    }

    // 如果是单层通配符 +,跳过这一层
    if (subLevels[i] === "+") {
      continue;
    }

    // 精确匹配这一层
    if (subLevels[i] !== msgLevels[i]) {
      return false;
    }
  }

  // 所有层级都匹配完成,长度必须相等
  return subLen === msgLen;
}

/**
 * 检查msgTopic是否匹配subsList中的任意一个订阅
 * @param subsList 订阅列表
 * @param msgTopic 消息主题
 * @returns 是否有匹配
 */
export function isAnyMatch(subsList: string[], msgTopic: string): boolean {
  for (const sub of subsList) {
    if (matchTopic(sub, msgTopic)) {
      return true;
    }
  }
  return false;
}

/**
 * 检查msgTopic是否匹配subsList中的所有订阅
 * @param subsList 订阅列表
 * @param msgTopic 消息主题
 * @returns 是否全部匹配
 */
export function isAllMatch(subsList: string[], msgTopic: string): boolean {
  if (subsList.length === 0) {
    return false; // 空列表返回false
  }

  for (const sub of subsList) {
    if (!matchTopic(sub, msgTopic)) {
      return false;
    }
  }
  return true;
}

/**
 * 获取匹配指定主题的所有订阅模式
 * @param subsList 订阅列表
 * @param msgTopic 消息主题
 * @returns 匹配的订阅模式列表
 */
export function getMatchingSubscriptions(
  subsList: string[],
  msgTopic: string
): string[] {
  return subsList.filter(sub => matchTopic(sub, msgTopic));
}
