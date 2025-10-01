<template>
  <div
    class="context-menu-item"
    :class="{
      'context-menu-item--disabled': disabled,
      'context-menu-item--danger': danger,
      'context-menu-item--success': success,
      'context-menu-item--warning': warning
    }"
    @click="handleClick"
  >
    <div v-if="icon || $slots.icon" class="menu-item-icon">
      <slot name="icon">
        <component :is="icon" />
      </slot>
    </div>

    <div class="menu-item-content">
      <div class="menu-item-title">
        <slot>{{ title }}</slot>
      </div>
      <div v-if="description" class="menu-item-description">
        {{ description }}
      </div>
    </div>

    <div v-if="shortcut || $slots.extra" class="menu-item-extra">
      <slot name="extra">
        <span v-if="shortcut" class="menu-item-shortcut">{{ shortcut }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Component } from "vue";

interface Props {
  title?: string;
  description?: string;
  icon?: string | Component;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  success?: boolean;
  warning?: boolean;
}

interface Emits {
  (e: "click", event: MouseEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  danger: false,
  success: false,
  warning: false
});

const emit = defineEmits<Emits>();

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;
  emit("click", event);
};
</script>

<style lang="scss" scoped>
.context-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin: 2px 8px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    position: absolute;
    inset: 0;
    content: "";
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &:active {
    transform: translateX(2px) scale(0.98);
  }

  &.context-menu-item--disabled {
    color: var(--el-text-color-disabled);
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      color: var(--el-text-color-disabled);
      background: transparent;
      box-shadow: none;
      transform: none;
    }

    &:hover::before {
      opacity: 0;
    }
  }

  &.context-menu-item--danger {
    color: var(--el-color-danger);

    &:hover {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }

    .menu-item-icon {
      color: var(--el-color-danger);
    }
  }

  &.context-menu-item--success {
    color: var(--el-color-success);

    &:hover {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }

    .menu-item-icon {
      color: var(--el-color-success);
    }
  }

  &.context-menu-item--warning {
    color: var(--el-color-warning);

    &:hover {
      color: var(--el-color-warning);
      background: var(--el-color-warning-light-9);
    }

    .menu-item-icon {
      color: var(--el-color-warning);
    }
  }

  .menu-item-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-right: 6px;
    color: var(--el-text-color-regular);
    transition: all 0.2s ease;
  }

  .menu-item-content {
    flex: 1;
    min-width: 0;

    .menu-item-title {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      color: inherit;
      white-space: nowrap;
    }

    .menu-item-description {
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      line-height: 1.3;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }
  }

  .menu-item-extra {
    flex-shrink: 0;
    margin-left: 12px;

    .menu-item-shortcut {
      padding: 2px 6px;
      font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-extra-light);
      border-radius: 4px;
    }
  }
}
</style>
