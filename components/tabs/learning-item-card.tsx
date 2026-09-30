'use client';

import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  GridSize,
  LearningGridCell as LearningGridCellData,
  LearningItem,
} from '@/lib/types';
import { generateId } from '@/lib/use-app-state';
import { LearningGridCell } from './learning-grid-cell';

interface LearningItemCardProps {
  itemId: string;
  index: number;
  item: LearningItem;
  gridSize: GridSize;
  onCellChange: (
    itemId: string,
    cellId: string,
    cell: LearningGridCellData
  ) => void;
  onRemove: (itemId: string) => void;
}

export function LearningItemCard({
  itemId,
  index,
  item,
  gridSize,
  onCellChange,
  onRemove,
}: LearningItemCardProps) {
  const cellEntries = Object.entries(item.cells).sort(
    ([, a], [, b]) => a.row - b.row || a.column - b.column
  );

  return (
    <Card className="bg-muted/30 border-border/60">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <span className="text-sm font-medium text-foreground">Learning Item</span>
            <Badge variant="outline" className="truncate font-mono text-xs">
              {itemId.slice(-8)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(itemId)}
            className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove learning item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${gridSize.columns}, minmax(260px, 1fr))`,
              minWidth: `max(100%, ${gridSize.columns * 280}px)`,
            }}
          >
            {cellEntries.map(([cellId, cell]) => (
              <LearningGridCell
                key={cellId}
                cellId={cellId}
                cell={cell}
                onChange={(changedCellId, changedCell) =>
                  onCellChange(itemId, changedCellId, changedCell)
                }
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function createEmptyLearningItem(rows: number, columns: number): LearningItem {
  const cells: Record<string, LearningGridCellData> = {};

  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const cellId = `cell_${row}_${column}`;
      cells[cellId] = {
        row,
        column,
        language: 'english',
        text: '',
        audioUrl: '',
      };
    }
  }

  return { cells };
}

export function newLearningItemId(): string {
  return generateId('item');
}
