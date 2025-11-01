/**
 * 边验证逻辑 - 基于连接矩阵的框架化设计
 * 集中管理所有节点类型之间的连接规则
 */

import { NodeTypeEnum } from "@/components/WorkFlow/types";
import type { Node, Edge, Connection } from "@vue-flow/core";
import { getHandleTypeFromId } from "./handleIdUtils";

/**
 * Handle 类型枚举 - 细分版本
 *
 * 为每种节点类型定义专属的输入和输出 HandleType
 * 命名规范：{节点类型}_{INPUT/OUTPUT}
 */
export enum HandleType {
  // ========== 通用输入类型 ==========
  COMMON_INPUT = "common_input", // 通用输入（大多数节点的标准输入）

  // ========== 通用输出类型 ==========
  COMMON_OUTPUT = "common_output", // 通用输出（大多数节点的标准输出）

  // ========== 开始节点 (USER_INPUT) ==========
  START_OUTPUT = "start_output", // 开始节点的输出

  // ========== 结束节点 (END_NODE) ==========
  END_INPUT = "end_input", // 结束节点的输入

  // ========== 任务生成器 (TODO_TASK_GENERATOR) ==========
  TASK_GENERATOR_INPUT = "task_generator_input", // 任务生成器的输入
  TASK_GENERATOR_OUTPUT = "task_generator_output", // 任务生成器的输出

  // ========== 条件检查器 (CONDITION_CHECKER) ==========
  CONDITION_INPUT = "condition_input", // 条件节点的输入
  CONDITION_BRANCH_OUTPUT = "condition_branch_output", // 条件节点的分支输出

  // ========== 并行执行器 (PARALLEL_EXECUTOR) ==========
  PARALLEL_EXECUTOR_INPUT = "parallel_executor_input", // 并行执行器的输入
  PARALLEL_THREAD_OUTPUT = "parallel_thread_output", // 并行执行器的线程输出（连接到子任务）
  PARALLEL_CHILD_INPUT = "parallel_child_input", // 并行子任务的输入（接收来自并行执行器的连接）

  // ========== API调用器 (API_CALLER) ==========
  API_CALLER_INPUT = "api_caller_input", // API调用器的输入
  API_CALLER_OUTPUT = "api_caller_output", // API调用器的输出

  // ========== 数据处理器 (DATA_PROCESSOR) ==========
  DATA_PROCESSOR_INPUT = "data_processor_input", // 数据处理器的输入
  DATA_PROCESSOR_OUTPUT = "data_processor_output", // 数据处理器的输出

  // ========== 循环节点 (WHILE_LOOP) ==========
  LOOP_INPUT = "loop_input", // 循环节点的输入
  LOOP_BODY_OUTPUT = "loop_body_output", // 循环体输出（进入循环体）
  LOOP_CONTINUE_OUTPUT = "loop_continue_output", // 循环继续输出（循环结束后）
  LOOP_FEEDBACK_INPUT = "loop_feedback_input", // 循环反馈输入（循环体回到循环节点）

  // ========== LLM调用器 (LLM_CALLER) ==========
  LLM_CALLER_INPUT = "llm_caller_input", // LLM调用器的输入
  LLM_CALLER_OUTPUT = "llm_caller_output", // LLM调用器的输出

  // ========== 工作流节点 (WORKFLOW) ==========
  WORKFLOW_INPUT = "workflow_input", // 工作流节点的输入
  WORKFLOW_OUTPUT = "workflow_output" // 工作流节点的输出
}

/**
 * Handle 兼容性矩阵 - 细分版本
 *
 * 定义哪些输出类型可以连接到哪些输入类型
 * 格式：HANDLE_COMPATIBILITY[源Handle类型][目标Handle类型] = 是否兼容
 *
 * 设计原则：
 * 1. 所有输出类型都不能连接到其他输出类型
 * 2. 所有输入类型都不能连接到其他输入类型
 * 3. 通用输出可以连接到大多数通用输入
 * 4. 特殊输出只能连接到特定的输入类型
 */
export const HANDLE_COMPATIBILITY: Record<
  HandleType,
  Partial<Record<HandleType, boolean>>
