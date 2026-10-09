import * as XLSX from 'xlsx';

import type {
  AppState,
  LearningCellLanguage,
  QuizType,
} from './types';

const SHEETS = {
  worlds: 'Worlds',
  levels: 'Levels',
  lessons: 'Lessons',
  learningCells: 'Learning Cells',
  quizzes: 'Quizzes',
  quizOptions: 'Quiz Options',
} as const;

const REQUIRED_HEADERS: Record<string, string[]> = {
  [SHEETS.worlds]: ['world_id', 'title', 'order'],
  [SHEETS.levels]: ['world_id', 'level_id', 'title', 'order'],
  [SHEETS.lessons]: [
    'world_id',
    'level_id',
    'lesson_id',
    'title',
    'order',
    'learning_name',
    'learning_description',
    'grid_rows',
    'grid_columns',
  ],
  [SHEETS.learningCells]: [
    'world_id',
    'level_id',
    'lesson_id',
    'item_id',
    'item_order',
    'row',
    'column',
    'language',
    'text',
  ],
  [SHEETS.quizzes]: [
    'world_id',
    'level_id',
    'lesson_id',
    'quiz_id',
    'type',
    'order',
    'question_text',
    'correct_option_id',
    'correct_answer_text',
    'arabic_prompt_text',
    'english_prompt_text',
  ],
  [SHEETS.quizOptions]: [
    'world_id',
    'level_id',
    'lesson_id',
    'quiz_id',
    'option_id',
    'text',
  ],
};

const QUIZ_TYPES = new Set<QuizType>([
  'text_multiple_choice',
  'audio_multiple_choice',
  'audio_typing',
  'arabic_voice_record',
]);

type ExcelRow = Record<string, unknown>;

export interface ExcelImportSummary {
  state: AppState;
  worlds: number;
  levels: number;
  lessons: number;
  learningCells: number;
  quizzes: number;
  quizOptions: number;
}

function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value).trim();

  const excelValue = value as {
    text?: string;
    result?: unknown;
    richText?: Array<{ text?: string }>;
  };
  if (excelValue.result != null) return text(excelValue.result);
  if (excelValue.text != null) return text(excelValue.text);
  if (Array.isArray(excelValue.richText)) {
    return excelValue.richText.map((part) => part.text ?? '').join('').trim();
  }
  return String(value).trim();
}

function integer(
  value: unknown,
  label: string,
  rowNumber: number,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${label}, row ${rowNumber}: expected a whole number from ${minimum} to ${maximum}.`
    );
  }
  return parsed;
}

function cloneState(state: AppState): AppState {
  return JSON.parse(JSON.stringify(state || { worlds: {} })) as AppState;
}

function hasValues(row: ExcelRow): boolean {
  return Object.values(row).some((value) => text(value) !== '');
}

function requireText(
  row: ExcelRow,
  field: string,
  sheetName: string,
  rowNumber: number
): string {
  const value = text(row[field]);
  if (!value) {
    throw new Error(`${sheetName}, row ${rowNumber}: '${field}' is required.`);
  }
  return value;
}

function getRows(workbook: XLSX.WorkBook, sheetName: string): ExcelRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Missing required sheet '${sheetName}'. Use the provided template.`);
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  const headers = (matrix[0] || []).map((value) => text(value));
  const missingHeaders = REQUIRED_HEADERS[sheetName].filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `${sheetName}: missing column(s) ${missingHeaders.join(', ')}. Do not rename template headers.`
    );
  }

  return XLSX.utils
    .sheet_to_json<ExcelRow>(sheet, { defval: '', raw: false })
    .filter(hasValues);
}

function findLesson(
  state: AppState,
  worldId: string,
  levelId: string,
  lessonId: string,
  sheetName: string,
  rowNumber: number
) {
  const world = state.worlds[worldId];
  if (!world) {
    throw new Error(`${sheetName}, row ${rowNumber}: world_id '${worldId}' does not exist.`);
  }

  const level = world.levels?.[levelId];
  if (!level) {
    throw new Error(`${sheetName}, row ${rowNumber}: level_id '${levelId}' does not exist in '${worldId}'.`);
  }

  const lesson = level.lessons?.[lessonId];
  if (!lesson) {
    throw new Error(`${sheetName}, row ${rowNumber}: lesson_id '${lessonId}' does not exist in '${levelId}'.`);
  }

  return lesson;
}

/**
 * Imports the text-only workbook as an upsert. Existing Cloudflare image and
 * audio URLs are deliberately preserved; new records receive empty media URLs.
 */
