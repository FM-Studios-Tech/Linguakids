// 'use client';

// import { useReducer, useCallback } from 'react';
// import { initialState } from './mock-data';
// import type {
//   AppState,
//   World,
//   Level,
//   Lesson,
//   LessonData,
//   LearningItem,
//   Quiz,
// } from './types';

// type Action =
//   | { type: 'ADD_WORLD'; world: World }
//   | { type: 'UPDATE_WORLD'; worldId: string; world: Partial<World> }
//   | { type: 'DELETE_WORLD'; worldId: string }
//   | { type: 'ADD_LEVEL'; worldId: string; level: Level }
//   | { type: 'UPDATE_LEVEL'; worldId: string; levelId: string; level: Partial<Level> }
//   | { type: 'DELETE_LEVEL'; worldId: string; levelId: string }
//   | { type: 'ADD_LESSON'; worldId: string; levelId: string; lesson: Lesson }
//   | {
//       type: 'UPDATE_LESSON';
//       worldId: string;
//       levelId: string;
//       lessonId: string;
//       lesson: Partial<Lesson>;
//     }
//   | { type: 'DELETE_LESSON'; worldId: string; levelId: string; lessonId: string }
//   | {
//       type: 'UPDATE_LESSON_DATA';
//       worldId: string;
//       levelId: string;
//       lessonId: string;
//       data: LessonData;
//     };

// export function generateId(prefix: string): string {
//   return `${prefix}_${Date.now().toString(36)}${Math.random()
//     .toString(36)
//     .slice(2, 6)}`;
// }

