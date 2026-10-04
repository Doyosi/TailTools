# CGEForm Practical Examples

Explore code recipes showcasing common use cases for `CGEForm`.

---

## 1. File Upload with Upload Progress Bar

Use the `xhr` driver or `axios` driver to track real-time upload progress percentages:

```html
<form id="upload-form" action="/api/documents" method="POST" enctype="multipart/form-data">
  <div class="cge-form-group">
    <label for="doc-file">Select PDF Document</label>
    <input type="file" name="document" id="doc-file" class="cge-input" accept=".pdf">
    <span class="cge-feedback hidden" data-cge-feedback="document"></span>
  </div>

  <!-- Progress Bar Container -->
  <div id="progress-wrapper" class="w-full bg-slate-100 rounded-full h-2 mb-4 hidden overflow-hidden">
    <div id="progress-bar" class="bg-indigo-600 h-2 rounded-full transition-all duration-150" style="width: 0%"></div>
  </div>

  <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-sm">
    Upload Document
  </button>
</form>

<script type="module">
  import { CGEForm } from 'tailtools';

  const form = new CGEForm('#upload-form', {
    driver: 'xhr',
    feedback: 'toast'
  });

  const progressWrapper = document.getElementById('progress-wrapper');
  const progressBar = document.getElementById('progress-bar');

  form.on('submit', () => {
    progressWrapper.classList.remove('hidden');
    progressBar.style.width = '0%';
  });

  form.on('progress', ({ percent }) => {
    progressBar.style.width = `${percent}%`;
  });

  form.on('complete', () => {
    setTimeout(() => progressWrapper.classList.add('hidden'), 1000);
  });
</script>
```

---

## 2. Pluggable Notification Drivers

Easily switch notification targets between `CGEToast`, `CGEAlert`, browser dialogs, or `SweetAlert2`:

```javascript
import { CGEForm } from 'tailtools';

// Example A: Toast on success, Modal Alert on validation errors
const formA = new CGEForm('#form-a', {
  feedback: {
    onSuccess: 'toast',
    onValidationError: 'alert',
    onError: 'alert'
  }
});

// Example B: External SweetAlert2 Bridge
// If window.Swal is loaded on your site, CGEForm bridges to it automatically:
const formB = new CGEForm('#form-b', {
  feedback: {
    type: 'sweetalert',
    options: {
      confirmButtonColor: '#4f46e5'
    }
  }
});

// Example C: Custom notification callback
const formC = new CGEForm('#form-c', {
  feedback: {
    type: 'custom',
    onSuccess: (status, message, payload) => {
      console.log('Custom success banner:', message);
    }
  }
});
```

---

## 3. Preserving Pre-Disabled Elements (State Memory Guard)

In edit forms, certain fields (e.g. `user_id`, immutable `email`) may be locked:

```html
<form id="profile-edit-form" action="/user/profile" method="POST">
  <div class="cge-form-group">
    <label>Account ID (System Locked)</label>
    <input type="text" name="id" value="USR-9941" disabled class="cge-input bg-slate-100 cursor-not-allowed">
  </div>

  <div class="cge-form-group">
    <label>Display Name</label>
    <input type="text" name="name" value="Jane Doe" class="cge-input">
    <span class="cge-feedback hidden" data-cge-feedback="name"></span>
  </div>

  <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-sm">Save Changes</button>
</form>

<script type="module">
  import { CGEForm } from 'tailtools';

  // Even if the server responds with a 422 error on "name",
  // CGEForm will NOT re-enable the pre-disabled "id" field!
  new CGEForm('#profile-edit-form');
</script>
```

---

## 4. Multi-Language Localization Engine

Dynamically set or switch languages globally:

```javascript
import { CGEForm } from 'tailtools';

// Define Turkish translations
CGEForm.setLocale('tr', {
  'success': 'Başarılı!',
  'success-message': 'İşlem başarıyla tamamlandı.',
  'error': 'Hata!',
  'error-message': 'Lütfen hatalı alanları düzeltip tekrar deneyin.',
  'save-button': 'Kaydet',
  'loading-indicator': '<span class="animate-spin inline-block mr-2">⏳</span> Yükleniyor...',
});

// Switch to Spanish translations
CGEForm.setLocale('es', {
  'success': '¡Éxito!',
  'success-message': 'Operación completada con éxito.',
  'error': '¡Error!',
  'error-message': 'Por favor corrija los errores marcados.',
  'save-button': 'Guardar',
  'loading-indicator': '<span class="animate-spin inline-block mr-2">⏳</span> Cargando...',
});
```
