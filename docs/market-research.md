# ИТОГОВЫЙ ОТЧЁТ: рынок сервисов аналитики для маркетплейс-селлеров

*Подготовлено для основателя сервиса аналитики товаров (фокус — Uzum/Центральная Азия). Все цифры и факты сверены с fact-check-вердиктами: опровергнутые исключены или помечены, устаревшие приведены с корректировкой, неподтверждённые помечены явно.*

---

## 1. TL;DR — 7 главных выводов

1. **Ниша Uzum уже занята локальными игроками, но рынок незрелый.** Минимум 9 сервисов целятся в Uzum (SellerPro.uz, Statbook, Bestats, DaData, Baraka Data, Zoomselling, Stata Bot и др.), все с похожим набором фич и без явного технологического лидера. Крупные РФ-игроки Uzum либо не держат, либо держат формально: у MPSTATS инструмент Uzum на 2026 показывает «Аналитика UZUM не доступна» (раньше работал) [mpstats-uzum](https://mpstats.io/instruments/uzum/analytics), у Sellmonitor Uzum заявлен, но это второстепенная неглубокая площадка, не вынесенная даже на витрину [cnews-1c](https://www.cnews.ru/news/line/2025-06-10_1c_voshla_v_sostav_uchreditelej). **Окно для сильного Uzum-эталона открыто.**

2. **Главный технологический риск рынка — достоверность оценки чужих продаж — стал острее.** В сентябре 2025 Wildberries закрыл публичные данные об остатках (лимит показа ≤100 ед.) и рекламных ставках; ~80–90% b2b-сервисов внешней аналитики WB потеряли ключевой функционал, дельта-метод (расчёт продаж по динамике остатков) на WB больше не работает достоверно [forbes-wb](https://www.forbes.ru/biznes/546971-wildberries-zakryla-dannye-ob-ostatkah-tovarov-na-svoih-skladah) [kommersant-wb](https://www.kommersant.ru/doc/8079679). Это прямой аргумент в пользу нашей концепции **«честно помечать оценку»**: рынок наелся непрозрачных «90% точности».

3. **Заявленная точность оценок — маркетинг, а не факт.** Amazon-вендоры публикуют взаимоисключающие исследования: Jungle Scout заявляет 84,1% у себя против 74% у Helium 10, Helium 10 — 89,59% у себя против 60% у Jungle Scout [h10-accuracy](https://www.helium10.com/blog/helium-10-jungle-scout-amazon-sales-data-accuracy/). Независимые тесты разницы практически не находят и называют все оценки «грубым ориентиром». **Честная подача погрешности — реальный дифференциатор, а не слабость.**

4. **ИИ-чат «спроси у данных» — НЕ пустая ниша, но занята слабо и фрагментарно.** На Западе полноценного чата к данным селлера нет ни у Helium 10, ни у Jungle Scout (у JS Q&A к своим данным появилось, но только на старших тарифах) [js-aiassist-kb](https://support.junglescout.com/hc/en-us/articles/17206297711127-AI-Assist-Chat). В СНГ прямой аналог уже запущен: inSales 11.02.2026 выпустил «ИИ-аналитик» — LLM-чат на русском к данным кабинета WB/Ozon/Яндекс [cnews-insales](https://www.cnews.ru/news/line/2026-02-11_insales_zapustila_ii-analitika). **Сам факт чата уже не уникален — дифференцироваться нужно глубиной данных, точностью (semantic layer против галлюцинаций) и связкой «вопрос → действие».** Для Uzum чата к данным пока ни у кого нет.

5. **Table-stakes-набор фич жёстко стандартизирован.** Подбор ниш/товаров, оценка продаж, reverse-поиск ключей, трекинг позиций, анализ конкурентов, калькулятор прибыли, базовый анализ отзывов и качества листинга — must-have «на входе». Дифференциаторы лежат в специализации: share of voice, история цен за годы, AI-репрайсинг, FIFO-точность прибыли, near-real-time алерты, goal-based PPC.

6. **Рынок СНГ консолидируется, игроки уходят — доли освобождаются.** Закрылись Moneyplace (01.11.2025, поглощён СКБ Контур), SellerExpert, а также eCompass, Anabar, Statberries [oborot-mp](https://oborot.ru/news/servis-analitiki-marketplejsov-moneyplace-prekrashhaet-rabotu-otdelnaya-struktura-chto-s-nim-budet-dalshe-i255312.html) [moysklad-24](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-marketpleysov/). При этом число селлеров на WB/Ozon впервые снизилось, барьеры входа растут — это давит на платёжеспособность аудитории в РФ, но Uzum, напротив, растёт.

7. **Uzum растёт — тайминг для эталонного сервиса хороший.** Uzum по итогам 2025 заявляет 17+ тыс. селлеров, рост GMV в ~1,5 раза, аудиторию ~20 млн *(не подтверждено независимо — данные самой компании)* [kapital-uzum](https://kapital.uz/uzum-podvel-itogi-2025-goda/).

---

## 2. Ландшафт конкурентов

### CIS / РФ / Центральная Азия

| Продукт | Рынок / маркетплейсы | Ключевые фичи | Поддержка Uzum | Ссылка |
|---|---|---|---|---|
| **MPSTATS** | WB, Ozon, Яндекс Маркет, Авито (лидер РФ, №1 в рейтингах) | Внешняя+внутренняя аналитика, SEO, репрайсер, биддер, AI (прогнозы, анализ отзывов, похожие товары) | **Было «да», сейчас НЕТ** — страница Uzum показывает «недоступно» (по отзывам, с ~авг. 2025) | [mpstats](https://mpstats.io/) [mpstats-uzum](https://mpstats.io/instruments/uzum/analytics) |
| **Sellmonitor / Sellematics** | WB, Ozon, Яндекс, МегаМаркет, Lamoda, **Uzum** (экосистема 1С, доля 51%) | Внешняя+внутренняя, репрайсер, биддер, AI-описания, расширение | **Частично** — заявлен, но неглубокая площадка, не вынесена на витрину | [sellmonitor](https://sellmonitor.com/) [cnews-1c](https://www.cnews.ru/news/line/2025-06-10_1c_voshla_v_sostav_uchreditelej) |
| **MarketGuru** | WB + ограниченно Ozon *(не «только WB» — это опровергнуто)* | Аналитика, биддер, репрайсер, финансы, SEO, A/B фото | Нет | [marketguru](https://marketguru.io/) [mpagency-mg](https://mpagency.ru/blog/obzor-marketguru/) |
| **Stat4Market** | WB, Ozon | Отчёты по продажам/прибыли в реальном времени, расчёт поставок, конкуренты | Нет | [stat4market](https://stat4market.com/) |
| **Shopstat** | WB, Ozon (+ заявлены Яндекс, AliExpress) | Аналитика продаж; **freemium** (есть платный план ~990₽/мес, не «полностью бесплатный») | Нет | [shopstat](https://shopstat.ru/) |
| **Moneyplace** | ~~WB, Ozon, Яндекс, МегаМаркет, AliExpress, KazanExpress, Магнит Маркет, Lamoda~~ | **ЗАКРЫТ 01.11.2025**, поглощён СКБ Контур | Не подтверждалась | [oborot-mp](https://oborot.ru/news/servis-analitiki-marketplejsov-moneyplace-prekrashhaet-rabotu-otdelnaya-struktura-chto-s-nim-budet-dalshe-i255312.html) |
| **SellerExpert** | ~~WB, Ozon~~ | **ЗАКРЫТ** (подтверждено МойСклад, 23.10.2025) | Нет | [moysklad-24](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-marketpleysov/) |
| **SellerStats** | WB, Ozon, Яндекс | Методика по счётчику заказов (WB), анализ остатков с фильтром аномалий (Ozon), учёт выкупов | Нет | [sellerstats](https://sellerstats.ru/) |
| **MarketDB** | KazanExpress → Магнит Маркет | Расширение Chrome: продажи конкурентов, новинки, продажи по характеристикам | Нет *(рабочий домен уточнить — редирект на marketdb.pro)* | [marketdb](https://marketdb.ru/) |
| **Модульселлер** | WB, Ozon, Яндекс, МегаМаркет, Магнит Маркет | Аналитика + операционка | Нет | [moysklad-24](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-marketpleysov/) |
| **inSales** | WB, Ozon, Яндекс | **ИИ-аналитик** — LLM-чат к данным кабинета (запуск 11.02.2026) | Нет | [insales-ai](https://www.insales.ru/page/ai-analyst) [cnews-insales](https://www.cnews.ru/news/line/2026-02-11_insales_zapustila_ii-analitika) |

**Uzum / Центральная Азия (специализированные):**

| Продукт | Рынок | Ключевые фичи | Поддержка Uzum | Ссылка |
|---|---|---|---|---|
| **SellerPro.uz** | Uzum | Анализ товаров/ниш/конкурентов, SEO, Auto Bid, AI-ассистент; ~1,5 млн товаров, ~45,8 тыс. магазинов *(цифры из выдачи, сайт отдал 403)* | **Да** | [sellerpro](https://sellerpro.uz/) |
| **Statbook.uz** | Uzum | Статистика товаров/магазинов, динамика, ценовая сегментация, мониторинг конкурентов, расширение | **Да** | [statbook](https://statbook.uz/) |
| **Bestats.uz** | Uzum | Подбор ниш, ABC/XYZ, SKU-отчёты, трекинг до 1000 карточек, расширение; тарифы 390k–1,49 млн сум/мес | **Да** | [bestats](https://site.bestats.uz/) |
| **DaData (uzum.dadata.io)** | Uzum | 6 методов исследования, ежедневный мониторинг, ABC/XYZ, экспорт; 590k–1,19 млн сум/мес | **Да** | [dadata-uzum](https://uzum.dadata.io/) |
| **Baraka Data** | Uzum | Топ-1000 товаров, мониторинг конкурентов, сезонность, калькулятор прибыли с комиссиями Uzum; 300k–360k сум/мес | **Да** | [barakadata](https://barakadata.uz/) |
| **Zoomselling** | **Uzum + Kaspi + Teez** | Подбор ниш, упущенная выручка, объём рынка, SEO, поиск по фото, бот с обновлением каждые 4 ч; 720k–1,29 млн сум/мес | **Да** | [zoomselling](https://zoomselling.io/) |
| **SellerFox / Sellerden** | WB, Ozon, Яндекс, Магнит Маркет, AliExpress + Uzum *(посадочная)* | Аналитика продаж, прогноз по категориям + AI | **Да** *(требует перепроверки, сайт 403)* | [sellerden-uzum](https://sellerden.ru/sellerfox/analitika-uzum-market/) |
| **Stata Bot** | Uzum | Telegram-бот аналитики *(контент не подтверждён — сайт отдал пустую страницу)* | **Да (заявлено)** | [stata](https://stata.site/) |

### Глобальные

| Продукт | Рынок | Ключевые фичи | Поддержка Uzum | Ссылка |
|---|---|---|---|---|
| **Helium 10** | Amazon, Walmart, TikTok Shop | All-in-one (30+ инструментов): Black Box (БД 450M+), Cerebro (reverse-ASIN), Magnet, Profits, Market Tracker, AI Listing Builder, Helium 10 Ads (PPC на Pacvue) | Нет | [helium10](https://www.helium10.com/tools/) |
| **Jungle Scout** | Amazon | Product Database (475M товаров), AccuSales (оценка продаж), Keyword Scout, Rank Tracker, Supplier Database (через таможню США), inventory | Нет | [junglescout](https://www.junglescout.com/features/) |
| **Keepa** | Amazon | Лидер по истории цен/BSR/Buy Box за годы, Product Finder (~120 фильтров), публичный API | Нет | [keepa](https://keepa.com/) |
| **SellerAmp (SAS)** | Amazon (арбитраж) | Мгновенный ROI/прибыль, BSR-эстиматор, Buy Box-анализ; расширение + моб. сканер + веб | Нет | [selleramp](https://selleramp.com/) |
| **AMZScout** | Amazon (14 рынков) | PRO AI Extension, БД ~600M товаров, Sales Estimator, AI Listing Builder, Review Analyzer | Нет | [amzscout](https://amzscout.net/) |
| **SmartScout** | Amazon | Brand/Seller Database, Traffic Graph («frequently bought together»), Market Share, Ad Spy | Нет | [smartscout](https://www.smartscout.com/) |
| **DataDive** | Amazon | Глубокая работа с ключами: Master Keyword List, кластеризация Roots; агрегация JS API + Keepa + Google Trends | Нет | [datadive](https://datadive.tools/) |
| **sellerboard** | Amazon | Real-time P&L (100+ комиссий, FIFO-COGS), автозапрос реимберсментов, PPC, listing-алерты | Нет | [sellerboard](https://sellerboard.com/) |
| **Perpetua** | Amazon (+ ритейл-медиа) | Goal-based PPC/DSP-автоматизация, dayparting; поглотил Sellics (апр. 2022) | Нет | [perpetua](https://www.perpetua.io/) |
| **ZIK Analytics** | eBay (+ дропшиппинг) | Product Research, Best Sellers, Title Builder, Autopilot | Нет | [zik](https://www.zikanalytics.com/) |
| **eRank** | Etsy | Etsy-SEO, keyword research, анализ конкурентов; 2,5M+ селлеров | Нет | [erank](https://erank.com/) |
| **EtsyHunt (ehunt.ai)** | Etsy | БД 71M+ листингов, данные неактивных товаров/шопов, AI-мокапы | Нет | [ehunt](https://ehunt.ai/?ref=etsyhunt) |
| **Polar Analytics** | Shopify / DTC (НЕ маркетплейсы) | **«Ask Polar»** — NL Q&A к данным через semantic layer + MCP | Нет | [askpolar](https://www.polaranalytics.com/ask-polar) |
| **Viral Launch** | ~~Amazon~~ | **ЗАКРЫТ 31.12.2025** (куплен Worldeye, 2023). Фичи — для изучения: Product Discovery, Kinetic PPC | Нет | [vl-shutdown](https://tracefuse.ai/blog/why-did-viral-launch-shut-down/) |

---

## 3. Матрица фич: table-stakes vs дифференциаторы

### Table-stakes (обязательный минимум)

| Фича | Что это | Пример | Ссылка |
|---|---|---|---|
| Product/niche research + БД с фильтрами | Поиск товарных идей по категории/цене/BSR/выручке | Jungle Scout 475M, Helium 10 Black Box 450M+ | [js-db](https://www.junglescout.com/features/product-database/) |
| Оценка продаж/выручки | По BSR (Amazon) или динамике остатков (WB/Ozon); бесплатный эстиматор есть у всех | Helium 10 / JS Sales Estimator | [h10-estimator](https://www.helium10.com/tools/free/amazon-sales-estimator/) |
| Reverse-поиск ключей + keyword research | Ключи конкурента по ID товара (reverse-ASIN) | Helium 10 Cerebro, JS Keyword Scout | [cerebro](https://www.helium10.com/tools/keyword-research/cerebro/) |
| Трекинг позиций | Органика + реклама во времени | Helium 10 Keyword Tracker | [h10-kw](https://www.helium10.com/tools/keyword-research/) |
| Анализ конкурентов | Трекинг продаж/цены/выручки по списку товаров | JS Product Tracker | [junglescout](https://www.junglescout.com/) |
| Калькулятор прибыли/комиссий | Цена − комиссии − логистика − COGS = маржа/ROI | Helium 10 FBA Calc, sellerboard | [h10-fba](https://www.helium10.com/tools/free/fba-calculator/) |
| Анализ отзывов | Распределение рейтинга, частые фразы, экспорт | Helium 10 Review Insights | [h10-reviews](https://www.helium10.com/tools/product-research/chrome-extension/review-insights/) |
| Качество листинга | Score + рекомендации. **Важно: шкалы у вендоров разные** — 0–100 у SellerApp, 1–10 у Helium 10 (миф о единой «0–100 по 10–15 параметрам» опровергнут) | SellerApp LQI, Helium 10 | [sellerapp-lqi](https://www.sellerapp.com/help/article/understanding-lqi/) |
| Инвентарь/прогноз поставок | Sales velocity, точки перезаказа, алерты stockout | JS Inventory Manager | [js-inventory](https://www.junglescout.com/solutions/streamline-business/) |
| Базовые алерты | Изменения листинга/цены/Buy Box, новые продавцы | Helium 10 Alerts, sellerboard | [helium10](https://www.helium10.com/tools/) |
| Базовая PPC-аналитика | ACOS/ROAS/TACOS по кампаниям + автоставки по target ACOS | Helium 10 Ads, sellerboard PPC | [helium10](https://www.helium10.com/tools/) |

### Дифференциаторы / «киллер»-фичи

| Фича | Чем выделяет | Пример | Ссылка |
|---|---|---|---|
| **Точность оценки продаж** | Главное поле конкуренции (Amazon не отдаёт реальные данные) — но цифры точности у всех самозаявленные | AccuSales / Xray | [h10-accuracy](https://www.helium10.com/blog/helium-10-jungle-scout-amazon-sales-data-accuracy/) |
| **Share of Voice / Market Share** | Доля показов в выдаче против конкурентов, organic vs paid по ad-форматам | Helium 10 Market Tracker (Diamond+) | [market-tracker](https://www.helium10.com/tools/analytics/market-tracker/) |
| **История цен/BSR за годы** | Глубина данных, недоступная all-in-one | Keepa | [keepa](https://keepa.com/) |
| **AI-репрайсинг** | Автопобеда в Buy Box с min/max и максимизацией прибыли *(win-rate 65%/63% — заявления вендоров)* | Aura, Informed | [aura](https://goaura.com/) |
| **FIFO-точность прибыли + реимберсменты** | Real-time P&L со 100+ комиссиями, автовозврат денег за ошибки FBA | sellerboard, Refund Genie | [sellerboard](https://sellerboard.com/) |
| **Goal-based PPC + DSP** | Управление по цели, dayparting, кросс-форматность | Perpetua | [ppc-2026](https://daniks.ai/blog/best-amazon-ppc-tools-2026) |
| **Near-real-time алерты** | Детект хайджекеров/suppressed-листингов, проверка каждые 35–60 мин, email/SMS | SellerSonar | [sellersonar](https://sellersonar.com/hijacking-alerts/) |
| **Data-first структуры** | Brand/Seller DB, Traffic Graph связей товаров | SmartScout | [smartscout](https://www.smartscout.com/) |
| **AI Q&A к своим данным** | NL-чат к продажам через semantic layer (защита от галлюцинаций) | Polar (DTC), inSales (WB/Ozon) | [askpolar](https://www.polaranalytics.com/ask-polar) [insales-ai](https://www.insales.ru/page/ai-analyst) |

### Чего НЕ хватает на рынке Uzum (пробелы → возможности)

- **Нет ИИ-чата «спроси у данных» по Uzum** — ни у одного локального игрока (есть только у inSales по WB/Ozon/Яндекс).
- **Нет честной модели подачи точности** — все локальные сервисы декларируют высокую точность без оговорок.
- **Слабые/отсутствующие**: Share of Voice по Uzum, near-real-time алерты на хайджекеров/изменения, goal-based PPC, глубокая история цен за годы, автоматизация «вопрос → действие».
- **Подключение альтернативных источников** (поисковый спрос, TikTok-тренды, 1688/опт) под Uzum-нишу никто системно не делает.

---

## 4. Источники данных (карта типов)

> Это ключевой раздел — пользователь прямо спрашивал про «другие типы источников». Ниже — что даёт каждый тип, ограничения и достоверность.

| Тип источника | Что даёт | Ограничения / достоверность | Ссылка |
|---|---|---|---|
| **Витрина маркетплейса (парсинг)** | Цены, рейтинги, отзывы, позиции, раньше — остатки/заказы | **WB с сент. 2025 закрыл остатки (≤100 ед.) и ставки** — дельта-метод по WB сломан, ~80–90% сервисов потеряли функционал (CONFIRMED). У Ozon открытого API такого уровня не было — внешняя аналитика традиционно слабее | [forbes-wb](https://www.forbes.ru/biznes/546971-wildberries-zakryla-dannye-ob-ostatkah-tovarov-na-svoih-skladah) [vc-tech](https://vc.ru/marketing/571615-kak-ustroen-servis-analitiki-marketpleisov-parsing-wildberries-ozon) |
| **Официальный Seller API (WB/Ozon/Яндекс/Uzum)** | Точные данные ТОЛЬКО по своему кабинету: продажи, остатки, воронка, поисковые запросы | Точность ~100%, но не видит конкурентов/весь рынок. Uzum API существует (api-seller.uzum.uz), авторизованный, привязан к кабинету (CONFIRMED) | [wb-api](https://dev.wildberries.ru/en/docs/openapi/analytics) [yandex-api](https://yandex.ru/dev/market/partner-api/doc/en/overview/) |
| **Поисковый спрос** | Спрос по запросам | Yandex Wordstat (РФ, API, лимиты по баллам — CONFIRMED); Google Trends (значения 0–100, alpha-API с июля 2025 — CONFIRMED); **Google Keyword Planner НЕ даёт абсолютные объёмы — только диапазоны-«корзины» (REFUTED)**: ~7 широких на free, ~60 при активных расходах | [wordstat](https://wordstat.yandex.ru/) [authoritas](https://www.authoritas.com/blog/understanding-googles-search-volume-buckets-a-deep-dive-into-how-search-volumes-really-work) |
| **TikTok / соцтренды** | Растущие товары, виральные тренды до выхода на маркетплейс | TikTok Creative Center (бесплатно, официально); WinningHunter / Minea (ad-spy, заявлено 90–95% точности — **self-reported, без независимого аудита**); Pinterest API v5; YouTube (Tubular, Social Blade) | [winninghunter](https://winninghunter.com/tiktok-shop) |
| **Таможня / импорт** | Bill of lading, поставщики, HS-коды, объёмы импорта | ImportGenius (US-ядро по FOIA, «25+ стран» маркетинг). **Важно: «РФ-импорт почти не покрыт» — ОПРОВЕРГНУТО**: у ImportGenius есть отдельный российский add-on (океан/земля/воздух, с янв. 2011, ~2,3 млн компаний). Panjiva/S&P — поиск по HS/HTS-кодам | [importgenius](https://www.importgenius.com/how-it-works/additional-countries) |
| **1688 / Alibaba (опт)** | Закупочные цены, MOQ, поставщики | Через скрейперы Apify (от $3.99/1000 товаров) — целая экосистема акторов. Официальное API ограничено (выдаётся в осн. китайским ERP), отсюда рынок скрейперов/реселлеров API (CONFIRMED) | [apify-1688](https://apify.com/zen-studio/1688-wholesale-scraper/api) |
| **Рекламные библиотеки** | Креативы и реклама конкурентов | Meta Ad Library, Google Transparency, TikTok Creative Center + SaaS (AdSpy, BigSpy, Pipiads) | [adlib-2026](https://adlibrary.com/posts/best-ad-intelligence-tools-2026) |
| **Чек-данные / ритейл-аудит** | Офлайн-контекст спроса (ОФД, FMCG) | Чек Индекс (ОФД, млн касс), NielsenIQ — **офлайн, не SKU селлера**, для маркетплейс-аналитики косвенно | [checkindex](https://checkindex.ru/) |

**Вывод для продукта:** для Uzum базис — связка официального Seller API (свои данные, 100%) + парсинг витрины Uzum (конкуренты, оценка). Альтернативные источники (поисковый спрос, TikTok-тренды, 1688/опт) — это потенциальный дифференциатор, которого у локальных конкурентов нет, но к каждому надо относиться с учётом ограничений (Keyword Planner — диапазоны, ad-spy точность — самозаявленная).

---

## 5. Как оценивают продажи и насколько это точно

**Две принципиально разные методологии:**

1. **BSR-based (Amazon):** продажи моделируются по Best Sellers Rank через категорийные lookup-таблицы (обратная экспоненциальная кривая «ранг → продажи»), откалиброванные на opt-in данных реальных селлеров и истории за 30 дней. Это **статистическая регрессия, а не наблюдение**. Один и тот же BSR даёт кратно разные продажи в разных категориях [easyparser-bsr](https://easyparser.com/blog/amazon-bsr-monthly-sales-estimation). Jungle Scout AccuSales обрабатывает ~2 млрд точек/день, формула не раскрывается (CONFIRMED) [js-accusales](https://www.junglescout.com/accusales/).

2. **Дельта-метод (WB/Ozon):** парсинг открытых остатков, продажи = снижение остатка между снимками (вчера 100 → сегодня 50 = 50 продаж). На WB дополнительно «счётчик заказов/выкупов» в карточке [globalparsing](https://globalparsing.ru/article/parsing_wildberries_-_kak_rabotajut_servisy_analitiki_marketplejsov/3178).

**Честная оценка точности (критика):**

- **Заявленная точность — взаимоисключающий маркетинг.** JS: 84,1% себе / 74% конкуренту; Helium 10: 89,59% себе / 60% конкуренту, причём Helium 10 уличает JS в арифметической ошибке («84−74 ≠ 14») [h10-accuracy](https://www.helium10.com/blog/helium-10-jungle-scout-amazon-sales-data-accuracy/). Оба исследования — самофинансируемые, конфликт интересов.
- **Дельта-метод ломается** на возвратах, перемещениях между складами, допоставках, инвентаризациях и форс-мажорах. Реальные кейсы ложных сигналов: пожар на складе Шушары и закрытие Екатеринбург-2 (2024) — обнуление остатков засчитано как «всплеск продаж». На FBS продавец может сам залить 1000 и обнулить — сервис покажет «продажи» [wbcon](https://wbcon.ru/2025/01/20/parsing-wildberries/).
- **Расхождение между сервисами 30–50%** по выручке в категориях со скрытыми остатками *(цифра из источника-агентства, без независимого замера)* [mpagency-mps](https://mpagency.ru/blog/obzor-mpstats/).
- **Точность по тирам ранга (±10–25%)** — *НЕ подтверждена независимо (UNCERTAIN, single-source)*. Корректнее: точность зависит в первую очередь **от категории и скорости продаж**, а не от номера ранга. Наименее надёжны медленно продающиеся товары (одна продажа резко двигает BSR) [bagengine](https://bagengine.com/articles/jungle-scout-accuracy).
- **«Независимый тест: завышение +202%/+256%»** — *ОПРОВЕРГНУТО*: цифры из вендорского исследования Helium 10, не из независимого теста, и неверно атрибутированы. Независимые обзоры сходятся лишь в том, что разница невелика, а оценки — «directionally correct» ориентир [ecomcrew](https://www.ecomcrew.com/helium10-vs-junglescout/).
- **MPStats «>90% точности, закрытая технология без потерь»** — *УСТАРЕЛО/самозаявление*: методология — обычный парсинг снимков; после закрытия данных WB (сент. 2025) парсинговая аналитика по WB искажена [oborot-wb](https://oborot.ru/news/pochemu-wildberries-zakryl-dostup-k-dannym-o-prodazhah-sellerov-i255306.html).
- **Внутренняя (по API селлера) ~100% и совпадает с ЛК; внешняя (чужие продажи) — всегда модель.** Разброс заявлений о погрешности от «3–5%» до «30–50%» сам по себе показывает отсутствие единого стандарта [moysklad-wb](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-wildberries/).

**Связка с нашим решением:** рынок наводнён непроверяемыми «90%+». Наша концепция **«помечать оценку честно»** (диапазон вместо точечного числа, явное указание метода и его слабых мест, разделение «свои данные = факт / чужие = оценка») — это не недостаток, а доверие-дифференциатор. Особенно уместно после кризиса данных WB-2025, когда селлеры на своём опыте увидели, насколько хрупки чужие «точные» цифры.

---

## 6. Бизнес-модели и цены

### Тарифы конкурентов (с пометкой актуальности)

**РФ (₽/мес):**
- **MPSTATS:** «Весь MPSTATS» ~39 990 ₽; «Весь Ozon» 16 990; «Весь WB» 29 990; старт/расширение от 9 000 (CONFIRMED). Модули: WB от 5 990, Ozon 6 990, Яндекс 5 990, Кабинет WB 7 990; модульная скидка до 58% (CONFIRMED). Базовый старт за один инструмент — от ~6 000–6 495 ₽ [mps-tariffs](https://mpstats.io/tariffs) [mpagency-mps](https://mpagency.ru/blog/obzor-mpstats/)
- **MarketGuru:** 9 990 / 11 990 / 32 990 / 45 990 ₽; скидки до −50% за 24 мес (CONFIRMED по live-странице, но цены нестабильны — пересверять) [mg-prices](https://marketguru.io/prices)
- **Shopstat:** freemium, платный план ~990 ₽/мес [shopstat-tariffs](https://shopstat.ru/tariffs/)
- **inSales «ИИ-аналитик»:** тариф «Селлер» ~4 080 ₽/мес (год), «Сайт из маркетплейса» 5 610 ₽; 7 дней бесплатно [insales-ai](https://www.insales.ru/page/ai-analyst)

**Глобальные (USD/мес):**
- **Helium 10:** Platinum $129, Diamond $359, Enterprise от $1499 (CONFIRMED). При годовой оплате Platinum ~$99, Diamond ~$279. **Тариф Starter убран** (вероятно янв. 2026, не апрель; в апреле — общее повышение цен). *Контекстная деталь «+2% ad spend» — НЕ подтверждена, вероятно ошибочна.* [h10-pricing](https://www.helium10.com/pricing/) [demandsage-h10](https://www.demandsage.com/helium-10-pricing/)
- **Jungle Scout:** Starter $29, Growth Accelerator $49, Brand Owner+CI $129; доп. место $49; Cobalt — enterprise по запросу (CONFIRMED) [js-pricing](https://www.junglescout.com/pricing/catalyst-plans/)
- **Keepa:** подписка €19/мес (€189/год); базовые графики/алерты бесплатны (CONFIRMED). **API — отдельно**, токенная модель €49–4 499/мес (НЕ входит в €19) [keepa-pricing](https://revenuegeeks.com/keepa-pricing/)

**Uzum (сум/мес):** Bestats 390k–1,49 млн; DaData 590k–1,19 млн; Baraka Data 300k–360k; Zoomselling 720k–1,29 млн *(все high-risk, перепроверять на сайтах)*.

### Модели монетизации
- **Подписка по тарифам/модулям** (доминирует): MPSTATS — модульная сборка; Helium 10/JS — лестница планов.
- **Freemium-воронка:** Shopstat, бесплатные эстиматоры/калькуляторы у всех как лид-магнит; триалы 1–7 дней (Uzum-сервисы — 24 ч–7 дней).
- **Per-seat / enterprise** для брендов (JS Cobalt, Helium 10 Enterprise, Market Tracker 360 от ~$650/мес).
- **Usage-based (токены)** для данных: Keepa API.
- **% от рекламных расходов:** заявлялось для Helium 10, но в проверке не подтвердилось.

### Размер и рост рынка
- **Рынок e-commerce аналитики:** ~$28,64 млрд в 2026, CAGR ~14,5%, прогноз до ~$60 млрд к 2030 *(high-risk, один источник)* [bri-market](https://www.businessresearchinsights.com/market-reports/e-commerce-analytics-market-102447)
- **Маркетплейсы РФ:** продажи ~8,59 трлн ₽ за 2025, темпы замедлились *(high-risk)* [kommersant-rf](https://www.kommersant.ru/doc/8516023)
- **Сжатие в РФ:** число продавцов WB/Ozon впервые упало (~−2%, реально торгующих −24,5%); комиссии +58–63%, логистика +33–89%, издержки 50–70% выручки *(high-risk)* [mail-sellers](https://finance.mail.ru/article/chislo-prodavcov-na-wildberries-i-ozon-vpervye-upalo-na-2-v-2025-godu-67435278/) [sostav-barriers](https://www.sostav.ru/publication/konets-deshevogo-vkhoda-pochemu-model-marketplejsov-sebya-izzhivaet-i-chto-zhdet-msp-81844.html)
- **Uzum растёт:** 17+ тыс. селлеров, GMV ~×1,5, аудитория ~20 млн *(данные компании, не подтверждены независимо)* [kapital-uzum](https://kapital.uz/uzum-podvel-itogi-2025-goda/)

---

## 7. AI-ландшафт

**Четыре типа применения ИИ (не путать):**

1. **AI-копирайтинг листингов** — самый массовый и зрелый. Helium 10 Listing Builder (на OpenAI/ChatGPT; исходно анонсирован GPT-4.0, версия в 2026 не раскрывается; *тезис «автоматически кормится reverse-ASIN из Cerebro как ключевое отличие» — ОПРОВЕРГНУТ*, ключи вводятся вручную/импортом) [h10-listing](https://www.helium10.com/blog/helium-10-announces-new-ai-enhanced-listing-builder-tool/). Также Jungle Scout, AMZScout, ZonGuru, в СНГ — Marpla/Eggheads.
2. **AI-анализ отзывов** — Jungle Scout Review Analysis, AMZScout, MPSTATS.
3. **AI-прогнозы спроса / подбор товаров** — MPSTATS «Прогнозы AI» (прогноз на месяц с доверительным интервалом, без раскрытия точности) [mps-ai](https://wiki.mpstats.io/Wildberries/%D0%9A%D0%B0%D1%82%D0%B5%D0%B3%D0%BE%D1%80%D0%B8%D0%B8/%D0%9F%D1%80%D0%BE%D0%B3%D0%BD%D0%BE%D0%B7%D1%8B_%D0%98%D0%98), Helium 10 Product Launchpad (AI-скоринг ниши, не чат — CONFIRMED).
4. **AI-оптимизация PPC** — Helium 10 Ads на Pacvue (задаёшь ACoS+бюджет, AI ведёт ставки; в Platinum — CONFIRMED) [h10-ads](https://www.helium10.com/news/helium-10-ushers-in-a-bold-new-era-of-ai-advertising/), Quartile, Seller Snap.

**Ключевой вывод по нашему дифференциатору — ИИ-чату «спроси у данных»:**

Ниша **НЕ пустая, но занята слабо и фрагментарно**:
- **Helium 10:** встроенного чата к данным внутри платформы НЕТ. *Тезис «надо вручную экспортировать в ChatGPT» УСТАРЕЛ* — на 2026 есть официальное приложение Helium 10 в ChatGPT Store (live-коннектор по логину Diamond+) [h10-chatgpt-kb](https://kb.helium10.com/hc/en-us/articles/48991154323611-Helium-10-App-in-ChatGPT-Introduction-and-Overview).
- **Jungle Scout:** *«AI Assist = только FAQ-бот» ОПРОВЕРГНУТО* — на старших тарифах (Brand Owner) при подключённом Seller Central отвечает на вопросы о СВОИХ данных («What was my net profit this week?»). Также есть MCP-сервер для NL-доступа через Claude/ChatGPT (CONFIRMED) [js-aiassist-kb](https://support.junglescout.com/hc/en-us/articles/17206297711127-AI-Assist-Chat) [js-mcp-zapier](https://zapier.com/mcp/jungle-scout).
- **Polar Analytics («Ask Polar»):** настоящий NL Q&A к данным через semantic layer + MCP, заявлено >95% точности на governed-метриках *(self-reported)* — **но это Shopify/DTC, НЕ маркетплейсы** [askpolar](https://www.polaranalytics.com/ask-polar). Архитектурный ориентир: semantic layer снижает ошибки gen-AI-запросов до ~⅔ (бенчмарк Google/Looker).
- **DataHawk:** AI-агенты с root-cause анализом (падение → причина: трафик/конверсия/цена/Buy Box/реклама → рекомендация) [datahawk](https://datahawk.co/blog/ai-agents/ai-agents-for-sellers/).
- **СНГ — прямой конкурент уже есть:** inSales «ИИ-аналитик» (11.02.2026) — LLM-чат на русском к данным кабинета WB/Ozon/Яндекс: выручка/прибыль/маржа, убыточные товары, ABC/XYZ, сравнение рекламы, ответы таблицами/графиками, 110 тем, до ~30 сек (CONFIRMED) [cnews-insales](https://www.cnews.ru/news/line/2026-02-11_insales_zapustila_ii-analitika).
- **Риск со стороны площадок:** Amazon запустил собственный AI-опыт Canvas для селлеров; WB тестирует AI-ассистента (пока для покупателей) — площадки могут встроить базовую AI-аналитику бесплатно [amazon-canvas](https://www.aboutamazon.com/news/innovation-at-amazon/amazon-sellers-canvas-artificial-intelligence).

**НЕЗАНЯТАЯ ниша конкретно для нас:** ИИ-чата «спроси у данных» по **Uzum** нет ни у кого. inSales закрыл WB/Ozon/Яндекс, но не Центральную Азию. Окно для дифференциации — не сам факт чата (он уже не уникален), а: **(а)** глубина интеграции данных Uzum (свой кабинет + рынок), **(б)** точность через semantic layer против галлюцинаций, **(в)** проактивные инсайты/алерты, **(г)** связка «вопрос → рекомендация → действие/автоматизация».

---

## 8. Что это значит для нашего продукта

### На чём дифференцироваться на рынке Uzum
1. **Uzum-эталон по качеству данных.** Локальные конкуренты многочисленны, но без явного лидера по глубине/точности. Стать «золотым стандартом» данных по Uzum (полнее категории/продавцы/бренды/ключи, история, ежечасное обновление для топов) — достижимая позиция.
2. **Честная модель оценки как доверие-бренд.** Везде показывать **диапазон, а не точечное число**; явно маркировать «свои данные (API, факт)» vs «оценка конкурента (модель, погрешность)»; раскрывать метод и его слабые места. После кризиса данных WB-2025 это резонирует с болью селлеров и бьёт по непрозрачным «90%+» конкурентов.
3. **ИИ-чат «спроси у данных» по Uzum — первый на рынке.** Но дифференциатор не в чате, а в: semantic layer (антигаллюцинация), проактивных алертах, связке «вопрос → действие». Это закрывает то, чего нет ни у локальных игроков, ни даже у глобальных лидеров на их рынках.

### Фичи в MVP
- **Table-stakes (без них не пустят):** подбор ниш/товаров по Uzum + БД с фильтрами; оценка продаж/выручки (с честным диапазоном); анализ конкурентов (трекинг товаров); reverse-поиск ключей + SEO; калькулятор прибыли с **реальными комиссиями Uzum** (как у Baraka Data); ABC/XYZ; браузерное расширение (стандарт у всех Uzum-сервисов).
- **Дифференциаторы для MVP/раннего этапа:** ИИ-чат к своим данным (через официальный Uzum Seller API) + базовый чат к рыночным данным; честная индикация точности; near-real-time алерты (изменения цен/новые продавцы/потеря позиций).
- **Отложить (post-MVP):** AI-репрайсинг, goal-based PPC, глубокая история цен за годы, мультимаркетплейс (Kaspi/Teez — как у Zoomselling).

### Какие источники подключать
1. **База (обязательно):** официальный Uzum Seller API (свои данные, ~100%) + парсинг витрины Uzum (конкуренты/оценка).
2. **Дифференцирующие альтернативные источники** (никто на Uzum системно не делает): Google Trends/Wordstat для спроса (помнить: Keyword Planner = диапазоны, не абсолюты); TikTok-тренды (Creative Center бесплатно; ad-spy точность — самозаявленная); 1688/опт через Apify-скрейперы для закупочных цен/MOQ/поставщиков.
3. **Позже:** таможня/импорт (ImportGenius покрывает РФ; по Узбекистану — проверить покрытие отдельно).

### Риски
- **Закрытие данных площадкой** (как WB в сент. 2025) — главный системный риск. Митигация: ставка на официальный Seller API (свои данные) и партнёрство/официальный доступ к Uzum, а не только на парсинг витрины. Не строить ядро ценности на хрупком парсинге чужих остатков.
- **Площадка встроит свою AI-аналитику** (Amazon Canvas, AI-ассистент WB) — Uzum может сделать то же. Митигация: уходить в глубину (кросс-рыночные источники, действия/автоматизация), куда площадка не пойдёт.
- **Сжатие платёжеспособности селлеров** (в РФ число продавцов падает, издержки растут). Для Uzum пока обратный тренд (рост), но цены тарифицировать в локальной валюте и аккуратно — у Uzum-конкурентов широкий разброс (300k–1,49 млн сум/мес).
- **ИИ-чат уже не уникален** (inSales запустил для WB/Ozon). Скорость выхода на Uzum и качество (точность/действия) важнее, чем сам факт фичи.
- **Низкая достоверность многих рыночных цифр** в этом отчёте (high-risk) — перед стратегическими решениями ключевые числа (доли, размер рынка, цены Uzum-конкурентов, данные Uzum о росте) перепроверять на первоисточниках.

---

## 9. Полный список ссылок (по направлениям, дедуплицирован)

### Конкуренты CIS/Uzum
- [MPSTATS — сайт](https://mpstats.io/)
- [MPSTATS — инструмент Uzum (на 2026: «недоступно»)](https://mpstats.io/instruments/uzum/analytics)
- [MPSTATS — апдейт ноябрь 2024](https://mpstats.io/media/news/obnovleniya-noyabr-2024)
- [MPSTATS — тарифы](https://mpstats.io/tariffs)
- [Sellmonitor — сайт](https://sellmonitor.com/)
- [CNews — «1С» в учредителях Селлематикс](https://www.cnews.ru/news/line/2025-06-10_1c_voshla_v_sostav_uchreditelej)
- [Moneyplace — сайт](https://moneyplace.io/)
- [Moneyplace — раздел KazanExpress/Магнит Маркет](https://moneyplace.io/kazanexpress/chto-prodavat-na-kazan-ekspress/)
- [MarketGuru — сайт](https://marketguru.io/)
- [MarketGuru — цены](https://marketguru.io/prices)
- [MPAgency — обзор MarketGuru](https://mpagency.ru/blog/obzor-marketguru/)
- [Stat4Market — сайт](https://stat4market.com/)
- [Stat4Market — обзор x-kit](https://x-kit.ru/analitika/analitika-marketpleysov/stat4market/)
- [Shopstat — сайт](https://shopstat.ru/)
- [Shopstat — тарифы](https://shopstat.ru/tariffs/)
- [SellerExpert — сайт (закрыт)](https://sellerexpert.ru/competitor)
- [SellerPro.uz](https://sellerpro.uz/)
- [Statbook.uz](https://statbook.uz/)
- [Bestats.uz](https://site.bestats.uz/)
- [DaData for Uzum](https://uzum.dadata.io/)
- [Baraka Data](https://barakadata.uz/)
- [Zoomselling (Uzum+Kaspi+Teez)](https://zoomselling.io/)
- [Stata Bot](https://stata.site/)
- [SellerFox/Sellerden — Uzum](https://sellerden.ru/sellerfox/analitika-uzum-market/)
- [MarketDB (KazanExpress/Магнит Маркет)](https://marketdb.ru/)
- [Магнит — ребрендинг KazanExpress](https://www.magnit.com/ru/media/press-releases/magnit-pristupaet-k-rebrendingu-kazanexpress/)
- [Магнит Маркет — Википедия](https://ru.wikipedia.org/wiki/%D0%9C%D0%B0%D0%B3%D0%BD%D0%B8%D1%82_%D0%9C%D0%B0%D1%80%D0%BA%D0%B5%D1%82)
- [МойСклад — обзор 24 сервисов](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-marketpleysov/)
- [vc.ru — ТОП-15 сервисов 2026](https://vc.ru/marketplace/2035503-luchshie-servisy-analitiki-marketpleysov-2025)
- [Skillbox — сравнение 5 платформ](https://skillbox.ru/media/marketing/servisy-analitiki-marketpleysov-izuchaem-i-sravnivaem-pyat-populyarnykh-platform/)
- [SellerBlog — альтернативы MPStats](https://sellerblog.ru/alternativy-mpstats/)

### Глобальные игроки
- [Helium 10 — инструменты](https://www.helium10.com/tools/)
- [Helium 10 Cerebro](https://www.helium10.com/tools/keyword-research/cerebro/)
- [Helium 10 KB — Cerebro](https://kb.helium10.com/hc/en-us/articles/360046326894-How-Do-I-Use-Cerebro)
- [Jungle Scout — фичи](https://www.junglescout.com/features/)
- [Jungle Scout AccuSales (support)](https://support.junglescout.com/hc/en-us/articles/360008616814-Extension-Estimates-AccuSales)
- [RevenueGeeks — точность Jungle Scout vs Helium 10](https://revenuegeeks.com/is-jungle-scout-accurate/)
- [Keepa — API](https://keepa.com/#!api)
- [Гайд по Keepa Product Finder](https://fbamogul.com/keepa-product-finder-getting-started-guide/)
- [SellerAmp SAS](https://selleramp.com/)
- [AMZScout](https://amzscout.net/)
- [AMZScout — reverse-ASIN](https://amzscout.net/reverse-asin-lookup/)
- [SmartScout](https://www.smartscout.com/)
- [DataDive — лендинг](https://datadive.tools/)
- [DataDive — Master Keyword List](https://support.datadive.tools/hc/en-us/articles/4414442624921-Master-Keyword-List)
- [Perpetua](https://www.perpetua.io/)
- [Perpetua — слияние с Sellics](https://perpetua.io/sellics-joins-perpetua/)
- [ZIK Analytics](https://www.zikanalytics.com/)
- [eRank](https://erank.com/)
- [EtsyHunt (ehunt.ai)](https://ehunt.ai/?ref=etsyhunt)
- [Почему закрылся Viral Launch](https://tracefuse.ai/blog/why-did-viral-launch-shut-down/)
- [Intellifox (редирект viral-launch.com)](https://intellifox.com/)

### Каталог фич
- [Helium 10 Market Tracker (Share of Voice)](https://www.helium10.com/tools/analytics/market-tracker/)
- [Helium 10 Listing Analyzer](https://www.helium10.com/tools/listing-optimization/listing-analyzer/)
- [Helium 10 Review Insights](https://www.helium10.com/tools/product-research/chrome-extension/review-insights/)
- [Helium 10 FBA Calculator](https://www.helium10.com/tools/free/fba-calculator/)
- [Helium 10 free Sales Estimator](https://www.helium10.com/tools/free/amazon-sales-estimator/)
- [Jungle Scout Sales Estimator](https://www.junglescout.com/estimator/)
- [Jungle Scout Product Database](https://www.junglescout.com/features/product-database/)
- [Jungle Scout — inventory/restock](https://www.junglescout.com/solutions/streamline-business/)
- [Jungle Scout — сезонность](https://www.junglescout.com/resources/articles/seasonal-products/)
- [SellerApp LQI (шкала 0–100)](https://www.sellerapp.com/help/article/understanding-lqi/)
- [sellerboard](https://sellerboard.com/)
- [Keepa](https://keepa.com/)
- [Aura — AI-репрайсер](https://goaura.com/)
- [Informed Repricer](https://www.informedrepricer.com/)
- [SellerSonar — алерты хайджекеров](https://sellersonar.com/hijacking-alerts/)
- [SellerSonar — алерты цен](https://sellersonar.com/amazon-price-change-alerts/)
- [Обзор PPC-инструментов 2026](https://daniks.ai/blog/best-amazon-ppc-tools-2026)
- [DemandSage — обзор Jungle Scout](https://www.demandsage.com/jungle-scout-review/)
- [DemandSage — альтернативы Helium 10](https://www.demandsage.com/helium-10-alternatives/)
- [Обзор репрайсеров Amazon 2026](https://amzprep.com/amazon-repricer-tools/)
- [Helium 10 — аудит-отчёт (Insights Dashboard)](https://kb.helium10.com/hc/en-us/articles/40930561482651-Using-the-Audit-Report-in-the-Insights-Dashboard)

### Источники данных
- [Wildberries закрыл данные (New Retail)](https://new-retail.ru/novosti/retail/wildberries_zakryl_dostup_k_dannym_dlya_storonnikh_analiticheskikh_servisov/)
- [Forbes — WB закрыл остатки](https://www.forbes.ru/biznes/546971-wildberries-zakryla-dannye-ob-ostatkah-tovarov-na-svoih-skladah)
- [WB Seller API — аналитика](https://dev.wildberries.ru/en/docs/openapi/analytics)
- [Ozon Seller API](https://docs.ozon.ru/api/seller/)
- [Yandex Market Partner API](https://yandex.ru/dev/market/partner-api/doc/en/overview/)
- [Yandex Wordstat](https://wordstat.yandex.ru/)
- [Authoritas — Keyword Planner = диапазоны](https://www.authoritas.com/blog/understanding-googles-search-volume-buckets-a-deep-dive-into-how-search-volumes-really-work)
- [WinningHunter — TikTok Shop](https://winninghunter.com/tiktok-shop)
- [ImportGenius — покрытие стран (вкл. РФ)](https://www.importgenius.com/how-it-works/additional-countries)
- [ImportGenius](https://www.importgenius.com/)
- [Apify — 1688 Wholesale Scraper](https://apify.com/zen-studio/1688-wholesale-scraper/api)
- [Обзор ad-intelligence 2026](https://adlibrary.com/posts/best-ad-intelligence-tools-2026)
- [Чек Индекс (ОФД)](https://checkindex.ru/)
- [МойСклад — обзор сервисов аналитики](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-marketpleysov/)
- [vc.ru — ТОП-20 сервисов WB/Ozon](https://vc.ru/marketplace/2799499-analitika-marketpleysov-top-20-servisov-dlya-wildberries-i-ozon)

### Методы оценки продаж
- [Jungle Scout — AccuSales](https://www.junglescout.com/accusales/)
- [Jungle Scout — case study точности](https://www.junglescout.com/blog/amazon-sales-estimates-update/)
- [Helium 10 — исследование точности vs JS](https://www.helium10.com/blog/helium-10-jungle-scout-amazon-sales-data-accuracy/)
- [BSR → продажи (методология)](https://easyparser.com/blog/amazon-bsr-monthly-sales-estimation)
- [BSR — диапазоны погрешности (single-source)](https://amzprep.com/amazon-bsr-sales-estimator/)
- [EcomCrew — независимый тест](https://www.ecomcrew.com/helium10-vs-junglescout/)
- [BagEngine — тест точности JS (2026)](https://bagengine.com/articles/jungle-scout-accuracy)
- [WBCON — критика дельта-метода](https://wbcon.ru/2025/01/20/parsing-wildberries/)
- [GlobalParsing — как работают сервисы WB](https://globalparsing.ru/article/parsing_wildberries_-_kak_rabotajut_servisy_analitiki_marketplejsov/3178)
- [vc.ru — техустройство сервиса аналитики](https://vc.ru/marketing/571615-kak-ustroen-servis-analitiki-marketpleisov-parsing-wildberries-ozon)
- [SellerStats](https://sellerstats.ru/)
- [MPAgency — обзор MPStats](https://mpagency.ru/blog/obzor-mpstats/)
- [MPStats — внешняя аналитика WB](https://mpstats.io/instruments/wildberries/analytics)
- [Коммерсантъ — WB закрыл данные](https://www.kommersant.ru/doc/8079679)
- [Oborot — почему WB закрыл данные](https://oborot.ru/news/pochemu-wildberries-zakryl-dostup-k-dannym-o-prodazhah-sellerov-i255306.html)
- [СберБизнес — удар по рынку аналитики WB](https://sberbusiness.live/publications/wb-zakril-analitiku-razbiraem-gde-selleram-poluchat-informatsiyu-o-rinke)
- [vc.ru — рынок после закрытия данных WB](https://vc.ru/marketplace/2308289-izmeneniya-na-rynke-e-commerce-posle-zakrytiya-dostupa-k-dannym-wildberries)
- [МойСклад — внутренняя vs внешняя аналитика WB](https://www.moysklad.ru/poleznoe/marketplejsy/analitika-wildberries/)

### Бизнес-модель и цены
- [Helium 10 — pricing](https://www.helium10.com/pricing/)
- [DemandSage — Helium 10 pricing](https://www.demandsage.com/helium-10-pricing/)
- [Jungle Scout — Catalyst pricing](https://www.junglescout.com/pricing/catalyst-plans/)
- [Keepa — pricing](https://revenuegeeks.com/keepa-pricing/)
- [E-commerce analytics market](https://www.businessresearchinsights.com/market-reports/e-commerce-analytics-market-102447)
- [WB/Ozon — число продавцов −2%](https://finance.mail.ru/article/chislo-prodavcov-na-wildberries-i-ozon-vpervye-upalo-na-2-v-2025-godu-67435278/)
- [Sostav — барьеры входа на маркетплейсы](https://www.sostav.ru/publication/konets-deshevogo-vkhoda-pochemu-model-marketplejsov-sebya-izzhivaet-i-chto-zhdet-msp-81844.html)
- [Uzum — итоги 2025](https://kapital.uz/uzum-podvel-itogi-2025-goda/)
- [Konkurenty analitiki RF (veroliki)](https://veroliki.ru/chto-prodayut-konkurenty-na-marketplejsakh)
- [Коммерсантъ — продажи маркетплейсов РФ 2025](https://www.kommersant.ru/doc/8516023)
- [Oborot — Moneyplace прекращает работу](https://oborot.ru/news/servis-analitiki-marketplejsov-moneyplace-prekrashhaet-rabotu-otdelnaya-struktura-chto-s-nim-budet-dalshe-i255312.html)

### AI-фичи
- [Jungle Scout AI Assist (RevenueGeeks)](https://revenuegeeks.com/jungle-scout-ai-assist/)
- [Jungle Scout AI Assist (офиц. справка)](https://support.junglescout.com/hc/en-us/articles/17206297711127-AI-Assist-Chat)
- [Jungle Scout MCP (Composio)](https://composio.dev/toolkits/junglescout)
- [Jungle Scout MCP (Zapier)](https://zapier.com/mcp/jungle-scout)
- [Helium 10 AI Tools 2026](https://revenuegeeks.com/helium10-ai-tools/)
- [Helium 10 App в ChatGPT (KB)](https://kb.helium10.com/hc/en-us/articles/48991154323611-Helium-10-App-in-ChatGPT-Introduction-and-Overview)
- [Helium 10 Listing Builder AI](https://www.helium10.com/blog/helium-10-announces-new-ai-enhanced-listing-builder-tool/)
- [Helium 10 Ads / Adtomic](https://revenuegeeks.com/helium10-adtomic/)
- [Helium 10 — анонс AI Advertising](https://www.helium10.com/news/helium-10-ushers-in-a-bold-new-era-of-ai-advertising/)
- [Helium 10 Product Launchpad](https://www.helium10.com/tools/product-research/product-launchpad/)
- [Ask Polar](https://www.polaranalytics.com/ask-polar)
- [Polar — semantic layer + MCP](https://www.polaranalytics.com/post/mcp-semantic-layer-ai-analytics)
- [Polar — AI-агенты + semantic layer (Shopify)](https://www.polaranalytics.com/post/ai-analytics-agents-semantic-layer-shopify)
- [inSales ИИ-аналитик (офиц.)](https://www.insales.ru/page/ai-analyst)
- [inSales ИИ-аналитик (ecomhub)](https://ecomhub.ru/insales-ai-analytics-llm-marketplaces-wildberries-ozon-yandex-market-seller-tools-2026/)
- [CNews — запуск inSales ИИ-аналитика](https://www.cnews.ru/news/line/2026-02-11_insales_zapustila_ii-analitika)
- [MPSTATS «Прогнозы AI»](https://wiki.mpstats.io/Wildberries/%D0%9A%D0%B0%D1%82%D0%B5%D0%B3%D0%BE%D1%80%D0%B8%D0%B8/%D0%9F%D1%80%D0%BE%D0%B3%D0%BD%D0%BE%D0%B7%D1%8B_%D0%98%D0%98)
- [MPSTATS — анализ отзывов / похожие товары AI](https://wiki.mpstats.io/ru/FAQ/%D0%90%D0%BD%D0%B0%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0_%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85/%D0%A3%D0%BD%D0%B8%D0%BA%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B5_%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B_MPSTATS)
- [vc.ru — ТОП-20 CIS-сервисов (AI-чата нет)](https://vc.ru/marketplace/2861395-luchshie-servisy-analitiki-marketpleysov)
- [vc.ru — обзор 2026 + AI-ассистент WB](https://vc.ru/services/2798915-analitika-marketpleysov-2026-luchshie-servisy-dlya-wildberries-i-ozon)
- [DataHawk AI Agents](https://datahawk.co/blog/ai-agents/ai-agents-for-sellers/)
- [Amazon Canvas — нативный AI для селлеров](https://www.aboutamazon.com/news/innovation-at-amazon/amazon-sellers-canvas-artificial-intelligence)
- [Обзор AI-инструментов для Amazon](https://revenuegeeks.com/best-ai-tools-for-amazon-sellers/)
- [Moneyplace — закрытие (CIS)](http://moneyplace.io/dejstvuyushhim-selleram/servisy-analitiki-prodazh-na-marketplejsah/)
