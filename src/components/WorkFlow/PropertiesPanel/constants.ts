import { NodeTypeEnum } from "../types";

/**
 * 节点类型标签映射
 */
export const NODE_TYPE_TAG_MAP: Record<
  string,
  "primary" | "success" | "warning" | "info" | "danger"
> = {
  [NodeTypeEnum.USER_INPUT]: "success",
  [NodeTypeEnum.END_NODE]: "danger",
  [NodeTypeEnum.DATA_PROCESSOR]: "primary",
  [NodeTypeEnum.CONDITION_CHECKER]: "warning",
  [NodeTypeEnum.PARALLEL_EXECUTOR]: "info",
  [NodeTypeEnum.API_CALLER]: "primary",
  [NodeTypeEnum.WHILE_LOOP]: "info",
  [NodeTypeEnum.LLM_CALLER]: "primary",
  [NodeTypeEnum.TODO_TASK_GENERATOR]: "warning",
  [NodeTypeEnum.WORKFLOW]: "info"
};

/**
 * 节点类型标签文本映射
 */
export const NODE_TYPE_LABEL_MAP: Record<string, string> = {
  [NodeTypeEnum.USER_INPUT]: "开始节点",
  [NodeTypeEnum.END_NODE]: "结束节点",
  [NodeTypeEnum.TODO_TASK_GENERATOR]: "待办任务生成节点",
  [NodeTypeEnum.CONDITION_CHECKER]: "条件检查节点",
  [NodeTypeEnum.PARALLEL_EXECUTOR]: "并行执行节点",
  [NodeTypeEnum.API_CALLER]: "API调用节点",
  [NodeTypeEnum.DATA_PROCESSOR]: "数据处理节点",
  [NodeTypeEnum.WHILE_LOOP]: "循环节点",
  [NodeTypeEnum.LLM_CALLER]: "LLM调用节点",
  [NodeTypeEnum.WORKFLOW]: "工作流节点"
};

/**
 * 并行模式选项
 */
export const PARALLEL_MODE_OPTIONS = [
  { label: "全部完成 (all)", value: "all" },
  { label: "任意完成 (any)", value: "any" },
  { label: "竞速模式 (race)", value: "race" }
] as const;

/**
 * 默认并行配置
 */
export const DEFAULT_PARALLEL_CONFIG = {
  mode: "all" as const,
  timeout: 30000
};
