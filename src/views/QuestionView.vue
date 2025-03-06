<script setup>
import { ref, watch, onBeforeMount } from "vue";
import questionCard from "@/components/new-questionCard.vue";
import { useRoute } from "vue-router";
const showList = ref();
const route = useRoute();

function initShowList() {
  const subject = route.params.Subject;
  const type = route.params.Type;
  const js_name = subject + "_" + type + ".json";
  console.log(" Now Loading " + "@/assets/" + js_name);
  fetch("/src/assets/" + js_name)
    .then((response) => response.json())
    .then((data) => {
      showList.value = data;
    })
    .catch((error) => {
      console.error("Error loading JSON:", error);
    });
}

onBeforeMount(() => {
  initShowList();
})

watch(
  () => route.params,
  () => {
    initShowList();
  },
  { immediate: true }
);

const toggleFlag = (index, flagType) => {
  showList.value[index][flagType] = !showList.value[index][flagType];
};
</script>

<template>
  <div>
    <questionCard
      v-for="(question, i) in showList"
      :key="i"
      :question="question"
      :index="i"
      @toggleFlag="toggleFlag"
    />
  </div>
</template>
