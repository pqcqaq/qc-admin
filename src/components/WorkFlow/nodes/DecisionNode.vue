<template>
  <div class="decision-node" :style="{ backgroundColor: data.color }">
    <!-- 输入连接点（顶部） -->
    <Handle
      :id="ConditionHandles.input(id)"
      type="target"
      :position="Position.Top"
      class="node-handle input-handle"
    />

    <div class="node-content">
      <span class="node-label">{{ data.label }}</span>
      <span v-if="data.description" class="node-description">{{
        data.description
      }}</span>
      <span v-if="branches.length > 0" class="branch-count">
        {{ branches.length }} 个分支
      </span>
    </div>

    <!-- 动态分支输出连接点 -->
    <Handle
      v-for="(branch, index) in branches"
      :id="ConditionHandles.branch(id, branch.name)"
      :key="branch.name"
      type="source"
      :position="getBranchPosition(index)"
      :style="getBranchStyle(index)"
      class="node-handle branch-handle"
    >
      <span class="branch-label">{{ branch.name }}</span>
    </Handle>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { NodeData, BranchConfig } from "../types";
import { ConditionHandles } from "@/composables/workflowApplication/handleIdUtils";

interface Props {
  id: string;
  data: NodeData;
}

const props = defineProps<Props>();

// 获取分支配置
const branches = computed<BranchConfig[]>(() => {
  if (!props.data?.branchNodes) {
    return [];
  }
  return Object.values(props.data.branchNodes);
});

// 根据分支索引计算连接点位置
const getBranchPosition = (index: number) => {
  const total = branches.value.length;

  // 如果只有2个分支，使用左右位置
  if (total === 2) {
    return index === 0 ? Position.Left : Position.Right;
  }

  // 如果有3个分支，使用左、右、下
  if (total === 3) {
    return [Position.Left, Position.Right, Position.Bottom][index];
  }

  // 如果有4个或更多分支，均匀分布在左、右、下
  if (index === 0) return Position.Left;
  if (index === 1) return Position.Right;
  return Position.Bottom;
};

// 根据分支索引计算连接点样式（用于底部多个分支的定位）
const getBranchStyle = (index: number) => {
  const total = branches.value.length;
  const position = getBranchPosition(index);

  // 如果是底部位置且有多个底部分支，需要水平分布
  if (position === Position.Bottom && total > 3) {
    const bottomBranches = total - 2; // 减去左右两个
    const bottomIndex = index - 2; // 当前是第几个底部分支
    const spacing = 100 / (bottomBranches + 1);
    const left = spacing * (bottomIndex + 1);

    return {
      left: `${left}%`,
      transform: "translateX(-50%)"
    };
  }

  return {};
};
</script>

<style scoped lang="scss">
.decision-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 130px;
  height: 130px;
  color: white;
  background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%);
  box-shadow: 0 4px 15px rgb(255 167 81 / 40%);
  transform: rotate(45deg);
  transition: box-shadow 0.3s ease;

  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 60px;
    font-weight: bold;
    color: rgb(255 255 255 / 10%);
    pointer-events: none;
    content: "?";
    transform: translate(-50%, -50%) rotate(-45deg);
  }

  &:hover {
    box-shadow: 0 6px 20px rgb(255 167 81 / 50%);
  }
}

.node-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  justify-content: center;
  max-width: 85px;
  text-align: center;
  transform: rotate(-45deg);
}

.node-label {
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}

.node-description {
  font-size: 10px;
  line-height: 1.3;
  opacity: 0.9;
}

.branch-count {
  padding: 3px 8px;
  margin-top: 3px;
  font-size: 10px;
  font-weight: 600;
  background: rgb(255 255 255 / 25%);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  backdrop-filter: blur(4px);
}

.node-handle {
  width: 12px;
  height: 12px;
  border: 3px solid white;
  border-radius: 50%;
  transition: all 0.2s ease;

  &.input-handle {
    background: #67c23a;
    box-shadow: 0 2px 8px rgb(103 194 58 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(103 194 58 / 70%);
    }
  }

  &.branch-handle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 8px rgb(102 126 234 / 50%);

    &:hover {
      box-shadow: 0 3px 12px rgb(102 126 234 / 70%);

      .branch-label {
        opacity: 1;
      }
    }
  }
}

.branch-label {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 10;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgb(0 0 0 / 85%) 0%,
    rgb(0 0 0 / 75%) 100%
  );
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
  opacity: 0;
  backdrop-filter: blur(4px);
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}
</style>
