# FlowGantt

MVP планировщика проектов с диаграммой Ганта и полноценным REST API. 
Сделано под хакатон-кейс «Проект под контролем».

## Стек

**Backend**
- Node.js + TypeScript
- Express (REST API)
- SQLite (`better-sqlite3`)
- `tsx` (dev-сервер без сборки)

**Frontend**
- React 18 + TypeScript
- Vite (dev-сервер и сборка)
- `dhtmlx-gantt` (визуализация диаграммы)

## Запуск

Требуется Node.js >= 20.0.0

**1. Backend (Терминал 1)**
```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

**2. Frontend (Терминал 2)**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Структура

```text
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── projects.ts    # API эндпоинты проектов
│   │   │   └── tasks.ts       # API эндпоинты задач и зависимостей
│   │   ├── db.ts              # Схема БД, seed-данные и логика каскадного сдвига
│   │   └── index.ts           # Точка входа Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── GanttChart.tsx # Компонент диаграммы Ганта
│   │   ├── api.ts             # Функции запросов к backend
│   │   ├── App.tsx            # Главный компонент и управление стейтом
│   │   └── main.tsx           # Точка входа React
│   └── package.json
└── README.md
```

## Что реализовано (по чек-листу кейса)

- Полноценный REST API для управления проектами и задачами (CRUD)
- Хранение данных в SQLite с автоматическим заполнением (seed) при первом запуске
- Визуализация диаграммы Ганта с отображением сроков, длительности и статусов
- Цветовая индикация задач (выполнено, в работе, запланировано)
- Отображение зависимостей между задачами (визуальные связи на графике)
- **Каскадный сдвиг:** при изменении сроков задачи бэкенд автоматически рассчитывает и сдвигает все зависимые (downstream) задачи, сохраняя логику Finish-to-Start
- Полная интеграция Frontend и Backend (данные загружаются реально из БД через API)

## Команда

- **Backend Developer:** Слава, Данзан
- **Frontend Developer:** Иван, Марк
- **Integration:** Данил
```

