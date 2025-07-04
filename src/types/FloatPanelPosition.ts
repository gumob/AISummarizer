export enum FloatPanelPosition {
  HIDE = 'HIDE',
  TOP_LEFT = 'TOP_LEFT',
  TOP_CENTER = 'TOP_CENTER',
  TOP_RIGHT = 'TOP_RIGHT',
  MIDDLE_LEFT = 'MIDDLE_LEFT',
  MIDDLE_RIGHT = 'MIDDLE_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_CENTER = 'BOTTOM_CENTER',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
}

export const getFloatPanelPositionLabel = (position: FloatPanelPosition): string => {
  const labels: Record<FloatPanelPosition, string> = {
    [FloatPanelPosition.HIDE]: 'Hide',
    [FloatPanelPosition.TOP_LEFT]: 'Top Left',
    [FloatPanelPosition.TOP_CENTER]: 'Top Center',
    [FloatPanelPosition.TOP_RIGHT]: 'Top Right',
    [FloatPanelPosition.MIDDLE_LEFT]: 'Middle Left',
    [FloatPanelPosition.MIDDLE_RIGHT]: 'Middle Right',
    [FloatPanelPosition.BOTTOM_LEFT]: 'Bottom Left',
    [FloatPanelPosition.BOTTOM_CENTER]: 'Bottom Center',
    [FloatPanelPosition.BOTTOM_RIGHT]: 'Bottom Right',
  };
  return labels[position];
};

export const getFloatPanelPositionIndex = (position: FloatPanelPosition): number => {
  return Object.values(FloatPanelPosition).findIndex(value => value === position);
};

export const getFloatPanelPositionFromIndex = (index: number): FloatPanelPosition => {
  return Object.values(FloatPanelPosition)[index];
};

export const getFloatPanelPositionTypeFromString = (str: string): FloatPanelPosition => {
  switch (str) {
    case 'HIDE':
      return FloatPanelPosition.HIDE;
    case 'TOP_LEFT':
      return FloatPanelPosition.TOP_LEFT;
    case 'TOP_CENTER':
      return FloatPanelPosition.TOP_CENTER;
    case 'TOP_RIGHT':
      return FloatPanelPosition.TOP_RIGHT;
    case 'MIDDLE_LEFT':
      return FloatPanelPosition.MIDDLE_LEFT;
    case 'MIDDLE_RIGHT':
      return FloatPanelPosition.MIDDLE_RIGHT;
    case 'BOTTOM_LEFT':
      return FloatPanelPosition.BOTTOM_LEFT;
    case 'BOTTOM_CENTER':
      return FloatPanelPosition.BOTTOM_CENTER;
    case 'BOTTOM_RIGHT':
      return FloatPanelPosition.BOTTOM_RIGHT;
    default:
      return FloatPanelPosition.HIDE;
  }
};