> = {
  // ========== 通用输入 (COMMON_INPUT) ==========
  [HandleType.COMMON_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 通用输出 (COMMON_OUTPUT) ==========
  [HandleType.COMMON_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 通用输出 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 通用输出 → 任务生成器输入
    [HandleType.CONDITION_INPUT]: true, // ✅ 通用输出 → 条件输入
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 通用输出 → 并行执行器输入
    [HandleType.API_CALLER_INPUT]: true, // ✅ 通用输出 → API调用器输入
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 通用输出 → 数据处理器输入
    [HandleType.LOOP_INPUT]: true, // ✅ 通用输出 → 循环输入
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 通用输出 → LLM调用器输入
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 通用输出 → 工作流输入
    [HandleType.END_INPUT]: true // ✅ 通用输出 → 结束节点输入
  },

  // ========== 开始节点输出 (START_OUTPUT) ==========
  [HandleType.START_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 开始 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 开始 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 开始 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 开始 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 开始 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 开始 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 开始 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 开始 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 开始 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ 开始 → 结束（允许空流程）
  },

  // ========== 结束节点输入 (END_INPUT) ==========
  [HandleType.END_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 任务生成器输入 (TASK_GENERATOR_INPUT) ==========
  [HandleType.TASK_GENERATOR_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 任务生成器输出 (TASK_GENERATOR_OUTPUT) ==========
  [HandleType.TASK_GENERATOR_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 任务生成器 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 任务生成器 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 任务生成器 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 任务生成器 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 任务生成器 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 任务生成器 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 任务生成器 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 任务生成器 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 任务生成器 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ 任务生成器 → 结束
  },

  // ========== 条件节点输入 (CONDITION_INPUT) ==========
  [HandleType.CONDITION_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 条件分支输出 (CONDITION_BRANCH_OUTPUT) ==========
  [HandleType.CONDITION_BRANCH_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 条件分支 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 条件分支 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 条件分支 → 条件检查器（嵌套条件）
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 条件分支 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 条件分支 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 条件分支 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 条件分支 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 条件分支 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 条件分支 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ 条件分支 → 结束
  },

  // ========== 并行执行器输入 (PARALLEL_EXECUTOR_INPUT) ==========
  [HandleType.PARALLEL_EXECUTOR_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 并行线程输出 (PARALLEL_THREAD_OUTPUT) ==========
  [HandleType.PARALLEL_THREAD_OUTPUT]: {
    [HandleType.PARALLEL_CHILD_INPUT]: true // ✅ 并行线程 → 并行子任务（专用连接）
  },

  // ========== 并行子任务输入 (PARALLEL_CHILD_INPUT) ==========
  [HandleType.PARALLEL_CHILD_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== API调用器输入 (API_CALLER_INPUT) ==========
  [HandleType.API_CALLER_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== API调用器输出 (API_CALLER_OUTPUT) ==========
  [HandleType.API_CALLER_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ API调用器 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ API调用器 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ API调用器 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ API调用器 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ API调用器 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ API调用器 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ API调用器 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ API调用器 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ API调用器 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ API调用器 → 结束
  },

  // ========== 数据处理器输入 (DATA_PROCESSOR_INPUT) ==========
  [HandleType.DATA_PROCESSOR_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 数据处理器输出 (DATA_PROCESSOR_OUTPUT) ==========
  [HandleType.DATA_PROCESSOR_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 数据处理器 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 数据处理器 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 数据处理器 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 数据处理器 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 数据处理器 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 数据处理器 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 数据处理器 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 数据处理器 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 数据处理器 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ 数据处理器 → 结束
  },

  // ========== 循环输入 (LOOP_INPUT) ==========
  [HandleType.LOOP_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 循环体输出 (LOOP_BODY_OUTPUT) ==========
  [HandleType.LOOP_BODY_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 循环体 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 循环体 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 循环体 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 循环体 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 循环体 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 循环体 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 循环体 → 循环节点（嵌套循环）
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 循环体 → LLM调用器
    [HandleType.LOOP_FEEDBACK_INPUT]: true // ✅ 循环体 → 循环反馈（回到循环节点）
  },

  // ========== 循环继续输出 (LOOP_CONTINUE_OUTPUT) ==========
  [HandleType.LOOP_CONTINUE_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 循环结束 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 循环结束 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 循环结束 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 循环结束 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 循环结束 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 循环结束 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 循环结束 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 循环结束 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 循环结束 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ 循环结束 → 结束
  },

  // ========== 循环反馈输入 (LOOP_FEEDBACK_INPUT) ==========
  [HandleType.LOOP_FEEDBACK_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== LLM调用器输入 (LLM_CALLER_INPUT) ==========
  [HandleType.LLM_CALLER_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== LLM调用器输出 (LLM_CALLER_OUTPUT) ==========
  [HandleType.LLM_CALLER_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ LLM调用器 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ LLM调用器 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ LLM调用器 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ LLM调用器 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ LLM调用器 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ LLM调用器 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ LLM调用器 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ LLM调用器 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ LLM调用器 → 工作流节点
    [HandleType.END_INPUT]: true // ✅ LLM调用器 → 结束
  },

  // ========== 工作流节点输入 (WORKFLOW_INPUT) ==========
  [HandleType.WORKFLOW_INPUT]: {
    // 输入不能作为源连接点
  },

  // ========== 工作流节点输出 (WORKFLOW_OUTPUT) ==========
  [HandleType.WORKFLOW_OUTPUT]: {
    [HandleType.COMMON_INPUT]: true, // ✅ 工作流 → 通用输入
    [HandleType.TASK_GENERATOR_INPUT]: true, // ✅ 工作流 → 任务生成器
    [HandleType.CONDITION_INPUT]: true, // ✅ 工作流 → 条件检查器
    [HandleType.PARALLEL_EXECUTOR_INPUT]: true, // ✅ 工作流 → 并行执行器
    [HandleType.API_CALLER_INPUT]: true, // ✅ 工作流 → API调用器
    [HandleType.DATA_PROCESSOR_INPUT]: true, // ✅ 工作流 → 数据处理器
    [HandleType.LOOP_INPUT]: true, // ✅ 工作流 → 循环节点
    [HandleType.LLM_CALLER_INPUT]: true, // ✅ 工作流 → LLM调用器
    [HandleType.WORKFLOW_INPUT]: true, // ✅ 工作流 → 工作流节点（允许嵌套）
    [HandleType.END_INPUT]: true // ✅ 工作流 → 结束
  }
};

/**
 * 连接规则
 */
export interface ConnectionRule {
  allowed: boolean; // 是否允许连接
  reason?: string; // 不允许的原因
  maxConnections?: number; // 最大连接数 (-1表示无限制)
}

/**
 * 节点输出规则
 */
export interface NodeOutputRule {
  canHaveNormalOutput: boolean; // 是否可以有普通输出
  canHaveBranchOutput: boolean; // 是否可以有分支输出
  canHaveParallelOutput: boolean; // 是否可以有并行输出
  maxNormalOutputs: number; // 最大普通输出数 (-1表示无限制)
  maxBranchOutputs: number; // 最大分支输出数 (-1表示无限制)
  maxParallelOutputs: number; // 最大并行输出数 (-1表示无限制)
}

/**
 * 节点输入规则
 */
export interface NodeInputRule {
  canBeTarget: boolean; // 是否可以作为目标节点
  maxInputs: number; // 最大输入连接数 (-1表示无限制)
  allowedSourceTypes?: NodeTypeEnum[]; // 允许的源节点类型（undefined表示允许所有）
}

/**
 * 节点输出规则配置
 */
const NODE_OUTPUT_RULES: Record<string, NodeOutputRule> = {
  [NodeTypeEnum.USER_INPUT]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.TODO_TASK_GENERATOR]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.CONDITION_CHECKER]: {
    canHaveNormalOutput: false, // 条件节点只能通过分支输出
    canHaveBranchOutput: true,
    canHaveParallelOutput: false,
    maxNormalOutputs: 0,
    maxBranchOutputs: 1, // 无限制
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.API_CALLER]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.DATA_PROCESSOR]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.WHILE_LOOP]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.END_NODE]: {
    canHaveNormalOutput: false, // 结束节点不能有任何输出
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 0,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.PARALLEL_EXECUTOR]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: true, // 并行执行器可以有并行子节点
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: -1 // 无限制
  },
  [NodeTypeEnum.LLM_CALLER]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  },
  [NodeTypeEnum.WORKFLOW]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  }
};

/**
 * 节点输入规则配置
 */
const NODE_INPUT_RULES: Record<string, NodeInputRule> = {
  [NodeTypeEnum.USER_INPUT]: {
    canBeTarget: false, // 开始节点不能被连接
    maxInputs: 0
  },
  [NodeTypeEnum.TODO_TASK_GENERATOR]: {
    canBeTarget: true,
    maxInputs: -1 // 无限制
  },
  [NodeTypeEnum.CONDITION_CHECKER]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.API_CALLER]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.DATA_PROCESSOR]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.WHILE_LOOP]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.END_NODE]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.PARALLEL_EXECUTOR]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.LLM_CALLER]: {
    canBeTarget: true,
    maxInputs: -1
  },
  [NodeTypeEnum.WORKFLOW]: {
    canBeTarget: true,
    maxInputs: -1
  }
};

