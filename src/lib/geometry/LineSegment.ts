import Point from "./Point";
import Vector2D from "./Vector2D";

class LineSegment {
  endPoint1: Point;
  endPoint2: Point;

  constructor(endPoint1: Point, endPoint2: Point) {
    this.endPoint1 = endPoint1;
    this.endPoint2 = endPoint2;
  }

  getLength(): number {
    return this.endPoint1.distanceToPoint(this.endPoint2);
  }

  /**
   * Determines whether or not the line segment intersects with another.
   * @credits Adapted from [codeproject.com](https://www.codeproject.com/tips/862988/find-the-intersection-point-of-two-line-segments)
   * @param lineSegment
   * @param considerCollinearOverlap
   * @returns
   */
  intersectsLineSegment(
    lineSegment: LineSegment,
    considerCollinearOverlap: boolean = false
  ): Point | undefined {
    const p1 = new Vector2D(this.endPoint1.x, this.endPoint1.y);
    const p2 = new Vector2D(this.endPoint2.x, this.endPoint2.y);
    const q1 = new Vector2D(lineSegment.endPoint1.x, lineSegment.endPoint1.y);
    const q2 = new Vector2D(lineSegment.endPoint2.x, lineSegment.endPoint2.y);

    const r = p2.minus(p1);
    const s = q2.minus(q1);
    const rxs = r.cross(s);
    const q1p1xr = q1.minus(p1).cross(r);

    if (rxs === 0 && q1p1xr === 0) {
      // 1. If either  0 <= (q - p) * r <= r * r or 0 <= (p - q) * s <= * s
      // then the two lines are overlapping,
      if (considerCollinearOverlap)
        if (
          (0 <= q1.minus(p1).dot(r) && q1.minus(p1).dot(r) <= r.dot(r)) ||
          (0 <= p1.minus(q1).dot(s) && p1.minus(q1).dot(s) <= s.dot(s))
        )
          return new Point(NaN, NaN);

      // 2. If neither 0 <= (q - p) * r = r * r nor 0 <= (p - q) * s <= s * s
      // then the two lines are collinear but disjoint.
      // No need to implement this expression, as it follows from the expression above.
      return undefined;
    }

    // 3. If r x s = 0 and (q - p) x r != 0, then the two lines are parallel and non-intersecting.
    if (rxs === 0 && q1p1xr !== 0) return undefined;

    const t = q1.minus(p1).cross(s) / rxs;
    const u = q1.minus(p1).cross(r) / rxs;

    // 4. If r x s != 0 and 0 <= t <= 1 and 0 <= u <= 1
    // the two line segments meet at the point p + t r = q + u s.
    if (rxs !== 0 && 0 <= t && t <= 1 && 0 <= u && u <= 1) {
      // We can calculate the intersection point using either t or u.
      const intersectionV = p1.plus(r.times(t));
      return new Point(intersectionV.dx, intersectionV.dy);
    }

    // 5. Otherwise, the two line segments are not parallel but do not intersect.
    return undefined;
  }
}

export default LineSegment;
