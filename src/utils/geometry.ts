export const rotatePoint = (
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  angleInDegrees: number,
): [number, number] => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const cosTheta = Math.cos(angleInRadians);
  const sinTheta = Math.sin(angleInRadians);

  const translatedX = x - centerX;
  const translatedY = y - centerY;

  const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
  const rotatedY = translatedX * sinTheta + translatedY * cosTheta;

  return [
    rotatedX + centerX,
    rotatedY + centerY,
  ];
};

export const calculateFaceCenter = (
  topLeft: [number, number],
  bottomRight: [number, number],
): number => {
  return (topLeft[0] + bottomRight[0]) / 2;
};
