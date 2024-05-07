import * as geojson from "geojson";
import FaceFaceBoundaryList from "../c-oriented-schematization/FaceFaceBoundaryList";
import Point from "../geometry/Point";
import Subdivision from "../geometry/Subdivision";
import BoundingBox from "../helpers/BoundingBox";
import { geoJsonToGeometry, validateGeoJSON } from "../utilities";
import Face from "./Face";
import HalfEdge from "./HalfEdge";
import Vertex from "./Vertex";

class Dcel {
  name?: string;
  vertices: Map<string, Vertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Face[];
  featureProperties: geojson.GeoJsonProperties;
  faceFaceBoundaryList?: FaceFaceBoundaryList;

  constructor() {
    this.vertices = new Map();
    this.halfEdges = new Map();
    this.faces = [];
    this.featureProperties = {};
  }

  /**
   * Creates a new Vertex and adds it to the DCEL.
   * @param x x coordinate of the new {@link Vertex}.
   * @param y y coordinate of the new {@link Vertex}.
   * @returns The created {@link Vertex}.
   */
  addVertex(x: number, y: number): Vertex {
    const key = Vertex.getKey(x, y);
    const existingVertex = this.vertices.get(key);
    if (existingVertex) return existingVertex;

    const vertex = new Vertex(x, y, this);
    this.vertices.set(key, vertex);
    return vertex;
  }

  /**
   * Creates a new HalfEdge and adds it to the DCEL.
   * @param tail tail {@link Vertex} of the new {@link HalfEdge}.
   * @param head head {@link Vertex} of the new {@link HalfEdge}.
   * @returns The created HalfEdge.
   */
  addHalfEdge(tail: Vertex, head: Vertex): HalfEdge {
    const key = HalfEdge.getKey(tail, head);
    const existingHalfEdge = this.halfEdges.get(key);
    if (existingHalfEdge) return existingHalfEdge;

    const halfEdge = new HalfEdge(tail, this);
    this.halfEdges.set(key, halfEdge);
    tail.edges.push(halfEdge);
    tail.edges.sort();
    return halfEdge;
  }

  /**
   * Creates a new Face and adds it to the DCEL.
   * @returns The created {@link Face}.
   */
  addFace(): Face {
    const face = new Face();
    this.faces.push(face);
    return face;
  }

  /**
   * Gets all Faces of the DCEL.
   * @returns An array of {@link Face}s.
   */
  getFaces(): Face[] {
    return this.faces;
  }

  /**
   * Returns only the bounded Faces of the DCEL (the unbounded outer Face is not returned).
   * @returns An array of {@link Face}s.
   */
  getBoundedFaces(): Face[] {
    return this.faces.filter((f) => !f.isUnbounded);
  }

  /**
   * Returns the unbounded Face of the DCEL.
   * @returns The unbounded {@link Face}.
   */
  getUnboundedFace(): Face | undefined {
    return this.faces.find((f) => f.isUnbounded);
  }

  /**
   * Returns Halfedges of the DCEL.
   * @param edgeClass If set, only the {@link HalfEdge}s of this class will be returned.
   * @param simple If true, for every pair of {@link HalfEdge}s only one will be returned. false by default.
   * @param significantTail If true, for a pair of {@link HalfEdge}s which do have a significant {@link Vertex}, the one where the significant {@link Vertex} is the tail will be returned, default = false
   * @returns A (sub)set of {@link HalfEdge}s.
   */
  getHalfEdges(simple = false): HalfEdge[] {
    const halfEdges = Array.from(this.halfEdges.values());
    return simple ? this.getSimpleEdges(halfEdges) : halfEdges;
  }

  getSimpleEdges(edges: HalfEdge[]) {
    // FIXME: confusing for map output: sometimes clockwise/counterclockwise assignment in map output wrong
    const simpleEdges: HalfEdge[] = [];
    edges.forEach((e) => {
      if (!e.twin) return;
      const idx = simpleEdges.indexOf(e.twin);
      if (idx < 0) simpleEdges.push(e);
    });
    return simpleEdges;
  }

  getVertices(significant?: boolean) {
    if (significant)
      return Array.from(this.vertices.values()).filter(
        (v) => v.significant === significant,
      );
    return Array.from(this.vertices.values());
  }

  getArea(): number {
    return this.getFaces().reduce((acc, face) => {
      // do only consider faces associated with one feature
      // the unbounded faces (no associated features) need to be ignored
      // and faces which are holes and boundary (two associated features) can be ignored
      // as the area of the hole and the boundary cancel each other out
      if (face.associatedFeatures.length !== 1) return acc;
      const faceArea = face.getArea();
      if (faceArea) acc += faceArea * (face.isHole ? -1 : 1);
      return acc;
    }, 0);
  }

