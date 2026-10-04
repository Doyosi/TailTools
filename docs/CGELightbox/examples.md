# CGELightbox - Practical Examples & Code Recipes

Real-world code patterns and recipes for implementing **CGELightbox** in modern Tailwind CSS v4 and Laravel applications.

---

## 1. Photo Album Gallery with Thumbnails & Captions

A responsive image gallery grid with thumbnails, captions, subtitles, and automatic grouping.

```html
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  <!-- Slide 1 -->
  <a href="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600"
     data-cge-lightbox
     data-cge-gallery="travel-album"
     data-cge-caption="Yosemite Valley Stream"
     data-cge-subtitle="National Park, California"
     data-cge-thumb="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500" class="w-full h-40 object-cover" alt="Yosemite">
  </a>

  <!-- Slide 2 -->
  <a href="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600"
     data-cge-lightbox
     data-cge-gallery="travel-album"
     data-cge-caption="Alpine Mountain Sunrise"
     data-cge-subtitle="Rocky Peaks Collection"
     data-cge-thumb="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500" class="w-full h-40 object-cover" alt="Mountains">
  </a>

  <!-- Slide 3 -->
  <a href="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600"
     data-cge-lightbox
     data-cge-gallery="travel-album"
     data-cge-caption="Misty Evergreen Forest"
     data-cge-subtitle="Pacific Northwest"
     data-cge-thumb="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500" class="w-full h-40 object-cover" alt="Forest">
  </a>

  <!-- Slide 4 -->
  <a href="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600"
     data-cge-lightbox
     data-cge-gallery="travel-album"
     data-cge-caption="Autumn Valley Sunburst"
     data-cge-subtitle="Rolling Hillside"
     data-cge-thumb="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300"
     class="block overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs hover:opacity-90 transition">
    <img src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=500" class="w-full h-40 object-cover" alt="Valley">
  </a>
</div>
```

---

## 2. Multi-Media Mixed Showcase (Image, YouTube, Vimeo, HTML5 Video)

Seamlessly group different media types inside a unified gallery sequence.

```html
<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
  <!-- Image Item -->
  <a href="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600"
     data-cge-lightbox
     data-cge-gallery="multi-media"
     data-cge-caption="Original Photography Still"
     class="block p-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
    <div class="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">Photo Item</div>
    <div class="text-[11px] text-slate-500">Static high-res image</div>
  </a>

  <!-- YouTube Embed Slide -->
  <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
     data-cge-lightbox
     data-cge-gallery="multi-media"
     data-cge-type="youtube"
     data-cge-caption="4K Product Demo (YouTube)"
     class="block p-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
    <div class="font-bold text-xs text-red-600 mb-1">YouTube Stream</div>
    <div class="text-[11px] text-slate-500">16:9 responsive embed</div>
  </a>

  <!-- Vimeo Embed Slide -->
  <a href="https://vimeo.com/76979871"
     data-cge-lightbox
     data-cge-gallery="multi-media"
     data-cge-type="vimeo"
     data-cge-caption="Artistic Motion Piece (Vimeo)"
     class="block p-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
    <div class="font-bold text-xs text-sky-600 mb-1">Vimeo Stream</div>
    <div class="text-[11px] text-slate-500">Cinematic video player</div>
  </a>

  <!-- Local HTML5 Video Slide -->
  <a href="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
     data-cge-lightbox
     data-cge-gallery="multi-media"
     data-cge-type="video"
     data-cge-caption="HTML5 Direct MP4 Video"
     class="block p-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
    <div class="font-bold text-xs text-indigo-600 mb-1">HTML5 Video</div>
    <div class="text-[11px] text-slate-500">Hardware accelerated MP4</div>
  </a>
</div>
```

---

## 3. Ultra High-Res Gigapixel Pan & Zoom Viewer

Open a detailed architectural blueprint or ultra-high-resolution photograph with smooth wheel zoom, double-tap zoom steps, and click-and-drag pan.

```html
<a href="https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=3200"
   data-cge-lightbox
   data-cge-caption="Architectural Blueprint (3200px)"
   data-cge-subtitle="Double-click, scroll mouse wheel, or pinch to inspect fine structural lines"
   class="block p-4 rounded-sm border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-center hover:bg-indigo-50 transition cursor-pointer">
  <div class="text-sm font-bold text-indigo-700 dark:text-indigo-400">🔍 Inspect High-Resolution Blueprint</div>
  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports up to 4x smooth zoom scale with drag panning</p>
</a>
```

---

## 4. Inline HTML Custom Template Modal in Lightbox

Display rich interactive HTML elements or hidden templates inside the lightbox frame using `data-cge-type="inline"`.

```html
<!-- Trigger -->
<button type="button"
        data-cge-lightbox
        data-cge-type="inline"
        href="#product-specs-modal"
        data-cge-caption="Product Technical Specifications"
        class="px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-sm hover:opacity-90 transition">
  Open Inline Technical Specs
</button>

<!-- Hidden Modal Content -->
<div id="product-specs-modal" class="hidden">
  <div class="p-6 max-w-md bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-2xl text-left">
    <div class="flex items-center gap-2 mb-3">
      <span class="px-2 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 text-[10px] font-bold">SPEC SHEET</span>
      <h3 class="text-sm font-bold text-slate-900 dark:text-white">Hardware Details</h3>
    </div>
    <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
      Native ECMAScript 2022 implementation with zero runtime dependencies. Automatically calculates aspect ratios and preloads neighbor items.
    </p>
    <div class="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
      <div class="flex justify-between">
        <span class="text-slate-500">File Size</span>
        <span class="font-semibold text-slate-700 dark:text-slate-300">&lt; 15 KB (gzipped)</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">CSS Requirement</span>
        <span class="font-semibold text-slate-700 dark:text-slate-300">Tailwind CSS v4.3+</span>
      </div>
    </div>
  </div>
</div>
```

---

## 5. Pure JavaScript Programmatic Controller

Launch the lightbox directly from an async API call or button click handler without any markup:

```javascript
import { CGELightbox } from 'tailtools';

async function launchProductInspection(productId) {
  // Fetch high-res assets from backend
  const response = await fetch(`/api/products/${productId}/gallery`);
  const mediaList = await response.json();

  // Open lightbox with dynamic payload
  const lb = CGELightbox.open(mediaList.map(item => ({
    src: item.hd_url,
    thumb: item.thumbnail_url,
    caption: item.title,
    subtitle: item.sku,
    type: item.is_video ? 'video' : 'image'
  })), {
    initialIndex: 0,
    loop: true,
    thumbnails: true,
    zoomable: true
  });

  lb.on('change', ({ index, item }) => {
    console.log(`Inspecting item: ${item.caption} (Index: ${index})`);
  });
}
```

---

## 6. Vertical Swipe-to-Dismiss & Touch Mobile Controls

On mobile devices, users can effortlessly flick down anywhere on the screen to close the lightbox, swipe horizontally to flip through items, or pinch to zoom.

```html
<a href="https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1600"
   data-cge-lightbox
   data-cge-caption="Touch Interaction Test"
   data-cge-subtitle="Swipe horizontally for slides, flick downwards to dismiss, or pinch to zoom"
   class="block p-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
  <div class="text-xs font-bold text-slate-800 dark:text-slate-200">📱 Mobile Gesture Ready</div>
  <p class="text-[11px] text-slate-500 mt-1">Touch swipe-to-dismiss threshold: 80px</p>
</a>
```
