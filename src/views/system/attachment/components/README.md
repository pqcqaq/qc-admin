# 上传组件使用说明

## 组件拆分

原来的 `UploadDialog.vue` 已经被拆分为两个独立的组件：

1. **UploadFormItem.vue** - 核心上传组件
2. **UploadDialog.vue** - 上传对话框（基于 UploadFormItem）

## UploadFormItem 组件

### 基本用法

```vue
<template>
  <UploadFormItem
    v-model="fileIds"
    type="drag"
    :limit="5"
    placeholder="拖拽文件到此处"
    @upload-success="handleSuccess"
  />
</template>

<script setup>
import UploadFormItem from './components/UploadFormItem.vue'
import { ref } from 'vue'

const fileIds = ref([])

const handleSuccess = (files) => {
  console.log('上传成功的文件:', files)
}
</script>
```

### Props 配置

| 参数          | 类型                                       | 默认值   | 说明                       |
| ------------- | ------------------------------------------ | -------- | -------------------------- |
| `modelValue`  | `string \| string[]`                       | -        | 双向绑定的文件ID值         |
| `type`        | `'avatar' \| 'drag' \| 'card' \| 'button'` | `'drag'` | 上传组件类型               |
| `limit`       | `number`                                   | `10`     | 文件数量限制               |
| `placeholder` | `string`                                   | -        | 占位符文本                 |
| `tip`         | `string`                                   | -        | 提示文本                   |
| `url`         | `string`                                   | -        | 回显URL（仅limit=1时生效） |
| `disabled`    | `boolean`                                  | `false`  | 是否禁用                   |
| `accept`      | `string`                                   | -        | 接受的文件类型             |
| `maxSize`     | `number`                                   | `10`     | 文件大小限制(MB)           |
| `autoUpload`  | `boolean`                                  | `true`   | 是否自动上传               |

### 事件

| 事件名              | 参数                        | 说明         |
| ------------------- | --------------------------- | ------------ |
| `update:modelValue` | `value: string \| string[]` | 值更新事件   |
| `upload-success`    | `files: FileItem[]`         | 上传成功事件 |
| `upload-error`      | `error: Error`              | 上传失败事件 |

### 组件类型说明

#### 1. 头像上传 (type="avatar")
- 适用于用户头像等单个图片上传
- 圆形显示区域
- 支持图片预览
- 建议配置 `limit={1}` 和 `accept="image/*"`

```vue
<UploadFormItem
  v-model="avatarId"
  type="avatar"
  :limit="1"
  :url="currentAvatarUrl"
  placeholder="上传头像"
  accept="image/*"
/>
```

#### 2. 拖拽上传 (type="drag")
- 经典的拖拽上传区域
- 支持拖拽和点击上传
- 适用于批量文件上传

```vue
<UploadFormItem
  v-model="fileIds"
  type="drag"
  :limit="5"
  placeholder="将文件拖到此处，或点击上传"
/>
```

#### 3. 卡片上传 (type="card")
- 卡片式文件展示
- 每个文件独立显示为卡片
- 支持预览和删除操作
- 适用于图片或文档管理

```vue
<UploadFormItem
  v-model="imageIds"
  type="card"
  :limit="6"
  placeholder="添加图片"
  accept="image/*"
/>
```

#### 4. 按钮上传 (type="button")
- 简单的按钮式上传
- 适用于表单中的文件字段
- 可配置为单文件或多文件

```vue
<UploadFormItem
  v-model="documentId"
  type="button"
  :limit="1"
  placeholder="选择文档"
/>
```

### v-model 行为

- **limit=1**: `modelValue` 为 `string` 类型，直接存储文件ID
- **limit>1**: `modelValue` 为 `string[]` 类型，存储文件ID数组

### 回显功能

当 `limit=1` 且提供了 `url` 参数时，组件会显示该URL的图片作为初始状态。上传新文件后，会用新文件的URL覆盖此URL。

### 上传模式

#### 自动上传模式（默认）

```vue
<UploadFormItem
  v-model="fileIds"
  type="drag"
  :auto-upload="true"
/>
```

文件选择后立即上传到服务器，上传成功后更新 `v-model` 值。

#### 延迟上传模式

```vue
<UploadFormItem
  v-model="fileIds"
  type="drag"
  :auto-upload="false"
/>
```

文件选择后暂存在组件内，当组件销毁时（如页面切换、对话框关闭等）自动上传所有待上传文件。这种模式适用于：

- 表单提交时才需要上传文件的场景
- 需要批量处理多个文件的场景
- 减少服务器请求频率的场景

## UploadDialog 组件

基于 `UploadFormItem` 的对话框版本，提供了更多的配置选项和演示功能。

### 基本用法

```vue
<template>
  <el-button @click="dialogVisible = true">打开上传对话框</el-button>
  
  <UploadDialog
    v-model:visible="dialogVisible"
    @success="handleDialogSuccess"
  />
</template>

<script setup>
import UploadDialog from './components/UploadDialog.vue'
import { ref } from 'vue'

const dialogVisible = ref(false)

const handleDialogSuccess = (files) => {
  console.log('对话框上传成功:', files)
}
</script>
```

## 完整示例

参考 `UploadDemo.vue` 文件查看所有使用方式的完整示例。

## API 依赖

组件依赖以下 API 接口：

- `prepareUpload` - 准备上传，获取上传凭证
- `confirmUpload` - 确认上传完成

确保后端提供了这些接口的实现。
