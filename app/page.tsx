// 'use client';

// import { useState } from 'react';
// import {
//   Globe,
//   Layers,
//   BookOpen,
//   PencilLine,
//   Save,
//   Cloud,
//   Languages,
//   CheckCircle2,
// } from 'lucide-react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { useAppState } from '@/lib/use-app-state';
// import { WorldsTab } from '@/components/tabs/worlds-tab';
// import { LevelsTab } from '@/components/tabs/levels-tab';
// import { LessonsTab } from '@/components/tabs/lessons-tab';
// import { LessonEditorTab } from '@/components/tabs/lesson-editor-tab';
// import { ref, set } from 'firebase/database';
// import { db } from '@/lib/firebase';
// export default function Home() {
//   const app = useAppState();
//   const [saved, setSaved] = useState(false);

//   const worldCount = Object.keys(app.state.worlds).length;
//   const levelCount = Object.values(app.state.worlds).reduce(
//     (sum, w) => sum + Object.keys(w.levels).length,
//     0
//   );
//   const lessonCount = Object.values(app.state.worlds).reduce(
//     (sum, w) =>
//       sum +
//       Object.values(w.levels).reduce((s, l) => s + Object.keys(l.lessons).length, 0),
//     0
//   );

  

// async function handleSave() {
//   try {
//     await set(ref(db, 'appState'), app.state);
//     setSaved(true);
//     setTimeout(() => setSaved(false), 2500);
//   } catch (err) {
//     console.error('Failed to save to Firebase:', err);
//     alert('Save failed — check the console for details.');
//   }
// }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//           <div className="flex h-16 items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
//                 <Languages className="h-5.5 w-5.5" />
//               </div>
//               <div>
//                 <h1 className="text-lg font-semibold text-foreground leading-tight">
//                   LinguaKids
//                 </h1>
//                 <p className="text-xs text-muted-foreground leading-tight">
//                   Admin Panel
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
//                 <span className="flex items-center gap-1.5">
//                   <Globe className="h-3.5 w-3.5" />
//                   {worldCount} worlds
//                 </span>
//                 <span className="flex items-center gap-1.5">
//                   <Layers className="h-3.5 w-3.5" />
//                   {levelCount} levels
//                 </span>
//                 <span className="flex items-center gap-1.5">
//                   <BookOpen className="h-3.5 w-3.5" />
//                   {lessonCount} lessons
//                 </span>
//               </div>
//               <Button onClick={handleSave} className="gap-2">
//                 {saved ? (
//                   <>
//                     <CheckCircle2 className="h-4 w-4" />
//                     Saved!
//                   </>
//                 ) : (
//                   <>
//                     <Cloud className="h-4 w-4" />
//                     Save to Firebase
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main content */}
//       <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
//         <Tabs defaultValue="worlds" className="w-full">
//           <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto">
//             <TabsTrigger value="worlds" className="gap-1.5 py-2">
//               <Globe className="h-4 w-4" />
//               <span className="hidden sm:inline">Worlds</span>
//             </TabsTrigger>
//             <TabsTrigger value="levels" className="gap-1.5 py-2">
//               <Layers className="h-4 w-4" />
//               <span className="hidden sm:inline">Levels</span>
//             </TabsTrigger>
//             <TabsTrigger value="lessons" className="gap-1.5 py-2">
//               <BookOpen className="h-4 w-4" />
//               <span className="hidden sm:inline">Lessons</span>
//             </TabsTrigger>
//             <TabsTrigger value="editor" className="gap-1.5 py-2">
//               <PencilLine className="h-4 w-4" />
//               <span className="hidden sm:inline">Lesson Editor</span>
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="worlds" className="mt-6">
//             <WorldsTab actions={app} worlds={app.state.worlds} />
//           </TabsContent>

//           <TabsContent value="levels" className="mt-6">
//             <LevelsTab actions={app} worlds={app.state.worlds} />
//           </TabsContent>

//           <TabsContent value="lessons" className="mt-6">
//             <LessonsTab actions={app} worlds={app.state.worlds} />
//           </TabsContent>

