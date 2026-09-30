'use client';

import { useState } from 'react';
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  Layers,
  BookOpen,
  Save,
  X,
} from 'lucide-react';
import { ImageUploader } from './image-uploader';
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
import type { World } from '@/lib/types';

interface WorldsTabProps {
  actions: AppActions;
  worlds: Record<string, World>;
}

export function WorldsTab({ actions, worlds }: WorldsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [formButtonImageUrl, setFormButtonImageUrl] = useState('');
  const [formBackgroundImageUrl, setFormBackgroundImageUrl] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const worldEntries = Object.entries(worlds).sort(
    ([, a], [, b]) => a.order - b.order
  );

  function openAdd() {
    setEditingId(null);
    setFormTitle('');
    setFormButtonImageUrl('');
    setFormBackgroundImageUrl('');
    setFormOrder(
      worldEntries.length > 0
        ? Math.max(...worldEntries.map(([, w]) => w.order)) + 1
        : 1
    );
    setDialogOpen(true);
  }

  function openEdit(id: string, world: World) {
    setEditingId(id);
    setFormTitle(world.title);
    setFormOrder(world.order);
    setFormButtonImageUrl(world.buttonImageUrl ?? '');
    setFormBackgroundImageUrl(world.backgroundImageUrl ?? '');
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formTitle.trim()) return;
    const world: World = {
      title: formTitle.trim(),
      order: formOrder,
      buttonImageUrl: formButtonImageUrl,
      backgroundImageUrl: formBackgroundImageUrl,
      levels: editingId ? worlds[editingId].levels : {},
    };
    if (editingId) {
      actions.updateWorld(editingId, {
        title: formTitle.trim(),
        order: formOrder,
        buttonImageUrl: formButtonImageUrl,
        backgroundImageUrl: formBackgroundImageUrl,
      });
    } else {
      actions.addWorld({ ...world, levels: {} });
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteId) {
      actions.deleteWorld(deleteId);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Worlds</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Top-level learning worlds. Each world contains levels and lessons.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add World
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            All Worlds
            <Badge variant="secondary" className="ml-1">
              {worldEntries.length}
            </Badge>
          </CardTitle>
          <CardDescription>Manage your learning worlds here.</CardDescription>
        </CardHeader>
        <CardContent>
          {worldEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No worlds yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Create your first learning world to get started.
              </p>
              <Button onClick={openAdd} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add World
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[100px] text-center">Levels</TableHead>
                  <TableHead className="w-[100px] text-center">Lessons</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worldEntries.map(([id, world]) => {
                  const levelCount = Object.keys(world.levels).length;
                  const lessonCount = Object.values(world.levels).reduce(
                    (sum, l) => sum + Object.keys(l.lessons).length,
                    0
                  );
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {world.order}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{world.title}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Layers className="h-3.5 w-3.5" />
                          {levelCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          {lessonCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(id, world)}
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="grid max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-4 sm:max-w-xl sm:gap-4 sm:p-6">
          <DialogHeader className="min-w-0 pr-8 text-left">
            <DialogTitle className="flex items-center gap-2 leading-snug">
              <Globe className="h-5 w-5 text-primary" />
              {editingId ? 'Edit World' : 'Add New World'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update this world and its images.'
                : 'Create a new learning world and upload its images.'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto px-1 py-2 scrollbar-thin">
            <div className="space-y-2">
              <Label htmlFor="world-title">World Title</Label>
              <Input
                id="world-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. World 3: Color Garden"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="world-order">Display Order</Label>
              <Input
                id="world-order"
                type="number"
                min={1}
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Button Image</Label>
              <ImageUploader
                value={formButtonImageUrl}
                onChange={setFormButtonImageUrl}
                label="Upload Button Image"
              />
            </div>
            <div className="space-y-2">
              <Label>Background Image</Label>
              <ImageUploader
                value={formBackgroundImageUrl}
                onChange={setFormBackgroundImageUrl}
                label="Upload Background Image"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t pt-3 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formTitle.trim()}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-1" />
              {editingId ? 'Save Changes' : 'Create World'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this world?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the world and all of its levels and
              lessons. This action cannot be undone.
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
