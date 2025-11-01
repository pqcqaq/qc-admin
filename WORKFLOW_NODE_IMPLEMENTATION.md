# Workflow 节点实现总结

## ✅ 实现完成

已成功添加 **Workflow 节点类型**，用于引用第三方 WorkflowApplication。

---

## 📋 实现内容

### 1. **数据库层 (Backend)**

#### `database/schema/workflow.go`

- ✅ 添加节点类型枚举值：`"workflow"` - 工作流节点（引用第三方WorkflowApplication）
- ✅ 添加字段：`workflow_application_id` (Uint64, Optional) - 引用的工作流应用ID

#### `shared/models/workflow.go`

- ✅ 更新 `WorkflowNodeResponse` 添加 `WorkflowApplicationID` 字段
- ✅ 更新 `CreateWorkflowNodeRequest` 添加 `WorkflowApplicationID` 字段
- ✅ 更新 `UpdateWorkflowNodeRequest` 添加 `WorkflowApplicationID` 字段
- ✅ 所有类型注释中添加 `workflow` 类型说明

---

### 2. **前端类型定义**

#### `src/components/WorkFlow/types.ts`

- ✅ `NodeTypeEnum` 添加：`WORKFLOW = "workflow"`
- ✅ `NodeData` 接口添加：`workflowApplicationId?: string`

#### `src/workflow/types.ts`

- ✅ `WorkflowNodeType` 添加：`'workflow'`
- ✅ `CreateWorkflowNodeRequest` 添加：`workflowApplicationId?: string`
- ✅ `UpdateWorkflowNodeRequest` 添加：`workflowApplicationId?: string`

---

### 3. **Handle ID 系统**

#### `src/composables/workflowApplication/handleIdUtils.ts`

- ✅ 添加 `WorkflowHandles` 生成器：
  ```typescript
  export const WorkflowHandles = {
    input: (nodeId: string) => createHandleId(nodeId, "workflow-input"),
    output: (nodeId: string) => createHandleId(nodeId, "workflow-output")
  };
  ```
- ✅ 更新 `getHandleTypeFromId()` 支持 `"workflow-input"` 和 `"workflow-output"`
- ✅ 更新 `isInputHandle()` 包含 `HandleType.WORKFLOW_INPUT`

#### `src/composables/workflowApplication/edgeValidation.ts`

- ✅ `HandleType` 枚举添加：
  - `WORKFLOW_INPUT = "workflow_input"`
  - `WORKFLOW_OUTPUT = "workflow_output"`

- ✅ `HANDLE_COMPATIBILITY` 矩阵更新：
  - `WORKFLOW_INPUT`: 输入类型，不能作为源连接点
  - `WORKFLOW_OUTPUT`: 可连接到所有标准输入类型（包括嵌套工作流）
  - 所有其他输出类型：添加对 `WORKFLOW_INPUT` 的兼容性

- ✅ `HANDLE_TYPE_LABELS` 添加：
  - `WORKFLOW_INPUT`: "工作流输入"
  - `WORKFLOW_OUTPUT`: "工作流输出"

- ✅ `HANDLE_CONNECTION_LIMITS` 添加：
  - `WORKFLOW_INPUT`: 无限输入，0输出
  - `WORKFLOW_OUTPUT`: 0输入，1输出

- ✅ `NODE_OUTPUT_RULES` 添加：

  ```typescript
  [NodeTypeEnum.WORKFLOW]: {
    canHaveNormalOutput: true,
    canHaveBranchOutput: false,
    canHaveParallelOutput: false,
    maxNormalOutputs: 1,
    maxBranchOutputs: 0,
    maxParallelOutputs: 0
  }
  ```

- ✅ `NODE_INPUT_RULES` 添加：
  ```typescript
  [NodeTypeEnum.WORKFLOW]: {
    canBeTarget: true,
    maxInputs: -1
  }
  ```

---

### 4. **节点组件**

#### `src/components/WorkFlow/nodes/WorkflowNode.vue` (新建)

- ✅ 创建 Workflow 节点 Vue 组件
- ✅ 使用 `WorkflowHandles.input()` 和 `WorkflowHandles.output()` 生成 Handle ID
- ✅ 显示引用的工作流应用名称（当前显示 ID，待集成 API）
- ✅ 渐变紫色主题样式（#667eea → #764ba2）
- ✅ 两个 Handle：顶部输入，底部输出

#### `src/components/WorkFlow/index.ts`

- ✅ 导出 `WorkflowNode` 组件

---

### 5. **节点配置**

#### `src/components/WorkFlow/nodeConfig.ts`

- ✅ `nodeTypes` 注册：`[NodeTypeEnum.WORKFLOW]: markRaw(WorkflowNode)`
- ✅ `nodeTemplates` 添加模板：
  ```typescript
  {
    type: NodeTypeEnum.WORKFLOW,
    label: "工作流",
    icon: "🔗",
    description: "引用第三方工作流应用",
    defaultData: {
      label: "工作流",
      description: "",
      color: "#667eea",
      config: {},
      workflowApplicationId: ""
    }
  }
  ```

#### `src/components/WorkFlow/PropertiesPanel/constants.ts`

- ✅ `NODE_TYPE_TAG_MAP` 添加：`[NodeTypeEnum.WORKFLOW]: "info"`
- ✅ `NODE_TYPE_LABEL_MAP` 添加：`[NodeTypeEnum.WORKFLOW]: "工作流节点"`

---

## 🎯 功能特性

### Workflow 节点特性

