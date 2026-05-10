# DNL Legal Compliance Map

Аудит не является юридическим заключением и не дает 100% гарантии от претензий. Цель документа - снизить риск и закрыть технические признаки, которые обычно проверяются автоматически и вручную: отдельные согласия, доступные документы, отсутствие предустановленных галочек, журнал согласий, понятные условия оплаты и подписки, cookie-gating.

## 1. Общий статус

- Дата аудита: 2026-05-10.
- Проект: "Дошкольное на лаконичном" / DNL.
- Текущие домены запуска: `fop-do.ru`, `фоп-до.рф`.
- Текущий staging-домен: `https://metodcab.replit.app`.
- Стек проекта: Next.js App Router, React, TypeScript, PostgreSQL, session cookie `metod_session`, Prodamus, SMTP, S3-compatible storage, OpenAI API для AI-помощника, Cloudflare Turnstile при наличии ключа.
- Основной принцип внедрения: не переписывать продуктовые, платежные и админские потоки; добавлять юридический слой локально и обратимо.

Основные риски:

| Риск | Где найден | Что означает | Приоритет |
|---|---|---|---|
| Часть legal-ссылок ведет не на legal-страницы | `src/components/Footer.tsx`, `src/components/ConsentCheckbox.tsx`, `src/lib/navigateRoute.ts` | `offer/privacy/terms/consent/refund/authors` не замаплены в App Router, возможен переход на `/` вместо документа | CRITICAL |
| Нет центрального журнала согласий | `app/api/auth/register/route.ts`, `app/api/orders/create/route.ts`, `app/api/subscriptions/create/route.ts` | Нельзя доказать версию документа, источник, IP, user-agent и форму согласия | CRITICAL |
| Регистрация имеет один общий чекбокс | `src/views/Register.tsx`, `src/components/ConsentCheckbox.tsx` | Нужно разделить обязательные согласия и optional-маркетинг; сервер должен валидировать согласия | HIGH |
| Оплата и подписка без явного чекбокса оферты/возврата | `src/views/Cart.tsx`, `app/podpiska/client.tsx` | Перед оплатой нужно явно показать оферту, условия цифрового доступа, возвраты, для подписки - условия срока и продления | HIGH |
| Рекуррентные платежи пока не реализованы | `src/server/prodamus.ts`, `src/server/subscriptions.ts`, `app/api/prodamus/webhook/route.ts` | Сейчас это разовая оплата за срок подписки; автосписания добавлять отдельной веткой после одобрения Prodamus | HIGH |
| AI-помощник принимает и хранит prompt | `app/pomoshchnik/client.tsx`, `app/api/assistant/respond/route.ts`, `src/server/aiAssistant.ts` | Нужны предупреждения: не вводить ПДн детей/родителей/сотрудников, ответы справочные | HIGH |
| Cookie-баннера нет | глобальная оболочка приложения | Сейчас внешней аналитики не найдено, но перед Яндекс.Метрикой/VK Pixel нужен баннер и отложенная загрузка | HIGH |
| Hardcoded-реквизиты ИП в футере | `src/components/Footer.tsx` | Лучше вынести в `legalInfo`/env, чтобы не править компоненты и не ошибиться при переносе | MEDIUM |
| Email-шаблоны без юридического footer/unsubscribe | `src/server/emailVerification.ts`, `src/server/passwordReset.ts`, `src/server/transactionalEmails.ts` | Транзакционные письма допустимы отдельно, но маркетинговые рассылки требуют отдельного согласия и отписки | MEDIUM |

Что уже реализовано:

