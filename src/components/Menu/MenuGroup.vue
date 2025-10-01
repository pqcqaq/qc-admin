<template>
  <div class="menu-group">
    <div v-if="title" class="menu-group-title">
      {{ title }}
    </div>
    <div class="menu-group-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.menu-group {
  & + .menu-group {
    margin-top: 8px;

    &::before {
      display: block;
      height: 1px;
      margin: 8px 16px;
      content: "";
      background: linear-gradient(
        90deg,
        transparent,
        var(--el-border-color-extra-light) 20%,
        var(--el-border-color-extra-light) 80%,
        transparent
      );
    }
  }

  .menu-group-title {
    padding: 8px 16px 4px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
</style>
