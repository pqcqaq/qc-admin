/**
 * Handle ID 工具函数
 *
 * 统一的 Handle ID 命名规范：{nodeId}:{handleType}[:{identifier}]
 *
 * 示例：
 * - node-1:start-output
 * - node-2:task-input
 * - node-3:branch:true
 * - node-4:thread:task1
 * - node-5:loop-feedback
 */

import { HandleType } from "./edgeValidation";

/**
 * Handle ID 的组成部分
 */
export interface HandleIdParts {
  nodeId: string;
  handleType: string;
  identifier?: string;
}

/**
 * 解析 Handle ID
 *
 * @param handleId - Handle ID 字符串
 * @returns Handle ID 的组成部分
 */
export function parseHandleId(handleId: string): HandleIdParts | null {
  if (!handleId) return null;

  const parts = handleId.split(":");

  if (parts.length < 2) {
    throw new Error(
      `Invalid handle ID format: "${handleId}". Expected format: "nodeId:handleType[:identifier]"`
    );
  }

  return {
    nodeId: parts[0],
    handleType: parts[1],
    identifier: parts[2]
  };
}

/**
 * 生成 Handle ID
 *
 * @param nodeId - 节点 ID
 * @param handleType - Handle 类型
 * @param identifier - 可选的标识符（用于分支、线程等）
 * @returns Handle ID 字符串
 */
export function createHandleId(
  nodeId: string,
  handleType: string,
  identifier?: string
): string {
  if (identifier) {
    return `${nodeId}:${handleType}:${identifier}`;
  }
  return `${nodeId}:${handleType}`;
}

// ========== 各节点类型的 Handle ID 生成器 ==========

/**
 * 开始节点 Handle ID
 */
export const StartNodeHandles = {
  output: (nodeId: string) => createHandleId(nodeId, "start-output")
};

/**
 * 结束节点 Handle ID
 */
export const EndNodeHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "end-input")
};

/**
 * 任务生成器 Handle ID
 */
export const TaskGeneratorHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "task-input"),
  output: (nodeId: string) => createHandleId(nodeId, "task-output")
};

/**
 * 条件检查器 Handle ID
 */
export const ConditionHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "condition-input"),
  branch: (nodeId: string, branchName: string) =>
    createHandleId(nodeId, "branch", branchName)
};

/**
 * 并行执行器 Handle ID
 */
export const ParallelHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "parallel-input"),
  thread: (nodeId: string, threadName: string) =>
    createHandleId(nodeId, "thread", threadName),
  childInput: (nodeId: string) => createHandleId(nodeId, "parallel-child-input")
};

/**
 * API调用器 Handle ID
 */
export const ApiCallerHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "api-input"),
  output: (nodeId: string) => createHandleId(nodeId, "api-output")
};

/**
 * 数据处理器 Handle ID
 */
export const DataProcessorHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "data-input"),
  output: (nodeId: string) => createHandleId(nodeId, "data-output")
};

/**
 * 循环节点 Handle ID
 */
export const LoopHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "loop-input"),
  body: (nodeId: string) => createHandleId(nodeId, "loop-body"),
  continue: (nodeId: string) => createHandleId(nodeId, "loop-continue"),
  feedback: (nodeId: string) => createHandleId(nodeId, "loop-feedback")
};

/**
 * LLM调用器 Handle ID
 */
export const LlmCallerHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "llm-input"),
  output: (nodeId: string) => createHandleId(nodeId, "llm-output")
};

/**
 * 通用节点 Handle ID（兜底）
 */
export const CommonHandles = {
  input: (nodeId: string) => createHandleId(nodeId, "common-input"),
  output: (nodeId: string) => createHandleId(nodeId, "common-output")
};

/**
 * 从 Handle ID 中提取 HandleType
 *
 * 这个函数现在变得非常简单，因为 HandleType 直接编码在 Handle ID 中
 *
 * @param handleId - Handle ID 字符串
 * @returns HandleType 枚举值
 */
export function getHandleTypeFromId(handleId?: string | null): HandleType {
  if (!handleId) {
    throw new Error("Handle ID is required");
  }

  const parts = parseHandleId(handleId);

  if (!parts) {
    throw new Error(`Failed to parse handle ID: "${handleId}"`);
  }

  // 直接从 handleType 映射到 HandleType
  const { handleType } = parts;

  switch (handleType) {
    // 开始/结束
    case "start-output":
      return HandleType.START_OUTPUT;
    case "end-input":
      return HandleType.END_INPUT;

    // 任务生成器
    case "task-input":
      return HandleType.TASK_GENERATOR_INPUT;
    case "task-output":
      return HandleType.TASK_GENERATOR_OUTPUT;

    // 条件检查器
    case "condition-input":
      return HandleType.CONDITION_INPUT;
    case "branch":
      return HandleType.CONDITION_BRANCH_OUTPUT;

    // 并行执行器
    case "parallel-input":
      return HandleType.PARALLEL_EXECUTOR_INPUT;
    case "thread":
      return HandleType.PARALLEL_THREAD_OUTPUT;
    case "parallel-child-input":
      return HandleType.PARALLEL_CHILD_INPUT;

    // API调用器
    case "api-input":
      return HandleType.API_CALLER_INPUT;
    case "api-output":
      return HandleType.API_CALLER_OUTPUT;

    // 数据处理器
    case "data-input":
      return HandleType.DATA_PROCESSOR_INPUT;
    case "data-output":
      return HandleType.DATA_PROCESSOR_OUTPUT;

    // 循环节点
    case "loop-input":
      return HandleType.LOOP_INPUT;
    case "loop-body":
      return HandleType.LOOP_BODY_OUTPUT;
    case "loop-continue":
      return HandleType.LOOP_CONTINUE_OUTPUT;
    case "loop-feedback":
      return HandleType.LOOP_FEEDBACK_INPUT;

    // LLM调用器
    case "llm-input":
      return HandleType.LLM_CALLER_INPUT;
    case "llm-output":
      return HandleType.LLM_CALLER_OUTPUT;

    // 通用类型
    case "common-input":
      return HandleType.COMMON_INPUT;
    case "common-output":
      return HandleType.COMMON_OUTPUT;

    default:
      console.warn(`未知的 handleType: ${handleType}，使用通用输出类型`);
      return HandleType.COMMON_OUTPUT;
  }
}

/**
 * 检查 Handle ID 是否为输入类型
 */
export function isInputHandle(handleId: string): boolean {
  const handleType = getHandleTypeFromId(handleId);

  const inputTypes = [
    HandleType.COMMON_INPUT,
    HandleType.END_INPUT,
    HandleType.TASK_GENERATOR_INPUT,
    HandleType.CONDITION_INPUT,
    HandleType.PARALLEL_EXECUTOR_INPUT,
    HandleType.PARALLEL_CHILD_INPUT,
    HandleType.API_CALLER_INPUT,
    HandleType.DATA_PROCESSOR_INPUT,
    HandleType.LOOP_INPUT,
    HandleType.LOOP_FEEDBACK_INPUT,
    HandleType.LLM_CALLER_INPUT
  ];

  return inputTypes.includes(handleType);
}

/**
 * 检查 Handle ID 是否为输出类型
 */
export function isOutputHandle(handleId: string): boolean {
  return !isInputHandle(handleId);
}
