<template>
  <div class="test-area-selector">
    <el-card shadow="never">
      <template #header>
        <span class="font-medium">AreaSelector 组件测试</span>
      </template>

      <div class="test-section">
        <h3>基础用法</h3>
        <div class="demo-item">
          <div class="label">选择地区:</div>
          <AreaSelector
            v-model="basicSelection"
            v-model:current="basicCurrent"
            placeholder="请选择地区"
          />
          <div class="result">
            <div>选中的路径: {{ basicSelection.join(" -> ") || "未选择" }}</div>
            <div>当前最后一级ID: {{ basicCurrent || "无" }}</div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>限制选择级别</h3>
        <div class="demo-item">
          <div class="label">只能选择到省份(maxLevel=2):</div>
          <AreaSelector
            v-model="levelLimitSelection"
            v-model:current="levelLimitCurrent"
            :max-level="2"
            placeholder="只能选择到省份"
          />
          <div class="result">
            <div>
              选中的路径: {{ levelLimitSelection.join(" -> ") || "未选择" }}
            </div>
            <div>当前最后一级ID: {{ levelLimitCurrent || "无" }}</div>
          </div>
        </div>

        <div class="demo-item">
          <div class="label">只能选择到城市(maxLevel=3):</div>
          <AreaSelector
            v-model="cityLimitSelection"
            v-model:current="cityLimitCurrent"
            :max-level="3"
            placeholder="只能选择到城市"
          />
          <div class="result">
            <div>
              选中的路径: {{ cityLimitSelection.join(" -> ") || "未选择" }}
            </div>
            <div>当前最后一级ID: {{ cityLimitCurrent || "无" }}</div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>限制父级地区</h3>
        <div class="demo-item">
          <div class="label">父级地区ID:</div>
          <el-input
            v-model="parentAreaId"
            placeholder="请输入父级地区ID"
            style="width: 300px"
          />
        </div>
        <div class="demo-item">
          <div class="label">限制在指定父级下选择:</div>
          <AreaSelector
            v-model="parentLimitSelection"
            v-model:current="parentLimitCurrent"
            :parent-area-id="parentAreaId"
            placeholder="请选择子地区"
          />
          <div class="result">
            <div>
              选中的路径:
              {{ parentLimitSelection.join(" -> ") || "未选择" }}
            </div>
            <div>当前最后一级ID: {{ parentLimitCurrent || "无" }}</div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>懒加载模式</h3>
        <div class="demo-item">
          <div class="label">启用懒加载(已强制启用，不可关闭):</div>
          <AreaSelector
            v-model="lazySelection"
            v-model:current="lazyCurrent"
            placeholder="懒加载模式"
          />
          <div class="result">
            <div>选中的路径: {{ lazySelection.join(" -> ") || "未选择" }}</div>
            <div>当前最后一级ID: {{ lazyCurrent || "无" }}</div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>任意级别选择</h3>
        <div class="demo-item">
          <div class="label">可以在任意级别结束选择(checkStrictly=true):</div>
          <AreaSelector
            v-model="strictlySelection"
            v-model:current="strictlyCurrent"
            :check-strictly="true"
            placeholder="可以选择任意级别"
          />
          <div class="result">
            <div>
              选中的路径: {{ strictlySelection.join(" -> ") || "未选择" }}
            </div>
            <div>当前最后一级ID: {{ strictlyCurrent || "无" }}</div>
          </div>
        </div>

        <div class="demo-item">
          <div class="label">
            结合最大级别限制(checkStrictly=true + maxLevel=3):
          </div>
          <AreaSelector
            v-model="strictlyWithLevelSelection"
            v-model:current="strictlyWithLevelCurrent"
            :check-strictly="true"
            :max-level="3"
            placeholder="只能选到城市，但可以在省份或城市停止"
          />
          <div class="result">
            <div>
              选中的路径:
              {{ strictlyWithLevelSelection.join(" -> ") || "未选择" }}
            </div>
            <div>当前最后一级ID: {{ strictlyWithLevelCurrent || "无" }}</div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>其他配置</h3>
        <div class="demo-item">
          <div class="label">不可清空:</div>
          <AreaSelector
            v-model="noClearSelection"
            v-model:current="noClearCurrent"
            :clearable="false"
            placeholder="不可清空"
          />
        </div>

        <div class="demo-item">
          <div class="label">禁用状态:</div>
          <AreaSelector
            v-model="disabledSelection"
            v-model:current="disabledCurrent"
            :disabled="true"
            placeholder="禁用状态"
          />
        </div>

        <div class="demo-item">
          <div class="label">不显示完整路径:</div>
          <AreaSelector
            v-model="noFullPathSelection"
            v-model:current="noFullPathCurrent"
            :show-all-levels="false"
            placeholder="只显示最后一级"
          />
        </div>

        <div class="demo-item">
          <div class="label">折叠标签:</div>
          <AreaSelector
            v-model="collapseTagsSelection"
            v-model:current="collapseTagsCurrent"
            :collapse-tags="true"
            :collapse-tags-tooltip="true"
            :max-collapse-tags="1"
            placeholder="折叠标签显示"
          />
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>组合示例 - 省市区三级联动</h3>
        <el-form :model="formData" label-width="100px">
          <el-form-item label="省份">
            <AreaSelector
              v-model="formData.provinceIds"
              v-model:current="formData.provinceId"
              :max-level="2"
              placeholder="请选择省份"
              @change="handleProvinceChange"
            />
          </el-form-item>
          <el-form-item label="城市">
            <AreaSelector
              v-model="formData.cityIds"
              v-model:current="formData.cityId"
              :max-level="3"
              :parent-area-id="formData.provinceId"
              :disabled="!formData.provinceId"
              placeholder="请先选择省份"
              @change="handleCityChange"
            />
          </el-form-item>
          <el-form-item label="区县">
            <AreaSelector
              v-model="formData.districtIds"
              v-model:current="formData.districtId"
              :max-level="4"
              :parent-area-id="formData.cityId"
              :disabled="!formData.cityId"
              placeholder="请先选择城市"
            />
          </el-form-item>
        </el-form>
        <div class="result">
          <h4>表单数据:</h4>
          <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>事件监听</h3>
        <div class="demo-item">
          <div class="label">带事件监听:</div>
          <AreaSelector
            v-model="eventSelection"
            v-model:current="eventCurrent"
            placeholder="选择地区查看事件"
            @change="handleAreaChange"
          />
        </div>
        <div class="result">
          <h4>事件日志:</h4>
          <div class="event-log">
            <div
              v-for="(log, index) in eventLogs"
              :key="index"
              class="log-item"
            >
              {{ log }}
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import AreaSelector from "@/components/AreaSelector";

