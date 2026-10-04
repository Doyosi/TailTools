import { CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone, init, initTailTools } from 'tailtools';
import TailTools from 'tailtools';
import Modal from 'tailtools/plugins/CGEModal';
import Toast from 'tailtools/plugins/CGEToast';
import Alert from 'tailtools/plugins/CGEAlert';
import Form from 'tailtools/plugins/CGEForm';
import Drawer from 'tailtools/plugins/CGEDrawer';
import Lightbox from 'tailtools/plugins/CGELightbox';
import Action from 'tailtools/plugins/CGEActionButton';
import Select from 'tailtools/plugins/CGESelect';
import Dropzone from 'tailtools/plugins/CGEDropzone';
import { CGESelect as ShortSelect, type CGESelectOptions } from 'tailtools/CGESelect';
import type { CGESelectEventMap } from '../../plugins/CGESelect/index.js';
import type { CGEDropzoneOptions } from '../../plugins/CGEDropzone/index.js';

const constructors = [CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone,
  Modal, Toast, Alert, Form, Drawer, Lightbox, Action, Select, Dropzone, ShortSelect];
void constructors;
init(document); initTailTools(document.body);
TailTools.init(document);
const options: CGESelectOptions = { multiple: true, asyncSource: { url: '/users', method: 'POST' } };
const select = new Select(document.createElement('select'), options);
select.on('opened', (detail: CGESelectEventMap['opened']) => detail.instance.close());
select.on('change', detail => { const value: string | string[] = detail.value; void value; });
const trigger: HTMLDivElement = select.trigger; void trigger;
const dropOptions: CGEDropzoneOptions = { uploadMode: 'form' };
const cleared: Promise<void> = new Dropzone(document.createElement('div'), dropOptions).clear({ remote: false }); void cleared;
// @ts-expect-error misspelled lifecycle event must be rejected
select.on('opend', () => {});
// @ts-expect-error remote option uses URL string
const invalid: CGESelectOptions = { asyncSource: { url: 123 } }; void invalid;
