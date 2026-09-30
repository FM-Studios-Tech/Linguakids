'use client';

import { Languages, Type, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LearningGridCell as LearningGridCellData } from '@/lib/types';
import { AudioUploader } from './audio-uploader';

interface LearningGridCellProps {
  cellId: string;
  cell: LearningGridCellData;
  onChange: (cellId: string, cell: LearningGridCellData) => void;
}

export function LearningGridCell({ cellId, cell, onChange }: LearningGridCellProps) {
  const isArabic = cell.language === 'arabic';

  return (
    <Card className="min-w-0 bg-muted/20">
      <CardHeader className="space-y-0 p-3 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          Row {cell.row}, Column {cell.column}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Languages className="h-3 w-3" />
            Language
          </Label>
          <Select
            value={cell.language}
            onValueChange={(language: 'english' | 'arabic') =>
              onChange(cellId, { ...cell, language })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Type className="h-3 w-3" />
            Word or Letter
          </Label>
          <Input
            value={cell.text}
            onChange={(event) =>
              onChange(cellId, { ...cell, text: event.target.value })
            }
            placeholder={isArabic ? 'اكتب كلمة أو حرفًا' : 'Enter a word or letter'}
            dir={isArabic ? 'rtl' : 'ltr'}
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs">
            <Volume2 className="h-3 w-3" />
            Audio (optional)
          </Label>
          <AudioUploader
            value={cell.audioUrl}
            onChange={(audioUrl) => onChange(cellId, { ...cell, audioUrl })}
            label="Upload Audio"
          />
        </div>
      </CardContent>
    </Card>
  );
}
