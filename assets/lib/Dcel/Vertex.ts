import { v4 as uuid } from "uuid";
import Sector from "../OrientationRestriction/Sector";
import Point from "../Geometry/Point";
import { crawlArray, getOccurrence } from "../utilities";
import Dcel from "./Dcel";
import HalfEdge from "./HalfEdge";

class Vertex extends Point {
  dcel: Dcel;
  uuid: string;
  edges: Array<HalfEdge>;
  significant: boolean;

  constructor(x: number, y: number, dcel: Dcel) {
    super(x, y);
    this.dcel = dcel;
    this.uuid = uuid();
    this.edges = [];
    this.significant = undefined;
  }

  static getKey(x: number, y: number): string {
    return `${x}/${y}`;
  }

  distanceToVertex(p: Point): number {
    return this.distanceToPoint(p);
  }

  // adapted from https://github.com/scottglz/distance-to-line-segment/blob/master/index.js
  distanceToEdge(edge: HalfEdge): number {
    const [vx, vy] = this.xy();
    const [e1x, e1y] = edge.getTail().xy();
    const [e2x, e2y] = edge.getHead().xy();
    const edx = e2x - e1x;
    const edy = e2y - e1y;
    const lineLengthSquared = edx ** 2 + edy ** 2;

    let t = ((vx - e1x) * edx + (vy - e1y) * edy) / lineLengthSquared;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;

    const ex = e1x + t * edx,
      ey = e1y + t * edy,
      dx = vx - ex,
      dy = vy - ey;
    return Math.sqrt(dx * dx + dy * dy);
  }

  sortEdges(clockwise: boolean = true): Array<HalfEdge> {
    this.edges = this.edges.sort((a, b) => {
      if (clockwise) return b.getAngle() - a.getAngle();
      else return a.getAngle() - b.getAngle();
    });
    return this.edges;
  }

  removeIncidentEdge(edge: HalfEdge): Array<HalfEdge> {
    const idx = this.edges.indexOf(edge);
    if (idx > -1) {
      this.edges.splice(idx, 1);
    }
    return this.edges;
  }

  allEdgesAligned(): boolean {
    return this.edges.every((edge) => edge.isAligned());
  }

  isSignificant(): boolean {
    // QUESTION: are vertices with only aligned edges never significant?
    // TODO: move to another class? to not mix dcel and schematization?

    // classify as insignificant if all edges are already aligned
    if (this.allEdgesAligned()) {
      return (this.significant = false);
    }

    // classify as significant if one sector occurs multiple times
    const occupiedSectors = this.edges.map((edge) => edge.getAssociatedSector()).flat();

    const uniqueSectors = occupiedSectors.reduce((acc, sector) => {
      if (!acc.find((accSector) => accSector.idx == sector.idx)) acc.push(sector);
      return acc;
    }, []);

    if (occupiedSectors.length !== uniqueSectors.length) {
      return (this.significant = true);
    }

    // classify as significant if neighbor sectors are not empty
    const isSignificant = uniqueSectors.every((sector) => {
      const [prevSector, nextSector] = sector.getNeighbors();
      return (
        this.getEdgesInSector(prevSector).length > 0 || this.getEdgesInSector(nextSector).length > 0
      );
    });
    return (this.significant = isSignificant);
  }

  getEdgesInSector(sector: Sector): Array<HalfEdge> {
    return this.edges.filter((edge) => sector.encloses(edge.getAngle()));
  }

  assignDirections(): Array<HalfEdge> {
    const edges = this.sortEdges(false);
    let directionsToAssign: number[] = [];
    const closestBounds = edges.map((edge) => {
      let direction: number;

      const [lower, upper] = edge.getAssociatedSector()[0].getBounds();
      direction = edge.getAngle() - lower <= upper - edge.getAngle() ? lower : upper;
      direction = direction == Math.PI * 2 ? 0 : direction;

      return this.dcel.config.c.getAngles().indexOf(direction);
    });
    directionsToAssign = closestBounds;

    // if (edges.length === 4) console.log(closestBounds);

    closestBounds.forEach((direction, idx) => {
      const nextDirection = crawlArray(this.dcel.config.c.getAngles(), direction, +1);
      const prevDirection = crawlArray(this.dcel.config.c.getAngles(), direction, -1);

      if (getOccurrence(directionsToAssign, direction) == 1) {
        directionsToAssign[idx] = direction;
        return;
      }

      if (getOccurrence(directionsToAssign, nextDirection) > 0) {
        directionsToAssign[idx] = prevDirection;
      } else {
        directionsToAssign[(idx + 1) % closestBounds.length] = nextDirection;
      }
    });

    // if (this.edges.length === 4) console.log("after", directionsToAssign);

    edges.forEach((edge, idx) => {
      if (!edge.assignedDirection) edge.assignedDirection = directionsToAssign[idx];
    });

    return this.edges;
  }
}

export default Vertex;
