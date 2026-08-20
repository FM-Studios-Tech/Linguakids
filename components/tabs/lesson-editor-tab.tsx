// 'use client';

// import { useState, useMemo } from 'react';
// import {
//   BookOpen,
//   Plus,
//   ChevronDown,
//   FileText,
//   HelpCircle,
//   AudioLines,
//   Layers,
//   Globe,
//   Sparkles,
// } from 'lucide-react';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
// import type { AppActions } from '@/lib/use-app-state';
// import type { World, Lesson, LearningItem, Quiz, QuizType } from '@/lib/types';
// import {
//   LearningItemCard,
//   createEmptyLearningItem,
//   newLearningItemId,
// } from './learning-item-card';
// import {
//   QuizCard,
//   createEmptyQuiz,
//   newQuizId,
// } from './quiz-card';

// interface LessonEditorTabProps {
//   actions: AppActions;
//   worlds: Record<string, World>;
// }

// export function LessonEditorTab({ actions, worlds }: LessonEditorTabProps) {
//   const [selectedWorldId, setSelectedWorldId] = useState<string>('');
//   const [selectedLevelId, setSelectedLevelId] = useState<string>('');
//   const [selectedLessonId, setSelectedLessonId] = useState<string>('');

//   const worldEntries = Object.entries(worlds).sort(([, a], [, b]) => a.order - b.order);
//   const selectedWorld = selectedWorldId ? worlds[selectedWorldId] : null;
//   const selectedLevel =
//     selectedWorld && selectedLevelId ? selectedWorld.levels[selectedLevelId] : null;
//   const selectedLesson =
//     selectedLevel && selectedLessonId
//       ? selectedLevel.lessons[selectedLessonId]
//       : null;

//   const lessonData = selectedLesson?.data;

//   const learningItemEntries = useMemo(() => {
//     if (!lessonData) return [];
//     return Object.entries(lessonData.learningItems);
//   }, [lessonData]);

//   const quizEntries = useMemo(() => {
//     if (!lessonData) return [];
//     return Object.entries(lessonData.quizzes);
//   }, [lessonData]);

//   function handleWorldChange(id: string) {
//     setSelectedWorldId(id);
//     setSelectedLevelId('');
//     setSelectedLessonId('');
//   }

//   function handleLevelChange(id: string) {
//     setSelectedLevelId(id);
//     setSelectedLessonId('');
//   }

//   function updateLearningItem(itemId: string, patch: Partial<LearningItem>) {
//     if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
//     const newItem: LearningItem = { ...lessonData.learningItems[itemId], ...patch };
//     const newItems = { ...lessonData.learningItems, [itemId]: newItem };
//     actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
//       ...lessonData,
//       learningItems: newItems,
//     });
//   }

//   function addLearningItem() {
//     if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
//     const id = newLearningItemId();
//     const item = createEmptyLearningItem();
//     const newItems = { ...lessonData.learningItems, [id]: item };
//     actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
//       ...lessonData,
//       learningItems: newItems,
//     });
//   }

//   function removeLearningItem(itemId: string) {
//     if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
//     const { [itemId]: _, ...rest } = lessonData.learningItems;
//     actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
//       ...lessonData,
//       learningItems: rest,
//     });
//   }

//   function updateQuiz(quizId: string, patch: Partial<Quiz>) {
//     if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
//     const newQuiz: Quiz = { ...lessonData.quizzes[quizId], ...patch };
//     const newQuizzes = { ...lessonData.quizzes, [quizId]: newQuiz };
//     actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
//       ...lessonData,
//       quizzes: newQuizzes,
//     });
//   }

//   function addQuiz(type: QuizType = 'text_multiple_choice') {
//     if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
//     const id = newQuizId();
//     const quiz = createEmptyQuiz(type);
//     const newQuizzes = { ...lessonData.quizzes, [id]: quiz };
//     actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
//       ...lessonData,
//       quizzes: newQuizzes,
//     });
//   }

//   function removeQuiz(quizId: string) {
//     if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
//     const { [quizId]: _, ...rest } = lessonData.quizzes;
//     actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
//       ...lessonData,
//       quizzes: rest,
//     });
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-xl font-semibold text-foreground">Lesson Editor</h2>
//         <p className="text-sm text-muted-foreground mt-1">
//           Select a world, level, and lesson to edit its learning items and quizzes.
//         </p>
//       </div>

