<template>
  <div ref="trackRef" hfull wfull relative :style="{ backgroundColor: bg }">
    <div v-for="note in notes" :key="note.key" wfull relative>
      <div
        :style="{ top: `${isSlider(note) ? note.top[0] : note.top}px` }"
        absolute
        wfull
        h10px
        bg-white
      ></div>
      <div
        v-if="isSlider(note)"
        :style="{
          top: `${note.top[1] + 5}px`,
          width: '80%',
          margin: '0px 10%',
          height: `${note.top[0] - note.top[1] - 10}px`,
        }"
        absolute
        bg-white
      ></div>
      <div
        v-if="isSlider(note)"
        :style="{ top: `${note.top[1]}px` }"
        absolute
        wfull
        h10px
        bg-white
      ></div>
    </div>
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
  (event: 'addScore', data: { judgeResult: number; isSlider: boolean });
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

const notes = ref([]);
const triggeredNotesKey = ref([]);
const topAdd = computed(() => {
  return notes.value.map((note) => {
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    const initialTop = isSlider(note) ? note.initialTop[0] : note.initialTop;
    return (endPoint - initialTop) * note.speed;
  });
});
const allNotes = computed(() => {
  return props.trackInfo.notes.map((note) => {
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    const frame = isSlider(note)
      ? [
          0,
          ((note.initialTop[1] - note.initialTop[0]) /
            ((endPoint - note.initialTop[0]) * note.speed)) *
            note.speed,
        ]
      : 0;
    const res = {
      ...note,
      triggered: false,
      judgeResult: '',
      top: note.initialTop,
      frame,
    };
    return res;
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
      const topestTop = isSlider(topest) ? topest.frame[1] : topest.frame;
      const noteTop = isSlider(note) ? note.frame[1] : note.frame;
      return topestTop > noteTop ? topest : note;
    });
  return topest;
});
const hitNote = ref(null);
const checkJudges = () => {
  bg.value = props.trackInfo.bg;
  // 执行判读
  if (hitNote.value) {
    let result;
    if (isSlider(hitNote.value)) {
      // console.log(ZSwitch.value);
      result = judgeByFrame(
        ZSwitch.value ? hitNote.value.frame[0] : hitNote.value.frame[1]
      );
    } else {
      result = judgeByFrame(hitNote.value.frame);
    }
    logAndChangeBg(result);
    emit('addScore', {
      judgeResult: result,
      isSlider: isSlider(hitNote.value),
    });
    hitNote.value = null;
  }
  // 是否miss
  const outOfScreen = allNotes.value.filter((note) => {
    if (isSlider(note)) return false;
    return note.frame > 1.18 && !triggeredNotesKey.value.includes(note.key);
  });
  const splitSliders = notes.value.filter(isSlider);
  splitSliders.forEach((note) => {
    note.frame.forEach((frame, fIndex) => {
      const newKey = `${note.key}-slider-${fIndex}`;
      const missSliderJudge = frame > 1.18;
      // console.log(missSliderJudge);
      if (missSliderJudge && !triggeredNotesKey.value.includes(newKey)) {
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
    emit('addScore', {
      judgeResult: 0,
      isSlider: false,
    });
  }
});

const push = () => {
  const notesToPush = allNotes.value.filter((note) => {
    const timeLine =
      new Date().getTime() >=
      startTimeStamp + note.startTimeStamp + offset.value;
    const triggered = !triggeredNotesKey.value.includes(note.key);
    const endPoint = isRambling(note) ? note.endTop : trackHeight.value;
    const notOutOfScreen = isSlider(note)
      ? note.frame[1] <= 1.18
      : note.frame <= 1.18;
    return timeLine && triggered && notOutOfScreen;
  });
  notes.value = notesToPush;
};
const move = () => {
  notes.value.forEach((note, index) => {
    if (isSlider(note)) {
      note.frame = note.frame.map((f, fIndex) => {
        if (fIndex === 0) {
          // slider按下不再增加索引0的frame
          if (ZSwitch.value) {
            note.sliding = true;
            return f;
          } else {
            return f + note.speed;
          }
        } else if (fIndex === 1) {
          // slider没按和按下后,只要没有抬起.都继续增加索引1的frame
          if (note.sliding === undefined || note.sliding === true) {
            return f + note.speed;
          } else {
            delete note.sliding;
            return f;
          }
        }
      });
      // console.log(toRaw(note.frame));
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
    if (topest === null) {
      topest = note;
      return;
    }
    const topestTop = isSlider(topest) ? topest.frame[0] : topest.frame;
    const noteTop = isSlider(note) ? note.frame[0] : note.frame;
    return topestTop > noteTop ? topest : note;
  });
  if (topest) {
    if (!isSlider(topest)) {
      triggeredNotesKey.value.push(topest.key);
    } else {
      // console.log(topest.frame);
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
          : topestSlider.frame[1] > note.frame[1]
          ? topestSlider
          : note;
    });
  // console.log(topestSlider);
  if (topestSlider) {
    topestSlider.sliding = false;
    // console.log(topestSlider.frame);
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