export async function importTextWorkbook(
  data: ArrayBuffer,
  currentState: AppState
): Promise<ExcelImportSummary> {
  const workbook = XLSX.read(data, { type: 'array' });
  const worldsRows = getRows(workbook, SHEETS.worlds);
  const levelsRows = getRows(workbook, SHEETS.levels);
  const lessonsRows = getRows(workbook, SHEETS.lessons);
  const learningRows = getRows(workbook, SHEETS.learningCells);
  const quizzesRows = getRows(workbook, SHEETS.quizzes);
  const optionsRows = getRows(workbook, SHEETS.quizOptions);

  const state = cloneState(currentState);
  state.worlds ||= {};

  worldsRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'world_id', SHEETS.worlds, rowNumber);
    const title = requireText(row, 'title', SHEETS.worlds, rowNumber);
    const order = integer(row.order, `${SHEETS.worlds}.order`, rowNumber, 1);
    const existing = state.worlds[worldId];

    state.worlds[worldId] = {
      title,
      order,
      buttonImageUrl: existing?.buttonImageUrl ?? '',
      backgroundImageUrl: existing?.backgroundImageUrl ?? '',
      levels: existing?.levels ?? {},
    };
  });

  levelsRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'world_id', SHEETS.levels, rowNumber);
    const levelId = requireText(row, 'level_id', SHEETS.levels, rowNumber);
    const title = requireText(row, 'title', SHEETS.levels, rowNumber);
    const order = integer(row.order, `${SHEETS.levels}.order`, rowNumber, 1);
    const world = state.worlds[worldId];

    if (!world) {
      throw new Error(`${SHEETS.levels}, row ${rowNumber}: world_id '${worldId}' does not exist.`);
    }

    const existing = world.levels?.[levelId];
    world.levels ||= {};
    world.levels[levelId] = {
      title,
      order,
      lessons: existing?.lessons ?? {},
    };
  });

  lessonsRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'world_id', SHEETS.lessons, rowNumber);
    const levelId = requireText(row, 'level_id', SHEETS.lessons, rowNumber);
    const lessonId = requireText(row, 'lesson_id', SHEETS.lessons, rowNumber);
    const title = requireText(row, 'title', SHEETS.lessons, rowNumber);
    const order = integer(row.order, `${SHEETS.lessons}.order`, rowNumber, 1);
    const rows = integer(row.grid_rows, `${SHEETS.lessons}.grid_rows`, rowNumber, 1, 4);
    const columns = integer(
      row.grid_columns,
      `${SHEETS.lessons}.grid_columns`,
      rowNumber,
      1,
      2
    );
    const world = state.worlds[worldId];
    const level = world?.levels?.[levelId];

    if (!world) {
      throw new Error(`${SHEETS.lessons}, row ${rowNumber}: world_id '${worldId}' does not exist.`);
    }
    if (!level) {
      throw new Error(`${SHEETS.lessons}, row ${rowNumber}: level_id '${levelId}' does not exist.`);
    }

    const existing = level.lessons?.[lessonId];
    level.lessons ||= {};
    level.lessons[lessonId] = {
      title,
      order,
      data: {
        learningItems: {
          name: text(row.learning_name),
          description: text(row.learning_description),
          gridSize: { rows, columns },
          items: existing?.data?.learningItems?.items ?? {},
        },
        quizzes: existing?.data?.quizzes ?? {},
      },
    };
  });

  learningRows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .sort((a, b) => Number(a.row.item_order) - Number(b.row.item_order))
    .forEach(({ row, rowNumber }) => {
      const worldId = requireText(row, 'world_id', SHEETS.learningCells, rowNumber);
      const levelId = requireText(row, 'level_id', SHEETS.learningCells, rowNumber);
      const lessonId = requireText(row, 'lesson_id', SHEETS.learningCells, rowNumber);
      const itemId = requireText(row, 'item_id', SHEETS.learningCells, rowNumber);
      integer(row.item_order, `${SHEETS.learningCells}.item_order`, rowNumber, 1);
      const cellRow = integer(row.row, `${SHEETS.learningCells}.row`, rowNumber, 1, 4);
      const column = integer(row.column, `${SHEETS.learningCells}.column`, rowNumber, 1, 2);
      const language = requireText(row, 'language', SHEETS.learningCells, rowNumber).toLowerCase();
      const cellText = requireText(row, 'text', SHEETS.learningCells, rowNumber);

      if (language !== 'english' && language !== 'arabic') {
        throw new Error(`${SHEETS.learningCells}, row ${rowNumber}: language must be english or arabic.`);
      }

      const lesson = findLesson(
        state,
        worldId,
        levelId,
        lessonId,
        SHEETS.learningCells,
        rowNumber
      );
      const items = lesson.data.learningItems.items;
      const item = items[itemId] ?? { cells: {} };
      const cellId = `cell_${cellRow}_${column}`;
      const existingCell = item.cells[cellId];

      item.cells[cellId] = {
        row: cellRow,
        column,
        language: language as LearningCellLanguage,
        text: cellText,
        audioUrl: existingCell?.audioUrl ?? '',
      };
      items[itemId] = item;
    });

  quizzesRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'world_id', SHEETS.quizzes, rowNumber);
    const levelId = requireText(row, 'level_id', SHEETS.quizzes, rowNumber);
    const lessonId = requireText(row, 'lesson_id', SHEETS.quizzes, rowNumber);
    const quizId = requireText(row, 'quiz_id', SHEETS.quizzes, rowNumber);
    const quizType = requireText(row, 'type', SHEETS.quizzes, rowNumber) as QuizType;
    const order = integer(row.order, `${SHEETS.quizzes}.order`, rowNumber, 0);

    if (!QUIZ_TYPES.has(quizType)) {
      throw new Error(`${SHEETS.quizzes}, row ${rowNumber}: invalid quiz type '${quizType}'.`);
    }

    const lesson = findLesson(
      state,
      worldId,
      levelId,
      lessonId,
      SHEETS.quizzes,
      rowNumber
    );
    const existing = lesson.data.quizzes[quizId];

    lesson.data.quizzes[quizId] = {
      type: quizType,
      order,
      questionText: text(row.question_text),
      questionAudioUrl: existing?.questionAudioUrl ?? '',
      correctOptionId: text(row.correct_option_id),
      correctAnswerText: text(row.correct_answer_text),
      arabicPromptText: text(row.arabic_prompt_text),
      englishPromptText: text(row.english_prompt_text),
      options: existing?.options ?? {},
    };
  });

  optionsRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'world_id', SHEETS.quizOptions, rowNumber);
    const levelId = requireText(row, 'level_id', SHEETS.quizOptions, rowNumber);
    const lessonId = requireText(row, 'lesson_id', SHEETS.quizOptions, rowNumber);
    const quizId = requireText(row, 'quiz_id', SHEETS.quizOptions, rowNumber);
    const optionId = requireText(row, 'option_id', SHEETS.quizOptions, rowNumber);
    const optionText = requireText(row, 'text', SHEETS.quizOptions, rowNumber);
    const lesson = findLesson(
      state,
      worldId,
      levelId,
      lessonId,
      SHEETS.quizOptions,
      rowNumber
    );
    const quiz = lesson.data.quizzes[quizId];

    if (!quiz) {
      throw new Error(`${SHEETS.quizOptions}, row ${rowNumber}: quiz_id '${quizId}' does not exist.`);
    }

    quiz.options ||= {};
    quiz.options[optionId] = { text: optionText };
  });

  quizzesRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = text(row.world_id);
    const levelId = text(row.level_id);
    const lessonId = text(row.lesson_id);
    const quizId = text(row.quiz_id);
    const quiz = state.worlds[worldId].levels[levelId].lessons[lessonId].data.quizzes[quizId];

    if (
      (quiz.type === 'text_multiple_choice' || quiz.type === 'audio_multiple_choice') &&
      (!quiz.correctOptionId || !quiz.options?.[quiz.correctOptionId])
    ) {
      throw new Error(
        `${SHEETS.quizzes}, row ${rowNumber}: correct_option_id must match an option_id in Quiz Options.`
      );
    }

    if (quiz.type === 'audio_typing' && !quiz.correctAnswerText) {
      throw new Error(`${SHEETS.quizzes}, row ${rowNumber}: correct_answer_text is required for audio_typing.`);
    }

    if (quiz.type === 'arabic_voice_record' && !quiz.englishPromptText) {
      throw new Error(`${SHEETS.quizzes}, row ${rowNumber}: english_prompt_text is required for arabic_voice_record.`);
    }
  });

  return {
    state,
    worlds: worldsRows.length,
    levels: levelsRows.length,
    lessons: lessonsRows.length,
    learningCells: learningRows.length,
    quizzes: quizzesRows.length,
    quizOptions: optionsRows.length,
  };
}
