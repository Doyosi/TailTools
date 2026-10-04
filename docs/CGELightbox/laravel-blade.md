# CGELightbox - Laravel Blade Integration Guide

This guide details how to integrate **CGELightbox** seamlessly into Laravel Blade applications using declarative data-attributes and custom Blade components (`<x-cge-lightbox>` and `<x-cge-gallery>`).

---

## 1. Asset Pipeline Setup

### A. Install Vite & Tailwind CSS v4

Ensure your Laravel project is configured with Tailwind CSS v4. In `resources/css/app.css`:

```css
@import "tailwindcss";
@import "tailwind-animations";

/* Import CGELightbox stylesheet */
@import "tailtools/plugins/CGELightbox/style.css";
```

In `resources/js/app.js`:

```javascript
import './bootstrap';
import { CGELightbox } from 'tailtools';

// CGELightbox auto-initializes on DOMContentLoaded for all [data-cge-lightbox] elements.
// Or expose globally for inline Blade scripts:
window.CGELightbox = CGELightbox;
```

---

## 2. Reusable Blade Components

Create two lightweight, zero-dependency Blade components in your Laravel project:

### `<x-cge-lightbox>` Component (`resources/views/components/cge-lightbox.blade.php`)

```blade
@props([
    'src',
    'gallery' => null,
    'type' => null,
    'caption' => null,
    'subtitle' => null,
    'thumb' => null,
    'class' => 'group relative block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xs hover:border-indigo-500 transition cursor-pointer'
])

<a href="{{ $src }}"
   data-cge-lightbox
   @if($gallery) data-cge-gallery="{{ $gallery }}" @endif
   @if($type) data-cge-type="{{ $type }}" @endif
   @if($caption) data-cge-caption="{{ $caption }}" @endif
   @if($subtitle) data-cge-description="{{ $subtitle }}" @endif
   @if($thumb) data-cge-thumb="{{ $thumb }}" @endif
   {{ $attributes->merge(['class' => $class]) }}>
    
    {{ $slot }}

    <!-- Hover Zoom Badge -->
    <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <span class="p-2 rounded-sm bg-black/60 text-white backdrop-blur-xs text-xs flex items-center gap-1.5 font-medium shadow-xs">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke-width="2"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
            {{ __('View') }}
        </span>
    </div>
</a>
```

### `<x-cge-gallery>` Component (`resources/views/components/cge-gallery.blade.php`)

```blade
@props([
    'name' => 'gallery-' . uniqid(),
    'columns' => 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    'gap' => 'gap-4',
    'class' => ''
])

<div {{ $attributes->merge(['class' => "grid {$columns} {$gap} {$class}"]) }} data-cge-gallery-wrapper="{{ $name }}">
    {{ $slot }}
</div>
```

---

## 3. Practical Blade Templates

### A. Photo Album Grid with Thumbnails

```blade
<x-cge-gallery name="destinations" columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    @foreach ($photos as $photo)
        <x-cge-lightbox 
            :src="$photo->highres_url" 
            gallery="destinations"
            :thumb="$photo->thumb_url"
            :caption="$photo->title"
            :subtitle="$photo->location">
            <img src="{{ $photo->thumb_url }}" 
                 alt="{{ $photo->title }}" 
                 class="w-full h-52 object-cover transition duration-300 group-hover:scale-105" 
                 loading="lazy">
        </x-cge-lightbox>
    @endforeach
</x-cge-gallery>
```

### B. Mixed Media Showcase (YouTube, Vimeo, HTML5 Video & High-Res Images)

```blade
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Image Card -->
    <x-cge-lightbox 
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600"
        gallery="mixed-showcase"
        caption="High-Resolution Yosemite Photography"
        subtitle="Unsplash Nature Archive"
        thumb="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300">
        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600" class="w-full h-48 object-cover" alt="Yosemite">
        <div class="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">Yosemite Valley</h4>
            <span class="text-[11px] text-slate-500">Image Slide</span>
        </div>
    </x-cge-lightbox>

    <!-- YouTube Stream Slide -->
    <x-cge-lightbox 
        src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        type="youtube"
        gallery="mixed-showcase"
        caption="YouTube 4K Broadcast Stream"
        thumb="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300">
        <div class="relative">
            <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600" class="w-full h-48 object-cover" alt="YouTube Stream">
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded-sm bg-red-600 text-white text-[10px] font-bold">YouTube</span>
        </div>
        <div class="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">Online Streaming</h4>
            <span class="text-[11px] text-slate-500">16:9 Responsive Embed</span>
        </div>
    </x-cge-lightbox>

    <!-- Local HTML5 Video Slide -->
    <x-cge-lightbox 
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        type="video"
        gallery="mixed-showcase"
        caption="Local HTML5 Video Player"
        poster="https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600">
        <div class="relative">
            <img src="https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600" class="w-full h-48 object-cover" alt="Video Clip">
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded-sm bg-indigo-600 text-white text-[10px] font-bold">HTML5 MP4</span>
        </div>
        <div class="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">Product Teaser</h4>
            <span class="text-[11px] text-slate-500">Direct Video Playback</span>
        </div>
    </x-cge-lightbox>
</div>
```

### C. Inline Custom Template Modal in Lightbox

```blade
<!-- Trigger Card -->
<a href="#quick-spec-card"
   data-cge-lightbox
   data-cge-type="inline"
   data-cge-caption="Detailed Specifications Sheet"
   class="block p-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-500 transition">
    <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-sm bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            ⚡
        </div>
        <div>
            <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Technical Data Sheet</h4>
            <p class="text-[11px] text-slate-500">Click to open inline interactive spec card</p>
        </div>
    </div>
</a>

<!-- Hidden Inline Template Container -->
<div id="quick-spec-card" class="hidden">
    <div class="p-6 max-w-lg bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-xl text-left">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">Engine Architecture & Specs</h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            All render pipelines execute hardware-accelerated transforms natively without extra layout passes.
        </p>
        <div class="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            <div class="flex justify-between text-slate-600 dark:text-slate-300">
                <span class="font-medium">Aspect Ratio:</span>
                <span>16:9 responsive auto-scaling</span>
            </div>
            <div class="flex justify-between text-slate-600 dark:text-slate-300">
                <span class="font-medium">Max Zoom Level:</span>
                <span>4.0x Smooth Pinch & Drag</span>
            </div>
        </div>
    </div>
</div>
```

---

## 4. Localization (i18n) via Laravel Translations

Provide localized action labels directly to the plugin during application boot in `resources/js/app.js`:

```javascript
import { CGELightbox } from 'tailtools';

// Pull localized strings from window or meta payload
CGELightbox.setTranslations({
  "close": window.__translations?.close || "Close (Esc)",
  "next": window.__translations?.next || "Next",
  "prev": window.__translations?.prev || "Previous",
  "zoom-in": window.__translations?.zoomIn || "Zoom in",
  "zoom-out": window.__translations?.zoomOut || "Zoom out",
  "fullscreen": window.__translations?.fullscreen || "Fullscreen",
  "download": window.__translations?.download || "Download",
  "counter": window.__translations?.counter || ":current / :total"
});
```