/**
 * 获取节点输出规则
 */
export function getNodeOutputRule(
  nodeType: NodeTypeEnum | string
): NodeOutputRule {
  return (
    NODE_OUTPUT_RULES[nodeType] || {
      canHaveNormalOutput: true,
      canHaveBranchOutput: false,
      canHaveParallelOutput: false,
      maxNormalOutputs: 1,
      maxBranchOutputs: 0,
      maxParallelOutputs: 0
    }
  );
}

/**
 * 获取节点输入规则
 */
export function getNodeInputRule(
  nodeType: NodeTypeEnum | string
): NodeInputRule {
  return (
    NODE_INPUT_RULES[nodeType] || {
      canBeTarget: true,
      maxInputs: -1
    }
  );
}

/**
 * 检查 Handle 类型兼容性
 *
 * @param sourceHandleType - 源 Handle 类型
 * @param targetHandleType - 目标 Handle 类型
 * @returns 连接规则
 */
function checkHandleCompatibility(
  sourceHandleType: HandleType,
  targetHandleType: HandleType
): ConnectionRule {
  // 查询兼容性矩阵
  const isCompatible =
    HANDLE_COMPATIBILITY[sourceHandleType]?.[targetHandleType];

  if (!isCompatible) {
    // 生成友好的错误提示
    const sourceLabel = getHandleTypeLabel(sourceHandleType);
    const targetLabel = getHandleTypeLabel(targetHandleType);

    return {
      allowed: false,
      reason: `「${sourceLabel}」不能连接到「${targetLabel}」`
    };
  }

  return { allowed: true };
}

