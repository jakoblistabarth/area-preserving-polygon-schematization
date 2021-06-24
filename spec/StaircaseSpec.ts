import Dcel from "../assets/lib/Dcel/Dcel";
import C from "../assets/lib/OrientationRestriction/C";
import { EdgeClasses } from "../assets/lib/Dcel/HalfEdge";
import Vertex from "../assets/lib/Dcel/Vertex";
import Staircase from "../assets/lib/OrientationRestriction/Staircase";
import Point from "../assets/lib/Geometry/Point";
import config from "../assets/schematization.config";
import { getPolygonArea } from "../assets/lib/utilities";

describe("The staircase class", function () {
  it("returns a staircase region for a HalfEdge of class UB", function () {
    const dcel = new Dcel();
    dcel.config = config;

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(2, 2, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UB;

    const staircase = new Staircase(edge);
    expect(staircase.region).toEqual([
      new Point(0, 0),
      new Point(2, 0),
      new Point(2, 2),
      new Point(0, 2),
    ]);
  });

  it("returns a staircase region for a HalfEdge of class UB", function () {
    const dcel = new Dcel();
    dcel.config = config;

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-2, -2, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UB;

    const staircase = new Staircase(edge);

    expect(staircase.region).toEqual([
      new Point(0, 0),
      new Point(-2, 0),
      new Point(-2, -2),
      new Point(0, -2),
    ]);
  });

  it("returns a staircase region for a HalfEdge of class UB", function () {
    const dcel = new Dcel();
    dcel.config = config;

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 2, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UB;

    const staircase = new Staircase(edge);
    expect(staircase.region).toEqual([
      new Point(0, 0),
      new Point(0, 2),
      new Point(-10, 2),
      new Point(-10, 0),
    ]);
  });
});

describe("Build staircase for a HalfEdge of class AD", function () {
  it("returns a staircase containing 7 Points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(4) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 10, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.AD;
    edge.assignedDirection = 0;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    expect(staircase.points.length).toBe(7);
    expect(staircase.region.length).toBeLessThanOrEqual(staircase.points.length);
  });
});

// TODO: test staircase with head like for staircase of UD edges
describe("Build staircase for a HalfEdge of class UB", function () {
  it("returns a staircase containing a minimum of 5 Points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(1, 1, dcel);
    const d = new Vertex(7, 5, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UB;
    edge.assignedDirection = 0;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUB();
    expect(points.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Build staircase for a HalfEdge of class UD", function () {
  it("returns a staircase with a minimum of 9 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(7, 5, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 3;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();
    const d2 = points[points.length - 1];

    expect(points.length).toBeGreaterThanOrEqual(9);
    expect(d.x).toBeCloseTo(d2.x, 10);
    expect(d.y).toBeCloseTo(d2.y, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 2;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();

    const appendedArea = getPolygonArea(points.slice(0, 4));
    const secondLastStep = getPolygonArea(points.slice(-5, -2));
    const lastStep = getPolygonArea(points.slice(-3));

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(30, 12, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 3;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();

    const appendedArea = getPolygonArea(points.slice(0, 4));
    const secondLastStep = getPolygonArea(points.slice(-5, -2));
    const lastStep = getPolygonArea(points.slice(-3));

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-7, 5, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 3;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();

    const appendedArea = getPolygonArea(points.slice(0, 4));
    const secondLastStep = getPolygonArea(points.slice(-5, -2));
    const lastStep = getPolygonArea(points.slice(-3));

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase where the area spanned between the first 4 points equals the area of the second last and the last 3 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-7, 5, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 0;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();

    const appendedArea = getPolygonArea(points.slice(0, 4));
    const secondLastStep = getPolygonArea(points.slice(-5, -2));
    const lastStep = getPolygonArea(points.slice(-3));

    expect(appendedArea).toBeCloseTo(secondLastStep, 10);
    expect(appendedArea).toBeCloseTo(lastStep, 10);
    expect(secondLastStep).toBeCloseTo(lastStep, 10);
  });

  it("returns a staircase with a minimum of 9 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-7, -5, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 0;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();
    const d2 = points[points.length - 1];

    expect(points.length).toBeGreaterThanOrEqual(9);
    expect(d.x).toBeCloseTo(d2.x, 10);
    expect(d.y).toBeCloseTo(d2.y, 10);
  });

  it("returns a staircase with a minimum of 9 points", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(2.5, 1, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 2;
    edge.dcel = dcel;

    const staircase = new Staircase(edge);
    const points = staircase.getStairCasePointsUD();
    const d2 = points[points.length - 1];

    expect(points.length).toBeGreaterThanOrEqual(9);
    expect(d.x).toBeCloseTo(d2.x, 10);
    expect(d.y).toBeCloseTo(d2.y, 10);
  });
});

describe("getStepArea(),", function () {
  it("returns the correct area a step adds/subtracts in C(2) ", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);

    const staircase = new Staircase(edge);
    const stepArea = staircase.getStepArea(3, 1);
    expect(stepArea).toBe(1.5);
  });

  it("returns the correct area a step adds/subtracts in C(4)", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(4) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);

    const staircase = new Staircase(edge);
    const stepArea = staircase.getStepArea(3, 1);
    expect(stepArea).toBeCloseTo(1.0607, 3);
  });
});

describe("getClosestAssociatedAngle() returns closest associated Angle for an edge", function () {
  it("when edge is in sector 0 and the assigned Direction is 3", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 3;

    expect(edge.getClosestAssociatedAngle()).toBe(0);
  });

  it("when edge is in sector 0 and the assigned Direction is 2", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 2;

    expect(edge.getClosestAssociatedAngle()).toBe(
      ((Math.PI * 2) / edge.dcel.config.c.getDirections().length) * 1
    );
  });

  it("when edge is in sector 1 and the assigned Direction is 0", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 0;

    expect(edge.getClosestAssociatedAngle()).toBe(
      ((Math.PI * 2) / edge.dcel.config.c.getDirections().length) * 1
    );
  });

  it("when edge is in sector 1 and the assigned Direction is 3", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, 4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 3;

    expect(edge.getClosestAssociatedAngle()).toBe(Math.PI);
  });

  it("when edge is in sector 2 and the assigned Direction is 1", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(-10, -4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 1;

    expect(edge.getClosestAssociatedAngle()).toBe(Math.PI);
  });

  it("when edge is in sector 3 and the assigned Direction is 2", function () {
    const dcel = new Dcel();
    dcel.config = { ...config, c: new C(2) };

    const o = new Vertex(0, 0, dcel);
    const d = new Vertex(10, -4, dcel);
    const edge = dcel.makeHalfEdge(o, d);
    const twin = dcel.makeHalfEdge(d, o);
    edge.twin = twin;
    twin.twin = edge;
    edge.class = EdgeClasses.UD;
    edge.assignedDirection = 2;

    expect(edge.getClosestAssociatedAngle()).toBe(
      ((Math.PI * 2) / edge.dcel.config.c.getDirections().length) * 3
    );
  });
});
