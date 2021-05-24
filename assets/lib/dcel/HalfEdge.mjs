import { v4 as uuid } from "uuid";
import config from "../../schematization.config.mjs";

class HalfEdge {
  constructor(tail, dcel) {
    this.uuid = uuid();
    this.tail = tail;
    this.twin = null;
    this.face = null;
    this.prev = null;
    this.next = null;
    this.dcel = dcel;
    this.schematizationProperties = {};
  }

  getTail() {
    return this.tail;
  }

  getHead() {
    return this.twin.tail;
  }

  getEndpoints() {
    return [this.getTail(), this.getHead()];
  }

  getCycle(forwards = true) {
    let currentEdge = this;
    const initialEdge = currentEdge;
    const halfEdges = [];

    do {
      halfEdges.push(currentEdge);
      currentEdge = forwards ? currentEdge.next : currentEdge.prev;
    } while (currentEdge != initialEdge);

    return halfEdges;
  }

  getAngle() {
    const vector = [this.twin.tail.x - this.tail.x, this.twin.tail.y - this.tail.y];
    const angle = Math.atan2(vector[1], vector[0]);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }

  getLength() {
    return this.getTail().getDistance(this.getHead());
  }

  getMidpoint() {
    const [x1, y1] = [this.getTail().x, this.getTail().y];
    const [x2, y2] = [this.getHead().x, this.getHead().y];

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return [mx, my];
  }

  remove() {
    this.tail.removeIncidentEdge(this);
    this.dcel.removeHalfEdge(this);
    if (this.face.outerRing) this.face.outerRing.removeInnerEdge(this);
  }

  bisect() {
    const e = this;
    const et = e.twin;
    const f1 = e.face;
    const f2 = et.face;

    const a = e.next;
    const b = e.prev;
    const c = et.next;
    const d = et.prev;

    const [x, y] = e.getMidpoint();
    const N = this.dcel.makeVertex(x, y);

    const et_ = this.dcel.makeHalfEdge(N, e.tail);
    const et__ = this.dcel.makeHalfEdge(et.tail, N);
    N.edges.sort();
    et_.next = c;
    et_.prev = et__;
    et_.face = f2;

    et__.next = et_;
    et__.prev = d;
    et__.face = f2;

    et.prev.next = et__;
    et.next.prev = et_;

    if (f2.edge != null && !f1.outerRing) {
      // if f2 is not the unbounded face and f1 is not a hole
      f2.edge = et_;
    }
    if (f2.innerEdges) {
      f2.innerEdges.forEach((e) => {
        e.face.replaceOuterRingEdge(et, et_);
      });
    }
    et.remove();

    const e_ = this.dcel.makeHalfEdge(e.tail, N);
    const e__ = this.dcel.makeHalfEdge(N, a.tail);
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

    f1.edge = e_;

    if (f1.outerRing) {
      //if f1 is a hole
      f2.replaceInnerEdge(e, e_);
    }
    if (f1.innerEdges) {
      f1.innerEdges.forEach((e) => {
        e.face.replaceOuterRingEdge(e, e_);
      });
    }
    e.remove();

    return e_;
  }

  subdivideToThreshold(threshold) {
    const initialHalfEdge = this;
    let currentHalfEdge = initialHalfEdge;

    while (currentHalfEdge != initialHalfEdge.next) {
      if (currentHalfEdge.getLength() < threshold) {
        currentHalfEdge = currentHalfEdge.next;
      } else {
        const newHalfEdge = currentHalfEdge.bisect();
        currentHalfEdge = newHalfEdge;
      }
    }
  }

  getAssociatedDirections(sectors = config.C.getSectors()) {
    const angle = this.getAngle();
    let directions;
    sectors.some(function (sector) {
      if (angle === sector[0]) directions = [sector[0]];
      else if (angle === sector[1]) directions = [sector[1]];
      else if (angle > sector[0] && angle < sector[1]) directions = sector;
      return;
    });
    return directions;
  }

  getSectorIndex(sectors = config.C.getSectors()) {
    const direction = this.getAssociatedDirections();
    const idx = sectors.reduce((acc, sector, idx) => {
      if (
        (direction[0] === sector[0] && direction[1] === sector[1]) ||
        +direction === sector[0] ||
        +direction === sector[1] ||
        +direction === sector[1] - Math.PI * 2
      ) {
        acc.push(idx);
      }
      return acc;
    }, []);
    return idx;
  }

  isInSector(sector) {
    return (this.getAngle() > sector[0] && this.getAngle() < sector[1]) ||
      this.getAngle() === sector[0] ||
      this.getAngle() === sector[1]
      ? true
      : false;
  }

  isAligned(sectors = config.C.getSectors()) {
    const isAligned = this.getAssociatedDirections(sectors).length === 1 ? true : false;
    this.schematizationProperties.isAligned = isAligned;
    return isAligned;
  }

  classify(sectors = config.C.getSectors()) {
    let classification;
    const sectorIdx = this.getSectorIndex();
    const prevSector = sectors[(sectorIdx - 1) % sectors.length];
    const nextSector = sectors[(sectorIdx + 1) % sectors.length];
    if (this.isAligned() && this.tail.allEdgesAligned()) classification = "alignedBasic";
    this.schematizationProperties.classification = classification;
    return classification;
  }
}

export default HalfEdge;