  /**
   * Find a Vertex within a DCEL, based on x and y coordinates.
   * @param x x Position
   * @param y y Position
   * @returns A {@link Vertex} if one exists on this position, otherwise undefined.
   */
  findVertex(x: number, y: number): Vertex | undefined {
    return this.vertices.get(Vertex.getKey(x, y));
  }

  /**
   * Find a HalfEdge within a DCEL, based on Points representing the tail and the head's position.
   * @param tailPos {@link Point} representing the position of the {@link HalfEdge}'s tail {@link Vertex}.
   * @param headPos {@link Point} representing the position of the {@link HalfEdge}'s head {@link Vertex}.
   * @returns A {@link HalfEdge}, if one exists with this endpoint positions, otherwise undefined.
   */
  findHalfEdge(tailPos: Point, headPos: Point): HalfEdge | undefined {
    return this.getHalfEdges().find((edge) => {
      const edgeHeadPos = edge.getHead()?.toPoint();
      if (!edgeHeadPos) return;
      const edgeTailPos = edge.tail.toPoint();
      return edgeHeadPos.equals(headPos) && edgeTailPos.equals(tailPos);
    });
  }

  /**
   * Removes the {@link Vertex} from the DCEL.
   * @param vertex The {@link Vertex} to remove.
   * @returns The remaining {@link Vertex|Vertices} in the DCEL.
   */
  removeVertex(vertex: Vertex): Map<string, Vertex> {
    const key = Vertex.getKey(vertex.x, vertex.y);
    this.vertices.delete(key);
    return this.vertices;
  }

