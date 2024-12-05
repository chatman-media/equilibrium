import { FC } from "react";
import { FaceCanvasData } from "../types/face";

interface FaceDisplayProps {
  alignedPhoto: string;
  canvasData: FaceCanvasData;
  leftHalf: string;
  rightHalf: string;
  onNewPhoto: () => void;
}

export const FaceDisplay: FC<FaceDisplayProps> = ({
  alignedPhoto,
  canvasData,
  leftHalf,
  rightHalf,
  onNewPhoto,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "1200px",
        backgroundColor: "#000",
        padding: "20px",
        gap: "20px",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "relative" }}>
          <img
            src={alignedPhoto}
            alt="Aligned"
            style={{
              width: "80%",
              objectFit: "contain",
            }}
          />
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
          onClick={onNewPhoto}
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
};
