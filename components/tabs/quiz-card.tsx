'use client';

import { useState } from 'react';
import {
  Trash2,
  Plus,
  AudioLines,
  HelpCircle,
  CheckCircle2,
  Keyboard,
  ListChecks,
  Headphones,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AudioUploader } from './audio-uploader';
import { generateId } from '@/lib/use-app-state';
import type { Quiz, QuizType, QuizOption } from '@/lib/types';

interface QuizCardProps {
  quizId: string;
  index: number;
  quiz: Quiz;
  onChange: (quizId: string, patch: Partial<Quiz>) => void;
  onRemove: (quizId: string) => void;
}

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  text_multiple_choice: 'Text Multiple Choice',
  audio_multiple_choice: 'Audio Multiple Choice',
  audio_typing: 'Audio Typing',
};

const QUIZ_TYPE_ICONS: Record<QuizType, React.ReactNode> = {
  text_multiple_choice: <ListChecks className="h-3.5 w-3.5" />,
  audio_multiple_choice: <Headphones className="h-3.5 w-3.5" />,
  audio_typing: <Keyboard className="h-3.5 w-3.5" />,
};

export function QuizCard({ quizId, index, quiz, onChange, onRemove }: QuizCardProps) {
  const [newOptionText, setNewOptionText] = useState('');

  const optionEntries = quiz.options
    ? Object.entries(quiz.options)
    : [];

  function addOption() {
    if (!newOptionText.trim()) return;
    const optId = generateId('opt');
    const newOptions = { ...(quiz.options || {}), [optId]: { text: newOptionText.trim() } };
    onChange(quizId, { options: newOptions });
    setNewOptionText('');
  }

  function updateOption(optId: string, text: string) {
    if (!quiz.options) return;
    const newOptions = { ...quiz.options, [optId]: { text } };
    onChange(quizId, { options: newOptions });
  }

  function removeOption(optId: string) {
    if (!quiz.options) return;
    const { [optId]: _, ...rest } = quiz.options;
    const newCorrect = quiz.correctOptionId === optId ? undefined : quiz.correctOptionId;
    onChange(quizId, { options: rest, correctOptionId: newCorrect });
  }

  function handleTypeChange(type: string) {
    const quizType = type as QuizType;
    const patch: Partial<Quiz> = { type: quizType };
    if (quizType === 'audio_typing') {
      patch.options = undefined;
      patch.correctOptionId = undefined;
      if (!quiz.correctAnswerText) patch.correctAnswerText = '';
    } else {
      patch.correctAnswerText = undefined;
      if (!quiz.options || Object.keys(quiz.options).length === 0) {
        const opt1 = generateId('opt');
        const opt2 = generateId('opt');
        patch.options = {
          [opt1]: { text: '' },
          [opt2]: { text: '' },
        };
        patch.correctOptionId = opt1;
      }
    }
    onChange(quizId, patch);
  }

  return (
    <Card className="bg-muted/30 border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {index + 1}
            </div>
            <span className="text-sm font-medium text-foreground">Quiz</span>
            <Badge variant="outline" className="font-mono text-xs">
              {quizId.slice(-6)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(quizId)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <Label className="text-xs flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Quiz Type
          </Label>
          <Select value={quiz.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(QUIZ_TYPE_LABELS) as QuizType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  <span className="flex items-center gap-2">
                    {QUIZ_TYPE_ICONS[type]}
                    {QUIZ_TYPE_LABELS[type]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {quiz.type === 'text_multiple_choice' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Question Text
              </Label>
              <Input
                value={quiz.questionText || ''}
                onChange={(e) => onChange(quizId, { questionText: e.target.value })}
                placeholder="Enter the question text..."
                className="bg-background"
                dir="auto"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                Options (select the correct one)
              </Label>
              <RadioGroup
                value={quiz.correctOptionId || ''}
                onValueChange={(val) => onChange(quizId, { correctOptionId: val })}
                className="gap-2"
              >
                {optionEntries.map(([optId, opt]) => (
                  <div key={optId} className="flex items-center gap-2">
                    <RadioGroupItem value={optId} id={`${quizId}-${optId}`} />
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(optId, e.target.value)}
                      placeholder="Option text..."
                      className="flex-1 bg-background h-9"
                    />
                    {quiz.correctOptionId === optId && (
                      <Badge className="bg-success text-success-foreground gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Correct
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optId)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Add new option..."
                  className="bg-background h-9"
                />
                <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
        )}

        {quiz.type === 'audio_multiple_choice' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <AudioLines className="h-3 w-3" />
                Question Audio
              </Label>
              <AudioUploader
                value={quiz.questionAudioUrl || ''}
                onChange={(url) => onChange(quizId, { questionAudioUrl: url })}
                label="Upload Question Audio"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                Options (select the correct one)
              </Label>
              <RadioGroup
                value={quiz.correctOptionId || ''}
                onValueChange={(val) => onChange(quizId, { correctOptionId: val })}
                className="gap-2"
              >
                {optionEntries.map(([optId, opt]) => (
                  <div key={optId} className="flex items-center gap-2">
                    <RadioGroupItem value={optId} id={`${quizId}-${optId}`} />
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(optId, e.target.value)}
                      placeholder="Option text..."
                      className="flex-1 bg-background h-9"
                    />
                    {quiz.correctOptionId === optId && (
                      <Badge className="bg-success text-success-foreground gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Correct
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optId)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder="Add new option..."
                  className="bg-background h-9"
                />
                <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
        )}

        {quiz.type === 'audio_typing' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <AudioLines className="h-3 w-3" />
                Question Audio
              </Label>
              <AudioUploader
                value={quiz.questionAudioUrl || ''}
                onChange={(url) => onChange(quizId, { questionAudioUrl: url })}
                label="Upload Question audio"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                Correct Answer Text
              </Label>
              <Input
                value={quiz.correctAnswerText || ''}
                onChange={(e) => onChange(quizId, { correctAnswerText: e.target.value })}
                placeholder="The correct typed answer..."
                className="bg-background"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function createEmptyQuiz(type: QuizType = 'text_multiple_choice'): Quiz {
  if (type === 'audio_typing') {
    return {
      type,
      questionAudioUrl: '',
      correctAnswerText: '',
    };
  }
  const opt1 = generateId('opt');
  const opt2 = generateId('opt');
  return {
    type,
    questionText: type === 'text_multiple_choice' ? '' : undefined,
    questionAudioUrl: type === 'audio_multiple_choice' ? '' : undefined,
    correctOptionId: opt1,
    options: {
      [opt1]: { text: '' },
      [opt2]: { text: '' },
    },
  };
}

export function newQuizId(): string {
  return generateId('quiz');
}
