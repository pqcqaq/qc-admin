import type { FormInstance, FormItemProp } from "element-plus";
import { clone } from "@pureadmin/utils";
import { ref } from "vue";
import { sendVerifyCodeApi } from "qc-admin-api-common/auth";
import { message } from "@/utils/message";

export const useVerifyCode = (formData?: any) => {
  // 将响应式变量移到函数内部，每个实例独立
  const isDisabled = ref(false);
  const timer = ref(null);
  const text = ref("");

  const start = async (
    formEl: FormInstance | undefined,
    props: FormItemProp,
    time = 60,
    purpose = "login", // 新增用途参数，默认为登录
    formModel?: any // 新增表单数据参数
  ) => {
    if (!formEl) {
      console.error("表单实例不存在");
      return;
    }

    const initTime = clone(time, true);

    console.log("开始验证字段:", props);

    await formEl.validateField(props, isValid => {
      console.log("字段验证结果:", isValid);

      if (isValid) {
        // 从传入的表单数据中获取手机号
        const phoneValue = formModel
          ? formModel[props as string]
          : formData?.[props as string];

        console.log("获取到的手机号:", phoneValue);

        if (!phoneValue) {
          console.error("无法获取手机号");
          message("请先输入手机号", { type: "error" });
          return;
        }

        // 调用发送验证码接口
        sendVerifyCodeApi({
          senderType: "phone",
          purpose: purpose, // 使用传递的用途参数
          identifier: phoneValue
        })
          .then(res => {
            if (res.success) {
              message("验证码发送成功", { type: "success" });

              // 开始倒计时
              clearInterval(timer.value);
              isDisabled.value = true;
              text.value = `${time}`;
              timer.value = setInterval(() => {
                if (time > 0) {
                  time -= 1;
                  text.value = `${time}`;
                } else {
                  text.value = "";
                  isDisabled.value = false;
                  clearInterval(timer.value);
                  time = initTime;
                }
              }, 1000);
            } else {
              message(res.message || "验证码发送失败", { type: "error" });
            }
          })
          .catch(error => {
            console.error("验证码发送错误:", error);
            message(
              error.response?.data?.message || "验证码发送失败，请稍后重试",
              { type: "error" }
            );
          });
      } else {
        console.log("表单验证失败");
      }
    });
  };

  const end = () => {
    text.value = "";
    isDisabled.value = false;
    clearInterval(timer.value);
  };

  return {
    isDisabled,
    timer,
    text,
    start,
    end
  };
};
