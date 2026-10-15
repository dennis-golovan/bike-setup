import type { BikeType, PressureUnit, ShockType, TerrainType, Weather, WeightUnit, WheelSize } from '../data/model';

export const t = {
  back: 'Назад',
  cancel: 'Скасувати',
  delete: 'Видалити',
  edit: 'Редагувати',
  save: 'Зберегти',
  add: 'Додати',
  decrease: 'Зменшити',
  increase: 'Збільшити',
  toggleSign: 'Змінити знак',
  yes: 'Так',
  no: 'Ні',
  missing: '—',
  notSet: 'Не вказано',

  bikeListTitle: 'Мої велосипеди',
  bikeListEmpty: 'Ще немає жодного велосипеда.\nДодай свій байк, а потім записуй сетапи під кожну місцевість.',
  bikeAdd: 'Велосипед',
  bikeNewTitle: 'Новий велосипед',
  bikeEditTitle: 'Редагування велосипеда',
  bikeInfoTitle: 'Велосипед',
  bikeName: 'Назва',
  bikeNameHint: 'Напр. Spectral 29',
  bikeType: 'Тип',
  bikeWheelSize: 'Колеса',
  bikeForkModel: 'Вилка',
  bikeForkModelHint: 'Напр. Fox 36 Factory Grip2',
  bikeShockType: 'Амортизатор',
  bikeShockModel: 'Модель амортизатора',
  bikeShockModelHint: 'Напр. RockShox Super Deluxe',
  bikeNoSetupsYet: 'Ще немає сетапів',
  bikeLastSetup: (date: string) => `останній ${date}`,
  bikeDeleteTitle: 'Видалити велосипед?',
  bikeDeleteText: 'Разом із велосипедом буде видалено всі його сетапи.',

  setupAdd: 'Новий сетап',
  setupNewTitle: 'Новий сетап',
  setupEditTitle: 'Редагування сетапу',
  setupListEmpty: 'Ще немає сетапів.\nДодай перший: тиск, sag, клацання та шини.',
  setupBaseGroup: 'Базовий сетап',
  setupNoLocation: 'Без місцевості (базовий)',
  setupCurrent: 'Актуальний',
  setupHistory: (count: number) => `Історія (${count})`,
  setupCopy: 'Новий на основі цього',
  setupEmptyValues: 'Значення не заповнені',
  setupPrefilledFrom: (date: string) => `За основу взято сетап від ${date}\nЗміни лише те, що крутив.`,
  setupNotesHint: 'Як їхало, що хочеш спробувати наступного разу',
  setupDeleteTitle: 'Видалити сетап?',
  setupDeleteText: 'Цей запис зникне з історії велосипеда.',

  sectionGeneral: 'Загальне',
  sectionFork: 'Вилка',
  sectionShock: 'Амортизатор',
  sectionTires: 'Колеса',
  sectionNotFilled: 'Не заповнено',
  clicksHint: 'Клацання рахуються від повністю закритого положення',

  fieldLocation: 'Місцевість',
  fieldDate: 'Дата',
  fieldWeather: 'Погода',
  fieldTemperature: 'Температура',
  fieldRiderWeight: 'Вага райдера з екіпіровкою',
  fieldRiderWeightShort: 'Вага з екіпом',
  fieldPressure: 'Тиск',
  fieldSpringRate: 'Пружина',
  fieldSag: 'Sag',
  fieldTokens: 'Токени',
  fieldRebound: 'Rebound',
  fieldLsc: 'LSC',
  fieldHsc: 'HSC',
  fieldFrontPressure: 'Тиск переднього колеса',
  fieldRearPressure: 'Тиск заднього колеса',
  fieldFrontPressureShort: 'Перед',
  fieldRearPressureShort: 'Зад',
  fieldFrontTire: 'Покришка перед',
  fieldRearTire: 'Покришка зад',
  fieldFrontInsert: 'Вставка перед',
  fieldRearInsert: 'Вставка зад',
  fieldTubeless: 'Безкамерка (tubeless)',
  fieldNotes: 'Нотатки',
  tireModelHint: 'Напр. Maxxis Assegai 2.5 MaxxGrip',

  summaryFork: 'Вилка',
  summaryShock: 'Аморт',
  summaryTires: 'Шини',

  locationListTitle: 'Місцевості',
  locationListEmpty: 'Ще немає місцевостей.\nДодай місця, де катаєш, щоб тримати окремий сетап під кожне.',
  locationAdd: 'Місцевість',
  locationAddInline: '+ Нова місцевість…',
  locationNewTitle: 'Нова місцевість',
  locationEditTitle: 'Редагування місцевості',
  locationName: 'Назва',
  locationNameHint: 'Напр. Буковель байк-парк',
  locationTerrain: 'Тип місцевості',
  locationLatitude: 'Широта',
  locationLongitude: 'Довгота',
  locationUseCurrent: 'Де я',
  locationLocating: 'Шукаю…',
  locationOpenMap: 'На мапі',
  locationNotesHint: 'Ґрунт, корені, каміння, особливості трас',
  locationFetchFailed: 'Не вдалося визначити місцезнаходження. Перевір, чи увімкнена геолокація.',
  locationPermissionDenied: 'Без дозволу на геолокацію координати можна ввести вручну',
  locationUnsupported: 'Цей браузер не підтримує геолокацію',
  locationDeleteTitle: 'Видалити місцевість?',
  locationDeleteText: "Сетапи, прив'язані до цієї місцевості, залишаться, але стануть базовими.",

  settingsTitle: 'Налаштування',
  settingsUnits: 'Одиниці виміру',
  settingsSuspensionPressure: 'Тиск підвіски',
  settingsTirePressure: 'Тиск шин',
  settingsWeight: 'Вага',
  settingsUnitsHint:
    'Значення зберігаються в метричних одиницях і перераховуються при показі, тож одиниці можна міняти будь-коли.',
  settingsBackup: 'Резервна копія',
  settingsBackupHint:
    'Дані зберігаються лише на цьому пристрої. Періодично зберігай копію у файл: так їх можна відновити або перенести на інший телефон.',
  settingsExport: 'Зберегти у файл',
  settingsImport: 'Відновити з файлу',
  settingsImportDone: (added: number, updated: number) => `Готово: нових записів ${added}, оновлено ${updated}`,
  settingsImportFailed: 'Це не схоже на файл резервної копії Bike Setup',
  settingsStorage: 'Сховище',
  settingsStoragePersistent: 'Постійне: браузер не видалятиме дані',
  settingsStorageBestEffort: 'Звичайне: при нестачі місця браузер може очистити дані, тож роби копії',
  settingsAbout: 'Про застосунок',
  settingsVersion: (version: string) => `Версія ${version}`,

  installTitle: 'Встанови на телефон',
  installIos: 'Натисни «Поділитись» у Safari, а потім «На екран Додому». Застосунок відкриватиметься на весь екран і працюватиме без інтернету.',
  installAndroid: 'Додай застосунок на головний екран: він відкриватиметься на весь екран і працюватиме без інтернету.',
  installButton: 'Встановити',
  installDismiss: 'Зрозуміло',
} as const;

