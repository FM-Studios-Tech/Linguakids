import * as XLSX from 'xlsx';
import type { LessonData, LearningItem, Quiz, QuizType } from './types';

export const LESSON_SHEET_HEADERS = [
  'Content Type', 'Sequence', 'Row', 'Column', 'Language', 'Text / Question',
  'Quiz Type', 'Correct Answer', 'Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3',
] as const;

const QUIZ_TYPES = new Set<QuizType>([
  'text_multiple_choice', 'audio_multiple_choice', 'audio_typing',
  'text_typing', 'true_false', 'arabic_voice_record',
]);

export interface LessonExcelImport {
  data: LessonData;
  learningItems: number;
  learningCells: number;
  quizzes: number;
  warnings: string[];
}

/** Imports only one existing lesson's content. Never writes to Firebase. */
export function importLessonWorkbook(buffer: ArrayBuffer, currentData: LessonData): LessonExcelImport {
  const workbook = XLSX.read(buffer, { type: 'array' });
  if (workbook.SheetNames.length !== 1) {
    throw new Error('Use the single-sheet lesson sample. This import does not create worlds, levels, or lessons.');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true, blankrows: true });
  const string = (value: unknown) => value == null ? '' : String(value).trim();
  const headers = (matrix[0] ?? []).map(string);
  const missing = LESSON_SHEET_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}. Use the single-sheet lesson sample.`);
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) {
    throw new Error('Column headers must not be duplicated.');
  }
  const rows = matrix.slice(1).map((values, index) => ({
    number: index + 2,
    values: Object.fromEntries(headers.map((header, column) => [header, string(values[column])])),
  })).filter(({ values }) => Object.values(values).some(Boolean));
  if (!rows.length) throw new Error('The sheet contains no lesson content.');

  const data: LessonData = JSON.parse(JSON.stringify(currentData));
  data.learningItems ||= { name: '', description: '', gridSize: { rows: 3, columns: 1 }, items: {} };
  data.learningItems.items ||= {};
  data.quizzes ||= {};
  const warnings: string[] = [];
  const seenMetadata = new Set<string>();
  const seenCells = new Set<string>();
  const seenQuizzes = new Set<string>();
  const touchedItems = new Set<string>();
  let learningCells = 0;
  let quizzes = 0;
  const fail = (row: number, message: string): never => { throw new Error(`Row ${row}: ${message}`); };
  const integer = (value: string, row: number, label: string, max: number) => {
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < 1 || number > max) {
      return fail(row, `${label} must be a whole number from 1 to ${max}.`);
    }
    return number;
  };
  const shortId = (prefix: string, number: number) => `${prefix}_${String(number).padStart(3, '0')}`;

  // Resolve metadata first, regardless of where ChatGPT places those rows.
  for (const { number, values } of rows) {
    const kind = values['Content Type'].toLowerCase();
    if (!['learning name', 'learning description', 'grid size', 'learning cell', 'quiz'].includes(kind)) {
      fail(number, 'Content Type must be Learning Name, Learning Description, Grid Size, Learning Cell, or Quiz.');
    }
    if (kind === 'learning cell' || kind === 'quiz') continue;
    if (seenMetadata.has(kind)) fail(number, `Duplicate ${values['Content Type']} row.`);
    seenMetadata.add(kind);
    if (kind === 'learning name') data.learningItems.name = values['Text / Question'];
    if (kind === 'learning description') data.learningItems.description = values['Text / Question'];
    if (kind === 'grid size') {
      data.learningItems.gridSize = {
        rows: integer(values.Row, number, 'Row (grid rows)', 4),
        columns: integer(values.Column, number, 'Column (grid columns)', 2),
      };
    }
  }
  const grid = data.learningItems.gridSize;
  const hasLearningRows = rows.some(({ values }) => values['Content Type'].toLowerCase() === 'learning cell');
  if (hasLearningRows && (!grid || !Number.isInteger(grid.rows) || !Number.isInteger(grid.columns) ||
      grid.rows < 1 || grid.rows > 4 || grid.columns < 1 || grid.columns > 2)) {
    throw new Error('Add a Grid Size row with 1–4 rows and 1–2 columns before importing learning cells.');
  }

  for (const { number, values } of rows) {
    const kind = values['Content Type'].toLowerCase();
    if (kind !== 'learning cell' && kind !== 'quiz') continue;
    const sequence = integer(values.Sequence, number, 'Sequence', 999999);
    if (kind === 'learning cell') {
      const row = integer(values.Row, number, 'Row', grid.rows);
      const column = integer(values.Column, number, 'Column', grid.columns);
      const language = values.Language.toLowerCase();
      if (language !== 'english' && language !== 'arabic') fail(number, 'Language must be English or Arabic.');
      const itemId = shortId('item', sequence);
      const cellId = `cell_${row}_${column}`;
      const path = `${itemId}/${cellId}`;
      if (seenCells.has(path)) fail(number, 'This item Sequence and cell position are duplicated.');
      seenCells.add(path);
      // An empty text box intentionally removes this cell; it is not a blank word.
      const item: LearningItem = data.learningItems.items[itemId] ?? { cells: {} };
      item.cells ||= {};
      if (!values['Text / Question']) {
        delete item.cells[cellId];
      } else {
        item.cells[cellId] = {
          row, column, language: language as 'english' | 'arabic',
          text: values['Text / Question'], audioUrl: item.cells[cellId]?.audioUrl ?? '',
        };
        learningCells++;
      }
      data.learningItems.items[itemId] = item;
      touchedItems.add(itemId);
      continue;
    }

    const id = shortId('quiz', sequence);
    if (seenQuizzes.has(id)) fail(number, 'Quiz Sequence is duplicated.');
    seenQuizzes.add(id);
    const type = values['Quiz Type'].toLowerCase() as QuizType;
    if (!QUIZ_TYPES.has(type)) fail(number, `Unknown Quiz Type '${values['Quiz Type']}'.`);
    const prompt = values['Text / Question'];
    const answer = values['Correct Answer'];
    const existing = data.quizzes[id];
    const isChoice = type === 'text_multiple_choice' || type === 'audio_multiple_choice';
    const isTyping = type === 'audio_typing' || type === 'text_typing';
    if (['text_multiple_choice', 'text_typing', 'true_false', 'arabic_voice_record'].includes(type) && !prompt) {
      fail(number, 'Text / Question is required for this quiz type.');
    }
    if ((isChoice || isTyping) && !answer) fail(number, 'Correct Answer is required for this quiz type.');
    if (type === 'true_false' && !['true', 'false'].includes(answer.toLowerCase())) {
      fail(number, 'Correct Answer must be True or False.');
    }
    const quiz: Quiz = { type, order: sequence - 1 };
    if (['text_multiple_choice', 'text_typing', 'true_false'].includes(type)) quiz.questionText = prompt;
    if (type === 'audio_multiple_choice' || type === 'audio_typing') {
      quiz.questionAudioUrl = existing?.questionAudioUrl ?? '';
      if (!quiz.questionAudioUrl) warnings.push(`Quiz ${sequence}: upload question audio in the editor before using this quiz.`);
    }
    if (isTyping) quiz.correctAnswerText = answer;
    if (type === 'true_false') quiz.correctAnswerBoolean = answer.toLowerCase() === 'true';
    if (type === 'arabic_voice_record') quiz.englishPromptText = prompt;
    if (isChoice) {
      quiz.correctOptionId = 'option_001';
      quiz.options = { option_001: { text: answer } };
      let option = 2;
      for (const field of ['Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3']) {
        if (values[field]) quiz.options[shortId('option', option++)] = { text: values[field] };
      }
    }
    data.quizzes[id] = quiz;
    quizzes++;
  }

  // Never silently crop retained learning cells when a workbook changes grid size.
  for (const [itemId, item] of Object.entries(data.learningItems.items)) {
    for (const cell of Object.values(item.cells ?? {})) {
      if (cell.row > grid.rows || cell.column > grid.columns) {
        throw new Error(`${itemId} has a retained cell outside the new grid. Keep the current grid size or remove that cell in the editor first.`);
      }
    }
  }
  return { data, learningItems: touchedItems.size, learningCells, quizzes, warnings };
}