//       <Card>
//         <CardHeader className="pb-4">
//           <CardTitle className="text-base font-medium flex items-center gap-2">
//             <BookOpen className="h-5 w-5 text-primary" />
//             Select Lesson to Edit
//           </CardTitle>
//           <CardDescription>
//             Cascading selection: world, level, then lesson.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <Label className="flex items-center gap-1.5">
//                 <Globe className="h-3.5 w-3.5 text-muted-foreground" />
//                 Select World
//               </Label>
//               <Select value={selectedWorldId} onValueChange={handleWorldChange}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Choose world..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {worldEntries.map(([id, world]) => (
//                     <SelectItem key={id} value={id}>
//                       {world.title}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label className="flex items-center gap-1.5">
//                 <Layers className="h-3.5 w-3.5 text-muted-foreground" />
//                 Select Level
//               </Label>
//               <Select
//                 value={selectedLevelId}
//                 onValueChange={handleLevelChange}
//                 disabled={!selectedWorld}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Choose level..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {selectedWorld &&
//                     Object.entries(selectedWorld.levels)
//                       .sort(([, a], [, b]) => a.order - b.order)
//                       .map(([id, level]) => (
//                         <SelectItem key={id} value={id}>
//                           {level.title}
//                         </SelectItem>
//                       ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label className="flex items-center gap-1.5">
//                 <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
//                 Select Lesson
//               </Label>
//               <Select
//                 value={selectedLessonId}
//                 onValueChange={setSelectedLessonId}
//                 disabled={!selectedLevel}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Choose lesson..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {selectedLevel &&
//                     Object.entries(selectedLevel.lessons)
//                       .sort(([, a], [, b]) => a.order - b.order)
//                       .map(([id, lesson]) => (
//                         <SelectItem key={id} value={id}>
//                           {lesson.title}
//                         </SelectItem>
//                       ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {selectedLesson && lessonData ? (
//         <div className="space-y-6">
//           <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
//             <Sparkles className="h-4 w-4 text-primary shrink-0" />
//             <span className="text-sm text-foreground">
//               Editing <strong className="font-semibold">{selectedLesson.title}</strong>
//               {' '}— changes save instantly to state.
//             </span>
//           </div>

//           <Accordion type="multiple" defaultValue={['items', 'quizzes']}>
//             <AccordionItem value="items" className="rounded-lg border bg-card px-4 mb-4">
//               <AccordionTrigger className="hover:no-underline">
//                 <div className="flex items-center gap-2 pr-4">
//                   <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
//                     <FileText className="h-4.5 w-4.5" />
//                   </div>
//                   <div className="text-left">
//                     <div className="font-semibold text-foreground">
//                       Learning Items
//                     </div>
//                     <div className="text-xs text-muted-foreground font-normal">
//                       {learningItemEntries.length} item{learningItemEntries.length !== 1 ? 's' : ''}
//                     </div>
//                   </div>
//                   <Badge variant="secondary" className="ml-2">
//                     {learningItemEntries.length}
//                   </Badge>
//                 </div>
//               </AccordionTrigger>
//               <AccordionContent>
//                 <div className="space-y-4 pt-2">
//                   {learningItemEntries.length === 0 && (
//                     <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg bg-muted/30 border border-dashed">
//                       <FileText className="h-8 w-8 text-muted-foreground mb-3" />
//                       <p className="text-sm font-medium text-foreground">
//                         No learning items yet
//                       </p>
//                       <p className="text-sm text-muted-foreground mt-1 mb-4">
//                         Add a learning item with letter, word, and audio.
//                       </p>
//                     </div>
//                   )}
//                   {learningItemEntries.map(([itemId, item], index) => (
//                     <LearningItemCard
//                       key={itemId}
//                       itemId={itemId}
//                       index={index}
//                       item={item}
//                       onChange={updateLearningItem}
//                       onRemove={removeLearningItem}
//                     />
//                   ))}
//                   <Button
//                     variant="outline"
//                     onClick={addLearningItem}
//                     className="w-full gap-2 border-dashed"
//                   >
//                     <Plus className="h-4 w-4" />
//                     Add Learning Item
//                   </Button>
//                 </div>
//               </AccordionContent>
//             </AccordionItem>