//           <TabsContent value="editor" className="mt-6">
//             <LessonEditorTab actions={app} worlds={app.state.worlds} />
//           </TabsContent>
//         </Tabs>
//       </main>
//     </div>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Layers,
  BookOpen,
  PencilLine,
  Save,
  Cloud,
  Languages,
  CheckCircle2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/use-app-state';
import { WorldsTab } from '@/components/tabs/worlds-tab';
import { LevelsTab } from '@/components/tabs/levels-tab';
import { LessonsTab } from '@/components/tabs/lessons-tab';
import { LessonEditorTab } from '@/components/tabs/lesson-editor-tab';
import { ref, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
 import Image from "next/image";
export default function Home() {
  const app = useAppState();
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch live data from Firebase on page load
  useEffect(() => {
    const stateRef = ref(db, 'appState');
    
    const unsub = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Dispatch the data to your state manager
        app.dispatch({ type: 'REPLACE_STATE', payload: data });
      } else {
        // If the database is completely empty, initialize it with an empty structure
        app.dispatch({ type: 'REPLACE_STATE', payload: { worlds: {} } });
      }
      setIsLoading(false); // Stop loading once data is fetched
    });
    
    // Cleanup subscription on unmount
    return () => unsub();
  }, []);

  // Safely calculate counts (Firebase removes completely empty objects, so we need fallbacks)
  const safeWorlds = app.state?.worlds || {};
  
  const worldCount = Object.keys(safeWorlds).length;
  
  const levelCount = Object.values(safeWorlds).reduce(
    (sum: any, w: any) => sum + Object.keys(w?.levels || {}).length,
    0
  );
  
  const lessonCount = Object.values(safeWorlds).reduce(
    (sum: any, w: any) =>
      sum +
      Object.values(w?.levels || {}).reduce((s: any, l: any) => s + Object.keys(l?.lessons || {}).length, 0),
    0
  );

  // Helper function to recursively remove or replace undefined values with empty strings/null
  function sanitizeForFirebase(obj: any): any {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirebase);
    }

    const sanitized: any = {};
    Object.keys(obj).forEach((key) => {
      const val = obj[key];
      // If a property is undefined, skip it or set it to ""
      if (val !== undefined) {
        sanitized[key] = sanitizeForFirebase(val);
      }
    });
    return sanitized;
  }

  async function handleSave() {
    try {
      // Clean the state of any undefined values before sending to Firebase
      const cleanState = sanitizeForFirebase(app.state);
      
      await set(ref(db, 'appState'), cleanState);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save to Firebase:', err);
      alert('Save failed — check the console for details.');
    }
  }
  // 2. Show a loading screen while fetching from Firebase
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Languages className="h-10 w-10 text-primary animate-bounce" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading English Plus Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
           

            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="English Plus Logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover shadow-sm"
              />
              <div>
                <h1 className="text-lg font-semibold text-foreground leading-tight">
                  English Plus
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">
                  Admin Panel
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {worldCount} worlds
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {levelCount} levels
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {lessonCount} lessons
                </span>
              </div>
              <Button onClick={handleSave} className="gap-2">
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4" />
                    Save to Firebase
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="worlds" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto">
            <TabsTrigger value="worlds" className="gap-1.5 py-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Worlds</span>
            </TabsTrigger>
            <TabsTrigger value="levels" className="gap-1.5 py-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Levels</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-1.5 py-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-1.5 py-2">
              <PencilLine className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson Editor</span>
            </TabsTrigger>
          </TabsList>

          {/* 3. Passing safe props to tabs to prevent crashes on empty data */}
          <TabsContent value="worlds" className="mt-6">
            <WorldsTab actions={app} worlds={safeWorlds} />
          </TabsContent>

          <TabsContent value="levels" className="mt-6">
            <LevelsTab actions={app} worlds={safeWorlds} />
          </TabsContent>

          <TabsContent value="lessons" className="mt-6">
            <LessonsTab actions={app} worlds={safeWorlds} />
          </TabsContent>

          <TabsContent value="editor" className="mt-6">
            <LessonEditorTab actions={app} worlds={safeWorlds} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}