const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const XLSX = require('xlsx');
const root = path.resolve(__dirname, '..');
function load(file, extra = '', customRequire = require) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8') + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', output)(customRequire, mod, mod.exports);
  return mod.exports;
}
const { importLessonWorkbook, LESSON_SHEET_HEADERS } = load('lib/lesson-excel-import.ts');
const blankLesson = () => ({ learningItems: { name: '', description: '', gridSize: { rows: 3, columns: 1 }, items: {} }, quizzes: {} });
function workbook(rows, secondSheet = false) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([LESSON_SHEET_HEADERS, ...rows]), 'Lesson Content');
  if (secondSheet) XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['other']]), 'Worlds');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
}
const sample = fs.readFileSync(path.join(root, 'public/templates/lesson-content-sample.xlsx'));

test('downloadable single-sheet sample imports all six quiz types and Arabic metadata', () => {
  const book = XLSX.read(sample);
  assert.deepEqual(book.SheetNames, ['Lesson Content']);
  const original = blankLesson();
  const before = JSON.stringify(original);
  const result = importLessonWorkbook(sample, original);
  assert.equal(result.learningItems, 2);
  assert.equal(result.learningCells, 6);
  assert.equal(result.quizzes, 6);
  assert.equal(result.data.learningItems.name, 'الحروف والكلمات');
  assert.equal(result.data.quizzes.quiz_005.correctAnswerBoolean, false);
  assert.equal(result.data.quizzes.quiz_004.correctAnswerText, 'Book');
  assert.equal(result.data.quizzes.quiz_004.order, 3);
  assert.equal(Object.keys(result.data.quizzes.quiz_001.options).length, 4);
  assert.equal(result.warnings.length, 2, 'new audio quizzes need uploads');
  assert.equal(JSON.stringify(original), before, 'preview must not mutate lesson');
  assert.equal(result.data.worlds, undefined, 'lesson import must not create hierarchy');
});

test('matching cells retain audio and omitted custom cells and quizzes remain', () => {
  const data = blankLesson();
  data.learningItems.gridSize = { rows: 4, columns: 2 };
  data.learningItems.items.item_001 = { cells: {
    cell_1_1: { row: 1, column: 1, language: 'english', text: 'Old', audioUrl: 'https://media.invalid/a.mp3' },
    cell_4_2: { row: 4, column: 2, language: 'arabic', text: 'ب', audioUrl: '' },
  } };
  data.quizzes.quiz_009 = { type: 'audio_typing', correctAnswerText: 'Keep', questionAudioUrl: 'https://media.invalid/keep.mp3' };
  const result = importLessonWorkbook(workbook([['Learning Cell', 1, 1, 1, 'English', 'New']]), data);
  assert.equal(result.data.learningItems.items.item_001.cells.cell_1_1.audioUrl, 'https://media.invalid/a.mp3');
  assert.equal(result.data.learningItems.items.item_001.cells.cell_4_2.text, 'ب');
  assert.deepEqual(result.data.quizzes.quiz_009, data.quizzes.quiz_009);
});

test('matching audio question retains existing URL', () => {
  const data = blankLesson();
  data.quizzes.quiz_001 = { type: 'audio_typing', correctAnswerText: 'Old', questionAudioUrl: 'https://media.invalid/question.mp3' };
  const result = importLessonWorkbook(workbook([['Quiz', 1, '', '', '', '', 'audio_typing', 'New']]), data);
  assert.equal(result.data.quizzes.quiz_001.questionAudioUrl, 'https://media.invalid/question.mp3');
  assert.equal(result.warnings.length, 0);
});

test('blank learning text removes only its specified coordinate', () => {
  const data = importLessonWorkbook(sample, blankLesson()).data;
  const result = importLessonWorkbook(workbook([['Learning Cell', 1, 1, 1, 'English', '']]), data);
  assert.equal(result.data.learningItems.items.item_001.cells.cell_1_1, undefined);
  assert.equal(result.data.learningItems.items.item_001.cells.cell_2_1.text, 'Apple');
});

