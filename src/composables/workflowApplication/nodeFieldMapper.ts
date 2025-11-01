/**
 * 节点字段映射器
 *
 * 设计理念：
 * 1. 元数据驱动：通过配置而非硬编码定义字段映射关系
 * 2. 类型安全：利用 TypeScript 类型系统确保映射正确性
 * 3. 可扩展：新增字段只需添加配置，无需修改核心逻辑
 * 4. 自动化：自动处理嵌套路径、类型转换、默认值
 */

import type { Node } from "@vue-flow/core";
import type {
  CreateWorkflowNodeRequest,
  UpdateWorkflowNodeRequest
} from "qc-admin-api-common/workflow";

/**
 * 字段映射配置
 */
interface FieldMappingConfig {
  /** 前端字段路径（支持点号分隔的嵌套路径，如 "data.label"） */
  frontendPath: string;

  /** 后端字段名 */
  backendKey: keyof CreateWorkflowNodeRequest | keyof UpdateWorkflowNodeRequest;

  /** 值转换函数（可选） */
  transform?: (value: any, node: Node) => any;

  /** 默认值（可选） */
  defaultValue?: any;

  /** 是否在创建时必需 */
  requiredOnCreate?: boolean;
}

/**
 * 字段映射元数据配置表
 *
 * 这是整个系统的核心配置，所有字段映射关系都在这里定义
 * 新增字段时只需在这里添加一条配置即可
 */
const FIELD_MAPPING_METADATA: FieldMappingConfig[] = [
  // ========== 基础字段 ==========
  {
    frontendPath: "data.label",
    backendKey: "name",
    transform: (value, node) => value || node.id,
    requiredOnCreate: true
  },
  {
    frontendPath: "type",
    backendKey: "type",
    requiredOnCreate: true
  },
  {
    frontendPath: "data.description",
    backendKey: "description",
    defaultValue: ""
  },
  {
    frontendPath: "data.config",
    backendKey: "config",
    defaultValue: {}
  },

  // ========== 位置字段（特殊处理：需要拆分为 positionX 和 positionY） ==========
  {
    frontendPath: "position.x",
    backendKey: "positionX"
  },
  {
    frontendPath: "position.y",
    backendKey: "positionY"
  },

  // ========== 节点类型特定字段 ==========
  {
    frontendPath: "data.prompt",
    backendKey: "prompt"
  },
  {
    frontendPath: "data.processorLanguage",
    backendKey: "processorLanguage"
  },
  {
    frontendPath: "data.processorCode",
    backendKey: "processorCode"
  },
  {
    frontendPath: "data.apiConfig",
    backendKey: "apiConfig"
  },
  {
    frontendPath: "data.parallelConfig",
    backendKey: "parallelConfig"
  },
  {
    frontendPath: "data.branchNodes",
    backendKey: "branchNodes"
  },
  {
    frontendPath: "data.workflowApplicationId",
    backendKey: "workflowApplicationId"
  },

  // ========== 执行配置字段 ==========
  {
    frontendPath: "data.async",
    backendKey: "async"
  },
  {
    frontendPath: "data.timeout",
    backendKey: "timeout"
  },
  {
    frontendPath: "data.retryCount",
    backendKey: "retryCount"
  },

  // ========== 样式字段 ==========
  {
    frontendPath: "data.color",
    backendKey: "color"
  }
];

/**
 * 根据路径从对象中获取值
 * 支持点号分隔的嵌套路径，如 "data.label"
 */
const getValueByPath = (obj: any, path: string): any => {
  const keys = path.split(".");
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }

  return value;
};

/**
 * 将前端 Node 转换为后端 CreateWorkflowNodeRequest
 *
 * @param node - 前端节点对象
 * @param applicationId - 应用ID
 * @returns 后端创建节点请求对象
 */
export const mapNodeToCreateRequest = (
  node: Node,
  applicationId: string
): CreateWorkflowNodeRequest => {
  const request: any = {
    applicationId
  };

  // 遍历所有字段映射配置
  for (const config of FIELD_MAPPING_METADATA) {
    // 获取前端值
    let value = getValueByPath(node, config.frontendPath);

    // 应用转换函数
    if (config.transform) {
      value = config.transform(value, node);
    }

    // 如果值为 undefined 且有默认值，使用默认值
    if (value === undefined && config.defaultValue !== undefined) {
      value = config.defaultValue;
    }

    // 如果是必需字段但值为 undefined，使用默认值或空值
    if (config.requiredOnCreate && value === undefined) {
      if (config.backendKey === "name") {
        value = node.id;
      } else if (config.backendKey === "type") {
        value = node.type;
      } else if (config.backendKey === "config") {
        value = {};
      }
    }

    // 设置后端字段值
    if (value !== undefined) {
      request[config.backendKey] = value;
    }
  }

  return request as CreateWorkflowNodeRequest;
};

/**
 * 将前端 Node 的变更字段转换为后端 UpdateWorkflowNodeRequest
 *
 * @param node - 前端节点对象
 * @param changedFields - 变更的字段路径列表（如 ["data.label", "position"]）
 * @returns 后端更新节点请求对象（只包含变更的字段）
 */
export const mapNodeToUpdateRequest = (
  node: Node,
  changedFields: string[]
): UpdateWorkflowNodeRequest => {
  const request: any = {};

  // 构建字段路径到配置的映射表（用于快速查找）
  const pathToConfigMap = new Map<string, FieldMappingConfig>();
  for (const config of FIELD_MAPPING_METADATA) {
    pathToConfigMap.set(config.frontendPath, config);
  }

  // 处理每个变更字段
  for (const changedField of changedFields) {
    // 特殊处理 position 字段（前端是 "position"，需要映射到 "position.x" 和 "position.y"）
    if (changedField === "position") {
      const xConfig = pathToConfigMap.get("position.x");
      const yConfig = pathToConfigMap.get("position.y");

      if (xConfig) {
        let xValue = getValueByPath(node, "position.x");
        if (xConfig.transform) {
          xValue = xConfig.transform(xValue, node);
        }
        if (xValue !== undefined) {
          request[xConfig.backendKey] = xValue;
        }
      }

      if (yConfig) {
        let yValue = getValueByPath(node, "position.y");
        if (yConfig.transform) {
          yValue = yConfig.transform(yValue, node);
        }
        if (yValue !== undefined) {
          request[yConfig.backendKey] = yValue;
        }
      }

      continue;
    }

    // 查找对应的映射配置
    const config = pathToConfigMap.get(changedField);
    if (!config) {
      // 如果没有找到映射配置，跳过该字段
      // 这可能是一些内部字段或临时字段
      continue;
    }

    // 获取前端值
    let value = getValueByPath(node, config.frontendPath);

    // 应用转换函数
    if (config.transform) {
      value = config.transform(value, node);
    }

    // 如果值为 undefined 且有默认值，使用默认值
    if (value === undefined && config.defaultValue !== undefined) {
      value = config.defaultValue;
    }

    // 设置后端字段值
    if (value !== undefined) {
      request[config.backendKey] = value;
    }
  }

  return request as UpdateWorkflowNodeRequest;
};

/**
 * 获取所有支持的前端字段路径
 * 用于 diff 系统
 */
export const getAllFrontendFieldPaths = (): string[] => {
  return FIELD_MAPPING_METADATA.map(config => config.frontendPath);
};

/**
 * 获取所有必需字段的前端路径
 * 用于验证
 */
export const getRequiredFieldPaths = (): string[] => {
  return FIELD_MAPPING_METADATA.filter(config => config.requiredOnCreate).map(
    config => config.frontendPath
  );
};