// function reducer(state: AppState, action: Action): AppState {
//   switch (action.type) {
//     case 'ADD_WORLD': {
//       const id = generateId('world');
//       return {
//         ...state,
//         worlds: { ...state.worlds, [id]: action.world },
//       };
//     }
//     case 'UPDATE_WORLD': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: { ...world, ...action.world },
//         },
//       };
//     }
//     case 'DELETE_WORLD': {
//       const { [action.worldId]: _, ...rest } = state.worlds;
//       return { ...state, worlds: rest };
//     }
//     case 'ADD_LEVEL': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const id = generateId('level');
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: { ...world.levels, [id]: action.level },
//           },
//         },
//       };
//     }
//     case 'UPDATE_LEVEL': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: { ...level, ...action.level },
//             },
//           },
//         },
//       };
//     }
//     case 'DELETE_LEVEL': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const { [action.levelId]: _, ...rest } = world.levels;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: { ...world, levels: rest },
//         },
//       };
//     }
//     case 'ADD_LESSON': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const id = generateId('lesson');
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: {
//                 ...level,
//                 lessons: { ...level.lessons, [id]: action.lesson },
//               },
//             },
//           },
//         },
//       };
//     }
//     case 'UPDATE_LESSON': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const lesson = level.lessons[action.lessonId];
//       if (!lesson) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: {
//                 ...level,
//                 lessons: {
//                   ...level.lessons,
//                   [action.lessonId]: { ...lesson, ...action.lesson },
//                 },
//               },
//             },
//           },
//         },
//       };
//     }
//     case 'DELETE_LESSON': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const { [action.lessonId]: _, ...rest } = level.lessons;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: { ...level, lessons: rest },
//             },
//           },
//         },
//       };
//     }
//     case 'UPDATE_LESSON_DATA': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const lesson = level.lessons[action.lessonId];
//       if (!lesson) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: {
//                 ...level,
//                 lessons: {
//                   ...level.lessons,
//                   [action.lessonId]: { ...lesson, data: action.data },
//                 },
//               },
//             },
//           },
//         },
//       };
//     }
//     default:
//       return state;
//   }
// }

// export interface LearningItemUpdate {
//   itemId: string;
//   item: Partial<LearningItem>;
// }

// export interface QuizUpdate {
//   quizId: string;
//   quiz: Partial<Quiz>;
// }

// export function useAppState() {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const addWorld = useCallback((world: World) => {
//     dispatch({ type: 'ADD_WORLD', world });
//   }, []);

//   const updateWorld = useCallback((worldId: string, world: Partial<World>) => {
//     dispatch({ type: 'UPDATE_WORLD', worldId, world });
//   }, []);

//   const deleteWorld = useCallback((worldId: string) => {
//     dispatch({ type: 'DELETE_WORLD', worldId });
//   }, []);

//   const addLevel = useCallback((worldId: string, level: Level) => {
//     dispatch({ type: 'ADD_LEVEL', worldId, level });
//   }, []);

//   const updateLevel = useCallback(
//     (worldId: string, levelId: string, level: Partial<Level>) => {
//       dispatch({ type: 'UPDATE_LEVEL', worldId, levelId, level });
//     },
//     []
//   );

//   const deleteLevel = useCallback((worldId: string, levelId: string) => {
//     dispatch({ type: 'DELETE_LEVEL', worldId, levelId });
//   }, []);

//   const addLesson = useCallback(
//     (worldId: string, levelId: string, lesson: Lesson) => {
//       dispatch({ type: 'ADD_LESSON', worldId, levelId, lesson });
//     },
//     []
//   );

//   const updateLesson = useCallback(
//     (worldId: string, levelId: string, lessonId: string, lesson: Partial<Lesson>) => {
//       dispatch({ type: 'UPDATE_LESSON', worldId, levelId, lessonId, lesson });
//     },
//     []
//   );

//   const deleteLesson = useCallback(
//     (worldId: string, levelId: string, lessonId: string) => {
//       dispatch({ type: 'DELETE_LESSON', worldId, levelId, lessonId });
//     },
//     []
//   );

//   const updateLessonData = useCallback(
//     (worldId: string, levelId: string, lessonId: string, data: LessonData) => {
//       dispatch({ type: 'UPDATE_LESSON_DATA', worldId, levelId, lessonId, data });
//     },
//     []
//   );

//   return {
//     state,
//     addWorld,
//     updateWorld,
//     deleteWorld,
//     addLevel,
//     updateLevel,
//     deleteLevel,
//     addLesson,
//     updateLesson,
//     deleteLesson,
//     updateLessonData,
//   };
// }

// export type AppActions = ReturnType<typeof useAppState>;
'use client';

import { useReducer, useCallback } from 'react';
import { initialState } from './mock-data';
import type {
  AppState,
  World,
  Level,
  Lesson,
  LessonData,
  LearningItem,
  Quiz,
} from './types';

type Action =
  | { type: 'REPLACE_STATE'; payload: AppState } // <-- Added action to accept live data
  | { type: 'ADD_WORLD'; world: World }
  | { type: 'UPDATE_WORLD'; worldId: string; world: Partial<World> }
  | { type: 'DELETE_WORLD'; worldId: string }
  | { type: 'ADD_LEVEL'; worldId: string; level: Level }
  | { type: 'UPDATE_LEVEL'; worldId: string; levelId: string; level: Partial<Level> }
  | { type: 'DELETE_LEVEL'; worldId: string; levelId: string }
  | { type: 'ADD_LESSON'; worldId: string; levelId: string; lesson: Lesson }
  | {
      type: 'UPDATE_LESSON';
      worldId: string;
      levelId: string;
      lessonId: string;
      lesson: Partial<Lesson>;
    }
  | { type: 'DELETE_LESSON'; worldId: string; levelId: string; lessonId: string }
  | {
      type: 'UPDATE_LESSON_DATA';
      worldId: string;
      levelId: string;
      lessonId: string;
      data: LessonData;
    };

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'REPLACE_STATE': {
      return action.payload; // <-- Overwrites entire state with Firebase data
    }
    case 'ADD_WORLD': {
      const id = generateId('world');
      return {
        ...state,
        worlds: { ...state.worlds, [id]: action.world },
      };
    }
    case 'UPDATE_WORLD': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: { ...world, ...action.world },
        },
      };
    }
    case 'DELETE_WORLD': {
      const { [action.worldId]: _, ...rest } = state.worlds;
      return { ...state, worlds: rest };
    }
    case 'ADD_LEVEL': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const id = generateId('level');
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: { ...world.levels, [id]: action.level },
          },
        },
      };
    }
    case 'UPDATE_LEVEL': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: { ...level, ...action.level },
            },
          },
        },
      };
    }
    case 'DELETE_LEVEL': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const { [action.levelId]: _, ...rest } = world.levels;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: { ...world, levels: rest },
        },
      };
    }
    case 'ADD_LESSON': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const id = generateId('lesson');
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: {
                ...level,
                lessons: { ...level.lessons, [id]: action.lesson },
              },
            },
          },
        },
      };
    }
    case 'UPDATE_LESSON': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const lesson = level.lessons[action.lessonId];
      if (!lesson) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: {
                ...level,
                lessons: {
                  ...level.lessons,
                  [action.lessonId]: { ...lesson, ...action.lesson },
                },
              },
            },
          },
        },
      };
    }
    case 'DELETE_LESSON': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const { [action.lessonId]: _, ...rest } = level.lessons;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: { ...level, lessons: rest },
            },
          },
        },
      };
    }
    case 'UPDATE_LESSON_DATA': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const lesson = level.lessons[action.lessonId];
      if (!lesson) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: {
                ...level,
                lessons: {
                  ...level.lessons,
                  [action.lessonId]: { ...lesson, data: action.data },
                },
              },
            },
          },
        },
      };
    }
    default:
      return state;
  }
}

