/**
 * CGEDropzone TypeScript Definitions
 * TailTools Plugin Library
 */

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

export interface CGEDropzoneTranslations {
  "dict-default-message"?: string;
  "dict-fallback-message"?: string;
  "dict-file-too-big"?: string;
  "dict-file-too-small"?: string;
  "dict-invalid-file-type"?: string;
  "dict-response-error"?: string;
  "dict-cancel-upload"?: string;
  "dict-cancel-confirmation"?: string;
  "dict-remove-file"?: string;
  "dict-remove-confirmation"?: string;
  "dict-max-files-exceeded"?: string;
  "dict-uploading"?: string;
  "dict-uploaded"?: string;
  "dict-retry"?: string;
  "dict-avatar-prompt"?: string;
  [key: string]: string | undefined;
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
  translations?: CGEDropzoneTranslations;
  onAddedFile?: (file: DropzoneFile) => void;
  onUploadProgress?: (file: DropzoneFile, progress: number) => void;
  onSuccess?: (file: DropzoneFile, response: any) => void;
  onError?: (file: DropzoneFile | null, error: string | null) => void;
  onRemoved?: (file: DropzoneFile) => void;
  onQueueComplete?: () => void;
}

export declare class CGEDropzone {
  static instances: Map<HTMLElement | string, CGEDropzone>;
  static defaults: CGEDropzoneOptions;
  static translations: CGEDropzoneTranslations;
  static setTranslations(dict: Partial<CGEDropzoneTranslations>): void;
  static get(target: string | HTMLElement): CGEDropzone | null;
  static init(root?: string | HTMLElement | Document, options?: CGEDropzoneOptions): CGEDropzone[];

  element: HTMLElement;
  options: Required<CGEDropzoneOptions>;
  files: DropzoneFile[];
  isDisabled: boolean;
  isUploading: boolean;
  hiddenInput: HTMLInputElement;
  previewsContainer: HTMLElement | null;
  triggerContainer: HTMLElement | null;
  form: HTMLFormElement | null;

  constructor(target: string | HTMLElement, options?: CGEDropzoneOptions);

  addFiles(fileList: FileList | File[]): void;
  addFile(file: File): DropzoneFile | null;
  removeFile(fileOrId: string | DropzoneFile, silent?: boolean): Promise<void>;
  /** Waits for remote deletes; failures retain their cards. remote:false only detaches locally. */
  clear(options?: { remote?: boolean }): Promise<void>;
  uploadAll(): void;
  uploadFile(fileId: string): Promise<void>;
  cancelUpload(fileId: string): void;
  retryUpload(fileId: string): void;
  disable(): void;
  enable(): void;
  destroy(): void;

  getFiles(): DropzoneFile[];
  getQueuedFiles(): DropzoneFile[];
  getUploadingFiles(): DropzoneFile[];
  getCompletedFiles(): DropzoneFile[];
  getFailedFiles(): DropzoneFile[];
  appendToFormData(formData: FormData, fieldName?: string): void;

  on(event: 'add' | 'progress' | 'success' | 'error' | 'removed' | 'complete' | string, handler: Function): this;
  off(event: string, handler: Function): this;
}

export default CGEDropzone;
