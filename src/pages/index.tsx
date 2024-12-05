import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FC } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";

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
  const [face, setFace] = useState<BlazeFacePrediction | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);

  // Добавляем функцию для поворота точки вокруг центра
  const rotatePoint = (
    x: number,
    y: number,
    centerX: number,
    centerY: number,
    angleInDegrees: number
  ): [number, number] => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    const cosTheta = Math.cos(angleInRadians);
    const sinTheta = Math.sin(angleInRadians);
    
    // Смещаем точку относительно центра вращения
    const translatedX = x - centerX;
    const translatedY = y - centerY;
    
    // Поворачиваем точку
    const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
    const rotatedY = translatedX * sinTheta + translatedY * cosTheta;
    
    // Возвращаем точку обратно
    return [
      rotatedX + centerX,
      rotatedY + centerY
    ];
  };

  // Загружаем модель при монтировании
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  const processFaceImage = async (photoData: string) => {
    if (!model) return;

    const img = new Image();
    img.src = photoData;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const predictions = await model.estimateFaces(
      img,
      false,
    ) as BlazeFacePrediction[];

    if (predictions.length > 0) {
      const face = predictions[0];
      
      const x = Math.max(0, face.topLeft[0] - 50);
      const y = Math.max(0, face.topLeft[1] - 100);
      const width = Math.min(
        canvas.width - x,
        face.bottomRight[0] - face.topLeft[0] + 100,
      );
      const height = Math.min(
        canvas.height - y,
        face.bottomRight[1] - face.topLeft[1] + 160,
      );

      const faceCanvas = document.createElement("canvas");
      const canvasWidth = width;
      const canvasHeight = Math.max(height, width * 1.25);
      faceCanvas.width = canvasWidth;
      faceCanvas.height = canvasHeight;
      const faceCtx = faceCanvas.getContext("2d");
      setCanvasWidth(canvasWidth);
      setCanvasHeight(canvasHeight);

      const leftEye = face.landmarks[1];   // Левый глаз
      const rightEye = face.landmarks[0];  // Правый глаз
      const nose = face.landmarks[2];      // Кончик носа
      const mouth = face.landmarks[3];     // Рот
      
      // Добавляем пересчет координат landmarks
      const adjustedLandmarks = face.landmarks.map(point => {
        // Сначала вычитаем смещение (x, y)
        const adjustedX = point[0] - x;
        const adjustedY = point[1] - y;
        
        // Учитываем смещение из-за центрирования изображения
        const offsetX = (canvasWidth - width) / 2;
        const offsetY = (canvasHeight - height) / 2;
        
        return [
          adjustedX + offsetX,
          adjustedY + offsetY
        ] as [number, number];
      });

      // Обновляем face с новыми координатами
      setFace({
        ...face,
        landmarks: adjustedLandmarks
      });

      // Функция для проверки выравнивания лица
      const getFaceAlignment = (rotationAngle: number) => {
        // Поворачиваем все ключевые точки
        const rotatedLeftEye = rotatePoint(leftEye[0], leftEye[1], canvasWidth / 2, canvasHeight / 2, rotationAngle);
        const rotatedRightEye = rotatePoint(rightEye[0], rightEye[1], canvasWidth / 2, canvasHeight / 2, rotationAngle);
        const rotatedNose = rotatePoint(nose[0], nose[1], canvasWidth / 2, canvasHeight / 2, rotationAngle);
        const rotatedMouth = rotatePoint(mouth[0], mouth[1], canvasWidth / 2, canvasHeight / 2, rotationAngle);
        
        // Находим центр между глазами
        const eyesCenterX = (rotatedLeftEye[0] + rotatedRightEye[0]) / 2;
        const eyesCenterY = (rotatedLeftEye[1] + rotatedRightEye[1]) / 2;
        
        // Проверяем горизонтальное выравнивание глаз
        const eyesHorizontalDiff = Math.abs(rotatedLeftEye[1] - rotatedRightEye[1]);
        
        // Проверяем вертикальное выравнивание между центром глаз и носом
        const noseVerticalDiff = Math.abs(rotatedNose[0] - eyesCenterX);
        
        // Проверяем вертикальное выравнивание рта относительно носа
        const mouthVerticalDiff = Math.abs(rotatedMouth[0] - rotatedNose[0]);
        
        // Проверяем горизонтальное расстояние между глазами
        const eyesDistance = Math.abs(rotatedLeftEye[0] - rotatedRightEye[0]);
        
        // Изменяем веса параметров, делая акцент на расстоянии между глазами
        return (
          eyesHorizontalDiff * 0.2 +    // Уменьшаем вес горизонтального выравнивания глаз
          noseVerticalDiff * 0.1 +      // Оставляем небольшой вес для носа
          mouthVerticalDiff * 0.1 +     // Оставляем небольшой вес для рта
          Math.abs(eyesDistance - (canvasWidth * 0.3)) * 0.6  // Увеличиваем вес расстояния между глазами
        );
      };

      // Также можно уточнить диапазон поиска угла
      let bestAngle = 0;
      let minDifference = getFaceAlignment(0);

      // Сначала грубый поиск
      for (let angle = -45; angle <= 45; angle += 1) {
        const difference = getFaceAlignment(angle);
        if (difference < minDifference) {
          minDifference = difference;
          bestAngle = angle;
        }
      }

      // Затем точная подстройка вокруг найденного угла
      const fineRange = 2; // градуса в каждую сторону
      for (let angle = bestAngle - fineRange; angle <= bestAngle + fineRange; angle += 0.1) {
        const difference = getFaceAlignment(angle);
        if (difference < minDifference) {
          minDifference = difference;
          bestAngle = angle;
        }
      }

      // Применяем найденный угол
      if (faceCtx) {
        const offsetX = (canvasWidth - width) / 2;
        const offsetY = (canvasHeight - height) / 2;
        faceCtx.save();
        faceCtx.translate(canvasWidth / 2, canvasHeight / 2);
        faceCtx.rotate(bestAngle * Math.PI / 180);
        faceCtx.translate(-canvasWidth / 2, -canvasHeight / 2);
        faceCtx.drawImage(
          canvas,
          x,
          y,
          width,
          height,
          offsetX,
          offsetY,
          width,
          height,
        );
        faceCtx.restore();

        // Сохраняем выровненное фото
        setAlignedPhoto(faceCanvas.toDataURL("image/jpeg"));

        const centerX = canvasWidth / 2;

        const leftFaceCanvas = document.createElement("canvas");
        const rightFaceCanvas = document.createElement("canvas");
        leftFaceCanvas.width = canvasWidth;
        rightFaceCanvas.width = canvasWidth;
        leftFaceCanvas.height = canvasHeight;
        rightFaceCanvas.height = canvasHeight;

        const leftCtx = leftFaceCanvas.getContext("2d");
        const rightCtx = rightFaceCanvas.getContext("2d");

        if (leftCtx && rightCtx) {
          leftCtx.drawImage(faceCanvas, 0, 0);
          leftCtx.save();
          leftCtx.translate(centerX, 0);
          leftCtx.scale(-1, 1);
          leftCtx.drawImage(
            faceCanvas,
            0,
            0,
            centerX,
            canvasHeight,
            -centerX,
            0,
            centerX,
            canvasHeight,
          );
          leftCtx.restore();

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
          rightCtx.restore();

          setLeftHalf(leftFaceCanvas.toDataURL("image/jpeg"));
          setRightHalf(rightFaceCanvas.toDataURL("image/jpeg"));
        }
      }
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);

      const photoData = canvas.toDataURL("image/jpeg");
      setPhoto(photoData);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      // Обрабатываем фото для поиска лица
      processFaceImage(photoData);
    }
  };

  const handleFileSelect = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setPhoto(photoData);
        processFaceImage(photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!photo) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [photo]);

  if (leftHalf && rightHalf) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          maxHeight: '1200px',
          backgroundColor: "#000",
          padding: "20px",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            width: "100%",
            maxWidth: "800px",
          }}
        >
          <div 
            style={{ 
              position: 'relative',
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={alignedPhoto!}
              alt="Aligned"
              style={{
                width: "100%",
                objectFit: "contain",
              }}
            />
            {/* Вертикальная линия */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "2px",
                height: "100%",
                backgroundColor: "#fff",
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <span
            style={{
              color: "#fff",
              marginTop: "8px",
              fontSize: "14px",
            }}
          >
            Выровненное фото
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "40%",
            }}
          >
            <img
              src={leftHalf}
              alt="Left half"
              style={{
                width: "100%",
                objectFit: "contain",
              }}
            />
            <span
              style={{
                color: "#fff",
                marginTop: "8px",
                fontSize: "14px",
              }}
            >
              Симметрия левой стороны
            </span>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "40%",
            }}
          >
            <img
              src={rightHalf}
              alt="Right half"
              style={{
                width: "100%",
                objectFit: "contain",
              }}
            />
            <span
              style={{
                color: "#fff",
                marginTop: "8px",
                fontSize: "14px",
              }}
            >
              Симметрия правой стороны
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            padding: "0 20px 20px",
          }}
        >
          <button
            onClick={() => {
              setPhoto(null);
              setLeftHalf(null);
              setRightHalf(null);
              setAlignedPhoto(null);
              setFace(null);
            }}
            style={{
              padding: "12px 24px",
              borderRadius: "13px",
              backgroundColor: "#1c1c1e",
              border: "none",
              cursor: "pointer",
              flex: 1,
              color: "#fff",
              fontSize: "17px",
              maxWidth: "300px",
            }}
          >
            Новое фото
          </button>
        </div>
      </div>
    );
  }

  if (photo) {
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
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={photo}
            alt="Captured"
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
            }}
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
            onClick={() => {
              setPhoto(null);
            }}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              backgroundColor: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Переснять
          </button>
          <button
            onClick={() => {
              setIsProcessing(true);
              processFaceImage(photo).finally(() => {
                setIsProcessing(false);
              });
            }}
            disabled={isProcessing}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              backgroundColor: isProcessing ? "#ccc" : "#fff",
              border: "none",
              cursor: isProcessing ? "default" : "pointer",
            }}
          >
            {isProcessing ? "Обработка..." : "Анализировать"}
          </button>
        </div>
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
