if (typeof utils === "undefined") {
   utils = require("../utils.js");
}
if (typeof NeuralNetwork === "undefined") {
   NeuralNetwork = require("../network.js");
}

class MLP {
   constructor(neuronCounts, classes) {
      this.neuronCounts = neuronCounts;
      this.classes = classes;
      this.network = new NeuralNetwork(neuronCounts);
   }
   load(mlp) {
      this.neuronCounts = mlp.neuronCounts;
      this.classes = mlp.classes;
      this.network = mlp.network;
   }
   predict(point) {
      const output = NeuralNetwork.feedForward(point, this.network);
      const max = Math.max(...output);
      const index = output.indexOf(max);
      const label = this.classes[index];
      return { label };
   }
   fit(samples, tries = 1000) {
      let bestNetwork = this.network;
      let bestAccuracy = this.evaluate(samples);
      for (let i = 0; i < tries; i++) {
         this.network = new NeuralNetwork(this.neuronCounts);
         const accuracy = this.evaluate(samples);
         if (accuracy > bestAccuracy) {
            bestAccuracy = accuracy;
            bestNetwork = this.network;
         }
      }
      this.network = bestNetwork;
   }
   evaluate(samples) {
      let correctCount = 0;
      for (const sample of samples) {
         const { label } = this.predict(sample.point);
         const truth = sample.label;
         correctCount += truth == label ? 1 : 0;
      }
      const accuracy = correctCount / samples.length;
      return accuracy;
   }
}

if (typeof module !== "undefined") {
   module.exports = MLP;
}
