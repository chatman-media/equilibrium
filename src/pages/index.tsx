import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
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

      if (faceCtx) {
        const offsetX = (canvasWidth - width) / 2;
        const offsetY = (canvasHeight - height) / 2;
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
    event: React.ChangeEvent<HTMLInputElement>,
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
          backgroundColor: "#000",
          padding: "20px",
          gap: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flex: 1,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={leftHalf}
              alt="Left half"
              style={{
                width: "80%",
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
            }}
          >
            <img
              src={rightHalf}
              alt="Right half"
              style={{
                width: "80%",
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
