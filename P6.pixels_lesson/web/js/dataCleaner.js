const flaggedSamples = [];

function toggleFlaggedSample(sample) {
   if (flaggedSamples.includes(sample.id)) {
      const index = flaggedSamples.indexOf(sample.id);
      flaggedSamples.splice(index, 1);
   } else {
      flaggedSamples.push(sample.id);
   }
   [...document.querySelectorAll(".flagged")].forEach(
      (e) => e.classList.remove("flagged")
   );

   for (const id of flaggedSamples) {
      const el = document.getElementById("sample_" + id);
      el.classList.add("flagged");
   }
}