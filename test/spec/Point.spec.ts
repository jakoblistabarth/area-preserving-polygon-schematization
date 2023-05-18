import LineSegment from "../../src/geometry/LineSegment";
import Point from "../../src/geometry/Point";
import Polygon from "../../src/geometry/Polygon";

describe("distanceToPoint()", function () {
  it("returns the correct distance between 2 vertices", function () {
    const a = new Point(0, 0);
    const b = new Point(4, 0);
    const c = new Point(4, 4);
    const d = new Point(-4, -4);

    expect(b.distanceToPoint(a)).toEqual(b.distanceToPoint(a));
    expect(a.distanceToPoint(b)).toEqual(4);
    expect(a.distanceToPoint(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.distanceToPoint(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});

describe("isInPolygon()", function () {
  it("returns interference for 2 regions from AUT_adm1-simple.json.", function () {
    const regionA = new Polygon([
      new Point(10.172608375549316, 47.269916534423885),
      new Point(10.1726083755, 47.3805885315),
      new Point(9.920696735382137, 47.38058853149417),
      new Point(9.9206967354, 47.2699165344),
      new Point(10.172608375549316, 47.269916534423885),
    ]);

    const regionB = new Polygon([
      new Point(9.668785095214957, 47.49126052856445),
      new Point(9.6687850952, 47.3805885315),
      new Point(9.920696735382137, 47.38058853149417),
      new Point(9.9206967354, 47.4912605286),
      new Point(9.668785095214957, 47.49126052856445),
    ]);

    expect(regionA.points[0].isInPolygon(regionB)).toBe(false);
    expect(regionA.points[1].isInPolygon(regionB)).toBe(false);
    expect(regionA.points[2].isInPolygon(regionB)).toBe(true);
    expect(regionA.points[3].isInPolygon(regionB)).toBe(false);
    expect(regionA.points[4].isInPolygon(regionB)).toBe(false);
    expect(regionB.points[0].isInPolygon(regionA)).toBe(false);
    expect(regionB.points[1].isInPolygon(regionA)).toBe(false);
    expect(regionB.points[2].isInPolygon(regionA)).toBe(true);
    expect(regionB.points[3].isInPolygon(regionA)).toBe(false);
    expect(regionB.points[4].isInPolygon(regionA)).toBe(false);
  });

  it("returns interference for 1 regions and a Point of AUT_adm1-simple.json.", function () {
    const polygon = new Polygon([
      new Point(9.668785095214957, 47.49126052856445),
      new Point(9.6687850952, 47.3313159943),
      new Point(9.788464546203699, 47.331315994262724),
      new Point(9.7884645462, 47.4912605286),
      new Point(9.668785095214957, 47.49126052856445),
    ]);
    const point = new Point(9.668785095214957, 47.49126052856445);

    expect(point.isInPolygon(polygon)).toBe(true);
  });

  it("returns false if it lies outside of a convex(!) Polygon", function () {
    const A = new Polygon([
      new Point(0, 0),
      new Point(0, 1),
      new Point(1, 1),
      new Point(1, 0),
    ]);
    const B = new Polygon([
      new Point(-5, -5),
      new Point(5, -5),
      new Point(5, 10),
      new Point(-5, 10),
    ]);

    const a = new Point(100, 100);
    const b = new Point(-1, -1);
    const c = new Point(1.1, 0);

    expect(a.isInPolygon(A)).toBe(false);
    expect(a.isInPolygon(B)).toBe(false);
    expect(b.isInPolygon(A)).toBe(false);
    expect(c.isInPolygon(A)).toBe(false);
  });

  it("returns true if it lies inside of a convex(!) Polygon", function () {
    const A = new Polygon([
      new Point(0, 0),
      new Point(0, 1),
      new Point(1, 1),
      new Point(1, 0),
    ]);
    const B = new Polygon([
      new Point(-5, -5),
      new Point(5, -5),
      new Point(5, 10),
      new Point(-5, 10),
    ]);
    const a = new Point(0.5, 0.5);
    const b = new Point(0, 1);
    const c = new Point(0.5, 0);
    const d = new Point(-2.5, -2.5);

    expect(a.isInPolygon(A)).toBe(true);
    expect(b.isInPolygon(A)).toBe(true);
    expect(c.isInPolygon(A)).toBe(true);
    expect(d.isInPolygon(B)).toBe(true);
  });
});

it("returns true if it lies inside of a convex(!) Polygon", function () {
  const a = new Point(1, 1);
  const b = new Point(2, 1);
  const c = new Point(2, 2);
  const d = new Point(1, 2);
  const A = new Polygon([a, b, c, d]);

  expect(a.isInPolygon(A)).toBe(true);
  expect(b.isInPolygon(A)).toBe(true);
  expect(c.isInPolygon(A)).toBe(true);
  expect(d.isInPolygon(A)).toBe(true);
});

describe("getArea()", function () {
  it("returns correct area for a given set of 4 Points (a square).", function () {
    const plgn = new Polygon([
      new Point(0, 0),
      new Point(0, 1),
      new Point(1, 1),
      new Point(1, 0),
    ]);
    expect(plgn.area).toBe(1);
  });

  it("returns correct area for a given set of 3 Points (a triangle).", function () {
    const plgn = new Polygon([
      new Point(0, 0),
      new Point(0, 1),
      new Point(1, 1),
    ]);
    expect(plgn.area).toBe(0.5);
  });
});

describe("equals()", function () {
  it("returns true if two points reside on the exact same location.", function () {
    expect(new Point(0, 0).equals(new Point(0, 0))).toBe(true);
  });

  it("returns false if two points reside on different locations.", function () {
    expect(new Point(0, 0).equals(new Point(0, 0.0000000001))).toBe(false);
  });
});

describe("isOnLineSegments()", function () {
  it("returns true if the point lies on one of the given linesegments.", function () {
    const lineSegments = [
      new LineSegment(new Point(0, 0), new Point(4, 4)),
      new LineSegment(new Point(4, 4), new Point(0, 8)),
      new LineSegment(new Point(0, 8), new Point(0, -8)),
    ];
    const pointA = new Point(2, 2);
    const pointB = new Point(-2, -2);
    const pointC = new Point(4, 4);
    const pointD = new Point(0, -8);
    expect(pointA.isOnLineSegments(lineSegments)).toBe(true);
    expect(pointB.isOnLineSegments(lineSegments)).toBe(false);
    expect(pointC.isOnLineSegments(lineSegments)).toBe(true);
    expect(pointD.isOnLineSegments(lineSegments)).toBe(true);
  });
});