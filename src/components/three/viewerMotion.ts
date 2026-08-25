export const shouldAutoRotate = (
  autoRotate: boolean,
  reducedMotion: boolean,
  renderActive: boolean,
) => autoRotate && !reducedMotion && renderActive;
