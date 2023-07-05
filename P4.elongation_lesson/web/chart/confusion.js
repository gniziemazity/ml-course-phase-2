class Confusion {
   constructor(container, samples, classes, options) {
      this.samples = samples;
      this.classes = classes;
      this.size = options.size;
      this.styles = options.styles;

      this.N = classes.length + 1;
      this.cellSize = this.size / (this.N + 1);

      this.table = document.createElement("table");
      this.table.style.borderCollapse = "collapse";
      this.table.style.textAlign = "center";
      this.table.style.marginLeft = this.cellSize+"px";
      this.table.style.marginTop = this.cellSize+"px";
      container.appendChild(this.table);

      const topText = document.createElement("div");
      topText.innerHTML = "Predicted Class";
      topText.style.position = "absolute";
      topText.style.fontSize = "x-large";
      topText.style.top = "0px";
      topText.style.left = "50%";
      topText.style.transform = "translate(-50%)";
      topText.style.height = this.cellSize + "px";
      topText.style.display = "flex";
      topText.style.alignItems = "center";
      topText.style.marginLeft = (this.cellSize / 2) + "px";
      container.appendChild(topText);
      
      const leftText = document.createElement("div");
      leftText.innerHTML = "True Class";
      leftText.style.position = "absolute";
      leftText.style.fontSize = "x-large";
      leftText.style.top = "50%";
      leftText.style.left = "0px";
      leftText.style.transform = "translate(-50%) rotate(-90deg)";
      leftText.style.height = this.cellSize + "px";
      leftText.style.display = "flex";
      leftText.style.alignItems = "center";
      leftText.style.marginLeft = (this.cellSize / 2) + "px";
      container.appendChild(leftText);

      this.matrix = this.#prepareMatrix(samples);
      this.#fillTable();
   }

   #prepareMatrix(samples) {
      const mat = [];
      for (let i = 0; i < this.N; i++) {
         mat[i] = [];
         for (let j = 0; j < this.N; j++) {
            mat[i][j] = 0;
         }
      }

      for (const s of samples) {
         mat[this.classes.indexOf(s.truth) + 1]
            [this.classes.indexOf(s.label) + 1] ++;
      }

      for (let i = 1; i < this.N; i++) {
         for (let j = 1; j < this.N; j++) {
            mat[0][j] += mat[i][j];
            mat[i][0] += mat[i][j];
         }
      }

      for (let i = 1; i < this.N; i++) {
         mat[0][i] -= mat[i][0];
         if (mat[0][i] > 0) {
            mat[0][i] = "+" + mat[0][i];
         }
      }

      mat[0][0] = "";

      return mat;
   }

   #fillTable() {
      const { N, matrix, styles, classes, cellSize, table } = this;

      const values = matrix
         .slice(1)
         .map((t) => t.slice(1))
         .flat();
      const min = Math.min(...values);
      const max = Math.max(...values);

      for (let i = 0; i < N; i++) {
         const row = document.createElement("tr");
         table.appendChild(row);

         for (let j = 0; j < N; j++) {
            const cell = document.createElement("td");
            cell.style.width = cellSize+"px";
            cell.style.height = cellSize+"px";
            cell.style.padding = "0";

            cell.textContent = matrix[i][j];

            if (i == 0 && j > 0) {
               cell.style.backgroundImage =
                  "url(" + styles[classes[j - 1]].image.src + ")";
               cell.style.backgroundRepeat = "no-repeat";
               cell.style.backgroundPosition = "50% 20%";
               cell.style.verticalAlign = "bottom";
               cell.style.fontWeight = "bold";
               const p = 2 * this.matrix[i][j] / this.matrix[j][i];
               const R = p >= 0 ? p * 255 : 0;
               const B = p <= 0 ? -p * 255 : 0;
               cell.style.color = `rgb(${R},0,${B})`;
            }

            if (j == 0 && i > 0) {
               cell.style.backgroundImage =
                  "url(" + styles[classes[i - 1]].image.src + ")";
               cell.style.backgroundRepeat = "no-repeat";
               cell.style.backgroundPosition = "50% 20%";
               cell.style.verticalAlign = "bottom";
               cell.style.fontWeight = "bold";
            }

            if (i > 0 && j > 0) {
               const p = math.invLerp(min, max, matrix[i][j]);
               if (i == j) {
                  cell.style.backgroundColor = `rgba(0, 0, 255, ${p})`;
               } else {
                  cell.style.backgroundColor = `rgba(255, 0, 0, ${p})`;
               }
            }

            row.appendChild(cell);
         }
      }
   }
}