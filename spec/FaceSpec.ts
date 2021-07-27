import fs from "fs";
import path from "path";
import HalfEdge from "../src/lib/DCEL/HalfEdge";
import Vertex from "../src/lib/DCEL/Vertex";
import Dcel from "../src/lib/dcel/Dcel";
import Face from "../src/lib/dcel/Face";

describe("replaceOuterRingEdge()", function () {
  let innerRing: Face;
  beforeEach(function () {
    const polygon = JSON.parse(
      fs.readFileSync(path.resolve("data/shapes/square-hole.json"), "utf8")
    );
    const dcel = Dcel.fromGeoJSON(polygon);
    innerRing = dcel.getBoundedFaces()[1];
  });

  it("only changes outerRing if edge which should be replaced is set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing?.edge as HalfEdge;
    const testEdge = new HalfEdge(new Vertex(10, 10, new Dcel()), new Dcel());

    innerRing.replaceOuterRingEdge(existingHalfEdge, testEdge);
    expect(innerRing.outerRing?.edge).toEqual(testEdge);
  });

  it("does not change outerRing if edge which should be replaced is not set as outerRing", function () {
    const existingHalfEdge = innerRing.outerRing?.edge;
    const testEdge = new HalfEdge(new Vertex(10, 10, new Dcel()), new Dcel());

    innerRing.replaceOuterRingEdge(testEdge, testEdge);
    expect(innerRing.outerRing?.edge).toEqual(existingHalfEdge);
  });
});
