# CGEDropzone Practical Examples

This document demonstrates common implementation patterns for **CGEDropzone** in modern web applications.

---

## Example 1: Multi-File Instant Async Upload with Progress

Uploads images and documents asynchronously as soon as dropped:

```html
<div data-cge-dropzone
     data-cge-upload-mode="instant"
     data-cge-url="/api/media/upload"
     data-cge-param-name="file"
     data-cge-accepted-files="image/*,.pdf,.zip"
     data-cge-max-file-size="10"
     data-cge-max-concurrent="3"
     data-cge-remove-url="/api/media/delete"
     class="rounded-xl border-2 border-dashed border-indigo-200 p-8 text-center bg-indigo-50/20">
</div>
```

---

## Example 2: Batch Form Submission with DataTransfer Synchronization

Accumulates files into a form payload and submits everything together:

```html
<form action="/projects/create" method="POST" enctype="multipart/form-data" class="space-y-4 max-w-lg">
  <!-- Laravel CSRF -->
  <input type="hidden" name="_token" value="{{ csrf_token() }}">

  <div>
    <label class="block text-sm font-medium text-slate-700">Project Title</label>
    <input type="text" name="title" required class="w-full mt-1 px-3 py-2 border rounded-md">
  </div>

  <div>
    <label class="block text-sm font-medium text-slate-700">Project Documents</label>
    <div data-cge-dropzone
         data-cge-upload-mode="form"
         data-cge-param-name="documents"
         data-cge-max-files="5"
         data-cge-accepted-files=".pdf,.docx,.xlsx,.zip">
    </div>
  </div>

  <button type="submit" class="px-5 py-2.5 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500">
    Create Project
  </button>
</form>
```

---

## Example 3: Avatar / Profile Photo Mode

Compact 1:1 circular uploader for user profile images:

```html
<div class="flex flex-col items-center">
  <div data-cge-dropzone
       data-cge-mode="avatar"
       data-cge-upload-mode="instant"
       data-cge-url="/user/avatar/upload"
       data-cge-accepted-files="image/jpeg,image/png,image/webp">
  </div>
  <span class="text-xs text-slate-500 mt-2 font-medium">Click to update photo</span>
</div>
```

---

## Example 4: Preloaded Existing Files from Server

Display existing files fetched from the database with deletion capabilities:

```javascript
import { CGEDropzone } from 'tailtools';

const dropzone = new CGEDropzone('#existing-files-dropzone', {
  url: '/api/attachments/upload',
  removeUrl: '/api/attachments/delete',
  existingFiles: [
    {
      id: 'file-101',
      name: 'invoice_2026_q1.pdf',
      size: 1024 * 1024 * 1.8,
      url: '/storage/invoices/q1.pdf',
      mimeType: 'application/pdf'
    },
    {
      id: 'file-102',
      name: 'brand_logo.png',
      size: 1024 * 320,
      url: '/storage/branding/logo.png',
      mimeType: 'image/png'
    }
  ]
});
```

---

## Example 5: Integration with CGEForm

Attach dropzone files directly to a reactive `CGEForm` submit:

```javascript
import { CGEForm, CGEDropzone } from 'tailtools';

const dropzone = new CGEDropzone('#attachments-dropzone', {
  uploadMode: 'form',
  paramName: 'files'
});

const form = new CGEForm('#campaign-form', {
  driver: 'axios',
  onSubmit: (formData) => {
    // Append all queued files from the dropzone
    dropzone.appendToFormData(formData, 'files');
  },
  onSuccess: (response) => {
    dropzone.clear();
    console.log('Campaign and files submitted successfully!');
  }
});
```
