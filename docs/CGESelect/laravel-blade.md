# CGESelect - Laravel Blade Guide

Integrating **CGESelect** into Laravel Blade components, standard form submissions, validation error binding, and Livewire components.

---

## 1. Reusable Blade Component (`<x-cge-select>`)

Create `resources/views/components/cge-select.blade.php`:

```html
@props([
    'name',
    'id' => null,
    'label' => null,
    'placeholder' => null,
    'multiple' => false,
    'clearable' => true,
    'searchable' => true,
    'maxItems' => null,
    'maxTagsVisible' => null,
    'options' => [],
    'selected' => null,
    'required' => false
])

@php
    $selectId = $id ?? $name;
    $selectedValues = is_array($selected) ? $selected : [$selected];
    $hasError = $errors->has($name);
@endphp

<div class="space-y-1.5">
    @if($label)
        <label for="{{ $selectId }}" class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {{ $label }}
            @if($required) <span class="text-rose-500">*</span> @endif
        </label>
    @endif

    <select
        id="{{ $selectId }}"
        name="{{ $multiple ? $name . '[]' : $name }}"
        data-cge-select
        @if($multiple) multiple @endif
        @if($placeholder) data-cge-placeholder="{{ $placeholder }}" @endif
        @if(!$clearable) data-cge-clearable="false" @endif
        @if(!$searchable) data-cge-searchable="false" @endif
        @if($maxItems) data-cge-max-items="{{ $maxItems }}" @endif
        @if($maxTagsVisible) data-cge-max-tags-visible="{{ $maxTagsVisible }}" @endif
        {{ $attributes->merge(['class' => 'w-full text-xs rounded-sm ' . ($hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700')]) }}
    >
        @if($placeholder && !$multiple)
            <option value="" disabled {{ empty($selectedValues) ? 'selected' : '' }} data-placeholder>
                {{ $placeholder }}
            </option>
        @endif

        @foreach($options as $val => $opt)
            @php
                $optVal = is_array($opt) ? ($opt['value'] ?? $val) : $val;
                $optLabel = is_array($opt) ? ($opt['label'] ?? $optVal) : $opt;
                $isSel = in_array((string)$optVal, array_map('strval', $selectedValues), true);
            @endphp
            <option
                value="{{ $optVal }}"
                {{ $isSel ? 'selected' : '' }}
                @if(is_array($opt) && !empty($opt['image'])) data-image="{{ $opt['image'] }}" @endif
                @if(is_array($opt) && !empty($opt['subtext'])) data-subtext="{{ $opt['subtext'] }}" @endif
                @if(is_array($opt) && !empty($opt['badge'])) data-badge="{{ $opt['badge'] }}" @endif
            >
                {{ $optLabel }}
            </option>
        @endforeach
    </select>

    @error($name)
        <p class="text-rose-500 text-[11px] font-medium">{{ $message }}</p>
    @enderror
</div>
```

---

## 2. Using the Blade Component

### Single Select with User Avatars:
```html
<x-cge-select
    name="assignee_id"
    label="Assign Task To:"
    placeholder="Select a developer..."
    :options="[
        ['value' => 1, 'label' => 'Sarah Connor', 'image' => '/avatars/sarah.jpg', 'subtext' => 'DevOps', 'badge' => 'Lead'],
        ['value' => 2, 'label' => 'Alex Rivera', 'image' => '/avatars/alex.jpg', 'subtext' => 'Frontend', 'badge' => 'UI'],
    ]"
    :selected="old('assignee_id', $task->assignee_id ?? null)"
    required
/>
```

### Multi-Select Tag Combobox:
```html
<x-cge-select
    name="tags"
    label="Project Tags:"
    placeholder="Select up to 3 tags..."
    multiple
    :max-items="3"
    :max-tags-visible="2"
    :options="['tailwind' => 'Tailwind CSS', 'laravel' => 'Laravel', 'vue' => 'Vue.js', 'docker' => 'Docker']"
    :selected="old('tags', ['tailwind', 'laravel'])"
/>
```

---

## 3. Form Validation with `CGEForm`

Because `CGESelect` updates the original `<select>` directly in the DOM, `CGEForm` and standard Laravel AJAX form submissions work out of the box with zero custom glue code:

```html
<form method="POST" action="/projects" data-cge-form>
    @csrf

    <x-cge-select
        name="team_id"
        label="Select Department Team"
        :options="$teams"
        required
    />

    <button type="submit" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-sm text-xs font-semibold">
        Create Project
    </button>
</form>
```

When Laravel returns a `422 Unprocessable Entity` JSON response with `{"errors": {"team_id": ["The team field is required."]}}`, `CGEForm` highlights the visible trigger (not only the hidden native select) and renders the error feedback right after the select wrapper. Server-rendered errors work too: put `aria-invalid="true"` on the `<select>` (e.g. `@error('team_id') aria-invalid="true" @enderror`) and the trigger mirrors it.

---

## 4. Laravel Livewire Synchronization

To bind with Livewire, simply add `wire:model.live="selectedUser"` or `wire:change`:

```html
<select
    wire:model.live="selectedUser"
    data-cge-select
    class="w-full text-xs"
>
    @foreach($users as $user)
        <option value="{{ $user->id }}">{{ $user->name }}</option>
    @endforeach
</select>
```

Whenever an option is clicked in `CGESelect`, a native bubbling `input` and `change` event is dispatched onto the `<select>`, prompting Livewire to update its component state immediately.

## Stability fixes (October 2026)

- `data-cge-async-method="POST"` endpoints receive `X-CSRF-TOKEN` from `<meta name="csrf-token">` (or the form `@csrf` field), so `VerifyCsrfToken` no longer answers 419.
- Remote JSON `icon` values are treated as class names or text; return HTML icons only from trusted endpoints and enable `asyncSource: { iconHtml: true }`.
- After Livewire morphs/Turbo visits call `CGESelect.destroyAll(root)` (or `destroyTailTools(root)`) before re-initializing.