export const bikeTypeLabels: Record<BikeType, string> = {
  TRAIL: 'Trail',
  ENDURO: 'Enduro',
  DOWNHILL: 'Downhill',
  XC: 'XC',
  DIRT_JUMP: 'Dirt / Street',
  E_BIKE: 'E-bike',
  OTHER: 'Інший',
};

export const wheelSizeLabels: Record<WheelSize, string> = {
  TWENTY_NINE: '29"',
  TWENTY_SEVEN_FIVE: '27.5"',
  MULLET: 'Mullet (29/27.5)',
  TWENTY_SIX: '26"',
};

export const shockTypeLabels: Record<ShockType, string> = {
  AIR: 'Повітряний',
  COIL: 'Пружинний',
  NONE: 'Немає (хардтейл)',
};

export const terrainLabels: Record<TerrainType, string> = {
  TRAIL: 'Трейл',
  ENDURO: 'Ендуро-траса',
  BIKE_PARK: 'Байк-парк',
  DOWNHILL: 'Даунхіл',
  XC: 'Крос-кантрі',
  PUMP_TRACK: 'Памп-трек',
  OTHER: 'Інше',
};

export const weatherLabels: Record<Weather, string> = {
  DRY: 'Сухо',
  MIXED: 'Місцями волого',
  WET: 'Мокро',
  MUD: 'Багнюка',
};

export const pressureUnitLabels: Record<PressureUnit, string> = { BAR: 'bar', PSI: 'psi' };

export const weightUnitLabels: Record<WeightUnit, string> = { KG: 'кг', LB: 'lb' };

type PluralForms = Record<'one' | 'few' | 'many' | 'other', string>;

const pluralRules = new Intl.PluralRules('uk-UA');

function plural(count: number, forms: PluralForms): string {
  const category = pluralRules.select(count) as keyof PluralForms;
  return (forms[category] ?? forms.other).replace('%d', String(count));
}

export const setupCount = (count: number): string =>
  plural(count, { one: '%d сетап', few: '%d сетапи', many: '%d сетапів', other: '%d сетапу' });

export const tokenCount = (count: number): string =>
  plural(count, { one: '%d токен', few: '%d токени', many: '%d токенів', other: '%d токена' });

const dateFormatter = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}
