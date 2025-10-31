/**
 * 节点类型（直接使用后端类型）
 */
export enum NodeTypeEnum {
  USER_INPUT = "user_input",
  END_NODE = "end_node",
  TODO_TASK_GENERATOR = "todo_task_generator",
  CONDITION_CHECKER = "condition_checker",
  PARALLEL_EXECUTOR = "parallel_executor",
  API_CALLER = "api_caller",
  DATA_PROCESSOR = "data_processor",
  WHILE_LOOP = "while_loop",
  LLM_CALLER = "llm_caller"
}

/**
 * 节点类型（类型别名）
 */
export type NodeType =
  | "user_input"
  | "end_node"
  | "todo_task_generator"
  | "condition_checker"
  | "parallel_executor"
  | "api_caller"
  | "data_processor"
  | "while_loop"
  | "llm_caller";

/**
 * 分支配置（用于判断节点）
 */
export interface BranchConfig {
  name: string; // 分支名称，如 "true", "false", "case1"
  targetNodeId?: string; // 目标节点ID
  condition?: string; // 分支条件表达式（可选）
}

/**
 * 并行配置（用于并行节点）
 */
export interface ParallelConfig {
  mode?: "all" | "any" | "race"; // 并行模式：全部完成、任意完成、竞速
  timeout?: number; // 超时时间
  [key: string]: any;
}

/**
 * 并行子节点配置（用于并行节点）
 */
export interface ParallelChildConfig {
  id?: string; // 子节点ID
  name: string; // 子节点名称
  targetNodeId?: string; // 目标节点ID
}

/**
 * 节点数据接口（匹配后端结构）
 */
export interface NodeData {
  label: string; // 节点名称
  nodeKey?: string; // 节点唯一标识符
  description?: string; // 节点描述
  prompt?: string; // 提示词（LLM节点）
  config?: Record<string, any>; // 节点配置
  processorLanguage?: string; // 处理器语言
  processorCode?: string; // 代码处理器
  apiConfig?: Record<string, any>; // API配置
  parallelConfig?: ParallelConfig; // 并行配置
  branches?: BranchConfig[]; // 分支配置（判断节点）
  parallelChildren?: ParallelChildConfig[]; // 并行子节点配置（并行节点）
  async?: boolean; // 是否异步执行
  timeout?: number; // 超时时间
  retryCount?: number; // 重试次数
  color?: string; // 节点颜色
  loading?: boolean; // 加载状态（UI用）
  _backendId?: string; // 后端ID（用于更新）
  [key: string]: any;
}

/**
 * 节点模板配置
 */
export interface NodeTemplate {
  type: NodeTypeEnum;
  label: string;
  icon: string;
  description: string;
  defaultData: NodeData;
}

/**
 * 边类型枚举
 */
export enum EdgeTypeEnum {
  DEFAULT = "default", // 普通连接（next_node）
  BRANCH = "branch", // 分支连接（condition_checker）
  PARALLEL = "parallel" // 并行子节点连接（parallel_executor）
}

/**
 * 节点连接规则
 */
export interface NodeConnectionRule {
  canHaveNextNode: boolean; // 是否可以有next_node_id
  canHaveBranches: boolean; // 是否可以有分支
  canBeParallel: boolean; // 是否可以作为并行节点的子节点
  requiresBranchName: boolean; // 连接时是否需要分支名称
  maxOutputConnections: number; // 最大输出连接数 (-1表示无限制)
}

/**
 * 获取节点类型的连接规则
 */
export function getNodeConnectionRule(
  nodeType: NodeTypeEnum | string
): NodeConnectionRule {
  const rules: Record<string, NodeConnectionRule> = {
    start: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: false,
      requiresBranchName: false,
      maxOutputConnections: 1
    },
    process: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: true,
      requiresBranchName: false,
      maxOutputConnections: 1
    },
    decision: {
      canHaveNextNode: false,
      canHaveBranches: true,
      canBeParallel: true,
      requiresBranchName: true,
      maxOutputConnections: -1 // 可以有多个分支
    },
    api_caller: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: true,
      requiresBranchName: false,
      maxOutputConnections: 1
    },
    data_processor: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: true,
      requiresBranchName: false,
      maxOutputConnections: 1
    },
    while_loop: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: false,
      requiresBranchName: false,
      maxOutputConnections: 1
    },
    end: {
      canHaveNextNode: false,
      canHaveBranches: false,
      canBeParallel: true,
      requiresBranchName: false,
      maxOutputConnections: 0
    },
    parallel: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: false,
      requiresBranchName: false,
      maxOutputConnections: 1
    },
    llm_caller: {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: true,
      requiresBranchName: false,
      maxOutputConnections: 1
    }
  };

  const rule = rules[nodeType];
  if (!rule) {
    // 默认规则
    return {
      canHaveNextNode: true,
      canHaveBranches: false,
      canBeParallel: true,
      requiresBranchName: false,
      maxOutputConnections: 1
    };
  }
  return rule;
}

/**
 * 边数据接口
 */
export interface EdgeData {
  branchName?: string; // 分支名称（用于分支连接）
  isParallelChild?: boolean; // 是否是并行子节点连接
  label?: string; // 边标签
  [key: string]: any;
}

/**
 * 节点配置接口
 */
export interface FlowNode {
  id: string;
  type: string;
  data: NodeData;
  position: { x: number; y: number };
  class?: string;
  connectable?: boolean;
}

/**
 * 边配置接口（增强版）
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // 源连接点ID
  targetHandle?: string; // 目标连接点ID
  type?: EdgeTypeEnum | string; // 边类型
  data?: EdgeData; // 边数据
  label?: string; // 边标签
  animated?: boolean; // 是否动画
  markerEnd?: any; // 箭头标记
}

/**
 * 面板状态接口
 */
export interface PanelState {
  isCollapsed: boolean;
  width?: number;
  height?: number;
}