/**
 * Handle 类型的中文标签
 */
export const HANDLE_TYPE_LABELS: Record<HandleType, string> = {
  // 通用类型
  [HandleType.COMMON_INPUT]: "通用输入",
  [HandleType.COMMON_OUTPUT]: "通用输出",

  // 开始/结束节点
  [HandleType.START_OUTPUT]: "开始输出",
  [HandleType.END_INPUT]: "结束输入",

  // 任务生成器
  [HandleType.TASK_GENERATOR_INPUT]: "任务生成器输入",
  [HandleType.TASK_GENERATOR_OUTPUT]: "任务生成器输出",

  // 条件检查器
  [HandleType.CONDITION_INPUT]: "条件输入",
  [HandleType.CONDITION_BRANCH_OUTPUT]: "条件分支输出",

  // 并行执行器
  [HandleType.PARALLEL_EXECUTOR_INPUT]: "并行执行器输入",
  [HandleType.PARALLEL_THREAD_OUTPUT]: "并行线程输出",
  [HandleType.PARALLEL_CHILD_INPUT]: "并行子任务输入",

  // API调用器
  [HandleType.API_CALLER_INPUT]: "API调用器输入",
  [HandleType.API_CALLER_OUTPUT]: "API调用器输出",

  // 数据处理器
  [HandleType.DATA_PROCESSOR_INPUT]: "数据处理器输入",
  [HandleType.DATA_PROCESSOR_OUTPUT]: "数据处理器输出",

  // 循环节点
  [HandleType.LOOP_INPUT]: "循环输入",
  [HandleType.LOOP_BODY_OUTPUT]: "循环体输出",
  [HandleType.LOOP_CONTINUE_OUTPUT]: "循环继续输出",
  [HandleType.LOOP_FEEDBACK_INPUT]: "循环反馈输入",

  // LLM调用器
  [HandleType.LLM_CALLER_INPUT]: "LLM调用器输入",
  [HandleType.LLM_CALLER_OUTPUT]: "LLM调用器输出",

  // 工作流节点
  [HandleType.WORKFLOW_INPUT]: "工作流输入",
  [HandleType.WORKFLOW_OUTPUT]: "工作流输出"
};

/**
 * 获取 HandleType 的中文标签
 */
export function getHandleTypeLabel(handleType: HandleType): string {
  return HANDLE_TYPE_LABELS[handleType] || handleType;
}

/**
 * Handle 连接数量限制规则
 *
 * 定义每个 Handle 类型的输入/输出连接数量限制
 */
