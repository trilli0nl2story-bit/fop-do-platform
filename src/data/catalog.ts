export interface CatalogDocument {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  ageGroup: string;
  price: number;
  fileType: 'PDF' | 'DOCX' | 'PPT';
  program: 'ФОП ДО' | 'ФАОП ДО' | 'Универсальный';
  programSlug: 'fop-do' | 'faop-do' | 'universal';
  developmentFeature: 'none' | 'tnr' | 'zpr' | 'ras' | 'onr';
  views: number;
  downloads: number;
  author: string;
}

export const catalogDocuments: CatalogDocument[] = [
  {
    id: 1, slug: 'konspekt-osennie-listia', title: 'Конспект занятия "Осенние листья"',
    description: 'Занятие по экологическому воспитанию с элементами творчества для детей среднего дошкольного возраста. Включает пошаговый план, материалы для распечатки и рекомендации по проведению.',
    category: 'Планы занятий', categorySlug: 'plany-zanyatiy',
    ageGroup: '4-5', price: 149, fileType: 'PDF',
    program: 'ФОП ДО', programSlug: 'fop-do', developmentFeature: 'none',
    views: 234, downloads: 45, author: 'Елена Козлова',
  },
  {
    id: 2, slug: 'rabochaya-programma-fop-do', title: 'Рабочая программа по ФОП ДО',
    description: 'Полная рабочая программа в соответствии с Федеральной образовательной программой дошкольного образования на 2024 год. Готова к использованию, включает все обязательные разделы.',
    category: 'Программы', categorySlug: 'programmy',
    ageGroup: '1-7', price: 390, fileType: 'DOCX',
    program: 'ФОП ДО', programSlug: 'fop-do', developmentFeature: 'none',
    views: 456, downloads: 89, author: 'Анна Морозова',
  },
  {
    id: 3, slug: 'metodicheskie-rekomendatsii-sreda', title: 'Методические рекомендации по организации развивающей среды',
    description: 'Практические советы по созданию развивающей предметно-пространственной среды для детей с задержкой психического развития.',
    category: 'Методички', categorySlug: 'metodichki',
    ageGroup: '3-7', price: 220, fileType: 'DOCX',
    program: 'ФАОП ДО', programSlug: 'faop-do', developmentFeature: 'zpr',
    views: 189, downloads: 34, author: 'Ольга Петрова',
  },
  {
    id: 4, slug: 'zanyatie-v-mire-zhivotnykh', title: 'План занятия "В мире животных"',
    description: 'Познавательное занятие о животных средней полосы России для старшей группы. Включает дидактические игры и наглядный материал.',
    category: 'Планы занятий', categorySlug: 'plany-zanyatiy',
    ageGroup: '5-6', price: 149, fileType: 'PDF',
    program: 'ФОП ДО', programSlug: 'fop-do', developmentFeature: 'none',
    views: 312, downloads: 67, author: 'Елена Козлова',
  },
  {
    id: 5, slug: 'prazdnik-noviy-god', title: 'Праздник "Новый год в детском саду"',
    description: 'Готовый сценарий новогоднего праздника с песнями, играми и конкурсами. Подходит для разновозрастных групп.',
    category: 'Сценарии', categorySlug: 'stsenarii',
    ageGroup: '3-7', price: 290, fileType: 'PPT',
    program: 'Универсальный', programSlug: 'universal', developmentFeature: 'none',
    views: 520, downloads: 140, author: 'Мария Сидорова',
  },
  {
    id: 6, slug: 'diagnostika-rechevogo-razvitiya', title: 'Диагностика речевого развития',
    description: 'Диагностические материалы и карты наблюдения для детей с тяжёлыми нарушениями речи. Включает протоколы обследования.',
    category: 'Диагностика', categorySlug: 'diagnostika',
    ageGroup: '4-5', price: 180, fileType: 'PDF',
    program: 'ФАОП ДО', programSlug: 'faop-do', developmentFeature: 'tnr',
    views: 198, downloads: 55, author: 'Ирина Волкова',
  },
  {
    id: 7, slug: 'marshrut-ras', title: 'Индивидуальный маршрут для ребёнка с РАС',
    description: 'Адаптированные материалы для работы с детьми с расстройствами аутистического спектра. Пошаговый план включения в группу.',
    category: 'Методички', categorySlug: 'metodichki',
    ageGroup: '3-7', price: 260, fileType: 'DOCX',
    program: 'ФАОП ДО', programSlug: 'faop-do', developmentFeature: 'ras',
    views: 143, downloads: 28, author: 'Ольга Петрова',
  },
  {
    id: 8, slug: 'uprazhneniya-onr', title: 'Коррекционные упражнения при ОНР',
    description: 'Комплекс логопедических упражнений для детей с общим недоразвитием речи. Карточки для занятий и домашних заданий.',
    category: 'Диагностика', categorySlug: 'diagnostika',
    ageGroup: '5-6', price: 199, fileType: 'PDF',
    program: 'ФАОП ДО', programSlug: 'faop-do', developmentFeature: 'onr',
    views: 167, downloads: 41, author: 'Ирина Волкова',
  },
  {
    id: 9, slug: 'sensornye-igry-malyshi', title: 'Сенсорные игры для малышей',
    description: 'Развивающие игры для детей раннего возраста, направленные на сенсорное развитие. Простые в подготовке, эффективные в использовании.',
    category: 'Планы занятий', categorySlug: 'plany-zanyatiy',
    ageGroup: '1-3', price: 129, fileType: 'PDF',
    program: 'ФОП ДО', programSlug: 'fop-do', developmentFeature: 'none',
    views: 211, downloads: 60, author: 'Елена Козлова',
  },
  {
    id: 10, slug: 'adaptirovannaya-programma-zpr', title: 'Адаптированная программа для детей с ЗПР',
    description: 'Полная адаптированная образовательная программа для дошкольников с задержкой психического развития. Включает все обязательные разделы.',
    category: 'Программы', categorySlug: 'programmy',
    ageGroup: '5-7', price: 450, fileType: 'DOCX',
    program: 'ФАОП ДО', programSlug: 'faop-do', developmentFeature: 'zpr',
    views: 302, downloads: 74, author: 'Анна Морозова',
  },
];

