export enum FloatButtonPosition {
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

export const getFloatButtonPositionLabel = (position: FloatButtonPosition): string => {
  const labels: Record<FloatButtonPosition, string> = {
    [FloatButtonPosition.HIDE]: 'Hide',
    [FloatButtonPosition.TOP_LEFT]: 'Top Left',
    [FloatButtonPosition.TOP_CENTER]: 'Top Center',
    [FloatButtonPosition.TOP_RIGHT]: 'Top Right',
    [FloatButtonPosition.MIDDLE_LEFT]: 'Middle Left',
    [FloatButtonPosition.MIDDLE_RIGHT]: 'Middle Right',
    [FloatButtonPosition.BOTTOM_LEFT]: 'Bottom Left',
    [FloatButtonPosition.BOTTOM_CENTER]: 'Bottom Center',
    [FloatButtonPosition.BOTTOM_RIGHT]: 'Bottom Right',
  };
  return labels[position];
};
