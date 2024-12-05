import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FC } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop/types";

interface BlazeFacePrediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  landmarks: Array<[number, number]>;
  probability: number;
}

export const IndexPage: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [leftHalf, setLeftHalf] = useState<string | null>(null);
  const [rightHalf, setRightHalf] = useState<string | null>(null);
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alignedPhoto, setAlignedPhoto] = useState<string | null>(null);

  // Состояния для react-easy-crop
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Обработчик завершения кропа
  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // Функция для создания симметричных изображений
  const createSymmetricImages = useCallback(async () => {
    if (!alignedPhoto || !croppedAreaPixels) return;

    const image = new Image();
    image.src = alignedPhoto;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Отрисовка кропнутого изображения
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const centerX = canvas.width / 2;

    // Создание левой симметрии
    const leftCanvas = document.createElement("canvas");
    leftCanvas.width = canvas.width;
    leftCanvas.height = canvas.height;
    const leftCtx = leftCanvas.getContext("2d");
    if (leftCtx) {
      leftCtx.drawImage(canvas, 0, 0);
      leftCtx.save();
      leftCtx.translate(centerX, 0);
      leftCtx.scale(-1, 1);
      leftCtx.drawImage(
        canvas,
        0,
        0,
        centerX,
        canvas.height,
        -centerX,
        0,
        centerX,
        canvas.height,
      );
      leftCtx.restore();
      setLeftHalf(leftCanvas.toDataURL());
    }

    // Создание правой симметрии
    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = canvas.width;
    rightCanvas.height = canvas.height;
    const rightCtx = rightCanvas.getContext("2d");
    if (rightCtx) {
      rightCtx.drawImage(
        canvas,
        centerX,
        0,
        centerX,
        canvas.height,
        centerX,
        0,
        centerX,
        canvas.height,
      );
      rightCtx.save();
      rightCtx.translate(centerX, 0);
      rightCtx.translate(centerX, 0);
      rightCtx.drawImage(
        faceCanvas,
        centerX,
        0,
        centerX,
        canvasHeight,
        0,
        0,
        centerX,
        canvasHeight,
      );
      rightCtx.save();
      rightCtx.translate(centerX, 0);
      rightCtx.drawImage(
        faceCanvas,
        centerX,
        0,
        centerX,
        canvasHeight,
        0,
        0,
        centerX,
        canvasHeight,
      );
      rightCtx.save();
      rightCtx.scale(-1, 1);
      rightCtx.drawImage(
        canvas,
        centerX,
        0,
        centerX,
        canvas.height,
        0,
        0,
        centerX,
        canvas.height,
      );
      rightCtx.restore();
      setRightHalf(rightCanvas.toDataURL());
    }
  }, [alignedPhoto, croppedAreaPixels]);

  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !model) return;

    // Создаем canvas для захвата кадра
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    // Устанавливаем размеры canvas равными размерам видео
    const videoElement = videoRef.current;
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Рисуем текущий кадр видео на canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Конвертируем canvas в base64
    const photoData = canvas.toDataURL('image/jpeg');
    setPhoto(photoData);

    try {
      setIsProcessing(true);
      
      // Создаем изображение для обработки
      const img = new Image();
      img.src = photoData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Получаем предсказания от модели
      const predictions = await model.estimateFaces(img, false);
      
      if (predictions.length > 0) {
        // Если лицо найдено, используем его для выравнивания
        const prediction = predictions[0];
        setAlignedPhoto(photoData);
      } else {
        // Если лицо не найдено, просто используем исходное фото
        setAlignedPhoto(photoData);
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      setAlignedPhoto(photoData);
    } finally {
      setIsProcessing(false);
    }

    // Останавливаем поток камеры
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [model, stream]);

  const handleFileSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !model) return;

    try {
      setIsProcessing(true);

      // Читаем файл как Data URL
      const reader = new FileReader();
      const photoData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      setPhoto(photoData);

      // Создаем изображение для обработки
      const img = new Image();
      img.src = photoData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Получаем предсказания от модели
      const predictions = await model.estimateFaces(img, false);
      
      if (predictions.length > 0) {
        // Если лицо найдено, используем его для выравнивания
        const prediction = predictions[0];
        setAlignedPhoto(photoData);
      } else {
        // Если лицо не найдено, просто используем исходное фото
        setAlignedPhoto(photoData);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      // В случае ошибки, просто показываем исходное фото
      setAlignedPhoto(photo);
    } finally {
      setIsProcessing(false);
    }

    // Очищаем input для возможности повторной загрузки того же файла
    event.target.value = '';
  }, [model, photo]);

  if (alignedPhoto) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "#000",
          padding: "20px",
        }}
      >
        <div
          style={{
            position: "relative",
            height: "70vh",
            backgroundColor: "#000",
          }}
        >
          <Cropper
            image={alignedPhoto}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            padding: "20px",
          }}
        >
          <button
            onClick={createSymmetricImages}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              backgroundColor: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Создать симметрию
          </button>
          <button
            onClick={() => {
              setPhoto(null);
              setAlignedPhoto(null);
              setLeftHalf(null);
              setRightHalf(null);
            }}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              backgroundColor: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Новое фото
          </button>
        </div>

        {leftHalf && rightHalf && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <img
              src={leftHalf}
              alt="Left symmetry"
              style={{ maxWidth: "40%" }}
            />
            <img
              src={rightHalf}
              alt="Right symmetry"
              style={{ maxWidth: "40%" }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#000",
        padding: "20px",
      }}
    >
      <div
        style={{
          height: "70%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <button
          onClick={takePhoto}
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            backgroundColor: "#fff",
            border: "4px solid rgba(255, 255, 255, 0.4)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <div
            style={{
              width: "90%",
              height: "90%",
              margin: "5%",
              borderRadius: "50%",
              backgroundColor: "#fff",
            }}
          />
        </button>
        <label
          style={{
            position: "absolute",
            left: "20px",
            bottom: "20px",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#1c1c1e",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </label>
      </div>
    </div>
  );
};