1. **引用第三方工作流**：通过 `workflowApplicationId` 字段引用其他 WorkflowApplication
2. **标准输入输出**：一个输入 Handle，一个输出 Handle
3. **连接兼容性**：
   - 可以接收来自任何标准输出的连接
   - 可以连接到任何标准输入（包括其他 Workflow 节点，支持嵌套）
4. **无分支/并行**：不支持分支输出或并行输出
5. **无限输入**：可以接受多个输入连接

---

## 📊 Handle 兼容性矩阵（Workflow 相关）

### Workflow 节点可以接收的输入

- ✅ 通用输出 (COMMON_OUTPUT)
- ✅ 开始节点输出 (START_OUTPUT)
- ✅ 任务生成器输出 (TASK_GENERATOR_OUTPUT)
- ✅ 条件分支输出 (CONDITION_BRANCH_OUTPUT)
- ✅ API调用器输出 (API_CALLER_OUTPUT)
- ✅ 数据处理器输出 (DATA_PROCESSOR_OUTPUT)
- ✅ 循环继续输出 (LOOP_CONTINUE_OUTPUT)
- ✅ LLM调用器输出 (LLM_CALLER_OUTPUT)
- ✅ 工作流输出 (WORKFLOW_OUTPUT) - 支持嵌套

### Workflow 节点可以连接到的目标

- ✅ 通用输入 (COMMON_INPUT)
- ✅ 任务生成器输入 (TASK_GENERATOR_INPUT)
- ✅ 条件检查器输入 (CONDITION_INPUT)
- ✅ 并行执行器输入 (PARALLEL_EXECUTOR_INPUT)
- ✅ API调用器输入 (API_CALLER_INPUT)
- ✅ 数据处理器输入 (DATA_PROCESSOR_INPUT)
- ✅ 循环输入 (LOOP_INPUT)
- ✅ LLM调用器输入 (LLM_CALLER_INPUT)
- ✅ 工作流输入 (WORKFLOW_INPUT) - 支持嵌套
- ✅ 结束节点输入 (END_INPUT)

---

## 🔄 下一步工作

### 1. **Properties Panel 集成** ✅ 已完成

- ✅ 创建 `WorkflowConfigSection.vue` 组件
- ✅ WorkflowApplication 选择器（下拉列表，支持搜索和清除）
- ✅ 显示选中的工作流应用详情（名称、描述、状态、版本、创建时间）
- ✅ 状态标签和警告提示（草稿状态显示警告）
- ✅ 自动更新节点标签为选中的工作流名称

### 2. **API 集成** ✅ 已完成

- ✅ 使用 `getWorkflowApplicationListWithPagination` API 获取工作流应用列表
- ✅ 支持分页加载（当前设置为 1000 条）
- ✅ 错误处理和加载状态

### 3. **后端逻辑**

- 实现 Workflow 节点的执行逻辑
- 处理工作流嵌套调用
- 处理工作流间的数据传递

### 4. **测试**

- 创建 Workflow 节点
- 连接到其他节点
- 选择引用的工作流应用
- 保存和加载工作流
- 执行工作流（包括嵌套调用）

---

## ✅ 验证清单

- [x] 数据库 schema 添加 `workflow` 类型
- [x] 数据库 schema 添加 `workflow_application_id` 字段
- [x] 后端类型定义更新
- [x] 前端类型定义更新
- [x] HandleType 枚举添加 WORKFLOW_INPUT 和 WORKFLOW_OUTPUT
- [x] Handle ID 生成器添加 WorkflowHandles
- [x] Handle 兼容性矩阵更新
- [x] Handle 连接限制配置
- [x] Handle 类型标签配置
- [x] 节点输出规则配置
- [x] 节点输入规则配置
- [x] WorkflowNode 组件创建
- [x] 节点类型注册
- [x] 节点模板配置
- [x] Properties Panel 常量更新
- [x] Properties Panel 组件更新（✅ 已完成）
- [x] API 集成（✅ 已完成）
- [ ] 后端执行逻辑（待实现）

---

## 📋 Properties Panel 实现详情

### WorkflowConfigSection 组件

已创建 `src/components/WorkFlow/PropertiesPanel/sections/WorkflowConfigSection.vue`，提供以下功能：

#### 功能特性

1. **工作流应用选择器**
   - 下拉列表显示所有可用的工作流应用
   - 支持搜索过滤（filterable）
   - 支持清除选择（clearable）
   - 加载状态指示

2. **工作流详情展示**
   - 名称、描述
   - 状态标签（已发布/草稿/已归档）
   - 版本号
   - 创建时间（格式化为本地时间）

3. **智能提示**
   - 未选择时显示提示信息
   - 草稿状态显示警告（可能影响执行结果）

4. **自动更新节点标签**
   - 选择工作流后，自动将节点标签更新为 `工作流: {应用名称}`

#### 状态映射

- `published` → 绿色标签（已发布）
- `draft` → 黄色标签（草稿）+ 警告提示
- `archived` → 灰色标签（已归档）

#### API 集成

- 使用 `getWorkflowApplicationListWithPagination` 获取工作流应用列表
- 组件挂载时自动加载
- 支持最多 1000 条记录（可调整）

---

## 🎉 总结

Workflow 节点类型已从框架层面完整实现，包括：

- ✅ 数据库定义
- ✅ 类型系统
- ✅ Handle ID 系统
- ✅ 连接规则
- ✅ 节点组件
- ✅ 配置系统

所有代码遵循现有的命名规范和架构设计，与其他节点类型保持一致。

**现在可以清空数据库，从 0 开始测试新系统！** 🚀