//             <AccordionItem value="quizzes" className="rounded-lg border bg-card px-4">
//               <AccordionTrigger className="hover:no-underline">
//                 <div className="flex items-center gap-2 pr-4">
//                   <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
//                     <HelpCircle className="h-4.5 w-4.5" />
//                   </div>
//                   <div className="text-left">
//                     <div className="font-semibold text-foreground">
//                       Quizzes
//                     </div>
//                     <div className="text-xs text-muted-foreground font-normal">
//                       {quizEntries.length} quiz{quizEntries.length !== 1 ? 'zes' : ''}
//                     </div>
//                   </div>
//                   <Badge variant="secondary" className="ml-2">
//                     {quizEntries.length}
//                   </Badge>
//                 </div>
//               </AccordionTrigger>
//               <AccordionContent>
//                 <div className="space-y-4 pt-2">
//                   {quizEntries.length === 0 && (
//                     <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg bg-muted/30 border border-dashed">
//                       <HelpCircle className="h-8 w-8 text-muted-foreground mb-3" />
//                       <p className="text-sm font-medium text-foreground">
//                         No quizzes yet
//                       </p>
//                       <p className="text-sm text-muted-foreground mt-1 mb-4">
//                         Add a quiz to test learners on this lesson.
//                       </p>
//                     </div>
//                   )}
//                   {quizEntries.map(([quizId, quiz], index) => (
//                     <QuizCard
//                       key={quizId}
//                       quizId={quizId}
//                       index={index}
//                       quiz={quiz}
//                       onChange={updateQuiz}
//                       onRemove={removeQuiz}
//                     />
//                   ))}

//                   <Separator className="my-2" />

//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//                     <Button
//                       variant="outline"
//                       onClick={() => addQuiz('text_multiple_choice')}
//                       className="gap-2 border-dashed"
//                     >
//                       <Plus className="h-4 w-4" />
//                       Text Choice Quiz
//                     </Button>
//                     <Button
//                       variant="outline"
//                       onClick={() => addQuiz('audio_multiple_choice')}
//                       className="gap-2 border-dashed"
//                     >
//                       <AudioLines className="h-4 w-4" />
//                       Audio Choice Quiz
//                     </Button>
//                     <Button
//                       variant="outline"
//                       onClick={() => addQuiz('audio_typing')}
//                       className="gap-2 border-dashed"
//                     >
//                       <Plus className="h-4 w-4" />
//                       Audio Typing Quiz
//                     </Button>
//                   </div>
//                 </div>
//               </AccordionContent>
//             </AccordionItem>
//           </Accordion>
//         </div>
//       ) : (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-20 text-center">
//             <div className="rounded-full bg-muted p-5 mb-4">
//               <ChevronDown className="h-10 w-10 text-muted-foreground" />
//             </div>
//             <p className="text-base font-medium text-foreground">
//               Select a lesson to edit
//             </p>
//             <p className="text-sm text-muted-foreground mt-1 max-w-md">
//               Use the cascading dropdowns above to choose a world, level, and
//               lesson. Then you can edit learning items and quizzes.
//             </p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  ChevronDown,
  FileText,
  HelpCircle,
  AudioLines,
  Layers,
  Globe,
  Sparkles,
  Mic,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { AppActions } from '@/lib/use-app-state';
import type { World, Lesson, LearningItem, Quiz, QuizType } from '@/lib/types';
import {
  LearningItemCard,
  createEmptyLearningItem,
  newLearningItemId,
} from './learning-item-card';
import {
  QuizCard,
  createEmptyQuiz,
  newQuizId,
} from './quiz-card';

interface LessonEditorTabProps {
  actions: AppActions;
  worlds: Record<string, World>;
}

