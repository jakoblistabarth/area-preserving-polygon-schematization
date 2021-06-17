const fs = require("fs");
const Dcel = require("../dist/cjs/lib/dcel/Dcel.js").default;
const HalfEdge = require("../dist/cjs/lib/dcel/HalfEdge.js").default;
const Vertex = require("../dist/cjs/lib/dcel/Vertex.js").default;
const Significance = require("../dist/cjs/lib/dcel/Vertex.js").Significance;

const getTestFiles = (dir) => {
  const filesInDir = fs.readdirSync(dir, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    return files;
  });

  return filesInDir.filter((f) => f.substr(-5, f.length) === ".json");
};

const createEdgeVertexSetup = () => {
  const setup = {};
  setup.dcel = new Dcel();

  setup.o = new Vertex(0, 0, setup.dcel);
  setup.o.significance = Significance.S;

  const destinations = {
    d0: new Vertex(4, 0, setup.dcel),
    d14: new Vertex(4, 1, setup.dcel),
    d37: new Vertex(4, 3, setup.dcel),
    d53: new Vertex(3, 4, setup.dcel),
    d76: new Vertex(1, 4, setup.dcel),
    d90: new Vertex(0, 4, setup.dcel),
    d104: new Vertex(-1, 4, setup.dcel),
    d143: new Vertex(-4, 3, setup.dcel),
    d180: new Vertex(-4, 0, setup.dcel),
    d217: new Vertex(-4, -3, setup.dcel),
    d270: new Vertex(0, -4, setup.dcel),
    d284: new Vertex(1, -4, setup.dcel),
    d315: new Vertex(4, -4, setup.dcel),
    d333: new Vertex(4, -2, setup.dcel),
  };

  Object.entries(destinations).forEach(([key, vertex]) => {
    const edge = new HalfEdge(setup.o);
    edge.twin = new HalfEdge(vertex);
    edge.twin.twin = edge;
    edge.dcel = setup.dcel;
    edge.twin.dcel = setup.dcel;
    setup["o" + key] = edge;
  });

  return setup;
};

exports.getTestFiles = getTestFiles;
exports.createEdgeVertexSetup = createEdgeVertexSetup;