- Публичные legal-страницы: `/legal/oferta`, `/legal/konfidentsialnost`, `/legal/usloviya`, `/legal/soglasie`, `/legal/vozvrat`, `/legal/avtory`.
- Публичные формы заявок используют `PublicFormConsent` и серверную проверку `consent === true`.
- Для публичных заявок сохраняются `consent_accepted_at`, `consent_ip`, `consent_user_agent`.
- `robots.ts` закрывает `/kabinet`, `/korzina`, `/oplata`, `/api`, `/admin`.
- Prodamus-webhook активирует доступ только после валидного уведомления, а не по `success_url`.
- Скидки в `cartQuote` считаются на сервере, потолок скидки ограничен 35%.

Что обязательно добавить до запуска:

- Исправить legal-ссылки из футера и чекбоксов.
- Добавить центральный журнал согласий.
- Добавить обязательные чекбоксы оферты/возврата на оплату товаров и подписки.
- Добавить отдельные согласия регистрации: ПДн, пользовательское соглашение, optional-маркетинг.
- Добавить AI-предупреждение и правила AI.
- Добавить cookie-баннер до подключения Яндекс.Метрики/VK Pixel.
- Подготовить документы с финальным текстом юриста и реквизитами владельца.

Что желательно добавить после запуска:

- Кабинет для управления подпиской и отменой автопродления, если Prodamus одобрит recurring.
- Экспорт/удаление/обезличивание аккаунта.
- Отдельный suppression-list и unsubscribe для маркетинга.
- Централизованный admin-аудит загрузок/изменений файлов.
- Версионирование legal-документов в админке.

Источники для владельца и юриста:

- [Портал персональных данных Роскомнадзора](https://pd.rkn.gov.ru/)
- [152-ФЗ "О персональных данных"](https://www.consultant.ru/document/cons_doc_LAW_61801/)
- [38-ФЗ "О рекламе"](https://www.consultant.ru/document/cons_doc_LAW_58968/)
- [Закон РФ "О защите прав потребителей"](https://www.consultant.ru/document/cons_doc_LAW_305/)
- [ФНС: онлайн-кассы и 54-ФЗ](https://www.nalog.gov.ru/rn77/taxation/reference_work/newkkt/)
- [Prodamus: формирование ссылки на автоплатеж](https://help.prodamus.ru/payform/integracii/tekhnicheskaya-dokumentaciya-po-avtoplatezham/formirovanie-ssylki-na-oplatu)
- [Prodamus: уведомления по подписке](https://help.prodamus.ru/payform/integracii/tekhnicheskaya-dokumentaciya-po-avtoplatezham/uvedomleniya)

## 2. Карта юридических документов

| Документ | Нужен? | Текущий маршрут | Предлагаемый alias | Файл/компонент | Подключен в футере | Подключен в формах | Статус |
|---|---|---|---|---|---|---|---|
| Политика обработки персональных данных | Да | `/legal/konfidentsialnost` | `/legal/privacy-policy` | `src/views/legal/Privacy.tsx` | Есть, но переход через `privacy` может ломаться | Есть в `PublicFormConsent`; регистрационный `ConsentCheckbox` может ломать переход | NEED_LINK_FIX |
| Согласие на обработку персональных данных | Да | `/legal/soglasie` | `/legal/personal-data-consent` | `src/views/legal/Consent.tsx` | Есть, но переход через `consent` может ломаться | Есть в `PublicFormConsent`; регистрационный `ConsentCheckbox` может ломать переход | NEED_LINK_FIX |
| Согласие на рекламную и информационную рассылку | Да, если будет маркетинг | Нет | `/legal/marketing-consent` | Нет | Нет | Нет | NEED_DOC_PAGE |
| Cookie Policy | Да до аналитики/пикселей | Нет | `/legal/cookie-policy` | Нет | Нет | Нет | NEED_DOC_PAGE |
| Пользовательское соглашение | Да | `/legal/usloviya` | `/legal/terms` | `src/views/legal/Terms.tsx` | Есть, но переход через `terms` может ломаться | В регистрации через старый чекбокс | NEED_LINK_FIX |
| Публичная оферта | Да | `/legal/oferta` | `/legal/offer` | `src/views/legal/Offer.tsx` | Есть, но переход через `offer` может ломаться | В оплате не подтверждается явно | NEED_CHECKBOX |
| Условия подписки и автопродления | Да | Нет | `/legal/subscription` | Нет | Нет | Нет | NEED_DOC_PAGE |
| Возврат и отмена доступа | Да | `/legal/vozvrat` | `/legal/refund` | `src/views/legal/Refund.tsx` | Есть, но переход через `refund` может ломаться | В оплате не подтверждается явно | NEED_CHECKBOX |
| Правообладателям | Да | Частично `/legal/avtory` | `/legal/copyright` | `src/views/legal/Authors.tsx` | Есть как "Для авторов" | Не связано с претензиями правообладателей | NEED_LEGAL_TEXT |
| Правила AI-помощника | Да | Нет | `/legal/ai-rules` | Нет | Нет | Нет | NEED_DOC_PAGE |
| Правила реферальной программы | Да | Нет | `/legal/referral` | Нет | Нет | Нет | NEED_DOC_PAGE |
| Согласие на публикацию отзыва | Только если появятся отзывы | Нет | `/legal/review-consent` | Нет | Нет | Нет | FUTURE |
| Согласие автора / договор автора | Да для авторского кабинета | Частично `/legal/avtory` | `/legal/author-agreement` | `src/views/legal/Authors.tsx` | Частично | В заявке автора нет отдельного акцепта | NEED_DOC_LINK |
| Обращения по персональным данным | Да | Нет | `/legal/personal-data-requests` | Нет | Нет | Нет | NEED_DOC_PAGE |

Важное решение по маршрутам: не переименовывать существующие русские routes сразу. Безопаснее добавить alias-страницы и поправить `resolveRoute`, чтобы старые ссылки продолжили работать, а новые юридические URL появились без ломки SEO и навигации.

## 3. Карта форм и согласий

| Форма | Путь/компонент | Данные | Нужно согласие ПДн | Нужна оферта | Нужна рассылка | Нужен cookie/analytics consent | Что добавить | Статус |
|---|---|---|---|---|---|---|---|---|
| Регистрация | `/registratsiya`, `src/views/Register.tsx`, `app/api/auth/register/route.ts` | имя, должность/роль, город, email, пароль, captcha | Да | Пользовательское соглашение | Optional, отдельно | Нет | Раздельные чекбоксы, server-side validation, запись в `consents`, исправить ссылки | NEED_LOGGING |
| Вход | `/vhod`, `src/views/Login.tsx` | email, пароль | Нет нового, но пользователь уже зарегистрирован | Нет | Нет | Нет | Ссылки на политику/условия внизу формы | NEED_DOC_LINK |
| Восстановление пароля | `/vosstanovlenie-parolya`, `app/vosstanovlenie-parolya/client.tsx` | email, captcha | Нет нового, сервисное письмо | Нет | Нет | Нет | Ссылка на политику ПДн | NEED_DOC_LINK |
| Новый пароль | `/novyy-parol`, `app/novyy-parol/client.tsx` | token, пароль | Нет | Нет | Нет | Нет | Ссылка на политику ПДн | NEED_DOC_LINK |
| Корзина / покупка товара | `/korzina`, `src/views/Cart.tsx`, `app/api/orders/create/route.ts` | material slugs, referral code, user session/email/phone для Prodamus | Уже через аккаунт, но действие оплаты требует акцепта | Да | Нет | Нет | Чекбокс оферты, цифрового доступа и возврата; серверная проверка; consent log | NEED_CHECKBOX |
| Подписка | `/podpiska`, `app/podpiska/client.tsx`, `app/api/subscriptions/create/route.ts` | planId, user session/email/phone для Prodamus | Уже через аккаунт, но действие оплаты требует акцепта | Да | Нет | Нет | Чекбокс оферты, возврата, условий подписки; отдельный блок recurring-ready | NEED_CHECKBOX |
| Заявка на документ | `/zakazat-dokument`, `PublicFormConsent`, `app/api/document-requests/route.ts` | email, имя, тема, возраст, тип документа, описание | Да | Нет | Нет | Нет | Добавить central consent log и версию документа | OK_NEED_JOURNAL |
| Авторская заявка | `/stat-avtorom`, `PublicFormConsent`, `app/api/author-applications/route.ts` | ФИО, email, телефон, город, опыт, должность, bio, занятость, sampleUrl | Да | Нет | Optional отдельно | Нет | Ссылка/чекбокс авторского соглашения и consent log | NEED_DOC_LINK |
| Молодой специалист | `/molodoy-specialist`, `PublicFormConsent`, `app/api/young-specialist/questions/route.ts` | имя, возраст, город, email, должность, возраст группы, программа, тема, вопрос, VK/Telegram | Да | Нет | Нет | Нет | Предупреждение не вводить ПДн детей/родителей/сотрудников; central log | OK_NEED_NOTICE |
| AI-помощник | `/pomoshchnik`, `app/api/assistant/respond/route.ts`, `src/server/aiAssistant.ts` | prompt, userId, модель, токены, ответ | Да, через аккаунт; нужен AI-дисклеймер | Нет | Нет | Нет | `AiSafetyNotice`, правила AI, запрет детских ПДн, лог факта принятия правил | RISK |
| Профиль | `/kabinet?section=profile`, `app/api/account/profile/route.ts` | ФИО, роль, город, учреждение, телефон | Опирается на регистрацию | Нет | Optional отдельно | Нет | Ссылка на политику ПДн и механизм удаления/обезличивания | NEED_DOC_LINK |
| Бесплатные материалы | `/materialy/besplatno`, `app/api/materials/free/grant/route.ts` | materialSlug + session | Через регистрацию | Нет | Нет | Нет | Журнал факта выдачи/скачивания, legal-ссылка рядом не обязательна | NEED_LOGGING |
| Скачивание материалов | `app/api/materials/download/route.ts` | material/file id + session | Через регистрацию | Нет | Нет | Нет | Audit/download log для поддержки споров | NICE_TO_HAVE |
| Админ-загрузка файлов | `/admin`, `app/admin/material-file-manager.tsx` | файлы, ссылки, metadata | internal/admin | Нет | Нет | Нет | Admin audit для загрузок, не пользовательское согласие | INTERNAL |
| Отзывы | Не найдено | - | Да при публикации ФИО/фото | Нет | Нет | Нет | Не внедрять до появления функции | FUTURE |
| Подписка на новости | Не найдено | - | Да | Нет | Да, отдельное | Да при рекламных пикселях | Не внедрять до появления функции | FUTURE |

## 4. Footer и юридические ссылки

- Footer: `src/components/Footer.tsx`.
- Сейчас есть: оферта, политика ПДн, пользовательское соглашение, согласие ПДн, возврат, для авторов.
- Проблема: ссылки вызывают `onNavigate(page)`, а App Router fallback зависит от `src/lib/navigateRoute.ts`. Для legal page ids нет маппинга, поэтому часть ссылок может вести на `/`.
- Не хватает: согласие на рассылку, cookie policy, условия подписки/автопродления, правила AI, правила рефералки, правообладателям, обращения по ПДн.
- Реквизиты ИП сейчас hardcoded в footer. Безопаснее вынести в `src/config/legalInfo.ts` или env:

```ts
export const legalInfo = {
  projectName: 'Дошкольное на лаконичном',
  legalName: 'ИП Васильева Наталья Александровна',
  ogrnip: '',
  inn: '',
  email: '',
  correspondenceAddress: '',
  domains: ['fop-do.ru', 'фоп-до.рф'],
};
```

## 5. Checkout / оплата / подписка

Корзина:

- UI: `src/views/Cart.tsx`.
- API: `app/api/orders/create/route.ts`.
- Серверная логика: `src/server/orders.ts`, `src/server/cartQuote.ts`.
- Хорошо: скидки и финальная сумма считаются на сервере; повторная выдача доступа зависит от webhook.
- Нужно добавить: checkbox перед оплатой с офертой, цифровым доступом и возвратом; server-side reject без флага; запись в `consents`.

Подписка:

- UI: `app/podpiska/client.tsx`.
- API: `app/api/subscriptions/create/route.ts`.
- Серверная логика: `src/server/subscriptions.ts`.
- Сейчас: разовый платеж за срок подписки, не настоящее recurring.
- Нужно добавить до оплаты: условия срока, цена, срок доступа, возврат/отмена, акцепт оферты и условий подписки.

Recurring-ready, не включать до одобрения Prodamus:

- Добавить feature flag: `PRODAMUS_RECURRENT_ENABLED=false`.
- Не менять текущий `buildProdamusPayformUrl`.
- Добавить отдельную функцию `buildProdamusSubscriptionUrl` только для recurring.
- В webhook отдельно обрабатывать `subscription.action_code`: `auto_payment`, `deactivation`, `finish`, failed attempts, next payment date.
- В кабинете показать: включено ли автопродление, следующая дата списания, способ отмены, доступ до конца оплаченного периода.
- В БД оставить мягкое расширение: `provider_subscription_id` уже есть; позже добавить `auto_renew`, `next_payment_at`, `cancel_at_period_end`, `cancelled_at`, `last_provider_event_id`.

## 6. Cookie и аналитика

Найдено:

- Session cookie `metod_session` в `src/server/auth.ts`: необходимая cookie.
- localStorage: корзина, referral, post-purchase discount, social proof, profile legacy, internal cms analytics.
- Cloudflare Turnstile script в `src/components/TurnstileField.tsx`, если задан public key.
- Внешние рекламные/аналитические пиксели не найдены: Яндекс.Метрика, VK Pixel, Google Analytics, Meta Pixel сейчас не подключены.

Что сделать:

- Добавить `CookieConsentBanner` до подключения внешней аналитики.
- Хранить выбор пользователя, например `dnl_cookie_consent_v1`.
- По умолчанию разрешены только необходимые cookie.
- Аналитика/пиксели грузятся только после `analytics=true`/`ads=true`.
- Сделать страницу `/legal/cookie-policy`.
- Добавить кнопку изменения настроек cookie в футер.

## 7. AI-помощник

- UI: `app/pomoshchnik/client.tsx`.
- API: `app/api/assistant/respond/route.ts`.
- Server: `src/server/aiAssistant.ts`.
- Данные: prompt пользователя, ответ, модель, токены, user id.
- Риски: пользователь может случайно ввести ФИО ребенка, диагноз, фото/ссылки, данные родителей/сотрудников ДОУ; prompt уходит внешнему AI-провайдеру и хранится в базе.

Нужно добавить перед отправкой:

- Не вводить ФИО, фотографии, медицинские сведения и иные персональные данные детей, родителей, сотрудников ДОУ и третьих лиц.
- Использовать обезличенные формулировки: "ребенок 5 лет", "группа 4-5 лет", "ребенок с ТНР" без имени и фото.
- Ответы AI носят справочный характер и не являются юридической, медицинской или официальной методической экспертизой.
- Ссылка на `/legal/ai-rules`.
- Однократное принятие правил AI с записью в `consents` желательно; минимум - предупреждение перед полем.

## 8. Рассылки

Сейчас найдены транзакционные письма:

- `src/server/emailVerification.ts`
- `src/server/passwordReset.ts`
- `src/server/transactionalEmails.ts`

Маркетинговой рассылки как отдельного продукта не найдено.

До маркетинга нужно:

- Отдельный optional-чекбокс.
- Отдельный документ `/legal/marketing-consent`.
- Запись согласия `consent_type=marketing`.
- Unsubscribe endpoint и suppression-list.
- В каждом маркетинговом письме ссылка отписки.
- Не смешивать обязательное согласие на ПДн и рекламу.

## 9. Журнал согласий

Сейчас:

- Есть per-table consent columns для публичных заявок через `src/server/publicFormConsent.ts`.
- Нет центральной таблицы `consents`.
- Нет версии документа, source_url и form_name в едином виде.

Минимальная схема:

```sql
CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  email text NULL,
  phone text NULL,
  form_name text NOT NULL,
  consent_type text NOT NULL,
  document_slug text NOT NULL,
  document_version text NOT NULL,
  document_hash text NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text NULL,
  user_agent text NULL,
  source_url text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS consents_user_id_idx ON consents (user_id);
CREATE INDEX IF NOT EXISTS consents_email_idx ON consents (email);
CREATE INDEX IF NOT EXISTS consents_type_idx ON consents (consent_type);
CREATE INDEX IF NOT EXISTS consents_accepted_at_idx ON consents (accepted_at DESC);
```

Типы `consent_type`:

- `personal_data`
- `terms`
- `offer`
- `refund`
- `subscription`
- `marketing`
- `cookies_analytics`
- `cookies_ads`
- `ai_rules`
- `review_publication`
- `author_agreement`

Где вызывать запись согласия:

- Регистрация: `app/api/auth/register/route.ts`.
- Корзина: `app/api/orders/create/route.ts`.
- Подписка: `app/api/subscriptions/create/route.ts`.
- Публичные заявки: `document-requests`, `author-applications`, `young-specialist`.
- AI: первое принятие правил или первое использование после показа notice.
- Cookie: отдельный endpoint только при необходимости server-side proof; иначе хранить localStorage и логировать analytics/ads acceptance при авторизованном пользователе.

Безопасность журнала:

- P0-согласия регистрации, оплаты и подписки писать server-side внутри существующих API routes, а не доверять публичному `/api/consents`.
- Публичный `/api/consents` использовать только для ограниченных сценариев вроде cookie/AI acknowledgement, с trusted-origin проверкой, rate limit, auth где возможно и idempotency.
- Для доказуемости хранить не только `document_version`, но и `document_hash` или immutable snapshot/version policy. Нельзя менять текст документа, сохранив старую версию.

## 10. Что уже сделано

| Задача | Файл | Что сделано | Дата | Статус |
|---|---|---|---|---|
| Legal-страницы базового набора | `app/legal/*`, `src/views/legal/*` | Есть оферта, политика, условия, согласие, возврат, авторы | до аудита | PARTIAL |
| Consent на публичных заявках | `PublicFormConsent`, `document-requests`, `author-applications`, `young-specialist` | Чекбокс + server-side проверка + IP/UA/timestamp | до аудита | PARTIAL_OK |
| Серверный расчет корзины | `src/server/cartQuote.ts` | Скидки и лимит 35% считаются на backend | до аудита | OK |
| Prodamus webhook | `app/api/prodamus/webhook/route.ts` | Доступ выдается по webhook | до аудита | OK |
| Админка и товары | `app/admin/*`, `app/api/admin/*` | Управление материалами и категориями работает | до аудита | DO_NOT_BREAK |

## 11. Что нужно сделать

| Приоритет | Задача | Файл | Почему важно | Как проверить | Статус |
|---|---|---|---|---|---|
| P0 | Исправить legal navigation | `src/lib/navigateRoute.ts`, `Footer.tsx`, `ConsentCheckbox.tsx` | Ссылки на legal-документы не должны вести на `/` | Все legal-ссылки открываются 200 | TODO |
| P0 | Добавить центральный consent journal | `src/server/consents.ts`, `app/api/consents/route.ts` | Доказательство согласий и версии документов | В БД появляется запись после регистрации/оплаты | TODO |
| P0 | Добавить offer/refund checkboxes в оплату | `Cart.tsx`, `orders/create` | Перед оплатой нужен явный акцепт | Без чекбокса API отдает 400 | TODO |
| P0 | Добавить subscription terms checkbox | `app/podpiska/client.tsx`, `subscriptions/create` | Подписка требует понятных условий | Без чекбокса API отдает 400 | TODO |
| P1 | Разделить регистрацию на ПДн/terms/marketing | `Register.tsx`, `register/route.ts` | Реклама не должна быть обязательной | Регистрация работает без marketing | TODO |
| P1 | Добавить AI safety notice | `app/pomoshchnik/client.tsx`, `/legal/ai-rules` | Снизить риск ввода ПДн детей | Notice виден до отправки prompt | TODO |
| P1 | Добавить missing legal pages / aliases | `app/legal/*`, `src/config/legalDocuments.ts` | Все ссылки должны существовать | `/legal/*` не дает 404 | TODO |
| P1 | Cookie banner + delayed analytics hook | `CookieConsentBanner`, layout | До подключения метрики/пикселей нужен consent | Метрика не грузится без согласия | TODO |
| P2 | Email footer + unsubscribe для будущего маркетинга | `src/server/*Email*.ts` | Письма должны иметь понятные legal/support ссылки | Тестовое письмо содержит ссылки | TODO |
| P2 | Account deletion/anonymization request | `app/kabinet`, API | Требования по обращениям субъекта ПДн | Пользователь видит канал обращения | TODO |
| P2 | Recurring-ready Prodamus branch | `prodamus.ts`, `subscriptions.ts`, webhook | Не ломать текущие разовые платежи | Флаг off сохраняет старое поведение | WAIT_PRODAMUS |

## 12. Acceptance checklist

- [ ] Уведомление РКН подано/обновлено вручную владельцем.
- [ ] Политика ПДн есть в футере.
- [ ] Согласие ПДн есть отдельным чекбоксом на всех формах, где это нужно.
- [ ] Галочки не предустановлены.
- [ ] Согласие на рассылку отдельно и не обязательно для регистрации/покупки.
- [ ] Cookie-баннер есть.
- [ ] Аналитика/пиксели не грузятся до согласия.
- [ ] Оферта есть до оплаты.
- [ ] Условия возврата есть до оплаты.
- [ ] Подписка, продление доступа и будущая опция автопродления описаны ясно.
- [ ] Recurring выключен до одобрения Prodamus и готовности юридического текста.
- [ ] Есть отписка от рассылки до запуска маркетинга.
- [ ] Есть механизм обращения по ПДн.
- [ ] Есть механизм удаления/обезличивания аккаунта или понятная ручная процедура.
- [ ] AI-помощник предупреждает не вводить ПДн детей.
- [ ] Footer содержит реквизиты ИП и юридические ссылки.
- [ ] Все юридические ссылки открываются без 404.
- [ ] Согласия логируются.
- [ ] Есть версия документа, с которой согласился пользователь.
- [ ] Финальные тексты проверены юристом.
- [ ] Хостинг, БД, S3, SMTP и AI-провайдер проверены как обработчики/места обработки данных.
- [ ] Онлайн-касса/чеки проверены с бухгалтером или оператором фискализации.

## 13. Действия владельца вне кода

- Подать или обновить уведомление оператора ПДн в РКН.
- Вставить финальные юридические документы, не оставлять drafts.
- Проверить реквизиты ИП: ОГРНИП, ИНН, email, адрес для корреспонденции.
- Проверить онлайн-кассу, чеки, признаки способа расчета и предмета расчета.
- Проверить договоры с обработчиками: хостинг, БД, S3, SMTP, Prodamus, OpenAI/AI-провайдер, аналитика.
- Проверить хранение и обработку ПДн граждан РФ.
- Получить письменное подтверждение/настройки Prodamus по рекуррентным платежам перед включением.
- Финально показать документы юристу.
