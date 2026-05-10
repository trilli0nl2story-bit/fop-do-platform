const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(?:\+7|8)[\s(.-]*\d{3}[\s).,-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/;
const SNILS_PATTERN = /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}\b/;
const PASSPORT_PATTERN = /\b\d{4}\s?\d{6}\b/;
const ADDRESS_PATTERN = /(?:адрес|проживает|улица|ул\.|дом|квартира|кв\.)[^\n]{0,80}\d/iu;
const FULL_NAME_PATTERN = /(?:^|[^А-ЯЁа-яё])([А-ЯЁ][а-яё]{2,}\s+[А-ЯЁ][а-яё]{2,}\s+[А-ЯЁ][а-яё]{2,})(?=$|[^А-ЯЁа-яё])/u;
const PERSONAL_DATA_HINT_PATTERN =
  /(?:фио|фамилия|имя\s+ребенка|имя\s+ребёнка|паспорт|снилс|телефон|почта|e-?mail|адрес\s+проживания|медицинск(?:ие|ая|ое)|диагноз)/iu;

export function findAiPromptSafetyIssues(prompt: string): string[] {
  const issues: string[] = [];

  if (EMAIL_PATTERN.test(prompt)) issues.push('email');
  if (PHONE_PATTERN.test(prompt)) issues.push('телефон');
  if (SNILS_PATTERN.test(prompt)) issues.push('СНИЛС');
  if (PASSPORT_PATTERN.test(prompt)) issues.push('паспортные данные');
  if (ADDRESS_PATTERN.test(prompt)) issues.push('адрес');
  if (FULL_NAME_PATTERN.test(prompt)) issues.push('ФИО');
  if (PERSONAL_DATA_HINT_PATTERN.test(prompt)) issues.push('упоминание персональных данных');

  return Array.from(new Set(issues));
}

export function buildAiPromptSafetyMessage(issues: string[]): string {
  const details = issues.length > 0 ? ` Обнаружено: ${issues.join(', ')}.` : '';
  return (
    'Обезличьте запрос перед отправкой AI-помощнику: не указывайте ФИО, телефоны, email, адреса, ' +
    'паспортные данные, СНИЛС, медицинские сведения и данные детей, родителей или сотрудников ДОУ.' +
    `${details} Например: «ребенок 5 лет», «группа 4-5 лет», «родитель воспитанника» без имени и контактов.`
  );
}