export interface LearningItemUpdate {
  itemId: string;
  item: Partial<LearningItem>;
}

export interface QuizUpdate {
  quizId: string;
  quiz: Partial<Quiz>;
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addWorld = useCallback((world: World) => {
    dispatch({ type: 'ADD_WORLD', world });
  }, []);

  const updateWorld = useCallback((worldId: string, world: Partial<World>) => {
    dispatch({ type: 'UPDATE_WORLD', worldId, world });
  }, []);

  const deleteWorld = useCallback((worldId: string) => {
    dispatch({ type: 'DELETE_WORLD', worldId });
  }, []);

  const addLevel = useCallback((worldId: string, level: Level) => {
    dispatch({ type: 'ADD_LEVEL', worldId, level });
  }, []);

  const updateLevel = useCallback(
    (worldId: string, levelId: string, level: Partial<Level>) => {
      dispatch({ type: 'UPDATE_LEVEL', worldId, levelId, level });
    },
    []
  );

  const deleteLevel = useCallback((worldId: string, levelId: string) => {
    dispatch({ type: 'DELETE_LEVEL', worldId, levelId });
  }, []);

  const addLesson = useCallback(
    (worldId: string, levelId: string, lesson: Lesson) => {
      dispatch({ type: 'ADD_LESSON', worldId, levelId, lesson });
    },
    []
  );

  const updateLesson = useCallback(
    (worldId: string, levelId: string, lessonId: string, lesson: Partial<Lesson>) => {
      dispatch({ type: 'UPDATE_LESSON', worldId, levelId, lessonId, lesson });
    },
    []
  );

  const deleteLesson = useCallback(
    (worldId: string, levelId: string, lessonId: string) => {
      dispatch({ type: 'DELETE_LESSON', worldId, levelId, lessonId });
    },
    []
  );

  const updateLessonData = useCallback(
    (worldId: string, levelId: string, lessonId: string, data: LessonData) => {
      dispatch({ type: 'UPDATE_LESSON_DATA', worldId, levelId, lessonId, data });
    },
    []
  );

  return {
    state,
    dispatch, // <-- Exporting dispatch so page.tsx can trigger REPLACE_STATE
    addWorld,
    updateWorld,
    deleteWorld,
    addLevel,
    updateLevel,
    deleteLevel,
    addLesson,
    updateLesson,
    deleteLesson,
    updateLessonData,
  };
}

export type AppActions = ReturnType<typeof useAppState>;