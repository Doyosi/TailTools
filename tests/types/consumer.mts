import { CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone, CGEDataTable, CGEDataGrid, CGETabs, CGEAccordion, CGECollapse, init, initTailTools } from 'tailtools';
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
import DataTable from 'tailtools/plugins/CGEDataTable';
import DataGrid from 'tailtools/plugins/CGEDataGrid';
import Tabs from 'tailtools/plugins/CGETabs';
import Accordion from 'tailtools/plugins/CGEAccordion';
import { CGESelect as ShortSelect, type CGESelectOptions } from 'tailtools/CGESelect';
import { CGEDataTable as ShortDataTable, type CGEDataTableOptions } from 'tailtools/CGEDataTable';
import { CGEDataGrid as ShortDataGrid, type CGEDataGridOptions } from 'tailtools/CGEDataGrid';
import { CGETabs as ShortTabs, type CGETabsOptions } from 'tailtools/CGETabs';
import { CGEAccordion as ShortAccordion, type CGEAccordionOptions, type CGECollapseOptions } from 'tailtools/CGEAccordion';
import type { CGESelectEventMap } from '../../plugins/CGESelect/index.js';
import type { CGEDropzoneOptions } from '../../plugins/CGEDropzone/index.js';

const constructors = [CGEModal, CGEToast, CGEAlert, CGEForm, CGEDrawer, CGELightbox, CGEActionButton, CGESelect, CGEDropzone, CGEDataTable, CGEDataGrid, CGETabs, CGEAccordion, CGECollapse,
  Modal, Toast, Alert, Form, Drawer, Lightbox, Action, Select, Dropzone, DataTable, DataGrid, Tabs, Accordion, ShortSelect, ShortDataTable, ShortDataGrid, ShortTabs, ShortAccordion];
void constructors;

const accOpts: CGEAccordionOptions = { exclusive: true, urlSync: 'hash', onOpen: null };
const accordion = new Accordion(document.createElement('div'), accOpts);
accordion.open('item-1');
accordion.toggle('item-2');
const colOpts: CGECollapseOptions = { defaultOpen: false, onToggle: null };
const collapse = new CGECollapse(document.createElement('div'), colOpts);
collapse.toggle();
void [accordion, collapse];
const accordionIcon: string = accordion.options.ui.icon;
const collapseControls: HTMLElement[] = collapse.triggers;
void [accordionIcon, collapseControls];
init(document); initTailTools(document.body);
TailTools.init(document);
const tabsOptions: CGETabsOptions = { urlSync: 'query', indicator: 'pill', onShow: null };
const tabs = new Tabs(document.createElement('div'), tabsOptions);
tabs.show('profile');
const tabLoadingLabel: string = tabs.options.translations.loading;
const tabBaseClass: string = tabs.options.ui.tab;
void [tabLoadingLabel, tabBaseClass];
tabs.on('cge:tabs:show', detail => { const tabId: string = detail.tabId; void tabId; });
// @ts-expect-error invalid event
tabs.on('cge:tabs:invalid', () => {});

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

// Standalone modules and the two collection plugins must match root/default exports.
import { CGEFilter, CGESort, CGEPagination, CGEResponsive } from 'tailtools';
import GridFilter from 'tailtools/plugins/CGEDataGrid/modules/CGEFilter.js';
import GridSort from 'tailtools/plugins/CGEDataGrid/modules/CGESort.js';
import GridPagination from 'tailtools/plugins/CGEDataGrid/modules/CGEPagination.js';
const gridOptions: CGEDataGridOptions = { source: 'json', data: [{ id: 0 }], selectable: true, layoutMode: 'list' };
const grid = new DataGrid(document.createElement('div'), gridOptions);
grid.on('selection-change', detail => { const ids: string[] = detail.selectedIds; void ids; });
grid.on('fetch-error', detail => void detail.error);
const tableOptions: CGEDataTableOptions = { source: 'json', data: [{ id: 0 }], columns: [{ key: 'id', sortable: false }] };
const table = new DataTable(document.createElement('table'), tableOptions);
table.toggleSelectRow(0);
table.on('rows:deleted', detail => { const ids: string[] = detail.ids; void ids; });
new CGESort().attachHeaders(document.createElement('thead'));
const filter: CGEFilter = new TailTools.CGEFilter({ onChange: detail => void detail.serialized });
const pager: CGEPagination = new TailTools.CGEPagination({ perPage: 'All' });
const sort: CGESort = new TailTools.CGESort();
const responsive: CGEResponsive = new TailTools.CGEResponsive({ table: '#users' });
void [filter, pager, sort, responsive, new GridFilter(), new GridSort(), new GridPagination()];
// @ts-expect-error the grid has only grid/list views
grid.setViewMode('cards');
// @ts-expect-error standalone filter notifications use onChange, not on()
filter.on('filter', () => {});
import AutoTailTools, { destroyTailTools } from 'tailtools/auto';
destroyTailTools(document.body);
TailTools.destroy(document);
AutoTailTools.init(document);
window.TailToolsConfig = { autoInit: false, livewire: true };
