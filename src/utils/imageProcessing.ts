export const createCanvasFromImage = (
  img: HTMLImageElement,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(img, 0, 0);
  }
  return canvas;
};

export const createSymmetricalHalves = (
  faceCanvas: HTMLCanvasElement,
  centerX: number,
): { leftHalf: string; rightHalf: string } => {
  const { width: canvasWidth, height: canvasHeight } = faceCanvas;

  const leftFaceCanvas = document.createElement("canvas");
  const rightFaceCanvas = document.createElement("canvas");
  leftFaceCanvas.width = canvasWidth;
  rightFaceCanvas.width = canvasWidth;
  leftFaceCanvas.height = canvasHeight;
  rightFaceCanvas.height = canvasHeight;

  const leftCtx = leftFaceCanvas.getContext("2d");
  const rightCtx = rightFaceCanvas.getContext("2d");

  if (leftCtx && rightCtx) {
    // Left symmetrical half
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

    // Right symmetrical half
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

    return {
      leftHalf: leftFaceCanvas.toDataURL("image/jpeg"),
      rightHalf: rightFaceCanvas.toDataURL("image/jpeg"),
    };
  }

  throw new Error("Failed to create canvas context");
};
