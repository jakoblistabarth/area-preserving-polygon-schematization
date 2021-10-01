import Dcel, { STEP } from "../lib/DCEL/Dcel";
import { getJSON } from "../lib/utilities";
import { renderDcel } from "./mapOutput";
import { DCELMap } from "./selectData";
import { timeNodes, computationalTimeNode } from "./algorithm-navigator";
import { time } from "console";

export function drawMapContainer(): void {
  const containerID = "map-container";
  let container = document.getElementById(containerID);
  if (container) container.innerHTML = "";
  else {
    container = document.createElement("div");
    container.setAttribute("id", containerID);
    document.body.appendChild(container);
  }

  const map = document.createElement("div");
  map.id = "map";
  if (container) container.appendChild(map);
}

export async function draw(test: string, map: DCELMap) {
  const name = test.slice(test.lastIndexOf("/") + 1, -5);
  const dcel = map.get(test) ?? (await generateDcel(test));
  dcel.name = name;
  map.set(test, dcel);
  dcel.toConsole();
  const times = dcel.getTimestamps();
  timeNodes.forEach((s, i) => (s.innerHTML = `${times[i]}ms`));
  computationalTimeNode.innerHTML = `${dcel.getDuration()}ms`;
  renderDcel(dcel, STEP.SIMPLIFY);
}

export async function generateDcel(path: string) {
  const data = await getJSON("data/" + path);
  // TODO: validate() data (within getJSON??) check if of type polygon or multipolygon, check crs and save it for later?
  const dcel = Dcel.fromGeoJSON(data);
  dcel.schematize();
  return dcel;
}