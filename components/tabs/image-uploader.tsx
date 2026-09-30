'use client';

import { useCallback, useRef, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setStatus('error');
        setError('Please select an image file.');
        return;
      }

      setStatus('uploading');
      setError('');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Image upload failed');
        }

        onChange(data.url);
        setStatus('done');
        window.setTimeout(() => setStatus('idle'), 2000);
      } catch (uploadError) {
        setStatus('error');
        setError(
          uploadError instanceof Error ? uploadError.message : 'Image upload failed'
        );
      }
    },
    [onChange]
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          'flex min-w-0 flex-col items-stretch gap-2 rounded-md border border-dashed p-2 transition-colors sm:flex-row sm:items-center',
          isDragging ? 'border-primary bg-primary/10' : 'border-input bg-background',
          status === 'error' && 'border-destructive'
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 gap-1.5 sm:w-auto"
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
          {status === 'uploading' ? 'Uploading...' : status === 'done' ? 'Uploaded' : label}
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {value ? (
            <>
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                {value}
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <span className="truncate text-xs text-muted-foreground">
              {isDragging ? 'Drop image here...' : 'PNG, JPG, WebP, GIF, or SVG (max 10 MB)'}
            </span>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
