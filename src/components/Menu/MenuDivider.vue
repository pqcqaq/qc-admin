<template>
  <div
    class="menu-divider"
    :class="{ 'menu-divider--with-text': $slots.default }"
  >
    <div v-if="$slots.default" class="divider-text">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// 分隔线组件不需要props
</script>

<style lang="scss" scoped>
.menu-divider {
  position: relative;
  height: 1px;
  margin: 8px 16px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--el-border-color-light) 20%,
    var(--el-border-color-light) 80%,
    transparent
  );

  &.menu-divider--with-text {
    display: flex;
    align-items: center;
    justify-content: center;
    height: auto;
    margin: 12px 16px;
    background: none;

    &::before,
    &::after {
      flex: 1;
      height: 1px;
      content: "";
      background: linear-gradient(
        90deg,
        transparent,
        var(--el-border-color-light) 30%,
        var(--el-border-color-light) 70%,
        transparent
      );
    }

    .divider-text {
      padding: 0 12px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      white-space: nowrap;
      background: var(--el-bg-color-overlay);
    }
  }
}
</style>
