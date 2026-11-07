import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { CarpoolShort, CARPOOL_FRAMES } from "./videos/carpool/Carpool";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="CarpoolShort" component={CarpoolShort} durationInFrames={CARPOOL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
