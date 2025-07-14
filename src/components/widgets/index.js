// Widget Components Export
export { default as ClockWidget } from './ClockWidget';
export { default as PhotosWidget } from './PhotosWidget';
export { default as NotesWidget } from './NotesWidget';
export { default as WeatherWidget } from './WeatherWidget';

// Widget Registry for dynamic loading
export const WIDGET_TYPES = {
  CLOCK: 'clock',
  PHOTOS: 'photos',
  NOTES: 'notes',
  WEATHER: 'weather',
};

// Widget Configuration
export const WIDGET_CONFIGS = {
  [WIDGET_TYPES.CLOCK]: {
    name: 'Reloj',
    description: 'Muestra la hora actual con formato personalizable',
    icon: 'time-outline',
    component: 'ClockWidget',
    defaultProps: {
      size: 'medium',
      theme: 'light',
      showDate: true,
      format24h: false,
      showSeconds: true,
    },
    sizes: ['small', 'medium', 'large'],
    themes: ['light', 'dark', 'gradient'],
    settings: [
      { key: 'showDate', label: 'Mostrar fecha', type: 'boolean' },
      { key: 'format24h', label: 'Formato 24 horas', type: 'boolean' },
      { key: 'showSeconds', label: 'Mostrar segundos', type: 'boolean' },
    ],
  },
  [WIDGET_TYPES.PHOTOS]: {
    name: 'Fotos',
    description: 'Galería de fotos con diferentes vistas',
    icon: 'images-outline',
    component: 'PhotosWidget',
    defaultProps: {
      size: 'medium',
      theme: 'light',
      maxPhotos: 6,
      showTitle: true,
      layout: 'grid',
    },
    sizes: ['small', 'medium', 'large'],
    themes: ['light', 'dark', 'gradient'],
    settings: [
      { key: 'maxPhotos', label: 'Máximo de fotos', type: 'number', min: 1, max: 12 },
      { key: 'showTitle', label: 'Mostrar título', type: 'boolean' },
      { key: 'layout', label: 'Diseño', type: 'select', options: ['grid', 'carousel', 'list'] },
    ],
  },
  [WIDGET_TYPES.NOTES]: {
    name: 'Notas',
    description: 'Notas rápidas y recordatorios',
    icon: 'document-text-outline',
    component: 'NotesWidget',
    defaultProps: {
      size: 'medium',
      theme: 'light',
      maxNotes: 3,
      showTitle: true,
      editable: true,
    },
    sizes: ['small', 'medium', 'large'],
    themes: ['light', 'dark', 'gradient'],
    settings: [
      { key: 'maxNotes', label: 'Máximo de notas', type: 'number', min: 1, max: 10 },
      { key: 'showTitle', label: 'Mostrar título', type: 'boolean' },
      { key: 'editable', label: 'Editable', type: 'boolean' },
    ],
  },
  [WIDGET_TYPES.WEATHER]: {
    name: 'Clima',
    description: 'Información meteorológica actual',
    icon: 'sunny-outline',
    component: 'WeatherWidget',
    defaultProps: {
      size: 'medium',
      theme: 'light',
      showForecast: false,
      showDetails: true,
      units: 'metric',
    },
    sizes: ['small', 'medium', 'large'],
    themes: ['light', 'dark', 'gradient'],
    settings: [
      { key: 'showForecast', label: 'Mostrar pronóstico', type: 'boolean' },
      { key: 'showDetails', label: 'Mostrar detalles', type: 'boolean' },
      { key: 'units', label: 'Unidades', type: 'select', options: ['metric', 'imperial'] },
    ],
  },
};

// Widget Factory Function
export const createWidget = (type, props = {}) => {
  const config = WIDGET_CONFIGS[type];
  if (!config) {
    throw new Error(`Widget type "${type}" not found`);
  }

  return {
    type,
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    props: {
      ...config.defaultProps,
      ...props,
    },
    config,
  };
};

