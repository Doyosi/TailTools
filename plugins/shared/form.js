export function isSubmitter(element, form) {
  return (element instanceof HTMLButtonElement && element.type === 'submit'
    || element instanceof HTMLInputElement && ['submit', 'image'].includes(element.type))
    && element.form === form;
}

// requestSubmit validates the form and includes a real submitter exactly once.
export function submitConfirmedForm(form, trigger) {
  let hidden;
  try {
    if (!isSubmitter(trigger, form) && trigger.name) {
      hidden = document.createElement('input');
      hidden.type = 'hidden'; hidden.name = trigger.name; hidden.value = trigger.value;
      form.append(hidden);
    }
    if (typeof form.requestSubmit === 'function') form.requestSubmit(isSubmitter(trigger, form) ? trigger : undefined);
    else HTMLFormElement.prototype.submit.call(form);
  } finally { hidden?.remove(); }
}
