import HalfEdge from "../DCEL/HalfEdge";
import Vertex from "../DCEL/Vertex";
import Line from "../geometry/Line";
import Point from "../geometry/Point";

export const enum OuterEdge {
  PREV = "prev",
  NEXT = "next",
}

class Configuration {
  innerEdge: HalfEdge;
  positiveBlockingNumber: number;
  negativeBlockingNumber: number;

  constructor(edge: HalfEdge) {
    this.innerEdge = edge; // TODO: not very elegant, similar problem to saving the dcel explicitly to Vertices and HalfEdges.
    this.positiveBlockingNumber = undefined;
    this.negativeBlockingNumber = undefined;
  }

  getOuterEdge(position: OuterEdge): HalfEdge {
    return position === OuterEdge.PREV ? this.innerEdge.prev : this.innerEdge.next;
  }

  getX(): HalfEdge[] {
    return [this.getOuterEdge(OuterEdge.PREV), this.innerEdge, this.getOuterEdge(OuterEdge.NEXT)];
  }

  getTrack(outerEdge: OuterEdge): Line {
    if (outerEdge === OuterEdge.PREV)
      return new Line(this.innerEdge.getTail(), this.getOuterEdge(OuterEdge.PREV).getAngle());
    else return new Line(this.innerEdge.getHead(), this.getOuterEdge(OuterEdge.NEXT).getAngle());
  }

  getTracks(): Line[] {
    return [this.getTrack(OuterEdge.PREV), this.getTrack(OuterEdge.NEXT)];
  }

  /**
   * Gets the point which is a possible and valid contraction point for an edge move.
   * @param outerEdge The edge which should be used as track for the edge move.
   * @returns A {@link Point}, posing a configuration's contraction point.
   */
  getContractionPoint(outerEdge: OuterEdge): Point {
    let track: Line;
    let vertex: Vertex;
    let edge: HalfEdge;
    if (outerEdge === OuterEdge.PREV) {
      track = this.getTrack(outerEdge);
      vertex = this.getOuterEdge(OuterEdge.NEXT).getHead();
      edge = this.getOuterEdge(OuterEdge.NEXT);
    } else {
      track = this.getTrack(outerEdge);
      vertex = this.getOuterEdge(OuterEdge.PREV).getTail();
      edge = this.getOuterEdge(OuterEdge.PREV);
    }

    const p2 = edge.intersectsLine(track);
    const p1 = track.intersectsLine(new Line(vertex, this.innerEdge.getAngle()));
    // return p2 only if it is on same side of the intersection as the configuration's inner edge
    if (p2 && track.point.distanceToPoint(p2) < track.point.distanceToPoint(p1)) return p2;
    if (p1.isValidIntersectionPoint(this)) return p1;
  }

  // negative for negative contraction areas, positive for positive ones?
  getContractionAreas(): number[] {
    return [10, -10];
  }
}

export default Configuration;
