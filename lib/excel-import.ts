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

const SIMPLE_SHEETS = {
  worlds: 'Worlds',
  levels: 'Levels',
  lessons: 'Lessons',
  learningItems: 'Learning Items',
  quizzes: 'Quizzes',
} as const;

const SIMPLE_REQUIRED_HEADERS: Record<string, string[]> = {
  [SIMPLE_SHEETS.worlds]: ['World ID', 'World Name', 'Display Order'],
  [SIMPLE_SHEETS.levels]: ['World', 'Level ID', 'Level Name', 'Display Order'],
  [SIMPLE_SHEETS.lessons]: [
    'World',
    'Level',
    'Lesson ID',
    'Lesson Name',
    'Display Order',
    'Learning Screen Title',
    'Learning Screen Description',
  ],
  [SIMPLE_SHEETS.learningItems]: [
    'World',
    'Level',
    'Lesson',
    'Item Number',
    'Letter',
    'English Word',
    'Arabic Word',
  ],
  [SIMPLE_SHEETS.quizzes]: [
    'World',
    'Level',
    'Lesson',
    'Quiz Type',
    'Sequence',
    'Question / Prompt',
    'Correct Answer',
    'Wrong Answer 1',
    'Wrong Answer 2',
  ],
};

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

function getSimpleRows(workbook: XLSX.WorkBook, sheetName: string): ExcelRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Missing required sheet '${sheetName}'. Use the simplified template.`);
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  const headers = (matrix[0] || []).map((value) => text(value));
  const missingHeaders = SIMPLE_REQUIRED_HEADERS[sheetName].filter(
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

function shortId(prefix: string, number: number): string {
  return `${prefix}_${String(number).padStart(3, '0')}`;
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

function importSimpleWorkbook(
  workbook: XLSX.WorkBook,
  currentState: AppState
): ExcelImportSummary {
  const worldsRows = getSimpleRows(workbook, SIMPLE_SHEETS.worlds);
  const levelsRows = getSimpleRows(workbook, SIMPLE_SHEETS.levels);
  const lessonsRows = getSimpleRows(workbook, SIMPLE_SHEETS.lessons);
  const learningRows = getSimpleRows(workbook, SIMPLE_SHEETS.learningItems);
  const quizzesRows = getSimpleRows(workbook, SIMPLE_SHEETS.quizzes);

  const state = cloneState(currentState);
  state.worlds ||= {};

  worldsRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'World ID', SIMPLE_SHEETS.worlds, rowNumber);
    const title = requireText(row, 'World Name', SIMPLE_SHEETS.worlds, rowNumber);
    const order = integer(
      row['Display Order'],
      `${SIMPLE_SHEETS.worlds}.Display Order`,
      rowNumber,
      1
    );
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
    const worldId = requireText(row, 'World', SIMPLE_SHEETS.levels, rowNumber);
    const levelId = requireText(row, 'Level ID', SIMPLE_SHEETS.levels, rowNumber);
    const title = requireText(row, 'Level Name', SIMPLE_SHEETS.levels, rowNumber);
    const order = integer(
      row['Display Order'],
      `${SIMPLE_SHEETS.levels}.Display Order`,
      rowNumber,
      1
    );
    const world = state.worlds[worldId];

    if (!world) {
      throw new Error(
        `${SIMPLE_SHEETS.levels}, row ${rowNumber}: World '${worldId}' does not exist.`
      );
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
    const worldId = requireText(row, 'World', SIMPLE_SHEETS.lessons, rowNumber);
    const levelId = requireText(row, 'Level', SIMPLE_SHEETS.lessons, rowNumber);
    const lessonId = requireText(row, 'Lesson ID', SIMPLE_SHEETS.lessons, rowNumber);
    const title = requireText(row, 'Lesson Name', SIMPLE_SHEETS.lessons, rowNumber);
    const order = integer(
      row['Display Order'],
      `${SIMPLE_SHEETS.lessons}.Display Order`,
      rowNumber,
      1
    );
    const world = state.worlds[worldId];
    const level = world?.levels?.[levelId];

    if (!world) {
      throw new Error(
        `${SIMPLE_SHEETS.lessons}, row ${rowNumber}: World '${worldId}' does not exist.`
      );
    }
    if (!level) {
      throw new Error(
        `${SIMPLE_SHEETS.lessons}, row ${rowNumber}: Level '${levelId}' does not exist in '${worldId}'.`
      );
    }

    const existing = level.lessons?.[lessonId];
    level.lessons ||= {};
    level.lessons[lessonId] = {
      title,
      order,
      data: {
        learningItems: {
          name: text(row['Learning Screen Title']),
          description: text(row['Learning Screen Description']),
          gridSize: existing?.data?.learningItems?.gridSize ?? {
            rows: 3,
            columns: 1,
          },
          items: existing?.data?.learningItems?.items ?? {},
        },
        quizzes: existing?.data?.quizzes ?? {},
      },
    };
  });

  const seenItems = new Set<string>();
  let learningCells = 0;

  learningRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'World', SIMPLE_SHEETS.learningItems, rowNumber);
    const levelId = requireText(row, 'Level', SIMPLE_SHEETS.learningItems, rowNumber);
    const lessonId = requireText(row, 'Lesson', SIMPLE_SHEETS.learningItems, rowNumber);
    const itemNumber = integer(
      row['Item Number'],
      `${SIMPLE_SHEETS.learningItems}.Item Number`,
      rowNumber,
      1,
      999
    );
    const itemId = shortId('item', itemNumber);
    const path = `${worldId}/${levelId}/${lessonId}/${itemId}`;

    if (seenItems.has(path)) {
      throw new Error(
        `${SIMPLE_SHEETS.learningItems}, row ${rowNumber}: Item Number ${itemNumber} is duplicated in this lesson.`
      );
    }
    seenItems.add(path);

    const lesson = findLesson(
      state,
      worldId,
      levelId,
      lessonId,
      SIMPLE_SHEETS.learningItems,
      rowNumber
    );
    const existingItem = lesson.data.learningItems.items[itemId];
    const existingCells = existingItem?.cells ?? {};
    const letter = text(row.Letter);
    const englishWord = text(row['English Word']);
    const arabicWord = text(row['Arabic Word']);
    const cells: Record<string, {
      row: number;
      column: number;
      language: LearningCellLanguage;
      text: string;
      audioUrl: string;
    }> = {};

    if (letter) {
      cells.cell_1_1 = {
        row: 1,
        column: 1,
        language: 'english',
        text: letter,
        audioUrl: existingCells.cell_1_1?.audioUrl ?? '',
      };
    }

    if (englishWord) {
      cells.cell_2_1 = {
        row: 2,
        column: 1,
        language: 'english',
        text: englishWord,
        audioUrl: existingCells.cell_2_1?.audioUrl ?? '',
      };
    }

    if (arabicWord) {
      cells.cell_3_1 = {
        row: 3,
        column: 1,
        language: 'arabic',
        text: arabicWord,
        audioUrl: existingCells.cell_3_1?.audioUrl ?? '',
      };
    }

    lesson.data.learningItems.items[itemId] = {
      cells,
    };

    learningCells += Object.keys(cells).length;
  });

  const seenQuizzes = new Set<string>();
  let quizOptions = 0;

  quizzesRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const worldId = requireText(row, 'World', SIMPLE_SHEETS.quizzes, rowNumber);
    const levelId = requireText(row, 'Level', SIMPLE_SHEETS.quizzes, rowNumber);
    const lessonId = requireText(row, 'Lesson', SIMPLE_SHEETS.quizzes, rowNumber);
    const quizType = requireText(
      row,
      'Quiz Type',
      SIMPLE_SHEETS.quizzes,
      rowNumber
    ) as QuizType;
    const sequence = integer(
      row.Sequence,
      `${SIMPLE_SHEETS.quizzes}.Sequence`,
      rowNumber,
      1,
      999
    );

    if (!QUIZ_TYPES.has(quizType)) {
      throw new Error(
        `${SIMPLE_SHEETS.quizzes}, row ${rowNumber}: invalid Quiz Type '${quizType}'.`
      );
    }

    const quizId = shortId('quiz', sequence);
    const path = `${worldId}/${levelId}/${lessonId}/${quizId}`;
    if (seenQuizzes.has(path)) {
      throw new Error(
        `${SIMPLE_SHEETS.quizzes}, row ${rowNumber}: Sequence ${sequence} is duplicated in this lesson.`
      );
    }
    seenQuizzes.add(path);

    const lesson = findLesson(
      state,
      worldId,
      levelId,
      lessonId,
      SIMPLE_SHEETS.quizzes,
      rowNumber
    );
    const existing = lesson.data.quizzes[quizId];
    const questionOrPrompt = text(row['Question / Prompt']);
    const correctAnswer = text(row['Correct Answer']);
    const wrongAnswer1 = text(row['Wrong Answer 1']);
    const wrongAnswer2 = text(row['Wrong Answer 2']);

    if (
      (quizType === 'text_multiple_choice' || quizType === 'audio_multiple_choice') &&
      !correctAnswer
    ) {
      throw new Error(
        `${SIMPLE_SHEETS.quizzes}, row ${rowNumber}: multiple-choice quizzes require a Correct Answer.`
      );
    }
    if (quizType === 'text_multiple_choice' && !questionOrPrompt) {
      throw new Error(
        `${SIMPLE_SHEETS.quizzes}, row ${rowNumber}: Question / Prompt is required for text multiple choice.`
      );
    }
    if (quizType === 'audio_typing' && !correctAnswer) {
      throw new Error(
        `${SIMPLE_SHEETS.quizzes}, row ${rowNumber}: Correct Answer is required for audio typing.`
      );
    }
    if (quizType === 'arabic_voice_record' && !questionOrPrompt) {
      throw new Error(
        `${SIMPLE_SHEETS.quizzes}, row ${rowNumber}: Question / Prompt is required for Arabic voice record.`
      );
    }

    const isMultipleChoice =
      quizType === 'text_multiple_choice' || quizType === 'audio_multiple_choice';
    const options: Record<string, { text: string }> = {};

    if (isMultipleChoice) {
      options.option_001 = { text: correctAnswer };
      if (wrongAnswer1) options.option_002 = { text: wrongAnswer1 };
      if (wrongAnswer2) options.option_003 = { text: wrongAnswer2 };
    }

    if (isMultipleChoice) quizOptions += Object.keys(options).length;

    lesson.data.quizzes[quizId] = {
      type: quizType,
      order: sequence - 1,
      questionText: quizType === 'text_multiple_choice' ? questionOrPrompt : '',
      questionAudioUrl: existing?.questionAudioUrl ?? '',
      correctOptionId: isMultipleChoice ? 'option_001' : '',
      correctAnswerText: quizType === 'audio_typing' ? correctAnswer : '',
      arabicPromptText: '',
      englishPromptText:
        quizType === 'arabic_voice_record' ? questionOrPrompt : '',
      options,
    };
  });

  return {
    state,
    worlds: worldsRows.length,
    levels: levelsRows.length,
    lessons: lessonsRows.length,
    learningCells,
    quizzes: quizzesRows.length,
    quizOptions,
  };
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

  if (workbook.SheetNames.includes(SIMPLE_SHEETS.learningItems)) {
    return importSimpleWorkbook(workbook, currentState);
  }

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
