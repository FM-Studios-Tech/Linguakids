// 'use client';

// import { useRef, useState, useCallback } from 'react';
// import { Upload, AudioLines, X, CheckCircle2, Loader2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';

// interface AudioUploaderProps {
//   value: string;
//   onChange: (url: string) => void;
//   label?: string;
//   accept?: string;
// }

// type UploadStatus = 'idle' | 'uploading' | 'done';

// function mockUploadUrl(fileName: string): string {
//   const slug = fileName
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '');
//   return `https://cdn.cloudflare.com/audio/${slug}-${Date.now().toString(36)}.mp3`;
// }

// export function AudioUploader({
//   value,
//   onChange,
//   label = 'Upload Audio',
//   accept = 'audio/*',
// }: AudioUploaderProps) {
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [status, setStatus] = useState<UploadStatus>('idle');
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragCounter, setDragCounter] = useState(0);

//   const processFile = useCallback(
//     (file: File) => {
//       if (!file.type.startsWith('audio/')) return;
//       setStatus('uploading');
//       window.setTimeout(() => {
//         const url = mockUploadUrl(file.name);
//         onChange(url);
//         setStatus('done');
//         window.setTimeout(() => setStatus('idle'), 2000);
//       }, 600);
//     },
//     [onChange]
//   );

//   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0];
//     if (file) processFile(file);
//     e.target.value = '';
//   }

//   function handleDrop(e: React.DragEvent) {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDragging(false);
//     setDragCounter(0);
//     const file = e.dataTransfer.files?.[0];
//     if (file) processFile(file);
//   }

//   function handleDragEnter(e: React.DragEvent) {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragCounter((c) => c + 1);
//     setIsDragging(true);
//   }

//   function handleDragLeave(e: React.DragEvent) {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragCounter((c) => {
//       const next = c - 1;
//       if (next <= 0) setIsDragging(false);
//       return next;
//     });
//   }

//   return (
//     <div className="space-y-1.5">
//       <input
//         ref={inputRef}
//         type="file"
//         accept={accept}
//         onChange={handleFileChange}
//         className="hidden"
//       />
//       <div
//         onDrop={handleDrop}
//         onDragOver={(e) => {
//           e.preventDefault();
//           e.stopPropagation();
//         }}
//         onDragEnter={handleDragEnter}
//         onDragLeave={handleDragLeave}
//         className={cn(
//           'flex items-center gap-2 rounded-md border border-dashed p-1.5 transition-colors',
//           isDragging
//             ? 'border-primary bg-primary/10'
//             : 'border-input bg-background'
//         )}
//       >
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           className="gap-1.5 shrink-0"
//           onClick={() => inputRef.current?.click()}
//           disabled={status === 'uploading'}
//         >
//           {status === 'uploading' ? (
//             <Loader2 className="h-3.5 w-3.5 animate-spin" />
//           ) : status === 'done' ? (
//             <CheckCircle2 className="h-3.5 w-3.5 text-success" />
//           ) : (
//             <Upload className="h-3.5 w-3.5" />
//           )}
//           {status === 'uploading' ? 'Uploading...' : status === 'done' ? 'Done' : label}
//         </Button>
//         <div className="flex-1 min-w-0 flex items-center gap-1.5">
//           {value ? (
//             <>
//               <AudioLines className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
//               <span className="text-xs font-mono text-muted-foreground truncate flex-1">
//                 {value}
//               </span>
//               <button
//                 type="button"
//                 onClick={() => onChange('')}
//                 className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
//                 aria-label="Remove audio"
//               >
//                 <X className="h-3.5 w-3.5" />
//               </button>
//             </>
//           ) : (
//             <span className="text-xs text-muted-foreground truncate">
//               {isDragging ? 'Drop audio file here...' : 'Click to browse or drag & drop'}
//             </span>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, AudioLines, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'done';

export function AudioUploader({
  value,
  onChange,
  label = 'Upload Audio',
  accept = 'audio/*',
}: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('audio/')) return;
      
      setStatus('uploading');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', { 
          method: 'POST', 
          body: formData 
        });
        
        if (!res.ok) throw new Error('Upload failed');
        
        const data = await res.json();
        
        onChange(data.url);
        setStatus('done');
        window.setTimeout(() => setStatus('idle'), 2000);
      } catch (error) {
        console.error('Error uploading file:', error);
        setStatus('idle');
      }
    },
    [onChange]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next <= 0) setIsDragging(false);
      return next;
    });
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={cn(
          'flex items-center gap-2 rounded-md border border-dashed p-1.5 transition-colors',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-input bg-background'
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : status === 'done' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {status === 'uploading' ? 'Uploading...' : status === 'done' ? 'Done' : label}
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {value ? (
            <>
              <AudioLines className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                {value}
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                aria-label="Remove audio"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground truncate">
              {isDragging ? 'Drop audio file here...' : 'Click to browse or drag & drop'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}