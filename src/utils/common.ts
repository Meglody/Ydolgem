import { DudgeLine } from './enums';
/**
 * @description: 高频调用同一个js函数操作dom，造成回流重绘的性能瓶颈时使用
 * @param {() => Boolean} reflowFn
 */
export function useRAF(reflowFn: () => boolean) {
  const step = () => {
    const endPoint = reflowFn();
    if (!endPoint) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

export function diff(keyDownTime: Date, noteTime: Date) {
  return Math.abs(keyDownTime.getTime() - noteTime.getTime());
}

export const judgeByTimeRule = (diffTimeStamp: number) => {
  if (diffTimeStamp > 300) {
    return DudgeLine.MISS;
  } else if (diffTimeStamp > 200) {
    return DudgeLine.GOOD;
  } else if (diffTimeStamp > 100) {
    return DudgeLine.PERFECT;
  }
  return DudgeLine.MASTER;
};

export const judgeByFrameRule = (diffFrame: number) => {
  if (diffFrame > 18) {
    return DudgeLine.MISS;
  } else if (diffFrame > 12) {
    return DudgeLine.GOOD;
  } else if (diffFrame > 6) {
    return DudgeLine.PERFECT;
  }
  return DudgeLine.MASTER;
};

export const pipe = (...fns: any) => {
  // 这个例子里面args好像其实也不需要，pipe本身是接受一元参数的
  return fns.reduce(
    (pre: any, cur: any) =>
      (...args: any[]) =>
        cur(pre(...args))
  );
};

export const judgeByTime = (keyDownTime: Date, noteTime: Date) => {
  return pipe(diff, judgeByTimeRule)(keyDownTime, noteTime);
};

export const judgeByFrame = (keyDownFrame: number) => {
  return pipe(judgeByFrameRule)(Math.abs(1 - keyDownFrame) * 100);
};

export const isRambling = (note: { type: number }) => {
  return note.type % 2 === 1;
};

export const isSlider = (note: { type: number }) => {
  return note.type >> 1;
};
