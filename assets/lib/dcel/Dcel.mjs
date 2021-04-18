import config from '../../schematization.config.mjs'
import Vertex from './Vertex.mjs'
import HalfEdge from './HalfEdge.mjs'
import Face from './Face.mjs'

class Dcel {
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

        const vertex = new Vertex(lng, lat, this)
        this.vertices[key] = vertex
        return vertex
    }

    makeHalfEdge(origin, prev, next) {
        let existingHalfEdge = null
        if (origin) {
            existingHalfEdge = this.halfEdges.find(edge => origin == edge.origin && origin !== null && edge.incidentFace == this.outerFace)
        }
        if (existingHalfEdge && false) {
            console.log(origin.getXY());
            console.log("existing halfEdge:", existingHalfEdge.origin.getXY(), existingHalfEdge.uuid)
            return existingHalfEdge
        }
        const halfEdge = new HalfEdge(origin, prev, next, this)
        halfEdge.incidentFace = this.outerFace
        // console.log("create halfEdge:", halfEdge.uuid);
        this.halfEdges.push(halfEdge)
        return halfEdge
    }

    makeFace(properties){
        const face = new Face()
        face.properties = properties ? properties : face.properties
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
            new Vertex(bbox[0],bbox[1]),
            new Vertex(bbox[2],bbox[1]),
            new Vertex(bbox[2],bbox[3]),
            new Vertex(bbox[0],bbox[3])
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
        const subdivision = new Dcel()

        geoJSON.features.forEach(feature => {
            feature.geometry.coordinates.forEach(subplgn => {
                const face = subdivision.makeFace(feature.properties)
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
        
        subdivision.setEpsilon(config.eFactor)

        return subdivision
    }

    // get epsilon
    // – the threshold for max edge length
    // takes a dcel
    // returns the treshold as float
    setEpsilon(factor) {
        this.epsilon = this.getDiameter() * factor
    }

}

export default Dcel