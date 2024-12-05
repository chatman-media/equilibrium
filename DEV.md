# Руководство разработчика

## Архитектура приложения

### Компоненты

#### 1. IndexPage (src/pages/index.tsx)

Главный компонент приложения, управляющий всей логикой и состоянием.

##### Ключевые состояния:

- `stream`: MediaStream для камеры
- `photo`: исходное фото
- `alignedPhoto`: выровненное фото
- `leftHalf/rightHalf`: симметричные версии
- `model`: ML-модель Blazeface
- `isProcessing`: флаг обработки
- `crop/zoom/rotation`: параметры кадрирования (react-easy-crop)
- `croppedAreaPixels`: результат кропа

#### 2. CameraView (src/components/CameraView.tsx)

Компонент для захвата фото через камеру или загрузки файла.

##### Props:

- `videoRef`: ссылка на видео элемент
- `onTakePhoto`: обработчик создания фото
- `onFileSelect`: обработчик выбора файла

#### 3. Page (src/components/Page.tsx)

Компонент-обертка для страниц с поддержкой Telegram WebApp.

##### Props:

- `back`: флаг для кнопки "назад"
- `children`: дочерние элементы

### Утилиты

#### 1. imageProcessing.ts

Утилиты для обработки изображений:

```typescript
createCanvasFromImage(img: HTMLImageElement): HTMLCanvasElement
createSymmetricalHalves(canvas: HTMLCanvasElement, centerX: number):
{ leftHalf: string; rightHalf: string }
```

#### 2. geometry.ts

Математические функции для работы с координатами:

```typescript
rotatePoint(x: number, y: number, centerX: number, centerY: number, angle: number): [number, number]
calculateFaceCenter(topLeft: [number, number], bottomRight: [number, number]): number
```

### Основные процессы

#### 1. Захват изображения

```typescript
// Через камеру
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoRef.current!.srcObject = stream;
  setStream(stream);
};
// Через файл
const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  }
};
```

#### 2. Обработка изображения

1. Загрузка ML модели
2. Детекция лица
3. Выравнивание
4. Кроп через react-easy-crop
5. Создание симметричных версий

#### 3. Создание симметрии

1. Получение области кропа
2. Отрисовка на canvas
3. Создание зеркальных отражений
4. Конвертация в base64

### Потоки данных

mermaid graph TD A[Камера/Файл] --> B[Фото] B --> C[ML Детекция] C -->
D[Выравнивание] D --> E[Кроп] E --> F[Симметрия] F --> G[Результат]

## Рекомендации по разработке

### Оптимизация

- Используйте `useCallback` для тяжелых функций обработки изображений
- Применяйте `React.memo` для компонентов, которые редко обновляются
- Кэшируйте результаты ML-модели
- Оптимизируйте размер canvas перед обработкой

### Обработка ошибок

- Проверяйте доступность камеры
- Валидируйте загружаемые файлы
- Обрабатывайте ошибки ML-модели
- Информируйте пользователя о проблемах

### Тестирование

- Проверка работы с разными размерами изображений
- Тестирование на мобильных устройствах
- Проверка граничных случаев детекции лица
- Тестирование производительности
