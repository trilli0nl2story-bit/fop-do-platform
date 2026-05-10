# REPLIT IMPLEMENTATION PROMPT - DNL Legal Compliance Layer

Ты работаешь в проекте "Дошкольное на лаконичном" / DNL. Задача - аккуратно внедрить юридический слой РФ без переписывания проекта и без ломки текущей админки, магазина, корзины, подписки, скидок, выдачи доступа и Prodamus webhook.

Перед началом:

1. Проверь `git status`. Синхронизируй workspace с актуальным GitHub main только если рабочее дерево чистое; не делай `reset --hard` и не перетирай чужие изменения.
2. Запусти `npm run build` и `npm run typecheck`, если скрипты есть.
3. Прочитай `docs/legal-compliance/DNL_legal_compliance_map.md`.
4. Работай маленькими этапами. После каждого этапа запускай build/typecheck.
5. Не меняй финальные юридические тексты на выдуманные. Где текста нет - добавь placeholder/TODO и понятное место для вставки текста юристом.

Нельзя ломать:

- `app/admin/*` и `app/api/admin/*`, кроме точечных ссылок/логов, если это явно требуется.
- `src/server/cartQuote.ts` - скидки и лимит 35% не трогать.
- `src/server/orders.ts` - не менять бизнес-логику выдачи доступа, кроме проверки и логирования согласия перед созданием платежа.
- `src/server/prodamus.ts` - не менять текущую функцию разового платежа; recurring добавлять отдельной функцией и только под feature flag.
- `app/api/prodamus/webhook/route.ts` - не ломать текущую активацию покупок и подписки по webhook.
- `app/admin/material-file-manager.tsx` - не менять товарные поля и CRUD без отдельной причины.

## Этап 1. Быстрый безопасный фикс legal-навигации

Цель: все уже существующие юридические ссылки должны открывать legal-страницы, а не `/`.

Изменить:

- `src/lib/navigateRoute.ts`
- `src/components/Footer.tsx`
- `src/components/ConsentCheckbox.tsx`

Сделать:

1. Добавить route mapping:
   - `offer` -> `/legal/oferta`
   - `privacy` -> `/legal/konfidentsialnost`
   - `terms` -> `/legal/usloviya`
   - `consent` -> `/legal/soglasie`
   - `refund` -> `/legal/vozvrat`
   - `authors` -> `/legal/avtory`
2. Лучше для legal-ссылок использовать обычные `<a href="/legal/...">`, чтобы они не зависели от SPA-навигации.
3. Добавить `/legal` index page со списком документов и ссылками на текущие страницы.

Проверка:

- Открыть `/legal`.
- Все ссылки footer открываются без 404.
- Все ссылки регистрации открываются без 404.
- `npm run build` проходит.

Откат:

- Вернуть только изменения трех файлов и `app/legal/page.tsx`.

## Этап 2. Конфиги юридической информации и документов

Создать:

- `src/config/legalInfo.ts`
- `src/config/legalDocuments.ts`

`legalInfo.ts`:

```ts
export const legalInfo = {
  projectName: 'Дошкольное на лаконичном',
  legalName: 'ИП Васильева Наталья Александровна',
  ogrnip: '',
  inn: '',
  email: '',
  correspondenceAddress: '',
  domains: ['fop-do.ru', 'фоп-до.рф'],
} as const;
```

`legalDocuments.ts`:

```ts
export const legalDocuments = [
  { slug: 'privacy-policy', title: 'Политика обработки персональных данных', route: '/legal/privacy-policy', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['registration', 'public_forms', 'profile'] },
  { slug: 'personal-data-consent', title: 'Согласие на обработку персональных данных', route: '/legal/personal-data-consent', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['registration', 'public_forms'] },
  { slug: 'marketing-consent', title: 'Согласие на рассылку', route: '/legal/marketing-consent', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['marketing'] },
  { slug: 'cookie-policy', title: 'Политика cookie', route: '/legal/cookie-policy', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['cookie_banner'] },
  { slug: 'terms', title: 'Пользовательское соглашение', route: '/legal/terms', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['registration'] },
  { slug: 'offer', title: 'Публичная оферта', route: '/legal/offer', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['checkout', 'subscription'] },
  { slug: 'subscription', title: 'Условия подписки и автопродления', route: '/legal/subscription', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['subscription'] },
  { slug: 'refund', title: 'Возврат и отмена доступа', route: '/legal/refund', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['checkout', 'subscription'] },
  { slug: 'ai-rules', title: 'Правила AI-помощника', route: '/legal/ai-rules', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['ai'] },
  { slug: 'referral', title: 'Правила реферальной программы', route: '/legal/referral', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['referral'] },
  { slug: 'review-consent', title: 'Согласие на публикацию отзыва', route: '/legal/review-consent', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['reviews'] },
  { slug: 'author-agreement', title: 'Соглашение автора', route: '/legal/author-agreement', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['author_application'] },
  { slug: 'copyright', title: 'Правообладателям', route: '/legal/copyright', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: [] },
  { slug: 'personal-data-requests', title: 'Обращения по персональным данным', route: '/legal/personal-data-requests', version: 'draft-2026-05', updatedAt: '2026-05-10', requiredInForms: ['profile'] },
] as const;
```

