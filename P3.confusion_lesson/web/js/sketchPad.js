class SketchPad {
   constructor(container, onUpdate = null, size = 400) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = size;
      this.canvas.height = size;
      this.canvas.style = `
         background-color:white;
         box-shadow: 0px 0px 10px 2px black;
         filter: invert(1);
      `;
      container.appendChild(this.canvas);

      const lineBreak = document.createElement("br");
      container.appendChild(lineBreak);

      this.undoBtn = document.createElement("button");
      this.undoBtn.innerHTML = "UNDO";
      this.undoBtn.style.position = "relative";
      this.undoBtn.style.zIndex = 1;
      container.appendChild(this.undoBtn);

      this.ctx = this.canvas.getContext("2d");

      this.onUpdate = onUpdate;
      this.reset();

      this.#addEventListeners();
   }

   reset() {
      this.paths = [];
      this.isDrawing = false;
      this.#redraw();
   }

   #addEventListeners() {
      this.canvas.onpointerdown = (evt) => {
         const mouse = this.#getMouse(evt);
         this.paths.push([mouse]);
         this.isDrawing = true;
         evt.preventDefault();
      };
      this.canvas.onpointermove = (evt) => {
         if (this.isDrawing) {
            const mouse = this.#getMouse(evt);
            const lastPath = this.paths[this.paths.length - 1];
            lastPath.push(mouse);
            this.#redraw();
         }
         evt.preventDefault();
      };
      document.onpointerup = () => {
         this.isDrawing = false;
      };
      this.undoBtn.onclick = () => {
         this.paths.pop();
         this.#redraw();
      };
   }

   #redraw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      draw.paths(this.ctx, this.paths);
      if (this.paths.length > 0) {
         this.undoBtn.disabled = false;
      } else {
         this.undoBtn.disabled = true;
      }
      this.triggerUpdate();
   }

   triggerUpdate() {
      if (this.onUpdate) {
         this.onUpdate(this.paths);
      }
   }

   #getMouse = (evt) => {
      const rect = this.canvas.getBoundingClientRect();
      return [
         Math.round(evt.clientX - rect.left),
         Math.round(evt.clientY - rect.top),
      ];
   };
}
