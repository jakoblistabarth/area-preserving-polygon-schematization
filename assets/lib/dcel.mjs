import { v4 as uuid } from 'uuid';

// TODO: if this class needs particular methods for the schematization algorithm extend this class
class DCELVertex {
    constructor(lng,lat) {
        this.uuid = uuid()
        this.lng = lng
        this.lat = lat
        this.incidentEdge = null
    }

    getDistance(p) {
        const [x1, y1] = [this.lng, this.lat]
        const [x2, y2] = [p.lng, p.lat]

        const a = x1 - x2
        const b = y1 - y2

        const c = Math.sqrt( a*a + b*b )
        return c
    }
}

class DCELHalfEdge {
    constructor(origin, prev, next) {
        this.uuid = uuid()
        this.origin = origin
        this.twin = null
        this.incidentFace = null
        this.prev = prev
        this.next = next
    }
}

class DCELFace {
    constructor() {
        this.uuid = uuid()
        this.halfEdge = null
    }

    getEdges() {
        const halfEdges = []
        const initialEdge = this.halfEdge
        let currentEdge = initialEdge

        do {
           halfEdges.push(currentEdge)
            currentEdge = currentEdge.next
        } while (currentEdge != initialEdge)
        return halfEdges
    }
}

class DCEL {
    constructor() {
        this.vertices = {}
        this.halfEdges = []
        this.faces = []
        this.outerFace = this.makeFace()
    }

    makeVertex(lng,lat) {
        const key = `${lng}/${lat}` // TODO: is there a better way to ensure that a coordinate pair vertex is added only once to the vertex list?
        if (this.vertices[key])
            return this.vertices[key]

        const vertex = new DCELVertex(lng,lat)
        this.vertices[key] = vertex
        return vertex
    }

    makeHalfEdge(origin, prev, next) {
        let existingHalfEdge = null
        if (origin) {
            existingHalfEdge = this.halfEdges.find(edge => edge.origin == origin && edge.incidentFace == this.outerFace)
        }
        if (existingHalfEdge) {
            // console.log("existing halfEdge:", existingHalfEdge.origin)
            return existingHalfEdge
        }
        const halfEdge = new DCELHalfEdge(origin, prev, next)
        halfEdge.incidentFace = this.outerFace
        this.halfEdges.push(halfEdge)
        // console.log("create halfEdge:", origin);
        return halfEdge
    }

    makeFace(){
        const face = new DCELFace()
        this.faces.push(face)
        return face
    }

    getFaces() {
        return this.faces
    }

    // as seen @ https://github.com/Turfjs/turf/blob/master/packages/turf-bbox/index.ts
    // takes a dcel
    // returns its Boundingbox as [minX, minY, maxX, maxY]
    getBbox() {
        const points = Object.values(this.vertices).map(p => [p.lng, p.lat])
        const bbox = [Infinity,Infinity,-Infinity,-Infinity]
        points.forEach(p =>{
            if (bbox[0] > p[0]) {
                bbox[0] = p[0];
              }
              if (bbox[1] > p[1]) {
                bbox[1] = p[1];
              }
              if (bbox[2] < p[0]) {
                bbox[2] = p[0];
              }
              if (bbox[3] < p[1]) {
                bbox[3] = p[1];
              }
        })
        return bbox
    }

    // takes a dcel
    // returns its diameter
    getDiameter() {
        const bbox = this.getBbox()
        // TODO: refactor this?
        const [a, b, c, d] = [
            this.makeVertex(bbox[0],bbox[1]),
            this.makeVertex(bbox[2],bbox[1]),
            this.makeVertex(bbox[2],bbox[3]),
            this.makeVertex(bbox[0],bbox[3])
        ]

        const diameter = Math.max(...[ // TODO: refactor this – only two sides necessary?
            a.getDistance(b),
            b.getDistance(c),
            c.getDistance(d),
            d.getDistance(a)
        ])

        return diameter;
    }

    static buildFromGeoJSON(geoJSON) {
        const subdivision = new DCEL()

        geoJSON.features.forEach(feature => {
            feature.geometry.coordinates.forEach(subplgn => {
                const face = subdivision.makeFace()
                let prevHalfEdge = null
                let initialEdge = null
                for (let idx = 0; idx <= subplgn.length; idx++) {

                    if (idx == subplgn.length) {
                        prevHalfEdge.next = initialEdge
                        initialEdge.prev = prevHalfEdge

                        subdivision.outerFace.halfEdge = initialEdge.twin
                        prevHalfEdge.twin.origin = initialEdge.origin
                        prevHalfEdge.twin.prev = initialEdge.twin
                        initialEdge.twin.origin = initialEdge.next.origin
                        initialEdge.twin.next = prevHalfEdge.twin
                        initialEdge.twin.prev = initialEdge.next.twin
                        continue
                    }

                    const v = subplgn[idx]
                    const origin = subdivision.makeVertex(v[0],v[1])
                    const halfEdge = subdivision.makeHalfEdge(origin, prevHalfEdge, null)
                    origin.incidentEdge = halfEdge
                    halfEdge.incidentFace = face
                    halfEdge.twin = subdivision.makeHalfEdge(null, null, null)
                    halfEdge.twin.twin = halfEdge
                    subdivision.outerFace.halfEdge = halfEdge.twin

                    if (idx == 0) {
                        initialEdge = halfEdge
                        face.halfEdge = initialEdge
                    } else {
                        prevHalfEdge.next = halfEdge
                        halfEdge.twin.next = prevHalfEdge.twin
                        prevHalfEdge.twin.origin = halfEdge.origin
                        prevHalfEdge.twin.prev = halfEdge.twin
                    }
                    prevHalfEdge = halfEdge
                }
            })
        })
        return subdivision
    }

    // get epsilon
    // – the threshold for max edge length
    // takes a dcel
    // returns the treshold as flaot
    getEpsilon(factor) {
        return this.getDiameter() * factor
    }

    bisectEdge(halfEdge){
        return
    }
}

export default DCEL