<template>
  <div class="custom-node" :class="{ loading: data.loading }">
    <div class="node-header">
      <span v-if="data.loading" class="loading-spinner" />
      {{ data.label }}
    </div>
    <Handle
      :id="'top-' + id"
      type="source"
      :position="Position.Top"
      :style="{ background: '#4a5568' }"
      connectable
    />
    <Handle
      :id="'left-' + id"
      type="source"
      :position="Position.Left"
      :style="{ background: '#4a5568' }"
      connectable
    />
    <Handle
      :id="'right-' + id"
      type="source"
      :position="Position.Right"
      :style="{ background: '#4a5568' }"
      connectable
    />
    <Handle
      :id="'bottom-' + id"
      type="source"
      :position="Position.Bottom"
      :style="{ background: '#4a5568' }"
      connectable
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
defineProps({ id: String, data: Object });
</script>

<style scoped>
.custom-node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 40px;
  color: white;
  background-color: #4a5568;
  border-radius: 3px;
  transition: opacity 0.3s;
}

.custom-node.loading {
  opacity: 0.7;
}

.node-header {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgb(255 255 255 / 30%);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