export interface HandleConnectionLimits {
  maxInputConnections: number; // 最大输入连接数（-1表示无限制）
  maxOutputConnections: number; // 最大输出连接数（-1表示无限制）
}

/**
 * Handle 连接数量限制配置表
 *
 * 关键规则：
 * - 每个输出 Handle 只能有一个输出连接
 * - 输入 Handle 可以接受多个输入连接（-1表示无限制）
 */
export const HANDLE_CONNECTION_LIMITS: Record<
  HandleType,
  HandleConnectionLimits
> = {
  // ========== 通用类型 ==========
  [HandleType.COMMON_INPUT]: {
    maxInputConnections: -1, // 可以接受多个输入连接
    maxOutputConnections: 0 // 输入 Handle 不能有输出
  },

  [HandleType.COMMON_OUTPUT]: {
    maxInputConnections: 0, // 输出 Handle 不能有输入
    maxOutputConnections: 1 // 每个输出 Handle 只能有一个输出连接
  },

  // ========== 开始/结束节点 ==========
  [HandleType.START_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  [HandleType.END_INPUT]: {
    maxInputConnections: -1, // 结束节点可以接受多个输入
    maxOutputConnections: 0
  },

  // ========== 任务生成器 ==========
  [HandleType.TASK_GENERATOR_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.TASK_GENERATOR_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  // ========== 条件检查器 ==========
  [HandleType.CONDITION_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.CONDITION_BRANCH_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1 // 每个分支只能连接一个目标
  },

  // ========== 并行执行器 ==========
  [HandleType.PARALLEL_EXECUTOR_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.PARALLEL_THREAD_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1 // 每个并行线程只能连接一个子任务
  },

  [HandleType.PARALLEL_CHILD_INPUT]: {
    maxInputConnections: 1, // 并行子任务只能接受一个来自并行执行器的连接
    maxOutputConnections: 0
  },

  // ========== API调用器 ==========
  [HandleType.API_CALLER_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.API_CALLER_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  // ========== 数据处理器 ==========
  [HandleType.DATA_PROCESSOR_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.DATA_PROCESSOR_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  // ========== 循环节点 ==========
  [HandleType.LOOP_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.LOOP_BODY_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  [HandleType.LOOP_CONTINUE_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  [HandleType.LOOP_FEEDBACK_INPUT]: {
    maxInputConnections: 1, // 循环反馈只能接受一个连接
    maxOutputConnections: 0
  },

  // ========== LLM调用器 ==========
  [HandleType.LLM_CALLER_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.LLM_CALLER_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  },

  // ========== 工作流节点 ==========
  [HandleType.WORKFLOW_INPUT]: {
    maxInputConnections: -1,
    maxOutputConnections: 0
  },

  [HandleType.WORKFLOW_OUTPUT]: {
    maxInputConnections: 0,
    maxOutputConnections: 1
  }
};

/**
 * 边验证结果
 */
export interface EdgeValidationResult {
  success: boolean;
  error?: string;
}

/**
 * 验证边是否可以添加（基于连接矩阵）
 */
export function validateEdgeConnection(
  connection: Connection,
  sourceNode: Node | undefined,
  targetNode: Node | undefined,
  allEdges: Edge[]
): EdgeValidationResult {
  // ========== 第一步：基础验证 ==========

  // 1. 检查节点是否存在
  if (!sourceNode) {
    return { success: false, error: "源节点不存在" };
  }
  if (!targetNode) {
    return { success: false, error: "目标节点不存在" };
  }

  // 2. 防止自连接
  if (connection.source === connection.target) {
    return { success: false, error: "不能连接到自己" };
  }

  // 3. 检查是否是重复连接
  const duplicateEdge = allEdges.find(
    e =>
      e.source === connection.source &&
      e.target === connection.target &&
      e.sourceHandle === connection.sourceHandle
  );
  if (duplicateEdge) {
    return { success: false, error: "该连接已存在" };
  }

  // ========== 第二步：Handle 类型判断 ==========

  // 获取源 Handle 和目标 Handle 的类型（使用新的 getHandleTypeFromId）
  const sourceHandleType = getHandleTypeFromId(connection.sourceHandle);
  const targetHandleType = getHandleTypeFromId(connection.targetHandle);

  // ========== 第三步：Handle 兼容性验证 ==========

  // 检查 Handle 类型是否兼容
  const compatibilityResult = checkHandleCompatibility(
    sourceHandleType,
    targetHandleType
  );

  if (!compatibilityResult.allowed) {
    return {
      success: false,
      error: compatibilityResult.reason || "不支持的连接类型"
    };
  } else {
    console.log("成功将类型", sourceHandleType, "连接到", targetHandleType);
  }

  // ========== 第四步：特殊业务规则验证 ==========

  // 特殊规则1：开始节点不能连接到开始节点
  if (
    sourceNode.type === NodeTypeEnum.USER_INPUT &&
    targetNode.type === NodeTypeEnum.USER_INPUT
  ) {
    return {
      success: false,
      error: "开始节点不能连接到开始节点"
    };
  }

  // 特殊规则2：检查目标节点是否可以被连接
  const inputRule = getNodeInputRule(targetNode.type);
  if (!inputRule.canBeTarget) {
    const targetName = targetNode.data?.label || targetNode.type;
    return {
      success: false,
      error: `${targetName} 不能作为目标节点`
    };
  }

  // ========== 第五步：Handle 连接数量限制验证 ==========

  // 5.1 检查源 Handle 的输出连接数量限制
  const sourceHandleLimits = HANDLE_CONNECTION_LIMITS[sourceHandleType];
  const sourceHandleLabel = getHandleTypeLabel(sourceHandleType);

  if (sourceHandleLimits.maxOutputConnections !== -1) {
    // 统计该具体 Handle 已有的输出连接数
    const existingOutputEdges = allEdges.filter(
      e =>
        e.source === connection.source &&
        e.sourceHandle === connection.sourceHandle
    );

    if (existingOutputEdges.length >= sourceHandleLimits.maxOutputConnections) {
      const sourceName = sourceNode.data?.label || sourceNode.type;
      return {
        success: false,
        error: `${sourceName} 的「${sourceHandleLabel}」已达到最大输出连接数（${sourceHandleLimits.maxOutputConnections}）`
      };
    }
  }

  // 5.2 检查目标 Handle 的输入连接数量限制
  const targetHandleLimits = HANDLE_CONNECTION_LIMITS[targetHandleType];
  const targetHandleLabel = getHandleTypeLabel(targetHandleType);

  if (targetHandleLimits.maxInputConnections !== -1) {
    // 统计该具体 Handle 已有的输入连接数
    const existingInputEdges = allEdges.filter(
      e =>
        e.target === connection.target &&
        e.targetHandle === connection.targetHandle
    );

    if (existingInputEdges.length >= targetHandleLimits.maxInputConnections) {
      const targetName = targetNode.data?.label || targetNode.type;
      return {
        success: false,
        error: `${targetName} 的「${targetHandleLabel}」已达到最大输入连接数（${targetHandleLimits.maxInputConnections}）`
      };
    }
  }

  // ========== 所有验证通过 ==========
  return { success: true };
}

/**
 * 检查是否可以删除边
 */
export function validateEdgeDeletion(
  _edge: Edge,
  _sourceNode: Node | undefined,
  _targetNode: Node | undefined
): EdgeValidationResult {
  // 目前没有特殊的删除限制
  // 可以在这里添加业务规则，例如：

  // 示例1：防止删除开始节点的唯一输出连接
  // if (_sourceNode?.type === NodeTypeEnum.USER_INPUT) {
  //   return {
  //     success: false,
  //     error: "不能删除开始节点的输出连接，工作流必须有起点"
  //   };
  // }

  // 示例2：防止删除条件节点的最后一个分支
  // if (_sourceNode?.type === NodeTypeEnum.CONDITION_CHECKER) {
  //   const branchEdges = allEdges.filter(
  //     e => e.source === _sourceNode.id && e.sourceHandle?.includes("-branch-")
  //   );
  //   if (branchEdges.length === 1) {
  //     return {
  //       success: false,
  //       error: "条件节点至少需要保留一个分支"
  //     };
  //   }
  // }

  // 示例3：删除关键连接前需要确认
  // if (_edge.data?.critical) {
  //   return {
  //     success: false,
  //     error: "这是一个关键连接，请先在节点属性中取消标记"
  //   };
  // }

  // 默认允许删除
  return { success: true };
}

// ========== 导出新的 Handle ID 工具函数 ==========

/**
 * 从 Handle ID 中提取 HandleType（新版本）
 *
 * 这是推荐使用的函数，基于语义化的 Handle ID 格式。
 *
 * @param handleId - Handle ID 字符串
 * @returns HandleType 枚举值
 */
export { getHandleTypeFromId };