Важно:

- Не удалять текущие русские маршруты `/legal/oferta`, `/legal/konfidentsialnost`, `/legal/usloviya`, `/legal/soglasie`, `/legal/vozvrat`, `/legal/avtory`.
- Новые английские slug-маршруты сделать aliases/wrappers.
- Финальный текст документов не выдумывать.

Проверка:

- Все `/legal/*` из списка открываются без 404.
- Старые `/legal/oferta` и т.д. тоже работают.

## Этап 3. Компоненты согласий

Создать или расширить без ломки текущих форм:

- `src/components/legal/ConsentCheckbox.tsx` или аккуратно расширить текущий `src/components/ConsentCheckbox.tsx`.
- `src/components/legal/MarketingConsentCheckbox.tsx`.
- `src/components/legal/OfferConsentCheckbox.tsx`.
- `src/components/legal/AiSafetyNotice.tsx`.
- `src/components/legal/LegalFooterLinks.tsx`.

Требования:

- `checked=false` по умолчанию.
- Обязательные чекбоксы реально блокируют submit.
- Маркетинг optional и не блокирует регистрацию/покупку.
- Legal-ссылки обычными `<a href>`, не через сломанную навигацию.
- Не объединять рекламу с обязательным согласием ПДн.

Тексты:

Регистрация:

- `[ ] Я даю согласие на обработку персональных данных в соответствии с Политикой обработки персональных данных.`
- `[ ] Я принимаю Пользовательское соглашение.`
- Optional: `[ ] Я согласен(на) получать информационные и рекламные сообщения о материалах, подписке, акциях и новостях проекта "Дошкольное на лаконичном". Я могу отказаться от рассылки в любой момент.`

Checkout:

- `[ ] Я принимаю условия Публичной оферты, условия предоставления цифровых материалов и условия возврата.`

Подписка:

- `[ ] Я понимаю условия подписки, срок доступа, порядок оплаты, отмены и продления подписки.`

AI:

- `Не вводите ФИО, фотографии, медицинские сведения и иные персональные данные детей, родителей, сотрудников ДОУ и третьих лиц. Используйте обезличенные формулировки: "ребенок 5 лет", "группа 4-5 лет", "ребенок с ТНР" без имени и фото.`
- `Ответы AI-помощника носят справочный характер и не являются юридической, медицинской или официальной методической экспертизой.`

## Этап 4. Центральный журнал согласий

Создать:

- `src/server/consents.ts`
- `app/api/consents/route.ts`

