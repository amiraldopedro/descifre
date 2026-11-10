import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setCodec("h264");
Config.setOverwriteOutput(true);
Config.setChromiumMultiProcessOnLinux(true);
Config.setChromiumOpenGlRenderer("angle"); // cenas 3D (Three.js) sem GPU
