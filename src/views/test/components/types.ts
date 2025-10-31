/**
 * 节点类型定义（前端）
 */
export enum NodeTypeEnum {
  START = "start", // 用户输入节点
  END = "end", // 结束节点
  PROCESS = "process", // 待办任务生成器
  DECISION = "decision", // 条件检查节点（分支）
  PARALLEL = "parallel", // 并行执行节点
  API_CALLER = "api_caller", // API调用节点
  DATA_PROCESSOR = "data_processor", // 数据处理节点
  WHILE_LOOP = "while_loop", // 循环节点
  LLM_CALLER = "llm_caller" // LLM调用节点
}

/**
 * 后端节点类型
 */
export type BackendNodeType =
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
 * 节点模板配置
 */
export interface NodeTemplate {
  type: NodeTypeEnum;
  label: string;
  icon: string;
  description: string;
  defaultData: Record<string, any>;
}

/**
 * 节点数据接口
 */
export interface NodeData {
  label: string;
  description?: string;
  loading?: boolean;
  color?: string;
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
 * 边配置接口
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  markerEnd?: any;
}

/**
 * 面板状态接口
 */
export interface PanelState {
  isCollapsed: boolean;
  width?: number;
  height?: number;
}
