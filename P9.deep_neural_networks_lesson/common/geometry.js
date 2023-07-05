// Adapted From Original Author:
// https://gist.github.com/id-ilych/8630fb273e5c5a0b64ca1dc080d68b63

if (typeof utils === "undefined") {
   utils = require("./utils.js");
}

const geometry = {};

geometry.roundness = (polygon) => {
   const length = geometry.length(polygon);
   const area = geometry.area(polygon);
   const R = length / (Math.PI * 2);
   const circleArea = Math.PI * R ** 2;
   const roundness = area / circleArea;

   if (isNaN(roundness)) {
      return 0;
   }
   return roundness;
};

geometry.length = (polygon) => {
   let length = 0;
   for (let i = 0; i < polygon.length; i++) {
      const nextI = (i + 1) % polygon.length;
      length += utils.distance(polygon[i], polygon[nextI]);
   }
   return length;
};

geometry.area = (polygon) => {
   let area = 0;
   const A = polygon[0];
   for (let i = 1; i < polygon.length - 1; i++) {
      const B = polygon[i];
      const C = polygon[i + 1];
      area += geometry.triangleArea(A, B, C);
   }
   return area;
};

geometry.triangleArea = (A, B, C) => {
   const a = utils.distance(B, C);
   const b = utils.distance(A, C);
   const c = utils.distance(A, B);

   const p = (a + b + c) / 2;
   const area = Math.sqrt(p * (p - a) * (p - b) * (p - c));
   return area;
};

// for all the functions below, assume screen coordinates: the x-axis is rightward, the y-axis is downward

// finds a point with the lowest vertical position (leftmost wins in case of a tie)
geometry.lowestPoint = (points) =>
   points.reduce((lowest, point) => {
      if (point[1] > lowest[1]) {
         return point;
      }
      if (point[1] === lowest[1] && point[0] < lowest[0]) {
         return point;
      }
      return lowest;
   });

// orders points in a counter-clockwise relative to the given origin
geometry.sortPoints = (origin, points) =>
   points.slice().sort((a, b) => {
      const orientation = getOrientation(origin, a, b);
      if (orientation === 0) {
         // if two points make the same angle with the lowest point, choose the closer one
         return distanceSquared(origin, a) - distanceSquared(origin, b);
      }
      return -orientation;
   });

// builds a convex hull (a polygon) using the Graham scan algorithm
// https://en.wikipedia.org/wiki/Graham_scan
geometry.grahamScan = (points) => {
   const lowestPoint = geometry.lowestPoint(points);
   const sortedPoints = geometry.sortPoints(lowestPoint, points);

   // initialize the stack with the first three points
   const stack = [sortedPoints[0], sortedPoints[1], sortedPoints[2]];

   // iterate over the remaining points
   for (let i = 3; i < sortedPoints.length; i++) {
      let top = stack.length - 1;
      // exclude points from the end
      // until adding a new point won't cause a concave
      // so that the resulting polygon will be convex
      while (
         top > 0 &&
         getOrientation(stack[top - 1], stack[top], sortedPoints[i]) <= 0
      ) {
         stack.pop();
         top--;
      }
      // add the point
      stack.push(sortedPoints[i]);
   }

   return stack;
};

// builds a box with one of the edges being coincident with the edge
// between hull's points i and j (expected to be neighbors)
geometry.coincidentBox = (hull, i, j) => {
   // a difference between two points (vector that connects them)
   const diff = (a, b) => [a[0] - b[0], a[1] - b[1]];
   // a dot product of two vectors
   const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
   // a length of a vector
   const len = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1]);
   // adds two vectors
   const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
   // multiplies a vector by a given magnitude
   const mult = (a, n) => [a[0] * n, a[1] * n];
   // divides a vector by a given magintued
   const div = (a, n) => [a[0] / n, a[1] / n];
   // builds a unit vector (one having a length of 1) with the same direction as a given one
   const unit = (a) => div(a, len(a));

   let origin = hull[i];
   // build base vectors for a new system of coordinates
   // where the x-axis is coincident with the i-j edge
   let baseX = unit(diff(hull[j], origin));
   // and the y-axis is orthogonal (90 degrees rotation counter-clockwise)
   let baseY = [baseX[1], -baseX[0]];

   let left = 0;
   let right = 0;
   let top = 0;
   let bottom = 0;
   // for every point of a hull
   for (const p of hull) {
      // calculate position relative to the origin
      const n = [p[0] - origin[0], p[1] - origin[1]];
      // calculate position in new axis (rotate)
      const v = [dot(baseX, n), dot(baseY, n)];
      // apply trivial logic for calculating the bounding box
      // as rotation is out of consideration at this point
      left = Math.min(v[0], left);
      top = Math.min(v[1], top);
      right = Math.max(v[0], right);
      bottom = Math.max(v[1], bottom);
   }

   // calculate bounding box vertices back in original screen space
   const vertices = [
      add(add(mult(baseX, left), mult(baseY, top)), origin),
      add(add(mult(baseX, left), mult(baseY, bottom)), origin),
      add(add(mult(baseX, right), mult(baseY, bottom)), origin),
      add(add(mult(baseX, right), mult(baseY, top)), origin),
   ];

   return {
      vertices,
      width: right - left,
      height: bottom - top,
   };
};

// determines the minimum (area) bounding box for a given hull (or set of points)
geometry.minimumBoundingBox = ({ points, hull }) => {
   if (points.length < 3) {
      return {
         width: 0,
         height: 0,
         vertices: points,
         hull: points
      };
   }
   hull = hull || geometry.grahamScan(points);

   let minArea = Number.MAX_VALUE;
   let result = null;
   for (let i = 0; i < hull.length; ++i) {
      const { vertices, width, height } = geometry.coincidentBox(
         hull,
         i,
         (i + 1) % hull.length
      );
      const area = width * height;
      if (area < minArea) {
         minArea = area;
         result = { vertices, width, height, hull };
      }
   }
   return result;
};

// determines p2 relative position to p1-p3. If it is:
// to the right then the result is 1,
// to the left then the result is -1,
// on the line then the result is 0
function getOrientation(p1, p2, p3) {
   const val =
      (p2[1] - p1[1]) * (p3[0] - p2[0]) - (p2[0] - p1[0]) * (p3[1] - p2[1]);
   return val;
      if (val === 0) {
      return 0;
   }
   return val > 0 ? 1 : -1;
}

// squared distance between two points
// (when comparing distances, the squares would do just fine,
// so computationally heavier "square root" operation can be avoided)
function distanceSquared(p1, p2) {
   const dx = p2[0] - p1[0];
   const dy = p2[1] - p1[1];
   return dx * dx + dy * dy;
}

if (typeof module !== "undefined") {
   module.exports = geometry;
}
