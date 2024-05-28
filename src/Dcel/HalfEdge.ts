import { v4 as uuid } from "uuid";
import Configuration from "../c-oriented-schematization/Configuration";
import Line from "../geometry/Line";
import LineSegment from "../geometry/LineSegment";
import Point from "../geometry/Point";
import Vector2D from "../geometry/Vector2D";
import Dcel from "./Dcel";
import Face from "./Face";
import Vertex from "./Vertex";

class HalfEdge {
  uuid: string;
  tail: Vertex;
  dcel: Dcel;
  twin?: HalfEdge;
  face?: Face;
  prev?: HalfEdge;
  next?: HalfEdge;

  constructor(tail: Vertex, dcel: Dcel) {
    this.uuid = uuid();
    this.tail = tail;
    this.dcel = dcel;
  }

  static getKey(tail: Vertex, head: Vertex): string {
    return `${tail.getUuid(10)}/${head.getUuid(10)}`;
  }

  /**
   * Get the unique identifier of the HalfEdge.
   * @param stop defines how many strings of the uuid are returned
   * @returns the edge's uuid
   */
  getUuid(length?: number) {
    return this.uuid.substring(0, length);
  }

  /**
   * Gets the Head of the HalfEdge.
   * @returns A {@link Vertex}, representing the {@link HalfEdge}'s head.
   */
  getHead() {
    if (this.twin) return this.twin.tail;
  }

  /**
   * Gets the Vertices of the HalfEdge.
   * @returns An array of {@link Vertex}s, representing the {@link HalfEdge}'s endpoints.
   */
  getEndpoints() {
    const head = this.getHead();
    return head ? [this.tail, head] : [];
  }

  /**
   * Gets all HalfEdges incident to the same face as the HalfEdge.
   * @param forwards A Boolean indicating whether the {@link HalfEdge}s should be returned forward (counterclockwise)
   * or backwards (clockwise). Default: true.
   * @returns An array of {@link HalfEdge}s.
   */
  getCycle(forwards: boolean = true): HalfEdge[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentEdge: HalfEdge = this;
    const initialEdge: HalfEdge = currentEdge;
    const halfEdges: HalfEdge[] = [];

    do {
      halfEdges.push(currentEdge);
      if (currentEdge.next && currentEdge.prev)
        currentEdge = forwards ? currentEdge.next : currentEdge.prev;
    } while (currentEdge != initialEdge);

    return halfEdges;
  }

  /**
   * Gets the minimum amount of steps it takes to get from the halfedge to another.
   * Looking at both directions, clock-wise and counter-clockwise.
   * @param other {@link HalfEdge} to which the distance in steps is measured.
   * @returns An integer, indicating the minimum step distance to the {@link Halfedge}.
   */
  getMinimalCycleDistance(other: HalfEdge): number {
    const forwards = this.getCycle().indexOf(other);
    const backwards = this.getCycle(false).indexOf(other);
    return Math.min(forwards, backwards);
  }

  getVector(): Vector2D | undefined {
    const [tail, head] = this.getEndpoints();
    if (tail && head) return new Vector2D(head.x - tail.x, head.y - tail.y);
  }

  /**
   * Returns an infinite Line going through the HalfEdge.
   * @returns A Line which includes the {@link HalfEdge}.
   */
  toLine(): Line | undefined {
    const angle = this.getAngle();
    if (typeof angle !== "number") return;
    return new Line(this.tail, angle);
  }

  /**
   * Gets the angle of an HalfEdge in respect to the unit circle.
   * @returns The angle in radians.
   */
  getAngle(): number | undefined {
    const vector = this.getVector();
    if (!vector) return;
    const angle = Math.atan2(vector.dy, vector.dx);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }

  /**
   * Gets the length of the Halfedge.
   * @returns The Length.
   */
  getLength(): number | undefined {
    const head = this.getHead();
    if (head) return this.tail.distanceToVertex(head);
  }

  /**
   * Gets the midpoint of the HalfEdge.
   * @returns A {@link Point}, indicating the midpoint of the {@link HalfEdge}.
   */
  getMidpoint(): Point | undefined {
    const head = this.getHead();
    if (!head) return;
    const [x1, y1] = this.tail.xy();
    const [x2, y2] = head.xy();

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return new Point(mx, my);
  }

  /**
   * Remove links of the halfEdge within the DCEL linkages.
   */
  remove(): void {
    this.tail.removeIncidentEdge(this);
    if (this.face?.outerRing) this.face.outerRing.removeInnerEdge(this);
    this.dcel?.removeHalfEdge(this);
  }

