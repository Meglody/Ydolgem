<template>
  <div ref="trackRef" hfull wfull relative :style="{ backgroundColor: bg }">
    <div
      v-for="note in notes"
      :key="note.key"
      :style="{ top: `${isSlider(note) ? note.top[0] : note.top}px` }"
      absolute
      wfull
      h10px
      bg-white
    ></div>
    <div
      absolute
      v-if="topestRambling"
      h2px
      wfull
      :style="{
        top: `${topestRambling.endTop}px`,
        background: 'radial-gradient(gold, yellow ,white, transparent)',
      }"
    ></div>
    <div
      absolute
      h2px
      wfull
      bg-white
      :style="{
        top: `${trackHeight - 20}px`,
        background: 'radial-gradient(black, transparent)',
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { colors } from '../utils/const';
import {
  pipe,
  useRAF,
  judgeByFrame,
  isSlider,
  isRambling,
} from '../utils/common';
import { DudgeLine } from '../utils/enums';
const offset = inject('offset');
const duration = inject('duration');
const props = withDefaults(
  defineProps<{
    trackInfo: {
      bg: String;
      keyCode: Number;
      notes: any[];
    };
  }>(),
  {
    trackInfo: {
      bg: '#cccccc',
      keyCode: 90,
      notes: () => [],
    },
  }
);
const emit = defineEmits<{
  (event: 'addScore', judgeResult: number);
}>();
const bg = ref(props.trackInfo.bg);
const trackRef = ref(null);
const {
  x,
  y,
  top,
  right,
  bottom,
  left,
  width,
  height: trackHeight,
} = useElementBounding(trackRef);
const endTime = new Date().getTime() + offset.value + duration.value;
const startTimeStamp = new Date().getTime();
const allNotes = props.trackInfo.notes.map((note) => ({
  ...note,
  triggered: false,
  judgeResult: '',
  top: note.initialTop,
  frame: isSlider(note) ? [0, 0] : 0,
}));
const notes = ref([]);
const triggeredNotesKey = ref([]);
const topAdd = computed(() => {
  return notes.value.map((note) => {
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    const initialTop = isSlider(note) ? note.initialTop[0] : note.initialTop;
    return (endPoint - initialTop) * note.speed;
  });
});
const topestRambling = computed(() => {
  let topest = null;
  notes.value
    .filter((note) => isRambling(note))
    .forEach((note) => {
      if (topest === null) {
        topest = note;
        return;
      }
      const topestTop = isSlider(topest) ? topest.top[1] : topest.top;
      const noteTop = isSlider(note) ? note.top[1] : note.top;
      return topestTop > noteTop ? topest : note;
    });
  return topest;
});
const hitNote = ref(null);
const checkJudges = () => {
  bg.value = props.trackInfo.bg;
  // 执行判读
  if (hitNote.value) {
    console.log(hitNote.value.frame);
    const result = judgeByFrame(hitNote.value.frame);
    logAndChangeBg(result);
    emit('addScore', result);
    hitNote.value = null;
  }
  // 是否miss
  const outOfScreen = allNotes.filter((note) => {
    if (isSlider(note)) return false;
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    const top = note.top;
    return top >= endPoint && !triggeredNotesKey.value.includes(note.key);
  });
  const splitSliders = allNotes.filter(isSlider);
  splitSliders.forEach((note) => {
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    note.top.forEach((top, topIndex) => {
      const newKey = `${note.key}-slider-${topIndex}`;
      if (top >= endPoint && !triggeredNotesKey.value.includes(newKey)) {
        outOfScreen.push({
          ...note,
          key: newKey,
        });
      }
    });
  });
  misses.value = outOfScreen.length;
  return outOfScreen;
};

const misses = ref(0);
watch(misses, (nv, ov) => {
  // miss数增加
  if (nv) {
    logAndChangeBg(0);
    emit('addScore', 0);
  }
});

const push = () => {
  const notesToPush = allNotes.filter((note) => {
    const timeLine =
      new Date().getTime() >=
      startTimeStamp + note.startTimeStamp + offset.value;
    const triggered = !triggeredNotesKey.value.includes(note.key);
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    const notOutOfScreen = isSlider(note)
      ? note.top[1] < endPoint
      : note.top < endPoint;
    // if (!notOutOfScreen) {
    //   console.log(note.key, calculateHitTime(note), new Date().getTime());
    // }
    return timeLine && triggered && notOutOfScreen;
  });
  notes.value = notesToPush;
};
const move = () => {
  notes.value.forEach((note, index) => {
    if (isSlider(note)) {
      note.frame = note.frame.map((f) => f + note.speed);
      note.top = note.top.map((t) => t + topAdd.value[index]);
    } else {
      note.frame += note.speed;
      note.top = note.top + topAdd.value[index];
    }
  });
};
const ifEnd = () => {
  const time = new Date().getTime();
  if (time >= endTime) {
    return true;
  }
  return false;
};
const render = pipe(checkJudges, push, move, ifEnd);

const userInput = () => {
  let topest = null;
  notes.value.forEach((note) => {
    if (topest === null) return note;
    const topestTop = isSlider(topest) ? topest.top[1] : topest.top;
    const noteTop = isSlider(note) ? note.top[1] : note.top;
    return topestTop > noteTop ? topest : note;
  });
  if (topest) {
    if (!isSlider(topest)) {
      triggeredNotesKey.value.push(topest.key);
    }
    return topest;
  } else {
    return null;
  }
};

const logAndChangeBg = async (result) => {
  const { MISS, GOOD, PERFECT, MASTER } = DudgeLine;
  bg.value = colors[result];
  switch (result) {
    case MISS:
      console.log('miss');
      break;
    case GOOD:
      console.log('good');
      break;
    case PERFECT:
      console.log('perfect');
      break;
    case MASTER:
      console.log('master');
      break;
  }
  return true;
};

const ZSwitch = ref(false);

const pressDown = (e) => {
  if (e.keyCode !== props.trackInfo.keyCode) return;
  // 记录note，下一帧执行判读
  if (!ZSwitch.value) {
    hitNote.value = userInput();
    ZSwitch.value = true;
  }
};

const pressUp = (e) => {
  if (e.keyCode !== props.trackInfo.keyCode) return;
  let topestSlider = null;
  notes.value
    .filter((note) => isSlider(note))
    .forEach((note) => {
      topestSlider =
        topestSlider === null
          ? note
          : topestSlider.top[1] > note.top[1]
          ? topestSlider
          : note;
    });
  if (topestSlider) {
    triggeredNotesKey.value.push(topestSlider.key);
    hitNote.value = topestSlider;
  }
  ZSwitch.value = false;
};

const bindKey = () => {
  window.addEventListener('keydown', pressDown);
  window.addEventListener('keyup', pressUp);
};
const UnBindKey = () => {
  window.removeEventListener('keydown', pressDown);
  window.removeEventListener('keyup', pressUp);
};

onMounted(() => {
  // render();
  bindKey();
  useRAF(render);
});

onUnmounted(() => {
  UnBindKey();
});
</script>
