<script setup>

</script>

<template>
  <div class="flex-col self-start group_3">
    <div class="group_2">
      <div class="group_5">
        <span class="self-start text_6">HELLO...</span>
      </div>
      <div class="flex-col self-start group_4">
        <div class="group_6">
          <span class="text_8">欢迎使用上海海洋大学马克思主义学院题库</span>
        </div>
        <div class="group_7">
          <span class="mt-48 text_11">这是一个由信院23级学生搭建的第三方题库，仅供参考学习。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.self-start {
  align-self: flex-start;
}

.group_3 {
  margin-right: 5px;
  width: 99%;
  height: 98vh;
  display: flex;
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
}

.group_5 {
  display: flex;
  justify-content: left;
  /* 水平居中 */
}

.group_6 {
  display: flex;
  justify-content: left;
  /* 水平居中 */
}

.group_7 {
  display: flex;
  justify-content: left;
  /* 水平居中 */
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.text_6 {
  color: #6c5dd3;
  font-size: 72px;
  font-family: HarmonyOSSansSC;
  font-weight: 900;
  line-height: 55px;
  letter-spacing: 8px;
}

.group_4 {
  margin-top: 64px;
  width: 931px;
}

.text_8 {
  color: #5f89d3;
  font-size: 48px;
  font-family: HarmonyOSSansSC;
  font-weight: 900;
  line-height: 46px;
  letter-spacing: 1px;
}

.text_11 {
  margin-top: 37px;
  color: #828282;
  font-size: 36px;
  font-family: HarmonyOSSansSC;
  font-weight: 700;
  line-height: 43px;
  text-align: left;
  letter-spacing: 1px;
}

.group_5 {
  opacity: 0;
  animation: fadeInUp 0.5s ease-in-out forwards;
  animation-delay: 0.5s;
}

.group_6 {
  opacity: 0;
  animation: fadeInUp 0.5s ease-in-out forwards;
  animation-delay: 1s;
}

.group_7 {
  opacity: 0;
  animation: fadeInUp 0.5s ease-in-out forwards;
  animation-delay: 1.5s;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(50px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>