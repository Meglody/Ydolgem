<script setup lang="ts">
import { tracks } from './tracks/demoTrack';
const offset = ref(333);
const duration = ref(4000);
provide('offset', offset);
provide('duration', duration);
const scoreRef = ref(null);
const addScore = (judgeResult) => {
  scoreRef.value.addScore(judgeResult);
};
</script>

<template>
  <Score ref="scoreRef" absolute z-20 left="0px" />
  <PlayGround flex flex-row overflow-hidden gap="0px 3px">
    <Track
      v-for="trackInfo in tracks"
      :trackInfo="trackInfo"
      @addScore="addScore"
    />
  </PlayGround>
</template>

<style scoped></style>
