<template>
  <el-collapse-item name="processor-config">
    <template #title>
      <div class="section-title">
        <el-icon><Cpu /></el-icon>
        <span>数据处理器配置</span>
      </div>
    </template>

    <el-form label-width="100px" label-position="top">
      <!-- 处理器语言 -->
      <el-form-item label="处理器语言">
        <el-select
          :model-value="node.data.processorLanguage"
          placeholder="请选择处理器语言"
          style="width: 100%"
          @change="updateData('processorLanguage', $event)"
        >
          <el-option label="JavaScript" value="javascript" />
          <el-option label="Python" value="python" />
          <el-option label="Go" value="go" />
          <el-option label="Java" value="java" />
        </el-select>
        <span class="form-hint">选择数据处理器的编程语言</span>
      </el-form-item>

      <!-- 处理器代码 -->
      <el-form-item label="处理器代码">
        <el-input
          :model-value="node.data.processorCode"
          type="textarea"
          :rows="15"
          :placeholder="codePlaceholder"
          class="code-editor"
          @update:modelValue="updateData('processorCode', $event)"
        />
        <span class="form-hint">编写数据处理逻辑代码</span>
      </el-form-item>

      <!-- 代码说明 -->
      <el-alert
        title="代码说明"
        type="info"
        :closable="false"
        style="margin-top: 8px"
      >
        <template #default>
          <div class="code-info">
            <p><strong>输入参数：</strong></p>
            <ul>
              <li><code>input</code> - 上游节点的输出数据</li>
              <li><code>context</code> - 工作流上下文对象</li>
            </ul>
            <p><strong>返回值：</strong></p>
            <ul>
              <li>处理后的数据对象</li>
            </ul>
          </div>
        </template>
      </el-alert>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Node } from "@vue-flow/core";
import { Cpu } from "@element-plus/icons-vue";

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateData: [key: string, value: any];
}>();

// 代码占位符
const codePlaceholder = computed(() => {
  const language = props.node.data.processorLanguage || "javascript";

  const placeholders: Record<string, string> = {
    javascript: `// JavaScript 数据处理器示例
function process(input, context) {
  // 处理输入数据
  const result = {
    ...input,
    processed: true,
    timestamp: Date.now()
  };
  
  return result;
}`,
    python: `# Python 数据处理器示例
def process(input, context):
    # 处理输入数据
    result = {
        **input,
        'processed': True,
        'timestamp': time.time()
    }
    
    return result`,
    go: `// Go 数据处理器示例
func Process(input map[string]interface{}, context Context) (map[string]interface{}, error) {
    // 处理输入数据
    result := make(map[string]interface{})
    for k, v := range input {
        result[k] = v
    }
    result["processed"] = true
    result["timestamp"] = time.Now().Unix()
    
    return result, nil
}`,
    java: `// Java 数据处理器示例
public Map<String, Object> process(Map<String, Object> input, Context context) {
    // 处理输入数据
    Map<String, Object> result = new HashMap<>(input);
    result.put("processed", true);
    result.put("timestamp", System.currentTimeMillis());
    
    return result;
}`
  };

  return placeholders[language] || placeholders.javascript;
});

const updateData = (key: string, value: any) => {
  emit("updateData", key, value);
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #e6a23c;
  }
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

.code-editor {
  :deep(textarea) {
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 13px;
    line-height: 1.5;
  }
}

.code-info {
  font-size: 13px;
  line-height: 1.6;

  p {
    margin: 8px 0 4px;
  }

  ul {
    padding-left: 20px;
    margin: 4px 0;
  }

  li {
    margin: 4px 0;
  }

  code {
    padding: 2px 6px;
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 12px;
    color: #e6a23c;
    background: #f5f7fa;
    border-radius: 3px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
