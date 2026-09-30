'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  FileText,
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
import type { World, Lesson } from '@/lib/types';

interface LessonsTabProps {
  actions: AppActions;
  worlds: Record<string, World>;
}

export function LessonsTab({ actions, worlds }: LessonsTabProps) {
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const worldEntries = Object.entries(worlds).sort(([, a], [, b]) => a.order - b.order);
  const selectedWorld = selectedWorldId ? worlds[selectedWorldId] : null;
  const selectedLevel =
    selectedWorld && selectedLevelId ? selectedWorld.levels[selectedLevelId] : null;

  const lessonEntries = useMemo(() => {
    if (!selectedLevel) return [];
    return Object.entries(selectedLevel.lessons).sort(
      ([, a], [, b]) => a.order - b.order
    );
  }, [selectedLevel]);

  function handleWorldChange(id: string) {
    setSelectedWorldId(id);
    setSelectedLevelId('');
  }

  function openAdd() {
    setEditingId(null);
    setFormTitle('');
    setFormOrder(
      lessonEntries.length > 0
        ? Math.max(...lessonEntries.map(([, l]) => l.order)) + 1
        : 1
    );
    setDialogOpen(true);
  }

  function openEdit(id: string, lesson: Lesson) {
    setEditingId(id);
    setFormTitle(lesson.title);
    setFormOrder(lesson.order);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formTitle.trim() || !selectedWorldId || !selectedLevelId) return;
    if (editingId) {
      actions.updateLesson(selectedWorldId, selectedLevelId, editingId, {
        title: formTitle.trim(),
        order: formOrder,
      });
    } else {
      actions.addLesson(selectedWorldId, selectedLevelId, {
        title: formTitle.trim(),
        order: formOrder,
        data: {
          learningItems: {
            name: '',
            description: '',
            gridSize: { rows: 0, columns: 0 },
            items: {},
          },
          quizzes: {},
        },
      });
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteId && selectedWorldId && selectedLevelId) {
      actions.deleteLesson(selectedWorldId, selectedLevelId, deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Lessons</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a world and level, then manage the lessons within them.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Cascading Selection
          </CardTitle>
          <CardDescription>
            Pick a world, then a level to view its lessons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select World</Label>
              <Select value={selectedWorldId} onValueChange={handleWorldChange}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Select Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={setSelectedLevelId}
                disabled={!selectedWorld}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a level..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedWorld &&
                    Object.entries(selectedWorld.levels)
                      .sort(([, a], [, b]) => a.order - b.order)
                      .map(([id, level]) => (
                        <SelectItem key={id} value={id}>
                          {level.title}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLevel && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  Lessons in {selectedLevel.title}
                  <Badge variant="secondary" className="ml-1">
                    {lessonEntries.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage lessons for this level.
                </CardDescription>
              </div>
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Lesson
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessonEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No lessons yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Add a lesson to start adding learning content.
                </p>
                <Button onClick={openAdd} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Lesson
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Order</TableHead>
                    <TableHead>Lesson Title</TableHead>
                    <TableHead className="w-[100px] text-center">Items</TableHead>
                    <TableHead className="w-[100px] text-center">Quizzes</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonEntries.map(([id, lesson]) => (
                    <TableRow key={id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {lesson.order}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          {Object.keys(lesson.data.learningItems.items).length}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          {Object.keys(lesson.data.quizzes).length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(id, lesson)}
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

      {!selectedLevel && worldEntries.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ChevronDown className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Select a world and level
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the dropdowns above to view lessons.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editingId ? 'Edit Lesson' : 'Add New Lesson'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the title and order of this lesson.'
                : `Create a new lesson in ${selectedLevel?.title}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Lesson 3: Letter D"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-order">Display Order</Label>
              <Input
                id="lesson-order"
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
              {editingId ? 'Save Changes' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lesson and all of its learning
              items and quizzes. This action cannot be undone.
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
