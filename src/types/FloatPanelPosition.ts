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

export const getFloatButtonPositionLabel = (position: FloatPanelPosition): string => {
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
