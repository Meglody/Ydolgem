<template>
  <div
    ref="trackRef"
    hfull
    wfull
    relative
    :style="{ backgroundColor: bgColor }"
  >
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
          top: `${Math.min(note.top[1], note.top[0]) + 5}px`,
          width: '80%',
          margin: '0px 10%',
          height: `${Math.abs(note.top[0] - note.top[1]) - 10}px`,
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
        background: `radial-gradient(gold, yellow, white, transparent)`,
      }"
    ></div>
    <div
      absolute
      h2px
      wfull
      bg-white
      :style="{
        top: `${trackHeight - 20}px`,
        transition: 'box-shadow .1s ease',
        background: `radial-gradient(black, transparent)`,
        boxShadow: `${bg} 0px 0px 20px`,
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { colors, bgColor } from '../utils/const';
import {
  pipe,
  useRAF,
  judgeByFrame,
  isSlider,
  isRambling,
  inDefaultBg,
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
          (note.initialTop[1] - note.initialTop[0]) /
            (endPoint - note.initialTop[0]),
        ]
      : 0;
    console.log(frame, endPoint);
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
  // ????????????
  if (hitNote.value) {
    let result;
    if (isSlider(hitNote.value)) {
      result = judgeByFrame(
        hitNote.value.slidering
          ? hitNote.value.frame[0]
          : hitNote.value.frame[1]
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
  let outOfScreen = [];
  // ??????miss
  allNotes.value.forEach((note) => {
    if (!isSlider(note)) {
      if (note.frame > 1.18 && !triggeredNotesKey.value.includes(note.key)) {
        outOfScreen.push(note);
      }
    } else {
      note.frame.forEach((frame, fIndex) => {
        const newKey = `${note.key}-slider-${fIndex}`;
        const missSliderJudge = frame > 1.18;
        if (
          missSliderJudge &&
          !outOfScreen.map((note) => note.key).includes(newKey)
        ) {
          outOfScreen.push({
            ...note,
            key: newKey,
          });
        }
      });
    }
  });
  misses.value = outOfScreen.length;
  return outOfScreen;
};

const misses = ref(0);
watch(misses, (nv, ov) => {
  // miss?????????
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
          // slider????????????????????????0???frame
          if (note.slidering === true) {
            return f;
          } else {
            return f + note.speed;
          }
        } else if (fIndex === 1) {
          // slider??????????????????,??????????????????.?????????????????????1???frame
          if (note.slidering === undefined || note.slidering === true) {
            return f + note.speed;
          } else {
            delete note.slidering;
            return f;
          }
        }
      });
      // console.log(note.frame, note.key);
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
  // ??????note????????????????????????
  if (!ZSwitch.value) {
    hitNote.value = userInput();
    if (isSlider(hitNote.value)) {
      hitNote.value.slidering = true;
    }
    ZSwitch.value = true;
  }
};

const pressUp = (e) => {
  if (e.keyCode !== props.trackInfo.keyCode) return;
  let topest = null;
  notes.value.forEach((note) => {
    if (topest === null) {
      topest = note;
    }
    const topestTop = isSlider(topest) ? topest.frame[1] : topest.frame;
    const noteTop = isSlider(note) ? note.frame[1] : note.frame;
    topest = topestTop > noteTop ? topest : note;
  });
  if (topest && isSlider(topest) && topest.slidering === true) {
    topest.slidering = false;
    triggeredNotesKey.value.push(topest.key);
    hitNote.value = topest;
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
