export class Consts {
  static APP_NAME: string = 'ACTIVFLOW-CORE-SYSTEM';
  static APP_VERSION: string = '1.0.0';
  static APP_DESCRIPTION: string = 'ActivFlow Core System';
  static PORT_SYSTEM: number = 5525;

  static GUARDIAN_SYSTEM_VERBOSE: boolean = false;

  static DEFAULT_INPUT_LANG: string = 'en';
  static DEFAULT_OUTPUT_LANG: string = 'fr';

  static MSG_UNAUTHORIZED: string =
    'You do not have permission to perform this operation';

  // IN DAYS
  static DEFAULT_DURATION: number = 7;

  static DEFAULT_SETTING_PRIMARY_COLOR: string = '#6366f1';
  static DEFAULT_SETTING_COMPANY_NAME: string = 'ActivFlow';
  static DEFAULT_SETTING_COMPANY_LOGO: string = '';

  static ADMIN_PROFILE: string = 'admin';
  static SUPERVISOR_PROFILE: string = 'supervisor';
  static SAMPLER_PROFILE: string = 'sampler';
  static VIEWER_PROFILE: string = 'viewer';

  static PROFILES: object[] = [
    {
      label: 'Admin',
      value: 'admin',
      description: "Il s'agit du profil Admin",
    },
    {
      label: 'Supervisor',
      value: 'supervisor',
      description: "Il s'agit du profil Supervisor",
    },
    {
      label: 'Sampler',
      value: 'sampler',
      description: "Il s'agit du profil Sampler",
    },
    {
      label: 'Viewer',
      value: 'viewer',
      description: "Il s'agit du profil Viewer",
    },
  ];

  static DEFAULT_USERS: any[] = [
    {
      lastname: 'admin',
      firstname: 'ActivFlow',
      email: 'admin@activflow.com',
      phone: '00000000',
      username: 'admin@activflow.com',
    },
  ];

  static KPI_TYPE_OBJECTIVE: string = 'objective';
  static KPI_TYPE_RESULT: string = 'result';

  static KPI_TYPES: string[] = ['objective', 'result'];

  static KPI_THRESHOLD_SCOPE_HOURLY: string = 'HOURLY';
  static KPI_THRESHOLD_SCOPE_DAILY: string = 'DAILY';
  static KPI_THRESHOLD_SCOPE_WEEKLY: string = 'WEEKLY';
  static KPI_THRESHOLD_SCOPE_MONTHLY: string = 'MONTHLY';
  static KPI_THRESHOLD_SCOPE_GLOBAL: string = 'GLOBAL';

  static KPI_THRESHOLD_SCOPES: string[] = [
    Consts.KPI_THRESHOLD_SCOPE_HOURLY,
    Consts.KPI_THRESHOLD_SCOPE_DAILY,
    Consts.KPI_THRESHOLD_SCOPE_WEEKLY,
    Consts.KPI_THRESHOLD_SCOPE_MONTHLY,
    Consts.KPI_THRESHOLD_SCOPE_GLOBAL,
  ];

  static KPI_THRESHOLD_TARGET_TYPE_USER: string = 'USER';
  static KPI_THRESHOLD_TARGET_TYPE_TEAM: string = 'TEAM';

  static KPI_THRESHOLD_TARGET_TYPES: string[] = [
    Consts.KPI_THRESHOLD_TARGET_TYPE_USER,
    Consts.KPI_THRESHOLD_TARGET_TYPE_TEAM,
  ];

  static DEFAULT_KPI_VALUE_TYPE: string = 'number';

  static DEFAULT_FILE_SIZE: number = 1024 * 1024 * 10; // 10MB

  static FILE_EXTENSIONS_ALLOWED: string[] = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'csv',
    'zip',
    'rar',
  ];

  static IMAGE_EXTENSIONS_ALLOWED: string[] = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
  ];

  static DEFAULT_FIELD_TYPES: object[] = [
    {
      label: 'Simple Text',
      value: 'simple-text',
      status: true,
    },
    {
      label: 'Long Text',
      value: 'long-text',
      status: true,
    },
    {
      label: 'Email',
      value: 'email',
      status: true,
    },
    {
      label: 'Uuid',
      value: 'uuid',
      status: false,
    },
    {
      label: 'Number',
      value: 'number',
      status: true,
    },
    {
      label: 'Integer',
      value: 'integer',
      status: true,
    },
    {
      label: 'Float',
      value: 'float',
      status: true,
    },
    {
      label: 'Date',
      value: 'date',
      status: true,
    },
    {
      label: 'Time',
      value: 'time',
      status: true,
    },
    {
      label: 'Datetime',
      value: 'datetime',
      status: true,
    },
    {
      label: 'Boolean',
      value: 'boolean',
      status: false,
    },
    {
      label: 'Select',
      value: 'select',
      status: true,
    },
    {
      label: 'Checkbox',
      value: 'checkbox',
      status: false,
    },
    {
      label: 'File',
      value: 'file',
      status: true,
    },
    {
      label: 'Location',
      value: 'location',
      status: true,
    },
    {
      label: 'Image',
      value: 'image',
      status: true,
    },
    {
      label: 'Multi Image',
      value: 'multi-image',
      status: true,
    },
  ];

  static ROLES: object = {
    admin: [
      'change_password',
      'profile_find_all',
      'field_type_find_all',
      'field_type_find_one',
      'user_create',
      'user_find_all',
      'user_search',
      'user_find_one',
      'user_find_me',
      'user_update',
      'user_update_password',
      'user_change_status',
      'user_delete',
      'user_authorize_activity',

      'kpi_link',
      'kpi_create',
      'kpi_find_all',
      'kpi_find_all_by_activity',
      'kpi_search',
      'kpi_find_one',
      'kpi_update',
      'kpi_fill_objective',

      'area_get_activity_team_areas',
      'area_attribute',
      'area_create',
      'area_find_all',
      'area_search',
      'area_find_one',
      'area_update',
      'area_change_status',
      'area_delete',

      'activity_dashboard',
      'activity_kpi_objective_dashboard',
      'activity_kpi_result_dashboard',
      'activity_report_team_dashboard',
      'activity_create',
      'activity_find_all',
      'activity_search',
      'activity_find_one',
      'activity_update',
      'activity_change_status',
      'activity_delete',
      'team_create',
      'team_find_all',
      'team_search',
      'team_find_one',
      'team_update',
      'team_change_status',
      'team_delete',
      'form_create',
      'form_find_all',
      'form_find_one',
      'form_update',
      'form_change_status',
      'form_delete',

      'team_add_member',
      'activity_duplicate',
      'activity_add_team',
      'activity_add_form',
      'form_add_field',
      'form_update_fields',
      'form_duplicate',
      'store_show',
      'store_list_session',
      'store_show_session',
    ],
    supervisor: [
      'change_password',
      'user_find_me',
      'field_type_find_all',
      'field_type_find_one',
      'store_save',
      'store_show',
      'store_list_session',
      'store_show_session',
      'kpi_find_all',
      'kpi_find_all_by_activity',
      'kpi_fill_result',
      'activity_find_one',
      'activity_fill_kpi',
      'form_find_one',
    ],
    sampler: [
      'change_password',
      'user_find_me',
      'field_type_find_all',
      'field_type_find_one',
      'store_save',
      'store_show',
      'store_list_session',
      'store_show_session',
      'form_find_one',
    ],
    viewer: ['change_password', 'user_find_me'],
  };
}
