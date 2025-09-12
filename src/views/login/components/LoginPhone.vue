<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, reactive } from "vue";
import Motion from "../utils/motion";
import { message } from "@/utils/message";
import { phoneRules } from "../utils/rule";
import type { FormInstance } from "element-plus";
import { $t, transformI18n } from "@/plugins/i18n";
import { useVerifyCode } from "../utils/verifyCode";
import { useUserStoreHook } from "@/store/modules/user";
import { getLogin } from "@/api/auth";
import { initRouter, getTopMenu } from "@/router/utils";
import { setToken } from "@/utils/auth";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Iphone from "~icons/ep/iphone";
import Keyhole from "~icons/ri/shield-keyhole-line";

const { t } = useI18n();
const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleForm = reactive({
  phone: "",
  verifyCode: ""
});
const ruleFormRef = ref<FormInstance>();
const verifyCodeState = useVerifyCode(ruleForm);
const { isDisabled, text } = verifyCodeState;

const onLogin = async (formEl: FormInstance | undefined) => {
  loading.value = true;
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      // 调用手机验证码登录API
      getLogin({
        credentialType: "phone",
        identifier: ruleForm.phone,
        verifyCode: ruleForm.verifyCode
      })
        .then(res => {
          if (res.success) {
            // 设置token和用户信息
            const tokenData = {
              accessToken: res.data.token,
              refreshToken: res.data.token,
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
              username: res.data.user.name,
              nickname: res.data.user.name,
              avatar: "",
              roles: res.data.user.roles || [],
              permissions: res.data.user.permissions || []
            };
            setToken(tokenData);

            // 获取后端路由
            return initRouter().then(() => {
              disabled.value = true;
              router
                .push(getTopMenu(true).path)
                .then(() => {
                  message(transformI18n($t("login.pureLoginSuccess")), {
                    type: "success"
                  });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            message("登录失败", {
              type: "error"
            });
          }
        })
        .catch(error => {
          message(error.response?.data?.message || "登录失败，请稍后重试", {
            type: "error"
          });
        })
        .finally(() => {
          loading.value = false;
        });
    } else {
      loading.value = false;
    }
  });
};

function onBack() {
  verifyCodeState.end();
  useUserStoreHook().SET_CURRENTPAGE(0);
}
</script>

<template>
  <el-form ref="ruleFormRef" :model="ruleForm" :rules="phoneRules" size="large">
    <Motion>
      <el-form-item prop="phone">
        <el-input
          v-model="ruleForm.phone"
          clearable
          :placeholder="t('login.purePhone')"
          :prefix-icon="useRenderIcon(Iphone)"
        />
      </el-form-item>
    </Motion>

    <Motion :delay="100">
      <el-form-item prop="verifyCode">
        <div class="w-full flex justify-between">
          <el-input
            v-model="ruleForm.verifyCode"
            clearable
            :placeholder="t('login.pureSmsVerifyCode')"
            :prefix-icon="useRenderIcon(Keyhole)"
          />
          <el-button
            :disabled="isDisabled"
            class="ml-2!"
            @click="
              verifyCodeState.start(ruleFormRef, 'phone', 60, 'login', ruleForm)
            "
          >
            {{
              text.length > 0
                ? text + t("login.pureInfo")
                : t("login.pureGetVerifyCode")
            }}
          </el-button>
        </div>
      </el-form-item>
    </Motion>

    <Motion :delay="150">
      <el-form-item>
        <el-button
          class="w-full"
          size="default"
          type="primary"
          :loading="loading"
          @click="onLogin(ruleFormRef)"
        >
          {{ t("login.pureLogin") }}
        </el-button>
      </el-form-item>
    </Motion>

    <Motion :delay="200">
      <el-form-item>
        <el-button class="w-full" size="default" @click="onBack">
          {{ t("login.pureBack") }}
        </el-button>
      </el-form-item>
    </Motion>
  </el-form>
</template>
