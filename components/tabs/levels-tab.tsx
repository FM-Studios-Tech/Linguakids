'use client';

import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AppActions } from '@/lib/use-app-state';
import type { World, Level } from '@/lib/types';

interface LevelsTabProps {
  actions: AppActions;
  worlds: Record<string, World>;
}

export function LevelsTab({ actions, worlds }: LevelsTabProps) {
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const worldEntries = Object.entries(worlds).sort(([, a], [, b]) => a.order - b.order);

  const selectedWorld = selectedWorldId ? worlds[selectedWorldId] : null;

  const levelEntries = useMemo(() => {
    if (!selectedWorld) return [];
    return Object.entries(selectedWorld.levels).sort(
      ([, a], [, b]) => a.order - b.order
    );
  }, [selectedWorld]);

  function openAdd() {
    setEditingId(null);
    setFormTitle('');
    setFormOrder(
      levelEntries.length > 0
        ? Math.max(...levelEntries.map(([, l]) => l.order)) + 1
        : 1
    );
    setDialogOpen(true);
  }

  function openEdit(id: string, level: Level) {
    setEditingId(id);
    setFormTitle(level.title);
    setFormOrder(level.order);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formTitle.trim() || !selectedWorldId) return;
    if (editingId) {
      actions.updateLevel(selectedWorldId, editingId, {
        title: formTitle.trim(),
        order: formOrder,
      });
    } else {
      actions.addLevel(selectedWorldId, {
        title: formTitle.trim(),
        order: formOrder,
        lessons: {},
      });
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteId && selectedWorldId) {
      actions.deleteLevel(selectedWorldId, deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Levels</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a world, then manage the levels within it.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Select World
          </CardTitle>
          <CardDescription>
            Choose a world to view and manage its levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedWorldId} onValueChange={setSelectedWorldId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a world..." />
            </SelectTrigger>
            <SelectContent>
              {worldEntries.map(([id, world]) => (
                <SelectItem key={id} value={id}>
                  {world.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedWorld && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  Levels in {selectedWorld.title}
                  <Badge variant="secondary" className="ml-1">
                    {levelEntries.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage levels for this world.
                </CardDescription>
              </div>
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Level
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {levelEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No levels yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Add a level to start organizing lessons.
                </p>
                <Button onClick={openAdd} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Level
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Order</TableHead>
                    <TableHead>Level Title</TableHead>
                    <TableHead className="w-[100px] text-center">Lessons</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levelEntries.map(([id, level]) => (
                    <TableRow key={id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {level.order}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{level.title}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          {Object.keys(level.lessons).length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(id, level)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedWorld && worldEntries.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Select a world above
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a world to view and manage its levels.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {editingId ? 'Edit Level' : 'Add New Level'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the title and order of this level.'
                : `Create a new level in ${selectedWorld?.title}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="level-title">Level Title</Label>
              <Input
                id="level-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Level 3: Vowel Sounds"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-order">Display Order</Label>
              <Input
                id="level-order"
                type="number"
                min={1}
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formTitle.trim()}>
              <Save className="h-4 w-4 mr-1" />
              {editingId ? 'Save Changes' : 'Create Level'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this level?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the level and all of its lessons.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
