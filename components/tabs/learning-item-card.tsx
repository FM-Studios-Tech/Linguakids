'use client';

import { Trash2, Type, Languages, AudioLines, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AudioUploader } from './audio-uploader';
import { generateId } from '@/lib/use-app-state';
import type { LearningItem } from '@/lib/types';

interface LearningItemCardProps {
  itemId: string;
  index: number;
  item: LearningItem;
  onChange: (itemId: string, patch: Partial<LearningItem>) => void;
  onRemove: (itemId: string) => void;
}

export function LearningItemCard({
  itemId,
  index,
  item,
  onChange,
  onRemove,
}: LearningItemCardProps) {
  return (
    <Card className="bg-muted/30 border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {index + 1}
            </div>
            <span className="text-sm font-medium text-foreground">
              Learning Item
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              {itemId.slice(-6)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(itemId)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Type className="h-3 w-3" />
              English Letter
            </Label>
            <Input
              value={item.englishLetter}
              onChange={(e) => onChange(itemId, { englishLetter: e.target.value })}
              placeholder="A"
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Type className="h-3 w-3" />
              English Word
            </Label>
            <Input
              value={item.englishWord}
              onChange={(e) => onChange(itemId, { englishWord: e.target.value })}
              placeholder="Apple"
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Languages className="h-3 w-3" />
              Arabic Word
            </Label>
            <Input
              value={item.arabicWord}
              onChange={(e) => onChange(itemId, { arabicWord: e.target.value })}
              placeholder="تُفَّاح"
              className="bg-background"
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <AudioLines className="h-3 w-3" />
              Letter Audio
            </Label>
            <AudioUploader
              value={item.audioUrlLetter}
              onChange={(url) => onChange(itemId, { audioUrlLetter: url })}
              label="Upload Letter Audio"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Word Audio
            </Label>
            <AudioUploader
              value={item.audioUrlWord}
              onChange={(url) => onChange(itemId, { audioUrlWord: url })}
              label="Upload Word Audio"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function createEmptyLearningItem(): LearningItem {
  return {
    englishLetter: '',
    englishWord: '',
    arabicWord: '',
    audioUrlLetter: '',
    audioUrlWord: '',
  };
}

export function newLearningItemId(): string {
  return generateId('item');
}
