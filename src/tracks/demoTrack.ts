import { bgColor } from '../utils/const';
import { NoteType } from '../utils/enums';
export const tracks = [
  {
    bg: bgColor,
    // z
    keyCode: 90,
    notes: [
      {
        type: NoteType.NOTE,
        key: 1,
        initialTop: -5,
        startTimeStamp: 333,
        speed: 2 / 100,
      },
      {
        type: NoteType.NOTE_RAMBLING,
        key: 2,
        initialTop: -5,
        endTop: 300,
        startTimeStamp: 1222,
        speed: 2 / 100,
      },
      {
        type: NoteType.SLIDE,
        key: 9,
        initialTop: [-5, -500],
        startTimeStamp: 2333,
        speed: 2 / 100,
      },
    ],
  },
  // {
  //   bg: bgColor,
  //   // x
  //   keyCode: 88,
  //   notes: [
  //     {
  //       type: NoteType.NOTE,
  //       key: 3,
  //       initialTop: -5,
  //       startTimeStamp: 666,
  //       speed: 2 / 100,
  //     },
  //     {
  //       type: NoteType.NOTE,
  //       key: 4,
  //       initialTop: -5,
  //       startTimeStamp: 1502,
  //       speed: 2 / 100,
  //     },
  //   ],
  // },
  // {
  //   bg: bgColor,
  //   // n
  //   keyCode: 78,
  //   notes: [
  //     {
  //       type: NoteType.NOTE,
  //       key: 5,
  //       initialTop: -5,
  //       startTimeStamp: 1888,
  //       speed: 2 / 100,
  //     },
  //     {
  //       type: NoteType.NOTE,
  //       key: 6,
  //       initialTop: -5,
  //       startTimeStamp: 2200,
  //       speed: 2 / 100,
  //     },
  //   ],
  // },
  // {
  //   bg: bgColor,
  //   // n
  //   keyCode: 77,
  //   notes: [
  //     {
  //       type: NoteType.NOTE,
  //       key: 7,
  //       initialTop: -5,
  //       startTimeStamp: 2677,
  //       speed: 2 / 100,
  //     },
  //     {
  //       type: NoteType.NOTE,
  //       key: 8,
  //       initialTop: -5,
  //       startTimeStamp: 3100,
  //       speed: 2 / 100,
  //     },
  //   ],
  // },
];
