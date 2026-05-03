#!/usr/bin/env node
import fs from "fs";
import mkdirp from "mkdirp";
import postcss from "postcss";
import { execSync } from "child_process";
import cssnano from "cssnano";
import postcssImport from "postcss-import";
import postcssNested from "postcss-nested";
import postcssCalc from "postcss-calc";
import postcssBase64 from "postcss-base64";
import * as esbuild from "esbuild";
import { currentVersion } from "./src/js/utils/ver.ts";

type BuildMode = "build" | "apply" | "build-local";

const plugins = [
  cssnano,
  postcssImport,
  postcssNested,
  postcssCalc,
  postcssBase64({
    root: process.cwd() + "/src",
    extensions: [".png", ".svg", ".gif", ".webp"],
  }),
];

const parser = postcss(plugins);

async function buildCSS() {
  const input = fs.readFileSync("src/index.scss");

  const targetFile = "dist/user.css";

  const result = await parser.process(input, {
    from: "src/index.scss",
    to: targetFile,
  });

  fs.writeFileSync(targetFile, result.css);
}

async function buildJS() {
  currentVersion.buildDate = new Date().toISOString().split('T')[0];
  fs.writeFileSync("src/js/utils/ver.ts", `export const currentVersion = ${JSON.stringify(currentVersion, null, 4)};`);

  await esbuild.build({
    entryPoints: ["src/js/main.ts"],
    bundle: true,
    minify: true,
    outfile: "dist/theme.js",
    platform: "browser",
  });
}

async function apply() {
  console.log("Applying WMPotify...");
  try {
    const spicetifyPath = execSync("spicetify path userdata").toString().trim();
    if (!spicetifyPath) {
      console.error("Spicetify not found. Make sure Spicetify is installed and added to PATH.");
      return;
    }
    console.log(`Spicetify path: ${spicetifyPath}`);
    const themePath = `${spicetifyPath}/Themes/WMPotify`;
    mkdirp.sync(themePath);
    fs.copyFileSync("dist/user.css", `${themePath}/user.css`);
    fs.copyFileSync("dist/theme.js", `${themePath}/theme.js`);
    fs.copyFileSync("dist/color.ini", `${themePath}/color.ini`);
    console.log("Theme applied successfully.");
  } catch (err) {
    console.error('Apply failed: ' + err);
  }
}

async function build() {
  const mode = process.argv[2] as BuildMode || "build";
  if (mode.includes("build")) {
    console.log("Building WMPotify...");
    try {
      mkdirp.sync("dist");
      await buildCSS();
      await buildJS();
      fs.copyFileSync("src/color.ini", "dist/color.ini");
      console.log("Build succeeded.");
    } catch (err) {
      console.error("Build failed: " + err);
    }
  }
  if (mode !== "build-local") {
    await apply();
  }
}

build();