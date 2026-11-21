const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/use-app-state.ts'), 'utf8');
const output = ts.transpileModule(source + '\nexport { reducer };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('require', 'module', 'exports', output)(
  name => name === './mock-data' ? { initialState: { worlds: {} } } : require(name),
  loaded, loaded.exports
);
const { reducer, levelOrderError } = loaded.exports;
const level = (order, lessons = {}) => ({ title: String(order), order, lessons });
const stateWith = levels => ({ worlds: {
  world_001: { title: 'World 1', order: 1, levels },
  world_002: { title: 'World 2', order: 2, levels: { level_010: level(10) } },
} });

test('deleting and recreating level 10 reuses level_010 despite a higher existing ID', () => {
  const original = stateWith({ level_010: level(10), level_011: level(11) });
  const removed = reducer(original, { type: 'DELETE_LEVEL', worldId: 'world_001', levelId: 'level_010' });
  const result = reducer(removed, { type: 'ADD_LEVEL', worldId: 'world_001', level: { ...level(10), title: 'Wrong title' } });
  assert.deepEqual(result.worlds.world_001.levels.level_010, level(10));
  assert.equal(result.worlds.world_001.levels.level_012, undefined);
  assert.strictEqual(result.worlds.world_001.levels.level_011, original.worlds.world_001.levels.level_011);
  assert.strictEqual(result.worlds.world_002, original.worlds.world_002);
});

test('editing display order moves the record and preserves every lesson and quiz', () => {
  const lessons = { lesson_001: { title: 'Lesson 1', data: { quizzes: { quiz_001: { type: 'true_false', correctAnswerBoolean: false } } } } };
  const original = stateWith({ level_011: level(1, lessons), level_002: level(2) });
  const serialized = JSON.stringify(original);
  const result = reducer(original, { type: 'UPDATE_LEVEL', worldId: 'world_001', levelId: 'level_011', level: { order: 10, title: 'Anything' } });
  assert.equal(result.worlds.world_001.levels.level_011, undefined);
  assert.equal(result.worlds.world_001.levels.level_010.title, '10');
  assert.equal(result.worlds.world_001.levels.level_010.order, 10);
  assert.strictEqual(result.worlds.world_001.levels.level_010.lessons, lessons);
  assert.strictEqual(result.worlds.world_001.levels.level_002, original.worlds.world_001.levels.level_002);
  assert.equal(JSON.stringify(original), serialized);
});

test('saving a legacy mismatched ID repairs it without changing its order', () => {
  const original = stateWith({ level_011: level(1) });
  const result = reducer(original, { type: 'UPDATE_LEVEL', worldId: 'world_001', levelId: 'level_011', level: { order: 1 } });
  assert.deepEqual(result.worlds.world_001.levels, { level_001: level(1) });
});

test('creation rejects an occupied ID or display order instead of overwriting data', () => {
  for (const levels of [{ level_010: level(9) }, { level_011: level(10) }]) {
    const original = stateWith(levels);
    assert.ok(levelOrderError(levels, 10));
    assert.strictEqual(reducer(original, { type: 'ADD_LEVEL', worldId: 'world_001', level: level(10) }), original);
  }
});

test('editing rejects collisions and keeps both records intact', () => {
  const original = stateWith({ level_001: level(1), level_010: level(10) });
  assert.strictEqual(reducer(original, { type: 'UPDATE_LEVEL', worldId: 'world_001', levelId: 'level_001', level: { order: 10 } }), original);
  assert.equal(levelOrderError(original.worlds.world_001.levels, 1, 'level_001'), null);
});

test('invalid display orders cannot create or rename levels', () => {
  for (const order of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const original = stateWith({ level_001: level(1) });
    assert.ok(levelOrderError({}, order));
    assert.strictEqual(reducer(original, { type: 'ADD_LEVEL', worldId: 'world_001', level: level(order) }), original);
    assert.strictEqual(reducer(original, { type: 'UPDATE_LEVEL', worldId: 'world_001', levelId: 'level_001', level: { order } }), original);
  }
});
