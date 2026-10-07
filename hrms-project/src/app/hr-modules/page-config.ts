/**
 * Config-driven pages for Performance, Recruitment and Learning.
 * One CrudPageComponent renders list + filters + create/edit form + row actions
 * + detail panel with child tables, from a PageConfig.
 */

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'time' | 'email' | 'url'
  | 'select' | 'multiselect' | 'checkbox' | 'file' | 'chips' | 'json';

export interface Lookup {
  /** API path, e.g. '/organisation/api/Department/' */
  endpoint: string;
  /** property to show; may be a function */
  label: string | ((row: any) => string);
  value?: string; // defaults to 'id'
  params?: Record<string, string>;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: any; label: string }[];
  lookup?: Lookup;
  placeholder?: string;
  help?: string;
  default?: any;
  /** grid width out of 12 (default 6) */
  width?: number;
  /** only show on create / edit */
  createOnly?: boolean;
  editOnly?: boolean;
  /** hide when this returns false (receives current form model) */
  showIf?: (model: any) => boolean;
  /** value list for 'chips' fields */
  chipOptions?: string[];
}

export type ColumnType = 'text' | 'date' | 'datetime' | 'money' | 'number' | 'tag' | 'stars' | 'progress' | 'bool' | 'list' | 'percent';

export interface ColumnConfig {
  key: string; // supports dotted paths and *_display / *_label companions
  label: string;
  type?: ColumnType;
  /** for type 'tag': value -> css class (green, blue, orange, red, grey, cyan) */
  tagColors?: Record<string, string>;
  /** read a different key for the tag colour than the label shown */
  colorKey?: string;
  value?: (row: any) => any;
}

export interface ActionConfig {
  label: string;
  icon?: string;
  /** POST <endpoint><id>/<action>/  (row) or <endpoint><action>/ (toolbar) */
  action?: string;
  method?: 'post' | 'get';
  color?: 'green' | 'blue' | 'red' | 'grey' | 'cyan' | 'orange';
  showIf?: (row: any) => boolean;
  confirm?: string;
  /** ask the user for these fields before calling (e.g. reason) */
  prompt?: FieldConfig[];
  /** extra body sent with the request (toolbar actions get current filters merged) */
  body?: (row: any, filters: any) => any;
  /** 'document' opens a printable view using the GET response */
  document?: (data: any) => string;
  /** navigate instead of calling the API */
  route?: (row: any) => string;
}

export interface ChildConfig {
  title: string;
  endpoint: string;
  /** read the rows from this array on the parent row instead of calling the API */
  rowsFrom?: string;
  /** query param + FK field that links the child to the parent row */
  parentKey: string;
  columns: ColumnConfig[];
  fields?: FieldConfig[];
  canAdd?: (parent: any) => boolean;
  canEdit?: (parent: any, row: any) => boolean;
  canDelete?: (parent: any, row: any) => boolean;
  rowActions?: ActionConfig[];
}

export interface StatTile {
  key: string;
  label: string;
  color?: string;
  format?: 'number' | 'percent' | 'money' | 'days';
}

export interface FilterConfig {
  key: string; // query param
  label: string;
  options?: { value: any; label: string }[];
  lookup?: Lookup;
}

export interface PageConfig {
  title: string;
  /** singular name used in form titles, e.g. 'KPI' -> "Create KPI" */
  itemName?: string;
  /** heading of the detail panel; defaults to the first column */
  detailTitle?: (row: any) => string;
  endpoint: string; // e.g. '/performance/api/kpis/'
  /** model name for permission checks, e.g. 'kpi' -> add_kpi / change_kpi */
  model?: string;
  intro?: string;
  columns: ColumnConfig[];
  fields?: FieldConfig[];
  filters?: FilterConfig[];
  defaultParams?: Record<string, string>;
  searchKeys?: string[];
  canCreate?: boolean;
  canEdit?: boolean | ((row: any) => boolean);
  canDelete?: boolean | ((row: any) => boolean);
  rowActions?: ActionConfig[];
  toolbarActions?: ActionConfig[];
  children?: ChildConfig[];
  /** extra read-only facts shown at the top of the detail panel */
  detailFields?: ColumnConfig[];
  stats?: { endpoint: string; tiles: StatTile[] };
  /** use multipart/form-data (file fields) */
  multipart?: boolean;
  emptyText?: string;
}