export interface CategoryInfo {
  slug: string;
  name: string;
  description: string;
}

export const categories: CategoryInfo[] = [
  { slug: 'plany-zanyatiy', name: 'Планы занятий', description: 'Готовые конспекты и планы занятий для всех возрастных групп детского сада. Разработаны в соответствии с ФОП ДО и ФАОП ДО.' },
  { slug: 'programmy', name: 'Программы', description: 'Рабочие и адаптированные образовательные программы для дошкольных учреждений. Полностью готовы к использованию.' },
  { slug: 'metodichki', name: 'Методички', description: 'Методические рекомендации и пособия для воспитателей и специалистов. Практические материалы для ежедневной работы.' },
  { slug: 'diagnostika', name: 'Диагностика', description: 'Диагностические материалы, карты наблюдения и протоколы обследования детей дошкольного возраста.' },
  { slug: 'stsenarii', name: 'Сценарии', description: 'Сценарии праздников, развлечений и тематических мероприятий для детского сада.' },
];

export interface ProgramInfo {
  slug: string;
  name: string;
  fullName: string;
  description: string;
}

export const programs: ProgramInfo[] = [
  { slug: 'fop-do', name: 'ФОП ДО', fullName: 'Федеральная образовательная программа дошкольного образования', description: 'Материалы, разработанные в полном соответствии с Федеральной образовательной программой дошкольного образования. Подходят для общеразвивающих групп.' },
  { slug: 'faop-do', name: 'ФАОП ДО', fullName: 'Федеральная адаптированная образовательная программа дошкольного образования', description: 'Адаптированные материалы для работы с детьми с ограниченными возможностями здоровья в соответствии с ФАОП ДО.' },
  { slug: 'universal', name: 'Универсальный', fullName: 'Универсальные материалы', description: 'Универсальные методические материалы, подходящие для любых образовательных программ дошкольного образования.' },
];

export interface AgeInfo {
  slug: string;
  label: string;
  description: string;
}

