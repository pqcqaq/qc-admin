<template>
  <div
    ref="contextMenuRef"
    class="context-menu-wrapper"
    @contextmenu="handleContextMenu"
  >
    <!-- 默认插槽：被右键菜单包裹的内容 -->
    <slot />

    <!-- 右键菜单 -->
    <teleport to="body">
      <transition name="context-menu-fade">
        <div
          v-if="visible"
          ref="menuRef"
          class="context-menu"
          :style="menuStyle"
          @contextmenu.prevent
        >
          <div class="context-menu-content">
            <!-- 菜单内容插槽 -->
            <slot
              name="menu"
              :close="closeMenu"
              :target-ref="targetRef"
              :context-data="contextData"
            >
              <!-- 默认菜单项 -->
              <div
                v-for="(item, index) in menuItems"
                :key="index"
                class="context-menu-item"
                :class="{
                  'context-menu-item--disabled': item.disabled,
                  'context-menu-item--divider': item.divider
                }"
                @click="handleItemClick(item)"
              >
                <template v-if="!item.divider">
                  <component
                    :is="item.icon"
                    v-if="item.icon"
                    class="context-menu-icon"
                  />
                  <span class="context-menu-label">{{ item.label }}</span>
                  <span v-if="item.shortcut" class="context-menu-shortcut">
                    {{ item.shortcut }}
                  </span>
                </template>
              </div>
            </slot>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- 遮罩层 -->
    <teleport to="body">
      <div
        v-if="visible"
        class="context-menu-overlay"
        @click="closeMenu"
        @contextmenu.prevent="closeMenu"
      />
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from "vue";

export interface ContextMenuItem {
  label: string;
  key: string;
  icon?: any;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: (data: any) => void;
}

interface Props {
  menuItems?: ContextMenuItem[];
  disabled?: boolean;
  trigger?: "contextmenu" | "click";
  placement?: "auto" | "top" | "bottom" | "left" | "right";
}

interface Emits {
  (
    e: "show",
    data: { event: MouseEvent; targetRef: any; contextData: any }
  ): void;
  (e: "hide"): void;
  (
    e: "item-click",
    data: { item: ContextMenuItem; targetRef: any; contextData: any }
  ): void;
}

const props = withDefaults(defineProps<Props>(), {
  menuItems: () => [],
  disabled: false,
  trigger: "contextmenu",
  placement: "auto"
});

const emit = defineEmits<Emits>();

// 响应式数据
const visible = ref(false);
const contextMenuRef = ref<HTMLElement>();
const menuRef = ref<HTMLElement>();
const targetRef = ref<any>(null);
const contextData = ref<any>(null);

// 菜单位置
const menuStyle = reactive({
  left: "0px",
  top: "0px",
  zIndex: 9999
});

// 处理右键菜单事件
const handleContextMenu = (event: MouseEvent) => {
  if (props.disabled) return;

  event.preventDefault();
  event.stopPropagation();

  // 获取触发元素
  const target = event.target as HTMLElement;
  targetRef.value = findNearestComponent(target);

  // 设置上下文数据
  contextData.value = {
    event,
    target,
    position: { x: event.clientX, y: event.clientY }
  };

  showMenu(event);
};

// 查找最近的Vue组件实例
const findNearestComponent = (element: HTMLElement): any => {
  let current = element;
  while (current && current !== contextMenuRef.value) {
    // 尝试获取Vue组件实例
    const vnode = (current as any).__vueParentComponent;
    if (vnode) {
      return vnode.ctx;
    }
    current = current.parentElement as HTMLElement;
  }
  return null;
};

// 显示菜单
const showMenu = async (event: MouseEvent) => {
  visible.value = true;

  await nextTick();

  if (menuRef.value) {
    const menuRect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.clientX;
    let top = event.clientY;

    // 防止菜单超出视口
    if (left + menuRect.width > viewportWidth) {
      left = viewportWidth - menuRect.width - 10;
    }

    if (top + menuRect.height > viewportHeight) {
      top = viewportHeight - menuRect.height - 10;
    }

    if (left < 0) left = 10;
    if (top < 0) top = 10;

    menuStyle.left = `${left}px`;
    menuStyle.top = `${top}px`;
  }

  emit("show", {
    event,
    targetRef: targetRef.value,
    contextData: contextData.value
  });
};

// 关闭菜单
const closeMenu = () => {
  visible.value = false;
  emit("hide");
};

// 处理菜单项点击
const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled || item.divider) return;

  // 执行菜单项的动作
  if (item.action) {
    item.action({
      targetRef: targetRef.value,
      contextData: contextData.value
    });
  }

  emit("item-click", {
    item,
    targetRef: targetRef.value,
    contextData: contextData.value
  });

  closeMenu();
};

// 监听全局点击事件
const handleGlobalClick = (event: Event) => {
  if (
    visible.value &&
    menuRef.value &&
    !menuRef.value.contains(event.target as Node)
  ) {
    closeMenu();
  }
};

// 监听ESC键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && visible.value) {
    closeMenu();
  }
};

onMounted(() => {
  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick);
  document.removeEventListener("keydown", handleKeydown);
});

// 暴露方法
defineExpose({
  showMenu,
  closeMenu,
  targetRef,
  contextData
});
</script>

<style lang="scss" scoped>
.context-menu-wrapper {
  width: 100%;
  height: 100%;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9998;
  width: 100vw;
  height: 100vh;
  background: transparent;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 120px;
  max-width: 300px;
  padding: 4px 0;
  user-select: none;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow-light);

  .context-menu-content {
    .context-menu-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(.context-menu-item--disabled, .context-menu-item--divider) {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &.context-menu-item--disabled {
        color: var(--el-text-color-disabled);
        cursor: not-allowed;
        opacity: 0.6;
      }

      &.context-menu-item--divider {
        height: 1px;
        padding: 0;
        margin: 4px 0;
        cursor: default;
        background: var(--el-border-color-light);
      }

      .context-menu-icon {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        margin-right: 8px;
        font-size: 16px;
      }

      .context-menu-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .context-menu-shortcut {
        flex-shrink: 0;
        margin-left: 16px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 动画
.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition: all 0.15s ease;
}

.context-menu-fade-enter-from,
.context-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
