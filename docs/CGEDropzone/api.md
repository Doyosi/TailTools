# CGEDropzone API Reference

Complete TypeScript interfaces, options definitions, and DOM event contracts for **CGEDropzone**.

---

## 1. TypeScript Types & Interfaces

```typescript
export type CGEDropzoneUploadMode = 'instant' | 'form';
export type CGEDropzoneVisualMode = 'standard' | 'avatar';
export type CGEDropzoneAspectRatio = '1:1' | '16:9' | '300x600' | '1200x630' | '50x50' | 'auto';
export type CGEDropzoneDriver = 'axios' | 'xhr' | 'fetch';
export type CGEDropzoneFileStatus = 'queued' | 'uploading' | 'success' | 'error' | 'canceled';

export interface DropzoneFile {
  id: string;
  file: File | null;
  name: string;
  size: number;
  type: string;
  formattedSize: string;
  status: CGEDropzoneFileStatus;
  progress: number;
  previewUrl: string | null;
  isImage: boolean;
  isExisting: boolean;
  xhr?: XMLHttpRequest | null;
  abortController?: AbortController | null;
  errorMessage?: string | null;
  response?: any;
  domCard?: HTMLElement | null;
}

export interface ExistingDropzoneFile {
  id?: string;
  name: string;
  size?: number;
  url: string;
  mimeType?: string;
}

export interface CGEDropzoneUI {
  container?: string;
  dragOver?: string;
  disabled?: string;
  trigger?: string;
  triggerIcon?: string;
  triggerText?: string;
  triggerSubtext?: string;
  previewsContainer?: string;
  previewCard?: string;
  previewMedia?: string;
  previewImage?: string;
  previewIconWrapper?: string;
  fileIcon?: string;
  previewDetails?: string;
  previewFileName?: string;
  previewMeta?: string;
  previewBadge?: string;
  progressBarContainer?: string;
  progressBar?: string;
  progressBarSuccess?: string;
  progressBarError?: string;
  statusOverlay?: string;
  removeBtn?: string;
  cancelBtn?: string;
  retryBtn?: string;
  errorText?: string;
  avatarContainer?: string;
  avatarImage?: string;
  avatarOverlay?: string;
  avatarIcon?: string;
}

export interface CGEDropzoneOptions {
  url?: string | null;
  method?: string;
  paramName?: string;
  uploadMode?: CGEDropzoneUploadMode;
  mode?: CGEDropzoneVisualMode;
  aspectRatio?: CGEDropzoneAspectRatio;
  acceptedFiles?: string | null;
  maxFileSize?: number | null;
  minFileSize?: number | null;
  maxFiles?: number | null;
  maxConcurrent?: number;
  autoProcessQueue?: boolean;
  headers?: Record<string, string>;
  extraData?: Record<string, any> | ((file: DropzoneFile) => Record<string, any>);
  removeUrl?: string | null;
  removeMethod?: string;
  confirmDelete?: boolean;
  driver?: CGEDropzoneDriver;
  axiosInstance?: any;
  existingFiles?: ExistingDropzoneFile[];
  clickable?: boolean | string;
  previewContainer?: string | HTMLElement | null;
  renderPreview?: ((fileItem: DropzoneFile, dropzone: CGEDropzone) => HTMLElement | string) | null;
  renderTrigger?: ((dropzone: CGEDropzone) => HTMLElement | string) | null;
  ui?: CGEDropzoneUI;
  translations?: Record<string, string>;
  onAddedFile?: (file: DropzoneFile) => void;
  onUploadProgress?: (file: DropzoneFile, progress: number) => void;
  onSuccess?: (file: DropzoneFile, response: any) => void;
  onError?: (file: DropzoneFile | null, error: string | null) => void;
  onRemoved?: (file: DropzoneFile) => void;
  onQueueComplete?: () => void;
}
```

---

## 2. DOM CustomEvents Contract

All events bubble and provide payload information in `event.detail`:

| Event Name | Detail Payload | Description |
| :--- | :--- | :--- |
| `cge:dropzone:add` | `{ instance, file }` | Dispatched immediately when a file is added and validated. |
| `cge:dropzone:progress` | `{ instance, file, data: percent }` | Dispatched on every upload progress tick (0 - 100). |
| `cge:dropzone:success` | `{ instance, file, data: response }` | Dispatched when a file upload completes successfully. |
| `cge:dropzone:error` | `{ instance, file, data: errorMessage }` | Dispatched when validation or network upload fails. |
| `cge:dropzone:removed` | `{ instance, file }` | Dispatched when a file is removed from the dropzone. |
| `cge:dropzone:complete` | `{ instance }` | Dispatched when all queued files have finished uploading. |