export function LessonEditorTab({ actions, worlds }: LessonEditorTabProps) {
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  const worldEntries = Object.entries(worlds).sort(([, a], [, b]) => a.order - b.order);
  const selectedWorld = selectedWorldId ? worlds[selectedWorldId] : null;
  const selectedLevel =
    selectedWorld && selectedLevelId ? selectedWorld.levels[selectedLevelId] : null;
  const selectedLesson =
    selectedLevel && selectedLessonId
      ? selectedLevel.lessons[selectedLessonId]
      : null;

  const lessonData = selectedLesson?.data;

  const learningItemEntries = useMemo(() => {
    if (!lessonData) return [];
    return Object.entries(lessonData.learningItems);
  }, [lessonData]);

  const quizEntries = useMemo(() => {
    if (!lessonData) return [];
    return Object.entries(lessonData.quizzes);
  }, [lessonData]);

  function handleWorldChange(id: string) {
    setSelectedWorldId(id);
    setSelectedLevelId('');
    setSelectedLessonId('');
  }

  function handleLevelChange(id: string) {
    setSelectedLevelId(id);
    setSelectedLessonId('');
  }

  function updateLearningItem(itemId: string, patch: Partial<LearningItem>) {
    if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
    const newItem: LearningItem = { ...lessonData.learningItems[itemId], ...patch };
    const newItems = { ...lessonData.learningItems, [itemId]: newItem };
    actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
      ...lessonData,
      learningItems: newItems,
    });
  }

  function addLearningItem() {
    if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
    const id = newLearningItemId();
    const item = createEmptyLearningItem();
    const newItems = { ...lessonData.learningItems, [id]: item };
    actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
      ...lessonData,
      learningItems: newItems,
    });
  }

  function removeLearningItem(itemId: string) {
    if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
    const { [itemId]: _, ...rest } = lessonData.learningItems;
    actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
      ...lessonData,
      learningItems: rest,
    });
  }

  function updateQuiz(quizId: string, patch: Partial<Quiz>) {
    if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
    const newQuiz: Quiz = { ...lessonData.quizzes[quizId], ...patch };
    const newQuizzes = { ...lessonData.quizzes, [quizId]: newQuiz };
    actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
      ...lessonData,
      quizzes: newQuizzes,
    });
  }

  function addQuiz(type: QuizType = 'text_multiple_choice') {
    if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
    const id = newQuizId();
    const quiz = createEmptyQuiz(type);
    const newQuizzes = { ...lessonData.quizzes, [id]: quiz };
    actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
      ...lessonData,
      quizzes: newQuizzes,
    });
  }

  function removeQuiz(quizId: string) {
    if (!lessonData || !selectedWorldId || !selectedLevelId || !selectedLessonId) return;
    const { [quizId]: _, ...rest } = lessonData.quizzes;
    actions.updateLessonData(selectedWorldId, selectedLevelId, selectedLessonId, {
      ...lessonData,
      quizzes: rest,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Lesson Editor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a world, level, and lesson to edit its learning items and quizzes.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Select Lesson to Edit
          </CardTitle>
          <CardDescription>
            Cascading selection: world, level, then lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Select World
              </Label>
              <Select value={selectedWorldId} onValueChange={handleWorldChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose world..." />
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
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Select Level
              </Label>
              <Select
                value={selectedLevelId}
                onValueChange={handleLevelChange}
                disabled={!selectedWorld}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose level..." />
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
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Select Lesson
              </Label>
              <Select
                value={selectedLessonId}
                onValueChange={setSelectedLessonId}
                disabled={!selectedLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose lesson..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedLevel &&
                    Object.entries(selectedLevel.lessons)
                      .sort(([, a], [, b]) => a.order - b.order)
                      .map(([id, lesson]) => (
                        <SelectItem key={id} value={id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLesson && lessonData ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">
              Editing <strong className="font-semibold">{selectedLesson.title}</strong>
              {' '}— changes save instantly to state.
            </span>
          </div>

          <Accordion type="multiple" defaultValue={['items', 'quizzes']}>
            <AccordionItem value="items" className="rounded-lg border bg-card px-4 mb-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 pr-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      Learning Items
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {learningItemEntries.length} item{learningItemEntries.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {learningItemEntries.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {learningItemEntries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg bg-muted/30 border border-dashed">
                      <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground">
                        No learning items yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Add a learning item with letter, word, and audio.
                      </p>
                    </div>
                  )}
                  {learningItemEntries.map(([itemId, item], index) => (
                    <LearningItemCard
                      key={itemId}
                      itemId={itemId}
                      index={index}
                      item={item}
                      onChange={updateLearningItem}
                      onRemove={removeLearningItem}
                    />
                  ))}
                  <Button
                    variant="outline"
                    onClick={addLearningItem}
                    className="w-full gap-2 border-dashed"
                  >
                    <Plus className="h-4 w-4" />
                    Add Learning Item
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quizzes" className="rounded-lg border bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 pr-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HelpCircle className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      Quizzes
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {quizEntries.length} quiz{quizEntries.length !== 1 ? 'zes' : ''}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {quizEntries.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {quizEntries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg bg-muted/30 border border-dashed">
                      <HelpCircle className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground">
                        No quizzes yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Add a quiz to test learners on this lesson.
                      </p>
                    </div>
                  )}
                  {quizEntries.map(([quizId, quiz], index) => (
                    <QuizCard
                      key={quizId}
                      quizId={quizId}
                      index={index}
                      quiz={quiz}
                      onChange={updateQuiz}
                      onRemove={removeQuiz}
                    />
                  ))}

                  <Separator className="my-2" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => addQuiz('text_multiple_choice')}
                      className="gap-2 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Text Choice Quiz
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addQuiz('audio_multiple_choice')}
                      className="gap-2 border-dashed"
                    >
                      <AudioLines className="h-4 w-4" />
                      Audio Choice Quiz
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addQuiz('audio_typing')}
                      className="gap-2 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Audio Typing Quiz
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => addQuiz('arabic_voice_record')}
                      className="gap-2 border-dashed"
                    >
                      <Mic className="h-4 w-4" />
                      Arabic Voice Record
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-5 mb-4">
              <ChevronDown className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">
              Select a lesson to edit
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Use the cascading dropdowns above to choose a world, level, and
              lesson. Then you can edit learning items and quizzes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
