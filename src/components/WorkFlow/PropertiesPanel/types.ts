export { NodeTypeEnum } from "../types";

/**
 * 分支配置接口
 */
export interface BranchConfig {
  name: string;
  condition?: string;
  handlerId?: string;
  targetNodeId?: string;
}

/**
 * 并行子节点配置接口
 */
export interface ParallelChildConfig {
  name: string;
  targetNodeId?: string;
  timeout: number;
}

/**
 * 并行配置接口
 */
export interface ParallelConfig {
  mode: "all" | "any" | "race";
  timeout: number;
}

/**
 * 节点数据接口
 */
export interface NodeData {
  label?: string;
  description?: string;
  color?: string;
  loading?: boolean;
  branches?: BranchConfig[];
  parallelChildren?: ParallelChildConfig[];
  parallelConfig?: ParallelConfig;
  [key: string]: any;
}

/**
 * 节点更新事件参数
 */
export interface NodeUpdatePayload {
  nodeId: string;
  updates: {
    data?: Partial<NodeData>;
    position?: { x: number; y: number };
    connectable?: boolean;
    [key: string]: any;
  };
}
