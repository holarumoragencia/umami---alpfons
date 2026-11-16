import { Composition } from "remotion";
import { PreciosRestauracion } from "./PreciosRestauracion";
import { DURATION, FPS } from "./theme";
import { Capacidad, CAP_DURATION, CAP_FPS, CAP_H, CAP_W } from "./Capacidad";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PreciosRestauracion"
        component={PreciosRestauracion}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Capacidad20"
        component={Capacidad}
        durationInFrames={CAP_DURATION}
        fps={CAP_FPS}
        width={CAP_W}
        height={CAP_H}
      />
    </>
  );
};