export const ageGroups: AgeInfo[] = [
  { slug: '1-2', label: '1-2 года', description: 'Материалы для работы с детьми раннего возраста от 1 до 2 лет. Сенсорное развитие, адаптация, первые навыки.' },
  { slug: '2-3', label: '2-3 года', description: 'Материалы для первой младшей группы. Развитие речи, мелкой моторики, познавательной активности.' },
  { slug: '3-4', label: '3-4 года', description: 'Материалы для второй младшей группы. Формирование игровых навыков, развитие воображения.' },
  { slug: '4-5', label: '4-5 лет', description: 'Материалы для средней группы. Развитие логического мышления, творческих способностей.' },
  { slug: '5-6', label: '5-6 лет', description: 'Материалы для старшей группы. Подготовка к школе, развитие самостоятельности.' },
  { slug: '6-7', label: '6-7 лет', description: 'Материалы для подготовительной группы. Итоговая подготовка к школьному обучению.' },
  { slug: '1-3', label: '1-3 года', description: 'Материалы для детей раннего возраста. Комплексное развитие в период активного роста.' },
  { slug: '1-4', label: '1-4 года', description: 'Материалы для детей от раннего до младшего дошкольного возраста.' },
  { slug: '2-4', label: '2-4 года', description: 'Материалы для младших дошкольников. Переход от раннего к дошкольному возрасту.' },
  { slug: '2-5', label: '2-5 лет', description: 'Материалы для младших и средних дошкольников. Широкий диапазон для смешанных групп.' },
  { slug: '3-5', label: '3-5 лет', description: 'Материалы для младшей и средней групп. Формирование базовых навыков.' },
  { slug: '5-7', label: '5-7 лет', description: 'Материалы для старших дошкольников. Подготовка к школе и развитие ключевых компетенций.' },
  { slug: '3-7', label: '3-7 лет', description: 'Универсальные материалы для всех дошкольных групп. Подходят для разновозрастных групп.' },
  { slug: '1-7', label: '1-7 лет', description: 'Материалы, охватывающие весь период дошкольного детства. Годовые планы и комплексные программы.' },
];

export interface NeedsInfo {
  slug: string;
  code: string;
  name: string;
  fullName: string;
  description: string;
}

export const specialNeeds: NeedsInfo[] = [
  { slug: 'tnr', code: 'tnr', name: 'ТНР', fullName: 'Тяжёлые нарушения речи', description: 'Методические материалы для работы с детьми, имеющими тяжёлые нарушения речи. Логопедические занятия, коррекционные программы и диагностические инструменты.' },
  { slug: 'zpr', code: 'zpr', name: 'ЗПР', fullName: 'Задержка психического развития', description: 'Адаптированные материалы для детей с задержкой психического развития. Индивидуальные маршруты, коррекционные занятия и методические рекомендации.' },
  { slug: 'ras', code: 'ras', name: 'РАС', fullName: 'Расстройства аутистического спектра', description: 'Материалы для организации работы с детьми с расстройствами аутистического спектра. Социальные истории, визуальные расписания, адаптационные программы.' },
  { slug: 'onr', code: 'onr', name: 'ОНР', fullName: 'Общее недоразвитие речи', description: 'Логопедические материалы для коррекции общего недоразвития речи у дошкольников. Упражнения, карточки, планы занятий.' },
];

export function getDocumentsByCategory(categorySlug: string): CatalogDocument[] {
  return catalogDocuments.filter(d => d.categorySlug === categorySlug);
}

export function getDocumentsByProgram(programSlug: string): CatalogDocument[] {
  return catalogDocuments.filter(d => d.programSlug === programSlug);
}

export function getDocumentsByAge(ageSlug: string): CatalogDocument[] {
  return catalogDocuments.filter(d => d.ageGroup === ageSlug);
}

export function getDocumentsByNeed(needCode: string): CatalogDocument[] {
  return catalogDocuments.filter(d => d.developmentFeature === needCode);
}

export function getDocumentBySlug(slug: string): CatalogDocument | undefined {
  return catalogDocuments.find(d => d.slug === slug);
}
