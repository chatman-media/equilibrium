import { ChangeEvent, FC, RefObject } from "react";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  onTakePhoto: () => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const CameraView: FC<CameraViewProps> = ({
  videoRef,
  onTakePhoto,
  onFileSelect,
}) => {
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
          onClick={onTakePhoto}
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
            onChange={onFileSelect}
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
