// Run with: node --test scripts/test-quiz-import.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/excel-import.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const importer = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, importer, importer.exports);
const { importTextWorkbook } = importer.exports;
const json = JSON.parse(fs.readFileSync(path.join(root, 'outputs/linguakids-short-ids/linguakids-firebase-short-ids.json'), 'utf8'));
const existingState = json.appState || json;
const lesson = (state) => state.worlds.world_001.levels.level_001.lessons.lesson_001;

function workbook(simple, type, question, answer, booleanColumn) {
  const name = simple
    ? 'outputs/linguakids-simple-template/linguakids-simple-import.xlsx'
    : 'outputs/linguakids-short-ids/linguakids-text-data-short-ids.xlsx';
  const book = XLSX.readFile(path.join(root, name));
  const matrix = XLSX.utils.sheet_to_json(book.Sheets.Quizzes, { header: 1, defval: '' });
  const row = simple
    ? { World: 'world_001', Level: 'level_001', Lesson: 'lesson_001', 'Quiz Type': type, Sequence: 901,
      'Question / Prompt': question, 'Correct Answer': answer }
    : { world_id: 'world_001', level_id: 'level_001', lesson_id: 'lesson_001', quiz_id: 'quiz_901',
      type, order: 900, question_text: question, correct_answer_text: answer };
  if (booleanColumn !== undefined) {
    matrix[0].push('correct_answer_boolean');
    row.correct_answer_boolean = booleanColumn;
  }
  matrix.push(matrix[0].map((header) => row[header] ?? ''));
  book.Sheets.Quizzes = XLSX.utils.aoa_to_sheet(matrix);
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
}

for (const simple of [true, false]) {
  const format = simple ? 'simplified' : 'detailed';
  test(`${format}: Arabic text prompt and English typed answer survive import`, async () => {
    const before = JSON.stringify(existingState);
    const result = await importTextWorkbook(workbook(simple, 'text_typing', 'اكتب كلمة تفاحة بالإنجليزية', 'Apple'), existingState);
    const quiz = lesson(result.state).data.quizzes.quiz_901;
    assert.equal(quiz.type, 'text_typing');
    assert.equal(quiz.questionText, 'اكتب كلمة تفاحة بالإنجليزية');
    assert.equal(quiz.correctAnswerText, 'Apple');
    assert.equal(quiz.correctAnswerBoolean, undefined);
    assert.equal(JSON.stringify(existingState), before, 'import must not mutate live state');
    const audioQuiz = Object.entries(lesson(existingState).data.quizzes).find(([, value]) => value.questionAudioUrl);
    assert.ok(audioQuiz, 'fixture must include existing quiz audio');
    assert.equal(lesson(result.state).data.quizzes[audioQuiz[0]].questionAudioUrl, audioQuiz[1].questionAudioUrl);
  });
  for (const answer of [true, false]) {
    test(`${format}: Excel boolean ${answer} is saved as a real boolean`, async () => {
      const result = await importTextWorkbook(workbook(simple, 'true_false', 'An apple is a fruit.', answer), existingState);
      const serialized = JSON.parse(JSON.stringify(lesson(result.state).data.quizzes.quiz_901));
      assert.equal(serialized.correctAnswerBoolean, answer);
      assert.equal(serialized.questionText, 'An apple is a fruit.');
      assert.equal(Object.keys(serialized.options || {}).length, 0);
    });
  }
  test(`${format}: missing text prompt is rejected`, async () => {
    await assert.rejects(importTextWorkbook(workbook(simple, 'text_typing', '', 'Apple'), existingState),
      /Question \/ Prompt is required|question_text is required/);
  });
  test(`${format}: missing typed answer is rejected`, async () => {
    await assert.rejects(importTextWorkbook(workbook(simple, 'text_typing', 'Translate apple.', ''), existingState),
      /Correct Answer is required|correct_answer_text is required/);
  });
  test(`${format}: missing true/false statement is rejected`, async () => {
    await assert.rejects(importTextWorkbook(workbook(simple, 'true_false', '', 'False'), existingState),
      /Question \/ Prompt is required|question_text is required/);
  });
  test(`${format}: false answer is case insensitive`, async () => {
    const result = await importTextWorkbook(workbook(simple, 'true_false', 'تفاحة تعني موزة', ' FaLsE '), existingState);
    assert.equal(lesson(result.state).data.quizzes.quiz_901.correctAnswerBoolean, false);
  });
  test(`${format}: invalid or empty boolean answer is rejected`, async () => {
    for (const answer of ['', 'maybe', '0']) {
      await assert.rejects(importTextWorkbook(workbook(simple, 'true_false', 'An apple is a fruit.', answer), existingState),
        /must be True or False/);
    }
  });
}

test('detailed: optional boolean column preserves false and takes priority over text', async () => {
  const result = await importTextWorkbook(workbook(false, 'true_false', 'An apple is blue.', 'True', false), existingState);
  assert.equal(lesson(result.state).data.quizzes.quiz_901.correctAnswerBoolean, false);
});

test('existing four workbooks remain accepted with their original quiz counts', async () => {
  const files = [
    'outputs/linguakids-existing-data/linguakids-existing-text-data.xlsx',
    'outputs/linguakids-short-ids/linguakids-text-data-short-ids.xlsx',
    'outputs/linguakids-simple-template/linguakids-simple-import.xlsx',
    'outputs/linguakids-simple-template/linguakids-google-sheets-import.xlsx',
  ];
  for (const file of files) {
    const result = await importTextWorkbook(fs.readFileSync(path.join(root, file)), { worlds: {} });
    assert.equal(result.quizzes, 108, file);
    assert.equal(result.quizOptions, 162, file);
  }
});
