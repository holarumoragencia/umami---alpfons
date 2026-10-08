import { Composition } from "remotion";
import { PreciosRestauracion } from "./PreciosRestauracion";
import { DURATION, FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PreciosRestauracion"
      component={PreciosRestauracion}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
