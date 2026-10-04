# CGEDropzone Laravel Blade Components

This guide provides drop-in Laravel Blade components for **CGEDropzone**, allowing you to render declarative file uploaders with idiomatic Laravel syntax.

---

## 1. Multi-File Dropzone Component (`resources/views/components/cge-dropzone.blade.php`)

```blade
@props([
    'id' => 'cge-dropzone-' . uniqid(),
    'name' => 'files',
    'uploadMode' => 'instant', // 'instant' | 'form'
    'url' => null,
    'removeUrl' => null,
    'acceptedFiles' => 'image/*,.pdf,.zip',
    'maxFileSize' => 10, // MB
    'maxFiles' => null,
    'maxConcurrent' => 2,
    'aspectRatio' => 'auto',
    'extraData' => null,
    'existingFiles' => []
])

<div {{ $attributes->merge([
    'id' => $id,
    'class' => 'w-full',
    'data-cge-dropzone' => '',
    'data-cge-param-name' => $name,
    'data-cge-upload-mode' => $uploadMode,
    'data-cge-url' => $url ?? ($uploadMode === 'instant' ? route('media.upload') : null),
    'data-cge-remove-url' => $removeUrl,
    'data-cge-accepted-files' => $acceptedFiles,
    'data-cge-max-file-size' => $maxFileSize,
    'data-cge-max-files' => $maxFiles,
    'data-cge-max-concurrent' => $maxConcurrent,
    'data-cge-aspect-ratio' => $aspectRatio,
    'data-cge-extra-data' => is_array($extraData) ? json_encode($extraData) : $extraData,
]) }}>
    {{ $slot }}
</div>

@if(!empty($existingFiles))
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const dz = window.CGEDropzone?.get('#{{ $id }}');
        if (dz) {
            const files = @json($existingFiles);
            files.forEach(f => dz.options.existingFiles.push(f));
            dz._loadExistingFiles();
        }
    });
</script>
@endif
```

### Blade Usage:
```blade
<x-cge-dropzone 
    name="documents"
    upload-mode="instant"
    :url="route('documents.upload')"
    :remove-url="route('documents.delete')"
    accepted-files=".pdf,.docx,.xlsx"
    :max-file-size="15"
    :max-files="5"
/>
```

---

## 2. Avatar / Profile Photo Component (`resources/views/components/cge-avatar-upload.blade.php`)

```blade
@props([
    'id' => 'cge-avatar-' . uniqid(),
    'name' => 'avatar',
    'url' => route('profile.avatar.update'),
    'currentAvatarUrl' => null,
    'size' => 'w-32 h-32',
    'rounded' => 'rounded-full'
])

<div class="flex flex-col items-center gap-2">
    <div {{ $attributes->merge([
        'id' => $id,
        'class' => "$size $rounded",
        'data-cge-dropzone' => '',
        'data-cge-mode' => 'avatar',
        'data-cge-upload-mode' => 'instant',
        'data-cge-param-name' => $name,
        'data-cge-url' => $url,
        'data-cge-accepted-files' => 'image/png,image/jpeg,image/webp'
    ]) }}>
    </div>
    
    @if($slot->isNotEmpty())
        <div>{{ $slot }}</div>
    @else
        <span class="text-xs text-slate-500 font-medium">Click or drop new photo</span>
    @endif
</div>

@if($currentAvatarUrl)
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const dz = window.CGEDropzone?.get('#{{ $id }}');
        if (dz) {
            dz.avatarImage.src = '{{ $currentAvatarUrl }}';
            dz.avatarImage.classList.remove('hidden');
            dz.avatarPlaceholder.classList.add('hidden');
        }
    });
</script>
@endif
```

### Blade Usage:
```blade
<x-cge-avatar-upload 
    :url="route('account.avatar')"
    :current-avatar-url="auth()->user()->avatar_url"
/>
```

---

## 3. Laravel Controller Upload Handler

Here is a standard controller method handling instant file uploads with validation:

```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:15360'] // 15MB
        ]);

        $path = $request->file('file')->store('uploads', 'public');

        return response()->json([
            'success' => true,
            'id' => uniqid('media_'),
            'name' => $request->file('file')->getClientOriginalName(),
            'size' => $request->file('file')->getSize(),
            'url' => Storage::url($path),
            'mimeType' => $request->file('file')->getMimeType()
        ]);
    }

    public function delete(Request $request)
    {
        $request->validate([
            'id' => ['required', 'string']
        ]);

        // Logic to delete file from storage and database...

        return response()->json(['success' => true]);
    }
}
```
