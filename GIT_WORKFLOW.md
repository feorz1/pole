# Рабочий процесс с Git и GitHub

## Основные команды для отправки изменений

### 1. Проверить статус
```bash
git status
```

### 2. Добавить файлы в staging
```bash
# Все измененные файлы
git add .

# Конкретный файл
git add script.js

# Несколько файлов
git add script.js style.css index.html
```

### 3. Создать коммит
```bash
git commit -m "Краткое описание изменений"
```

### 4. Отправить на GitHub
```bash
git push origin main
```

## Быстрый способ (для уже отслеживаемых файлов)

```bash
# Добавить все измененные файлы и создать коммит одной командой
git commit -am "Описание изменений"
git push origin main
```

## Полезные команды

### Посмотреть историю коммитов
```bash
git log
```

### Посмотреть разницу изменений
```bash
git diff
```

### Отменить изменения в файле (до добавления в staging)
```bash
git restore script.js
```

### Отменить добавление файла из staging
```bash
git restore --staged script.js
```

### Обновить локальный репозиторий с GitHub
```bash
git pull origin main
```

## Типичный рабочий процесс

1. Внести изменения в файлы
2. `git status` - проверить что изменилось
3. `git add .` - добавить все изменения
4. `git commit -m "Описание"` - создать коммит
5. `git push origin main` - отправить на GitHub

## Примеры сообщений коммитов

- `git commit -m "Fix: исправлена ошибка с клавиатурой"`
- `git commit -m "Add: добавлена новая функция"`
- `git commit -m "Update: обновлены стили"`
- `git commit -m "Refactor: рефакторинг кода"`

