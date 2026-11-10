import React from "react";
import { Composition, Still } from "remotion";
import { Video } from "./Video";
import { Thumb, ThumbProps } from "./Thumb";
import { ShortVideo } from "./Short";
import { Manifesto } from "./tema";
import exemplo from "./exemplo.json";

export const Root: React.FC = () => (
  <>
    <Composition
      id="Video"
      component={Video as unknown as React.FC<Record<string, unknown>>}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={300}
      defaultProps={exemplo as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as unknown as Manifesto).totalFrames,
        fps: (props as unknown as Manifesto).fps,
      })}
    />
    <Composition
      id="Short"
      component={ShortVideo as unknown as React.FC<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={exemplo as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => ({
        durationInFrames: (props as unknown as Manifesto).totalFrames,
        fps: (props as unknown as Manifesto).fps,
      })}
    />
    <Still
      id="Thumb"
      component={Thumb as unknown as React.FC<Record<string, unknown>>}
      width={1280}
      height={720}
      defaultProps={{ linha1: "Você é fácil de", destaque: "manipular?", selo: "FAÇA O TESTE" } satisfies ThumbProps}
    />
  </>
);
