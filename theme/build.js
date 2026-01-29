#!/usr/bin/env node
const fs = require("fs");
const mkdirp = require("mkdirp");
const postcss = require("postcss");
const plugins = [
  require("cssnano"),
  require("postcss-import"),
  require("postcss-nested"),
  require("postcss-calc"),
  require("postcss-base64")({
    root: process.cwd() + "/src",
    extensions: [".png", ".svg", ".gif", ".webp"],
  }),
];
const esbuild = require("esbuild");

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
  await esbuild.build({
    entryPoints: ["src/js/main.ts"],
    bundle: true,
    minify: true,
    outfile: "dist/theme.js",
    platform: "browser",
  });
}

async function build() {
  try {
    mkdirp.sync("dist");
    await buildCSS();
    await buildJS();
    fs.copyFileSync("src/color.ini", "dist/color.ini");
  } catch (err) {
    console.error(err);
  }
}
module.exports = build;

build();