'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LessonData } from '@/lib/types';
import type { LessonExcelImport } from '@/lib/lesson-excel-import';
import { QUIZ_TYPE_LABELS } from './quiz-card';

interface Props {
  lessonTitle: string;
  data: LessonData;
  onApply: (data: LessonData) => void;
}

export function LessonContentImport({ lessonTitle, data, onApply }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const latestData = useRef(data);
  latestData.current = data;
  const previewBase = useRef('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<LessonExcelImport | null>(null);
  const [error, setError] = useState('');

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const { importLessonWorkbook } = await import('@/lib/lesson-excel-import');
      previewBase.current = JSON.stringify(latestData.current);
      setPreview(importLessonWorkbook(buffer, latestData.current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import this lesson sheet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <input ref={input} type="file" accept=".xlsx,.xls" onChange={chooseFile} className="hidden" aria-label={`Excel file for ${lessonTitle}`} />
      <Button variant="outline" size="sm" disabled={loading} onClick={() => input.current?.click()} className="gap-1.5" aria-label={`Import Excel into ${lessonTitle}`}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {loading ? 'Reading...' : 'Import Excel'}
      </Button>
      <Dialog open={Boolean(preview) || Boolean(error)} onOpenChange={(open) => { if (!open) { setPreview(null); setError(''); } }}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1rem)] max-w-3xl flex-col overflow-hidden">
          <DialogHeader className="pr-6">
            <DialogTitle>{error ? 'Could not import lesson' : 'Review lesson import'}</DialogTitle>
            <DialogDescription>
              {lessonTitle}. Changes are applied locally first. Firebase updates only when you click Save to Firebase.
            </DialogDescription>
          </DialogHeader>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : preview && (
            <div className="min-h-0 space-y-4 overflow-y-auto pr-2 text-sm">
              <p className="rounded-md bg-muted p-3">
                {preview.learningItems} learning items, {preview.learningCells} filled cells, and {preview.quizzes} quizzes from the sheet.
                {' '}Matching item positions and quiz numbers update existing content. Omitted records remain.
              </p>
              {preview.warnings.map((warning) => <p key={warning} className="rounded-md border border-warning/40 bg-warning/10 p-2">{warning}</p>)}
              <div>
                <p className="font-medium">Learning name</p>
                <p dir="auto">{preview.data.learningItems.name || '(blank)'}</p>
                <p className="mt-2 font-medium">Learning description</p>
                <p dir="auto">{preview.data.learningItems.description || '(blank)'}</p>
                <p className="mt-2">Grid: {preview.data.learningItems.gridSize.rows} rows × {preview.data.learningItems.gridSize.columns} columns</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Learning items after import</p>
                {Object.entries(preview.data.learningItems.items).map(([id, item]) => (
                  <div key={id} className="rounded-md border p-3">
                    <p className="mb-1 font-medium">{id}</p>
                    {Object.entries(item.cells).sort(([, a], [, b]) => a.row - b.row || a.column - b.column).map(([cellId, cell]) => (
                      <div key={cellId} className="flex flex-wrap gap-2 py-1">
                        <span className="text-muted-foreground">Row {cell.row}, column {cell.column} · {cell.language}:</span>
                        <span dir="auto">{cell.text || '(blank)'}</span>
                        {cell.audioUrl && <span className="text-xs text-muted-foreground">Audio retained</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Quizzes after import</p>
                {Object.entries(preview.data.quizzes).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0)).map(([id, quiz]) => (
                  <div key={id} className="space-y-1 rounded-md border p-3">
                    <p className="font-medium">{id} · {QUIZ_TYPE_LABELS[quiz.type]}</p>
                    <p dir="auto">{quiz.questionText || quiz.englishPromptText || quiz.arabicPromptText || '(Audio question)'}</p>
                    <p>Correct answer: <span dir="auto">{
                      quiz.type === 'true_false'
                        ? quiz.correctAnswerBoolean === undefined ? '(not selected)' : quiz.correctAnswerBoolean ? 'True' : 'False'
                        : quiz.correctAnswerText || quiz.options?.[quiz.correctOptionId ?? '']?.text || '(recording)'
                    }</span></p>
                    {quiz.options && <p className="text-muted-foreground">Options: {Object.values(quiz.options).map((option) => option.text).join(' · ')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 border-t pt-3 sm:space-x-0">
            <Button variant="outline" onClick={() => { setPreview(null); setError(''); }}>{error ? 'Close' : 'Cancel'}</Button>
            {preview && !error && <Button onClick={() => {
              if (JSON.stringify(data) !== previewBase.current) {
                setError('This lesson changed while the preview was open. Close and import again to review the latest content.');
                return;
              }
              onApply(preview.data);
              setPreview(null);
            }}>Apply Locally</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