  /**
   * Removes the {@link HalfEdge} from the DCEL.
   * @param edge The {@link HalfEdge} to remove.
   * @returns The remaining {@link HalfEdge}s in the DCEL.
   */
  removeHalfEdge(edge: HalfEdge): Map<string, HalfEdge> {
    const head = edge.getHead();
    if (!head) return this.halfEdges;
    const edgeKey = HalfEdge.getKey(edge.tail, head);
    this.halfEdges.delete(edgeKey);
    if (edge.face && edge.twin?.face) {
      const boundaryKey = FaceFaceBoundaryList.getKey(
        edge.face,
        edge.twin.face,
      );
      const boundaryEdges =
        this.faceFaceBoundaryList?.boundaries.get(boundaryKey)?.edges;
      if (boundaryEdges && boundaryEdges.indexOf(edge) >= 0)
        boundaryEdges.splice(boundaryEdges.indexOf(edge), 1);
    }
    return this.halfEdges;
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a geoJSON.
   * @param geoJSON a valid geojson with features of type 'Polygon' or 'Multipolygon'
   * @returns A {@link Dcel}.
   */
  static fromGeoJSON(
    geoJSON: geojson.FeatureCollection<geojson.Polygon | geojson.MultiPolygon>,
  ): Dcel {
    if (!validateGeoJSON(geoJSON)) throw new Error("invalid input");
    const geometry = geoJsonToGeometry(geoJSON);
    return this.fromSubdivision(geometry);
  }

  /**
   * Creates a Doubly Connected Edge List (DCEL) data structure from a {@link Subdivision}.
   * @credits adapted from [cs.stackexchange.com](https://cs.stackexchange.com/questions/2450/how-do-i-construct-a-doubly-connected-edge-list-given-a-set-of-line-segments)
   * @param The {@link subdivision} to be converted to a {@link Dcel}.
   * @returns A {@link Dcel}.
   */
  static fromSubdivision(subdivision: Subdivision): Dcel {
    const dcel = new Dcel();

    dcel.featureProperties = subdivision.multiPolygons.map((d) => d.properties);

    // convert Multipolygons to nested array of vertices (polygons)
    const polygons = subdivision.multiPolygons.reduce(
      (acc: Vertex[][][], multiPolygon) => {
        acc.push(
          ...multiPolygon.polygons.map((polygon) =>
            polygon.rings.map((ring) =>
              ring.points.map(
                (point) =>
                  dcel.findVertex(point.x, point.y) ||
                  dcel.addVertex(point.x, point.y),
              ),
            ),
          ),
        );
        return acc;
      },
      [],
    );

    polygons.forEach((polygon) =>
      polygon.forEach((ring) => {
        ring.forEach((tail, idx) => {
          const head: Vertex = ring[(idx + 1) % ring.length];
          const halfEdge = dcel.addHalfEdge(tail, head);
          const twinHalfEdge = dcel.addHalfEdge(head, tail);
          halfEdge.twin = twinHalfEdge;
          twinHalfEdge.twin = halfEdge;
        });
      }),
    );

    // TODO: sort edges everytime a new edge is pushed to vertex.edges
    dcel.vertices.forEach((vertex) => {
      // sort the half-edges whose tail vertex is that endpoint in clockwise order.
      vertex.sortEdges();

      // For every pair of half-edges e1, e2 in clockwise order, assign e1->twin->next = e2 and e2->prev = e1->twin.
      vertex.edges.forEach((e1, idx) => {
        const e2 = vertex.edges[(idx + 1) % vertex.edges.length];
        if (!e1.twin) return;
        e1.twin.next = e2;
        e2.prev = e1.twin;
      });
    });

    // For every cycle, allocate and assign a face structure.
    subdivision.multiPolygons.forEach((multiPolygon, idx) => {
      const featureId = idx;

      let outerRingFace: Face;
      multiPolygon.polygons.forEach((polygon) =>
        polygon.rings.forEach((ring, idx) => {
          const [firstPoint, secondPoint] = ring.points;

          // find first edge of the ring
          const edge = dcel.getHalfEdges().find((e) => {
            return (
              e.tail.x === firstPoint.x &&
              e.tail.y === firstPoint.y &&
              e.twin?.tail.x === secondPoint.x &&
              e.twin?.tail.y === secondPoint.y
            );
          });
          if (!edge) return;

          // check whether there's already a face related to this edge
          const existingFace = dcel.faces.find((f) => f.edge === edge);
          // console.log({ existingFace, featureId, idx, edge: edge.toString() });
          // console.log({
          //   props: multiPolygon.properties,
          //   featureId,
          //   idx,
          //   existingFace,
          // });
          if (existingFace?.associatedFeatures) {
            existingFace.associatedFeatures.push(featureId);
          } else {
            if (idx === 0) {
              // only for outer ring
              outerRingFace = dcel.addFace();
              outerRingFace.associatedFeatures.push(featureId);
              edge?.getCycle().forEach((e) => (e.face = outerRingFace));
              outerRingFace.edge = edge;
            } else {
              const innerRingFace = dcel.addFace();
              innerRingFace.associatedFeatures.push(featureId);
              innerRingFace.outerRing = outerRingFace;

              edge.getCycle().forEach((e) => (e.face = innerRingFace));
              innerRingFace.edge = edge;
              if (!outerRingFace.innerEdges.length)
                outerRingFace.innerEdges = [];

              outerRingFace.innerEdges.push(edge);

              edge.twin?.getCycle().forEach((e) => (e.face = outerRingFace));
            }
          }
        }),
      );
    });

    // create unbounded Face (infinite outerFace) and assign it to edges which do not have a face yet
    const unboundedFace = dcel.addFace();
    while (dcel.getHalfEdges().find((edge) => !edge.face)) {
      const outerEdge = dcel.getHalfEdges().find((edge) => !edge.face);
      if (outerEdge) {
        outerEdge.getCycle().forEach((edge) => {
          edge.face = unboundedFace;
        });
      }
    }

    return dcel;
  }

  /**
   * Gets an array of Points making up the bounding box of the DCEL.
   * As seen from [turf.js](https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts).
   * @returns The bounding box of the {@link Dcel} as [minX, minY, maxX, maxY].
   */
  getBbox() {
    const points = Array.from(this.vertices.values()).map(
      (v) => [v.x, v.y] as [number, number],
    );
    return new BoundingBox(points);
  }

  /**
   * Get the center of the polygon.
   * Defined as the center of it's Boundingbox
   */
  get center(): [number, number] {
    return this.getBbox().center;
  }

  /**
   * Calculates the diameter of the DCEL (as the diameter of its bounding box).
   * @returns The diameter of the {@link Dcel}.
   */
  getDiameter(): number {
    return this.getBbox().diameter;
  }

  toConsole(verbose: boolean = false): void {
    if (!verbose) console.log("DCEL " + this.name, this);
    else {
      console.log("🡒 START DCEL:", this);

      this.getFaces().forEach((f) => {
        console.log("→ new face", f.uuid);
        if (f.getEdges() != undefined) {
          f.getEdges().forEach((e) => {
            console.log(e, `(${e.tail.x},${e.tail.y})`);
          });
        }
      });
      console.log("🡐 DCEL END");
    }
  }

  toSubdivision() {
    //TODO: implement
    return new Subdivision([]);
  }
}

export default Dcel;
