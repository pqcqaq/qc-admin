/**
 * Handle 兼容性矩阵生成器
 *
 * 用于生成和可视化 Handle 类型兼容性矩阵
 */

import {
  HandleType,
  HANDLE_COMPATIBILITY,
  HANDLE_TYPE_LABELS
} from "./edgeValidation";

/**
 * 所有 Handle 类型列表（按类别分组）
 */
const ALL_HANDLE_TYPES = [
  // 通用类型
  HandleType.COMMON_INPUT,
  HandleType.COMMON_OUTPUT,

  // 开始/结束
  HandleType.START_OUTPUT,
  HandleType.END_INPUT,

  // 任务生成器
  HandleType.TASK_GENERATOR_INPUT,
  HandleType.TASK_GENERATOR_OUTPUT,

  // 条件检查器
  HandleType.CONDITION_INPUT,
  HandleType.CONDITION_BRANCH_OUTPUT,

  // 并行执行器
  HandleType.PARALLEL_EXECUTOR_INPUT,
  HandleType.PARALLEL_THREAD_OUTPUT,
  // HandleType.PARALLEL_CHILD_INPUT,

  // API调用器
  HandleType.API_CALLER_INPUT,
  HandleType.API_CALLER_OUTPUT,

  // 数据处理器
  HandleType.DATA_PROCESSOR_INPUT,
  HandleType.DATA_PROCESSOR_OUTPUT,

  // 循环节点
  HandleType.LOOP_INPUT,
  HandleType.LOOP_BODY_OUTPUT,
  HandleType.LOOP_CONTINUE_OUTPUT,
  HandleType.LOOP_FEEDBACK_INPUT,

  // LLM调用器
  HandleType.LLM_CALLER_INPUT,
  HandleType.LLM_CALLER_OUTPUT
];

/**
 * Handle 类型的简称（用于矩阵显示）
 */
const HANDLE_TYPE_SHORT_LABELS: Partial<Record<HandleType, string>> = {
  // 通用类型
  [HandleType.COMMON_INPUT]: "通用入",
  [HandleType.COMMON_OUTPUT]: "通用出",

  // 开始/结束
  [HandleType.START_OUTPUT]: "开始",
  [HandleType.END_INPUT]: "结束",

  // 任务生成器
  [HandleType.TASK_GENERATOR_INPUT]: "任务入",
  [HandleType.TASK_GENERATOR_OUTPUT]: "任务出",

  // 条件检查器
  [HandleType.CONDITION_INPUT]: "条件入",
  [HandleType.CONDITION_BRANCH_OUTPUT]: "分支出",

  // 并行执行器
  [HandleType.PARALLEL_EXECUTOR_INPUT]: "并行入",
  [HandleType.PARALLEL_THREAD_OUTPUT]: "线程出",
  // [HandleType.PARALLEL_CHILD_INPUT]: "子任务入",

  // API调用器
  [HandleType.API_CALLER_INPUT]: "API入",
  [HandleType.API_CALLER_OUTPUT]: "API出",

  // 数据处理器
  [HandleType.DATA_PROCESSOR_INPUT]: "数据入",
  [HandleType.DATA_PROCESSOR_OUTPUT]: "数据出",

  // 循环节点
  [HandleType.LOOP_INPUT]: "循环入",
  [HandleType.LOOP_BODY_OUTPUT]: "循环体出",
  [HandleType.LOOP_CONTINUE_OUTPUT]: "循环继续",
  [HandleType.LOOP_FEEDBACK_INPUT]: "循环反馈",

  // LLM调用器
  [HandleType.LLM_CALLER_INPUT]: "LLM入",
  [HandleType.LLM_CALLER_OUTPUT]: "LLM出"
};

/**
 * 打印 Handle 兼容性矩阵到控制台
 */
export function printHandleCompatibilityMatrix() {
  console.log("========== Handle 兼容性矩阵 ==========\n");
  console.log("格式：[源Handle类型] → [目标Handle类型]\n");

  // 打印表头
  const header = [
    "源\\目标",
    ...ALL_HANDLE_TYPES.map(t => HANDLE_TYPE_SHORT_LABELS[t])
  ];
  console.log(header.join("\t"));
  console.log("-".repeat(80));

  // 打印每一行
  for (const sourceType of ALL_HANDLE_TYPES) {
    const row = [HANDLE_TYPE_SHORT_LABELS[sourceType]];

    for (const targetType of ALL_HANDLE_TYPES) {
      const isCompatible = HANDLE_COMPATIBILITY[sourceType]?.[targetType];
      row.push(isCompatible ? "✅" : "❌");
    }

    console.log(row.join("\t"));
  }

  console.log("\n");
}

/**
 * 导出 Handle 兼容性矩阵为 Markdown 格式
 */
export function exportHandleCompatibilityAsMarkdown(): string {
  let markdown = "# Handle 兼容性矩阵\n\n";
  markdown += "本文档展示了工作流系统中所有 Handle 类型之间的兼容性规则。\n\n";
  markdown += "## 📊 兼容性矩阵说明\n\n";
  markdown += "- ✅ = 允许连接\n";
  markdown += "- ❌ = 不允许连接\n\n";
  markdown += "矩阵格式：`[源Handle类型] → [目标Handle类型]`\n\n";

  // 生成表格
  markdown += "## 🔗 Handle 兼容性表格\n\n";
  markdown += "| 源\\目标 |";
  for (const targetType of ALL_HANDLE_TYPES) {
    markdown += ` ${HANDLE_TYPE_SHORT_LABELS[targetType]} |`;
  }
  markdown += "\n|---|";
  for (let i = 0; i < ALL_HANDLE_TYPES.length; i++) {
    markdown += "---|";
  }
  markdown += "\n";

  for (const sourceType of ALL_HANDLE_TYPES) {
    markdown += `| **${HANDLE_TYPE_SHORT_LABELS[sourceType]}** |`;
    for (const targetType of ALL_HANDLE_TYPES) {
      const isCompatible = HANDLE_COMPATIBILITY[sourceType]?.[targetType];
      markdown += ` ${isCompatible ? "✅" : "❌"} |`;
    }
    markdown += "\n";
  }

  // 添加规则说明
  markdown += "\n## 📝 Handle 类型说明\n\n";
  markdown += "| Handle 类型 | 完整名称 | 简称 |\n";
  markdown += "|---|---|---|\n";

  // 动态生成所有 Handle 类型的说明
  for (const handleType of ALL_HANDLE_TYPES) {
    const fullName = HANDLE_TYPE_LABELS[handleType] || handleType;
    const shortName = HANDLE_TYPE_SHORT_LABELS[handleType] || handleType;
    markdown += `| ${handleType} | ${fullName} | ${shortName} |\n`;
  }

  markdown += "\n## 🎯 兼容性规则\n\n";
  markdown +=
    "- ✅ 表示允许连接\n- ❌ 表示不允许连接\n- 空白表示未定义（默认不允许）\n\n";

  markdown += "---\n\n";
  markdown += "**注意：** 此文档基于 `HANDLE_COMPATIBILITY` 矩阵自动生成。\n";

  return markdown;
}
