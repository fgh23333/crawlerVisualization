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
          <span class="text_8">这是一个第三方题库，仅供海大学生复习备考</span>
        </div>
        <div class="group_7">
          <span class="mt-48 text_11">
            <a class="GitHub_link" href="https://github.com/fgh23333/crawlerVisualization">
              更多详情请前往GitHub项目主页（网站持续更新ing）
              <img class="GitHub_icon" src="../../assets/icon/github.svg">
            </a>
          </span>
        </div>
        <div class="group_7">
          <span class="mt-48 text_12">
            题库内容全部免费，从未授权任何人进行任何形式的收费，请各位访客谨慎识别，以免上当受骗
          </span>
        </div>
        <div class="group_7">
          <span class="mt-48 text_12">
            AI对话（测试版）现已上线，欢迎大家体验
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
a,
a:link,
a:visited,
a:hover,
a:active {
  text-decoration: none;
  color: inherit;
}

.self-start {
  align-self: flex-start;
}

.group_3 {
  margin-right: 5px;
  width: 99%;
  height: 98vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.group_5 {
  display: flex;
  justify-content: left;
}

.group_6 {
  display: flex;
  justify-content: left;
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

.text_11 {
  margin-top: 40px;
  color: #828282;
  font-size: 24px;
  font-family: HarmonyOSSansSC;
  font-weight: 700;
  line-height: 48px;
  text-align: left;
  letter-spacing: 1px;
}

.text_12 {
  margin-top: 40px;
  color: #828282;
  font-size: 20px;
  font-family: HarmonyOSSansSC;
  font-weight: 700;
  line-height: 48px;
  text-align: left;
  letter-spacing: 1px;
}

.group_4 {
  margin-top: 64px;
  width: 1100px;
}

.text_8 {
  color: #5f89d3;
  font-size: 48px;
  font-family: HarmonyOSSansSC;
  font-weight: 900;
  line-height: 46px;
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
  display: flex;
  justify-content: left;
  margin-top: 20px
}

.GitHub_icon {
  margin-left: 10px;
  margin-bottom: -5px
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