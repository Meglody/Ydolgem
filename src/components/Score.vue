<script setup lang="ts">
import { DudgeLine } from '../utils/enums';
const score = ref(0);
const computedScoreStr = computed(() => {
  const str = score.value + '';
  return str.padStart(10, 0);
});
const props = withDefaults(
  defineProps<{
    tracks: {
      bg: String;
      keyCode: Number;
      notes: any[];
    }[];
  }>(),
  {
    tracks: () => [],
  }
);
const each = computed(() =>
  sum(props.tracks.map((track) => track.notes.length))
);
const addScore = ({
  judgeResult,
  isSlider,
}: {
  judgeResult: number;
  isSlider: number;
}) => {
  const base = 1000000000 / each.value;
  const { MISS, GOOD, PERFECT, MASTER } = DudgeLine;
  let ex = 0;
  switch (judgeResult) {
    case MISS:
      ex = 0;
      break;
    case GOOD:
      ex = Math.floor(base * 0.8);
      break;
    case PERFECT:
      ex = base;
      break;
    case MASTER:
      ex = Math.floor(base * 1.02);
      break;
  }
  score.value = Math.floor(score.value + (ex >> isSlider));
};
const add = (a, b) => a + b;
const sum = (arr) => arr.reduce(add, 0);

expose({
  addScore,
  add,
  sum,
});
</script>
<template>
  <div flex flex-row w300px h80px color-black justify-start items-center px20px>
    <span text-xl>{{ computedScoreStr }}</span>
  </div>
</template>