  /**
   * Subdivides a halfedge by adding a new vertex between a halfedge's tail and head.
   * @credits adapted from [Doubly Connect Edge List (DCEL)](https://www2.cs.sfu.ca/~binay/813.2011/DCEL.pdf)
   * @param newPoint {@link Point} which should be added between the {@link HalfEdge}'s tail and head. default: the edge's midpoint
   * @returns the new {@link HalfEdge} which leads from the original {@link HalfEdge}'s tail to the newly created {@link Vertex}.
   */
  subdivide(
    newPoint: Point | undefined = this.getMidpoint(),
  ): HalfEdge | undefined {
    if (!newPoint) return;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const e = this;
    const et = e.twin;
    if (!et) return;
    const f1 = e.face;
    const f2 = et.face;
    if (!f2 || !f1) return;

    const a = e.next;
    const b = e.prev;
    const c = et.next;
    const d = et.prev;
    if (!a || !b || !c || !d) return;

    const [x, y] = newPoint.xy();
    const N = this.dcel.addVertex(x, y);

    const et_ = this.dcel.addHalfEdge(N, e.tail);
    const et__ = this.dcel.addHalfEdge(et.tail, N);
    N.edges.sort();
    et_.next = c;
    et_.prev = et__;
    et_.face = f2;

    et__.next = et_;
    et__.prev = d;
    et__.face = f2;

    if (!et.prev || !et.next) return;
    et.prev.next = et__;
    et.next.prev = et_;

    if (f2.edge && !f1.outerRing) {
      // if f2 is not the unbounded face and f1 is not a hole
      f2.edge = et_;
    }

    f2.innerEdges.forEach((e) => {
      if (!e.face) return;
      e.face.replaceOuterRingEdge(et, et_);
    });

    if (f2.outerRing) {
      // if f2 is a hole
      f1.replaceInnerEdge(et, et_);
    }

    et.remove();

    const e_ = this.dcel.addHalfEdge(e.tail, N);
    const e__ = this.dcel.addHalfEdge(N, a.tail);
    N.edges.sort();
    e_.next = e__;
    e_.prev = b;
    e_.face = f1;

    e__.next = a;
    e__.prev = e_;
    e__.face = f1;

    b.next = e_;
    a.prev = e__;

    et_.twin = e_;
    e_.twin = et_;
    et__.twin = e__;
    e__.twin = et__;

    if (f1.edge && !f2.outerRing) f1.edge = e_; // if e is an clockwise-running edge incident to the unbounded face

    f1.innerEdges.forEach((e) => {
      if (!e.face) return;
      e.face.replaceOuterRingEdge(e, e_);
    });

    if (f1.outerRing) {
      // if f1 is a hole
      f2.replaceInnerEdge(e, e_);
    }

    e.remove();

    return e_;
  }

  /**
   * Moves an Halfedge to the specified tail's and head's position.
   * @param newTail {@link} A {@link Point}, indicating the new position of the {@link HalfEdge}'s tail.
   * @param newHead A {@link Point}, indicating the new position of the {@link HalfEdge}'s head.
   * @returns The moved {@link HalfEdge}.
   */
  move(newTail: Point, newHead: Point) {
    const head = this.getHead();
    const prevTail = this.prev?.tail;
    const nextHead = this.next?.getHead();
    if (!head || !nextHead || !prevTail) return;
    if (newHead.equals(nextHead)) {
      const newEdge = head.remove(this.face);
      if (newEdge) newEdge.configuration = new Configuration(newEdge);
      newEdge?.dcel.faceFaceBoundaryList?.addEdge(newEdge);
    } else head.moveTo(newHead.x, newHead.y);
    if (newTail.equals(prevTail)) {
      const newEdge = this.tail.remove(this.face);
      if (newEdge) newEdge.configuration = new Configuration(newEdge);
      newEdge?.dcel.faceFaceBoundaryList?.addEdge(newEdge);
    } else this.tail.moveTo(newTail.x, newTail.y);
  }

  /**
   * Returns the intersection point of the HalfEdge and a line, if exists.
   * @credits Part that determines whether or not the point is on the line segment, was adapted from this [stack overflow answer](https://stackoverflow.com/a/17590923).
   * @param line The infinite {@link Line} the {@link HalfEdge} is intersected with.
   * @returns
   */
  intersectsLine(line: Line): Point | undefined {
    const head = this.getHead();
    const P = this.toLine()?.intersectsLine(line);
    //TODO: check if the fact that intersectsLine returns undefined for parallel line
    // poses a problem for the case that the halfedge is part of the line
    if (!P || !head) return;
    if (P.isOnLineSegment(new LineSegment(this.tail, head))) return P;
  }

  /**
   * Subdivides the HalfEdge into smaller Edges, using a threshold.
   * @param threshold The value determining the maximum length of a subdivision of the original {@link HalfEdge}.
   */
  subdivideToThreshold(threshold: number): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const initialHalfEdge: HalfEdge = this;
    let currentHalfEdge: HalfEdge = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      const length = currentHalfEdge.getLength();
      if (
        currentHalfEdge.next &&
        typeof length === "number" &&
        length < threshold
      ) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge = currentHalfEdge.subdivide();
        currentHalfEdge =
          newHalfEdge ?? currentHalfEdge.next ?? initialHalfEdge;
      }
    }
  }

  /**
   * Gets the minimum distance between two HalfEdges.
   * @param otherEdge The {@link HalfEdge} the distance to is calculated.
   * @returns A number, indicating the minimum distance.
   */
  distanceToEdge(otherEdge: HalfEdge): number | undefined {
    const head = this.getHead();
    const otherHead = otherEdge.getHead();
    if (!head || !otherHead) return;
    const verticesThis = [this.tail, head];
    const verticesEdge = [otherEdge.tail, otherHead];
    const distances = [
      ...verticesThis.map((v) => v.distanceToEdge(otherEdge)),
      ...verticesEdge.map((v) => v.distanceToEdge(this)),
    ].filter((distance): distance is number => !!distance);
    return Math.min(...distances);
  }

  /**
   * Converts the HalfEdge into its equivalent LineSegment.
   * @returns A {@link LineSegment}.
   */
  toLineSegment(): LineSegment | undefined {
    const head = this.getHead();
    if (head) return new LineSegment(this.tail, head);
  }

  /**
   * Converts the halfedge into a short string. For debugging purposes.
   * @returns A string representing the {@link Halfedge}'s endpoints.
   */
  toString() {
    return this.getEndpoints()
      .map((p) => p.xy().join("/"))
      .join("->");
  }
}

export default HalfEdge;