test('grid metadata is processed even when placed after learning rows', () => {
  const result = importLessonWorkbook(workbook([
    ['Learning Cell', 1, 4, 2, 'Arabic', 'كتاب'], ['Grid Size', '', 4, 2],
  ]), blankLesson());
  assert.equal(result.data.learningItems.items.item_001.cells.cell_4_2.text, 'كتاب');
});

test('coordinates must fit selected lesson grid and global limits', () => {
  assert.throws(() => importLessonWorkbook(workbook([['Learning Cell', 1, 4, 2, 'English', 'A']]), blankLesson()), /Row must be/);
  assert.throws(() => importLessonWorkbook(workbook([['Grid Size', '', 5, 2]]), blankLesson()), /grid rows/);
});

test('shrinking a grid cannot silently drop existing cells', () => {
  const data = importLessonWorkbook(sample, blankLesson()).data;
  assert.throws(() => importLessonWorkbook(workbook([['Grid Size', '', 1, 1]]), data), /retained cell outside/);
});

test('repeated quiz numbers and learning coordinates are rejected', () => {
  const quiz = ['Quiz', 1, '', '', '', 'An apple is a fruit.', 'true_false', 'True'];
  assert.throws(() => importLessonWorkbook(workbook([quiz, quiz]), blankLesson()), /Quiz Sequence is duplicated/);
  const cell = ['Learning Cell', 1, 1, 1, 'English', 'A'];
  assert.throws(() => importLessonWorkbook(workbook([cell, cell]), blankLesson()), /cell position are duplicated/);
});

test('invalid truth values and missing questions/answers produce errors', () => {
  assert.throws(() => importLessonWorkbook(workbook([['Quiz', 1, '', '', '', 'Statement', 'true_false', 'maybe']]), blankLesson()), /True or False/);
  assert.throws(() => importLessonWorkbook(workbook([['Quiz', 1, '', '', '', '', 'text_typing', 'Apple']]), blankLesson()), /Text \/ Question is required/);
  assert.throws(() => importLessonWorkbook(workbook([['Quiz', 1, '', '', '', 'Translate', 'text_typing', '']]), blankLesson()), /Correct Answer is required/);
});

test('whole-project workbooks are rejected in lesson-scoped import', () => {
  assert.throws(() => importLessonWorkbook(workbook([['Grid Size', '', 3, 1]], true), blankLesson()), /single-sheet lesson sample/);
});

test('wrong headers, content types and repeated metadata are rejected', () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['World ID']]), 'Lesson');
  assert.throws(() => importLessonWorkbook(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), blankLesson()), /Missing columns/);
  assert.throws(() => importLessonWorkbook(workbook([['World', 1]]), blankLesson()), /Content Type must be/);
  assert.throws(() => importLessonWorkbook(workbook([['Learning Name', '', '', '', '', 'A'], ['Learning Name', '', '', '', '', 'B']]), blankLesson()), /Duplicate Learning Name/);
});

test('Firebase-normalized lesson retains false answers and safely handles absent empty items', () => {
  const { reducer } = load('lib/use-app-state.ts', '\nexport { reducer };', (name) => name === './mock-data' ? { initialState: { worlds: {} } } : require(name));
  const data = blankLesson();
  data.learningItems.name = 'اسم الدرس';
  delete data.learningItems.items; // Firebase omits an empty object.
  data.quizzes.quiz_001 = { type: 'true_false', questionText: 'Statement', correctAnswerBoolean: false };
  const state = reducer({ worlds: {} }, { type: 'REPLACE_STATE', payload: { worlds: { world_001: { levels: { level_001: { lessons: { lesson_001: { data } } } } } } } });
  const normalized = state.worlds.world_001.levels.level_001.lessons.lesson_001.data;
  assert.deepEqual(normalized.learningItems.items, {});
  assert.equal(normalized.learningItems.name, 'اسم الدرس');
  assert.equal(normalized.quizzes.quiz_001.correctAnswerBoolean, false);
});
