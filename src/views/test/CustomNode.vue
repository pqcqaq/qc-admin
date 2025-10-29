<template>
  <div class="custom-node">
    <div class="node-header">{{ data.label }}</div>
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
import { defineProps } from "vue";
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
}

.node-header {
  font-size: 14px;
  font-weight: bold;
}
</style>
