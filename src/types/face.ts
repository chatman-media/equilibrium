export interface BlazeFacePrediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  landmarks: Array<[number, number]>;
  probability: number;
}

export interface FaceCanvasData {
  width: number;
  height: number;
  centerX: number;
}