Минимальная таблица:

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
```

Типы:

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

Серверная функция:

- `ensureConsentsTable()`
- `recordConsent({ userId, email, phone, formName, consentType, documentSlug, documentVersion, documentHash, sourceUrl, metadata }, request)`

Важно:

- Не удалять существующие `consent_accepted_at/ip/user_agent` в публичных заявках.
- Добавить центральный лог поверх текущего механизма.
- P0-согласия регистрации, оплаты и подписки писать server-side внутри существующих routes. Не доверять публичному `/api/consents` для этих событий.
- Если создается `app/api/consents/route.ts`, ограничить его: trusted-origin check, rate limit, auth где возможно, idempotency, allow-list `consent_type`, запрет писать согласия за другого пользователя.
- Для доказуемости добавить `document_hash` или immutable snapshot policy. Нельзя менять текст документа, сохранив старую версию.
- Если запись consent не удалась из-за БД, для P0-потоков лучше возвращать ошибку до оплаты/регистрации, а не silently continue.

## Этап 5. Регистрация

Изменить:

- `src/views/Register.tsx`
- `app/api/auth/register/route.ts`
- `app/registratsiya/client.tsx` только если нужно пробросить навигацию/состояние.

Сделать:

- Разделить current combined consent на:
  - `personalDataConsent`
  - `termsConsent`
  - `marketingConsent` optional
- На фронте не отправлять форму без первых двух.
- На backend валидировать первые два.
- После успешного создания пользователя записать:
  - `personal_data`
  - `terms`
  - `marketing`, если пользователь включил optional checkbox.
- Не менять логику session cookie и redirect после регистрации.

Проверка:

- Без обязательных checkbox кнопка не активна или API возвращает 400.
- С optional marketing=false регистрация работает.
- В `consents` появились записи.

## Этап 6. Checkout и подписка

Изменить:

- `src/views/Cart.tsx`
- `app/api/orders/create/route.ts`
- `app/podpiska/client.tsx`
- `app/api/subscriptions/create/route.ts`

Сделать:

- В корзине добавить обязательный checkbox оферты/возврата до кнопки `Оплатить`.
- В подписке добавить обязательный checkbox условий подписки + оферты/возврата до кнопки оплаты.
- В запрос передавать только boolean-флаги согласия, не доверять цене/скидке с фронта.
- На backend reject 400, если checkbox-флаги не пришли.
- Записать consents перед созданием платежной ссылки.
- Не менять `cartQuote`.
- Не менять текущую выдачу доступа после webhook.

Проверка:

- Без checkbox API не создает платеж.
- С checkbox Prodamus paymentUrl создается как раньше.
- Скидка/реферал/лимит 35% не изменились.

## Этап 7. AI-помощник

Изменить:

- `app/pomoshchnik/client.tsx`
- при необходимости `app/api/assistant/respond/route.ts`

Сделать:

- Добавить `AiSafetyNotice` перед полем ввода.
- Добавить ссылку `/legal/ai-rules`.
- Не блокировать весь AI сложным consent-flow на первом шаге, если это рискованно для UX; минимум - видимый notice до отправки.
- На следующем шаге можно добавить однократный checkbox "Я понимаю правила AI-помощника" и записывать `ai_rules`.

Проверка:

- Notice виден на мобильном и desktop.
- Prompt отправляется как раньше.

## Этап 8. Cookie banner

Создать:

- `src/components/legal/CookieConsentBanner.tsx`
- `src/lib/cookieConsent.ts`

Сделать:

- Кнопки: `Принять все`, `Только необходимые`, `Настроить`, `Политика cookie`.
- Хранить выбор в localStorage, например `dnl_cookie_consent_v1`.
- Пока внешней аналитики нет, banner только сохраняет выбор.
- Будущие Яндекс.Метрика/VK Pixel должны подключаться только после consent.
- Не блокировать session cookie, авторизацию, корзину и оплату.

Проверка:

- Новый пользователь видит banner.
- После выбора banner не появляется повторно.
- Можно открыть настройки заново из footer.

## Этап 9. Recurring-ready Prodamus без включения

Не включать recurring, пока владелец не получил одобрение Prodamus и юрист не проверил условия.

Сделать только подготовку, если безопасно:

- Добавить env flag `PRODAMUS_RECURRENT_ENABLED=false`.
- Добавить TODO-комментарии и отдельную функцию-заготовку `buildProdamusSubscriptionUrl` рядом с `buildProdamusPayformUrl`, но не использовать ее при false flag.
- В docs/admin/readiness показать, что recurring выключен.
- Не менять текущие разовые платежи.
- В пользовательских текстах до одобрения Prodamus писать "подписка/продление доступа", а не обещать автоматическое автосписание. Блок auto-renew показывать только условно при включенном flag.

Когда recurring будет одобрен:

- Показывать план, период, цену, дату следующего списания, как отменить, что доступ сохраняется до конца периода.
- Хранить `provider_subscription_id`, `auto_renew`, `next_payment_at`, `cancel_at_period_end`, `cancelled_at`.
- Webhook должен понимать `subscription.action_code`.

## Этап 10. Проверки

Обязательно:

1. `npm run build`
2. `npm run typecheck`
3. Если есть lint - `npm run lint`
4. Все `/legal/*` routes открываются.
5. Footer visible на публичных страницах.
6. Регистрация не проходит без обязательных checkbox.
7. Optional marketing не обязателен.
8. Корзина не создает payment без offer/refund checkbox.
9. Подписка не создает payment без subscription terms checkbox.
10. С checkbox Prodamus paymentUrl создается.
11. AI notice виден до поля отправки.
12. Cookie banner появляется новому пользователю.
13. Админка `/admin` открывается, документы/категории не сломаны.
14. `/materialy/magazin`, detail page, `/korzina`, `/podpiska`, `/moi-dokumenty`, `/kabinet` работают.
15. Signed Prodamus webhook для store order по-прежнему выдает доступ в `user_materials`.
16. Signed Prodamus webhook для subscription по-прежнему продлевает `subscriptions.current_period_end`.
17. Повторное использование pending payment/order не сломано.
18. Старые русские legal routes и новые alias routes возвращают 200.

## Этап 11. QA subagent prompt

После реализации запусти отдельную QA-проверку:

```text
Проверь юридический слой как QA без внесения изменений. Открой/проверь маршруты /legal/*, регистрацию, восстановление пароля, корзину, подписку, AI-помощник, публичные заявки, footer. Проверь, что signed Prodamus webhook по-прежнему выдает store-доступ и продлевает подписку. Найди 404, сломанные ссылки, предустановленные галочки, формы, которые отправляются без обязательных согласий, и любые изменения, которые могли сломать admin/payment/materials. Верни список блокеров, рисков и что уже OK.
```

## Этап 12. Commit/report format

Финальный отчет:

- GitHub commit hash.
- Build/typecheck status.
- Какие файлы изменены.
- Какие маршруты проверены.
- Какие формы проверены.
- Что осталось владельцу: РКН, финальные тексты, реквизиты, касса/чеки, договоры с обработчиками, Prodamus recurring approval, юрист.

Не писать "юридически полностью защищено". Формулировка: "реализация снижает риск и закрывает технические признаки, которые обычно проверяются автоматически и вручную".
