/**
 * CGEDropzone TypeScript Definitions
 * TailTools Plugin Library
 */

export type CGEDropzoneUploadMode = 'instant' | 'form';
export type CGEDropzoneVisualMode = 'standard' | 'avatar';
export type CGEDropzoneAspectRatio = '1:1' | '16:9' | '300x600' | '1200x630' | '50x50' | 'auto';
/**
 * Upload transport. 'axios' uses the configured axiosInstance or window.axios; 'xhr' and 'fetch'
 * (and axios without an instance) upload through XMLHttpRequest because fetch has no upload
 * progress events. Remote deletes use axios when available, otherwise fetch.
 */
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
  /** True for client-side rejections (size/type); these cannot be retried */
  validationError?: boolean;
  response?: any;
  domCard?: HTMLElement | null;
  /** Hidden server-ID input written in instant mode */
  serverIdInput?: HTMLInputElement | null;
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
  /** Axios instance used before window.axios */
  axiosInstance?: any;
  /**
   * Instant mode only: name of the hidden inputs that receive each uploaded file's server ID
   * (response `id`, `path`, `data.id` or `data.path`; existing files use their `id`/`path`).
   * Default `${paramName}_ids[]`; `false` disables. The native file input is never filled in instant mode.
   */
  serverIdName?: string | false | null;
  existingFiles?: ExistingDropzoneFile[];
  /** true: the dropzone opens the picker; false: no click/keyboard picker; string: elements matching the selector open it */
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
  /** Destroys instances whose element is inside root or disconnected (Livewire/Turbo teardown). */
  static destroyAll(root?: Document | Element): CGEDropzone[];

  element: HTMLElement;
  options: Required<CGEDropzoneOptions>;
  files: DropzoneFile[];
  isDisabled: boolean;
  /** True while at least one upload request is in flight */
  isUploading: boolean;
  /** File picker opened by clicks/keyboard; never named and reset after every selection. */
  hiddenInput: HTMLInputElement;
  /** Form mode only: hidden named input (`paramName` / `paramName[]`) that carries the files on submit. */
  formInput: HTMLInputElement | null;
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
  /** Re-queues a failed upload (not client validation errors); respects maxConcurrent and form mode. */
  retryUpload(fileId: string): void;
  disable(): void;
  enable(): void;
  /** Removes listeners and generated nodes and restores the element's original class/role/tabindex/aria-label. */
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