defineOptions({
  name: "TestAreaSelector"
});

// 基础用法
const basicSelection = ref<string[]>([]);
const basicCurrent = ref("");

// 级别限制
const levelLimitSelection = ref<string[]>([]);
const levelLimitCurrent = ref("");

const cityLimitSelection = ref<string[]>([]);
const cityLimitCurrent = ref("");

// 父级限制
const parentAreaId = ref("");
const parentLimitSelection = ref<string[]>([]);
const parentLimitCurrent = ref("");

// 懒加载
const lazySelection = ref<string[]>([]);
const lazyCurrent = ref("");

// 任意级别选择
const strictlySelection = ref<string[]>([]);
const strictlyCurrent = ref("");

const strictlyWithLevelSelection = ref<string[]>([]);
const strictlyWithLevelCurrent = ref("");

// 其他配置
const noClearSelection = ref<string[]>([]);
const noClearCurrent = ref("");

const disabledSelection = ref<string[]>([]);
const disabledCurrent = ref("");

const noFullPathSelection = ref<string[]>([]);
const noFullPathCurrent = ref("");

const collapseTagsSelection = ref<string[]>([]);
const collapseTagsCurrent = ref("");

// 表单数据
const formData = reactive({
  provinceIds: [] as string[],
  provinceId: "",
  cityIds: [] as string[],
  cityId: "",
  districtIds: [] as string[],
  districtId: ""
});

// 事件监听
const eventSelection = ref<string[]>([]);
const eventCurrent = ref("");
const eventLogs = ref<string[]>([]);

const handleProvinceChange = (ids: string[], currentId: string) => {
  // 重置下级选择
  formData.cityIds = [];
  formData.cityId = "";
  formData.districtIds = [];
  formData.districtId = "";
};

const handleCityChange = (ids: string[], currentId: string) => {
  // 重置下级选择
  formData.districtIds = [];
  formData.districtId = "";
};

const handleAreaChange = (ids: string[], currentId: string) => {
  const timestamp = new Date().toLocaleTimeString();
  eventLogs.value.unshift(
    `[${timestamp}] 选择变化: 路径=${ids.join(" -> ")}, 当前ID=${currentId}`
  );
  // 只保留最近10条日志
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop();
  }
};
</script>

<style scoped lang="scss">
.test-area-selector {
  padding: 20px;
}

.test-section {
  margin-bottom: 20px;

  h3 {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  h4 {
    margin: 10px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }
}

.demo-item {
  margin-bottom: 20px;

  .label {
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .result {
    padding: 12px;
    margin-top: 10px;
    font-size: 13px;
    line-height: 1.6;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    > div {
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    pre {
      padding: 10px;
      margin: 0;
      overflow-x: auto;
      font-family: Consolas, Monaco, monospace;
      font-size: 12px;
      background-color: var(--el-fill-color);
      border-radius: 4px;
    }
  }
}

.event-log {
  max-height: 200px;
  padding: 10px;
  overflow-y: auto;
  background-color: var(--el-fill-color);
  border-radius: 4px;

  .log-item {
    padding: 4px 0;
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.5;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
