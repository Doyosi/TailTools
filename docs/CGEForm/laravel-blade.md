# Laravel Blade Integration Guide for CGEForm

Learn how to integrate `CGEForm` seamlessly into Laravel Blade templates, form requests, and controllers.

---

## 1. Reusable Blade Components

Create modern, reusable components in `resources/views/components/`.

### `<x-cge-form>` Component

Save as `resources/views/components/cge-form.blade.php`:

```blade
@props([
    'action' => '#',
    'method' => 'POST',
    'driver' => 'axios',
    'feedback' => 'toast',
    'loadingText' => null,
    'resetOnSuccess' => false,
])

@php
    $spoofMethod = in_array(strtoupper($method), ['PUT', 'PATCH', 'DELETE']);
@endphp

<form
    action="{{ $action }}"
    method="{{ $spoofMethod ? 'POST' : $method }}"
    data-cge-form
    data-cge-driver="{{ $driver }}"
    data-cge-feedback="{{ is_array($feedback) ? json_encode($feedback) : $feedback }}"
    @if($loadingText) data-cge-loading-text="{{ $loadingText }}" @endif
    @if($resetOnSuccess) data-cge-reset-on-success="true" @endif
    {{ $attributes->merge(['class' => 'space-y-4']) }}
>
    @csrf
    @if($spoofMethod)
        @method($method)
    @endif

    {{ $slot }}
</form>
```

### `<x-cge-form-group>` Component

Save as `resources/views/components/cge-form-group.blade.php`:

```blade
@props([
    'name',
    'label' => null,
    'help' => null,
    'helpPosition' => 'bottom',
])

<div {{ $attributes->merge(['class' => 'cge-form-group']) }}>
    @if($label)
        <label for="{{ $attributes->get('id', $name) }}">{{ $label }}</label>
    @endif

    @if($help && $helpPosition === 'top')
        <p class="cge-help-top" data-cge-help="top">{{ $help }}</p>
    @endif

    {{ $slot }}

    @if($help && $helpPosition === 'bottom')
        <p class="cge-help-bottom" data-cge-help="bottom">{{ $help }}</p>
    @endif

    <span class="cge-feedback hidden" data-cge-feedback="{{ $name }}"></span>
</div>
```

---

## 2. Practical Blade View Examples

### Example: User Registration Form with Nested & Array Fields

```blade
<x-cge-form
    :action="route('users.store')"
    method="POST"
    feedback="toast"
    loading-text="Creating Account..."
    reset-on-success
>
    <!-- Simple Input -->
    <x-cge-form-group name="name" label="Full Name">
        <input type="text" name="name" id="name" class="cge-input" placeholder="Alex Rivera">
    </x-cge-form-group>

    <!-- Email Input -->
    <x-cge-form-group name="email" label="Email Address">
        <input type="email" name="email" id="email" class="cge-input" placeholder="alex@example.com">
    </x-cge-form-group>

    <!-- Numeric Array Inputs (choices[]) -->
    <div class="space-y-2">
        <label class="block text-sm font-semibold text-slate-700">Select Priorities</label>
        
        <x-cge-form-group name="choices.0">
            <input type="text" name="choices[]" class="cge-input" placeholder="Priority Item #1">
        </x-cge-form-group>

        <x-cge-form-group name="choices.1">
            <input type="text" name="choices[]" class="cge-input" placeholder="Priority Item #2">
        </x-cge-form-group>
    </div>

    <!-- Associative Keyed Array (choices2[a], choices2[b]) -->
    <div class="grid grid-cols-2 gap-4">
        <x-cge-form-group name="choices2.a" label="Option A">
            <input type="text" name="choices2[a]" class="cge-input" placeholder="Primary option">
        </x-cge-form-group>

        <x-cge-form-group name="choices2.b" label="Option B">
            <input type="text" name="choices2[b]" class="cge-input" placeholder="Secondary option">
        </x-cge-form-group>
    </div>

    <!-- Deeply Nested Object (user.profile.bio) -->
    <x-cge-form-group name="user.profile.bio" label="Biographical Summary">
        <textarea name="user[profile][bio]" class="cge-input" rows="3"></textarea>
    </x-cge-form-group>

    <!-- Submit Button -->
    <div class="pt-4 flex justify-end">
        <button type="submit" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-sm">
            Save User
        </button>
    </div>
</x-cge-form>
```

---

## 3. Laravel Controller & FormRequest Handling

### Laravel FormRequest

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'choices' => ['required', 'array', 'min:1'],
            'choices.*' => ['required', 'string', 'min:3'],
            'choices2.a' => ['required', 'string'],
            'user.profile.bio' => ['nullable', 'string', 'max:500'],
        ];
    }
}
```

When validation fails, Laravel automatically responds with an HTTP **422 Unprocessable Entity** JSON payload:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email address has already been taken."],
    "choices.0": ["The choices.0 field must be at least 3 characters."],
    "choices2.a": ["Option A is required."]
  }
}
```

`CGEForm` catches this response automatically, maps `choices.0` to the corresponding input, highlights the error border in red, removes `.hidden` from `<span data-cge-feedback="choices.0">`, and displays a warning notification!

### Controller Success & Redirect Responses

```php
namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        // Option A: Success response with message
        return response()->json([
            'status' => 'success',
            'message' => 'User profile created successfully!',
            'data' => $user
        ]);

        // Option B: Success response with automated client redirect
        // return response()->json([
        //     'message' => 'Account setup complete! Redirecting...',
        //     'redirect' => route('users.index')
        // ]);
    }
}
```
