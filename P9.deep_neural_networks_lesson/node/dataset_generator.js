const draw = require("../common/draw.js");
const constants = require("../common/constants.js");
const utils = require("../common/utils.js");
const geometry = require("../common/geometry.js");
const featureFunctions = require("../common/featureFunctions.js");

const { createCanvas } = require("canvas");
const canvas = createCanvas(400, 400);
const ctx = canvas.getContext("2d");

const fs = require("fs");

// This section helps to install the package
if (fs.existsSync(constants.DATASET_DIR)) {
   fs.readdirSync(constants.DATASET_DIR).forEach((fileName) =>
      fs.rmSync(constants.DATASET_DIR + "/" + fileName, { recursive: true })
   );
   fs.rmdirSync(constants.DATASET_DIR);
}
fs.mkdirSync(constants.DATASET_DIR);
fs.mkdirSync(constants.JSON_DIR);
fs.mkdirSync(constants.IMG_DIR);
if (!fs.existsSync(constants.MODELS_DIR)) {
   fs.mkdirSync(constants.MODELS_DIR);
}
console.log("GENERATING DATASET ...");
// End of extra section

const fileNames = fs.readdirSync(constants.RAW_DIR);
const samples = [];
let id = 1;
fileNames.forEach((fn) => {
   const content = fs.readFileSync(constants.RAW_DIR + "/" + fn);
   const { session, student, drawings } = JSON.parse(content);
   for (let label in drawings) {
      if (!utils.flaggedSamples.includes(id)) {
         samples.push({
            id,
            label,
            student_name: student,
            student_id: session,
         });

         const paths = drawings[label];
         fs.writeFileSync(
            constants.JSON_DIR + "/" + id + ".json",
            JSON.stringify(paths)
         );

         generateImageFile(constants.IMG_DIR + "/" + id + ".png", paths);
      }
      utils.printProgress(id, fileNames.length * 8);
      id++;
   }
});
console.log("\n");

fs.writeFileSync(constants.SAMPLES, JSON.stringify(samples));

fs.mkdirSync(constants.JS_OBJECTS, {recursive: true});
fs.writeFileSync(
   constants.SAMPLES_JS,
   "const samples = " + JSON.stringify(samples) + ";"
);

function generateImageFile(outFile, paths) {
   ctx.clearRect(0, 0, canvas.width, canvas.height);

   draw.paths(ctx, paths);

   const pixels = featureFunctions.getPixels(paths);
   const size = Math.sqrt(pixels.length);
   const imgData = ctx.getImageData(0, 0, size, size);
   for (let i = 0; i < pixels.length; i++) {
      const alpha = pixels[i];
      const startIndex = i * 4;
      imgData.data[startIndex] = 0;
      imgData.data[startIndex + 1] = 0;
      imgData.data[startIndex + 2] = 0;
      imgData.data[startIndex + 3] = alpha;
   }
   ctx.putImageData(imgData, 0, 0);

   const buffer = canvas.toBuffer("image/png");
   fs.writeFileSync(outFile, buffer);
}