// Widget Validation
export const validateWidget = (widget) => {
  if (!widget.type || !WIDGET_CONFIGS[widget.type]) {
    return { valid: false, error: 'Tipo de widget inválido' };
  }

  const config = WIDGET_CONFIGS[widget.type];
  const props = widget.props || {};

  // Validate size
  if (props.size && !config.sizes.includes(props.size)) {
    return { valid: false, error: `Tamaño "${props.size}" no válido para widget ${config.name}` };
  }

  // Validate theme
  if (props.theme && !config.themes.includes(props.theme)) {
    return { valid: false, error: `Tema "${props.theme}" no válido para widget ${config.name}` };
  }

  // Validate settings
  for (const setting of config.settings) {
    const value = props[setting.key];
    if (value !== undefined) {
      switch (setting.type) {
        case 'number':
          if (typeof value !== 'number' || 
              (setting.min !== undefined && value < setting.min) ||
              (setting.max !== undefined && value > setting.max)) {
            return { valid: false, error: `Valor "${value}" no válido para ${setting.label}` };
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            return { valid: false, error: `Valor "${value}" debe ser verdadero o falso` };
          }
          break;
        case 'select':
          if (!setting.options.includes(value)) {
            return { valid: false, error: `Valor "${value}" no es una opción válida para ${setting.label}` };
          }
          break;
      }
    }
  }

  return { valid: true };
};

// Widget Categories
export const WIDGET_CATEGORIES = {
  PRODUCTIVITY: {
    name: 'Productividad',
    icon: 'briefcase-outline',
    widgets: [WIDGET_TYPES.NOTES, WIDGET_TYPES.CLOCK],
  },
  MEDIA: {
    name: 'Multimedia',
    icon: 'images-outline',
    widgets: [WIDGET_TYPES.PHOTOS],
  },
  INFORMATION: {
    name: 'Información',
    icon: 'information-circle-outline',
    widgets: [WIDGET_TYPES.WEATHER],
  },
};

// Helper Functions
export const getWidgetsByCategory = (category) => {
  const categoryConfig = WIDGET_CATEGORIES[category];
  if (!categoryConfig) return [];
  
  return categoryConfig.widgets.map(type => ({
    type,
    ...WIDGET_CONFIGS[type],
  }));
};

export const getAllWidgets = () => {
  return Object.keys(WIDGET_CONFIGS).map(type => ({
    type,
    ...WIDGET_CONFIGS[type],
  }));
};

export const getWidgetConfig = (type) => {
  return WIDGET_CONFIGS[type];
};

// Widget Layout Utilities
export const calculateWidgetLayout = (widgets, containerWidth) => {
  const layout = [];
  let currentRow = [];
  let currentRowWidth = 0;
  const margin = 16;

  widgets.forEach((widget, index) => {
    const config = WIDGET_CONFIGS[widget.type];
    const widgetWidth = config.defaultProps.size === 'small' ? containerWidth * 0.4 :
                      config.defaultProps.size === 'medium' ? containerWidth * 0.6 :
                      containerWidth * 0.8;

    if (currentRowWidth + widgetWidth + margin > containerWidth) {
      // Start new row
      layout.push([...currentRow]);
      currentRow = [{ ...widget, width: widgetWidth }];
      currentRowWidth = widgetWidth;
    } else {
      // Add to current row
      currentRow.push({ ...widget, width: widgetWidth });
      currentRowWidth += widgetWidth + margin;
    }
  });

  // Add last row
  if (currentRow.length > 0) {
    layout.push(currentRow);
  }

  return layout;
};

// Export everything as default for easier importing
export default {
  ClockWidget,
  PhotosWidget,
  NotesWidget,
  WeatherWidget,
  WIDGET_TYPES,
  WIDGET_CONFIGS,
  WIDGET_CATEGORIES,
  createWidget,
  validateWidget,
  getWidgetsByCategory,
  getAllWidgets,
  getWidgetConfig,
  calculateWidgetLayout,
};
