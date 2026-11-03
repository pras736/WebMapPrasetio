import "./style.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { Vector as VectorSource } from "ol/source.js";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON.js";
import { fromLonLat } from "ol/proj.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import Overlay from "ol/Overlay.js";

const pekanbaru = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "data/map.json",
  }),
  style: new Style({
    stroke: new Stroke({ color: "#3388ff", width: 1.5 }),
    fill: new Fill({ color: "rgba(51, 136, 255, 0.05)" }),
  }),
});

const sampah = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "data/Ekspor AM 1 (1)1.json",
  }),
  style: function (feature) {
    const nama = (feature.get("name") || "").trim();
    const liar = nama.includes("liar");
    return new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: liar ? "#e53935" : "#2e7d32" }),
        stroke: new Stroke({ color: "#ffffff", width: 2 }),
      }),
    });
  },
});


const container = document.getElementById("popup");
const content_element = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

const jalur = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "data/Ekspor AM 1 (1)2.json",
  }),
  style: new Style({
    stroke: new Stroke({ color: "#ff802f", width: 4 }),
  }),
});

const kabRiau = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'data/kab_riau.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'FID'],
      1,
      '#ffff33',
      13,
      '#3358ff',
    ],
  },
});

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    kabRiau,
    sampah,
  ],
  overlays: [overlay],
  view: new View({
    center: fromLonLat([101.4433, 0.533]),
    zoom: 16,
  }),
});
// B.5 Popup
const popup = new Overlay({
  element: document.getElementById('popup'),
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -15]
});
map.addOverlay(popup);

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feat) {
    return feat;
  });
  if (feature) {
    let content = '<h3>Informasi Fitur</h3>';
    content += '<p>Nama Daerah: <strong>' + feature.get('Nama_Pemetaan') +
      '</strong></p>' + '<p>Jumlah Korban: ' + feature.get('Jumlah_Korban') + '</p>';
    document.getElementById('popup-content').innerHTML = content;
    popup.setPosition(evt.coordinate);
  } else {
    popup.setPosition(undefined);
  }
});

document.getElementById('popup-closer').onclick = function () {
  popup.setPosition(undefined);
  this.blur();
  return false;
};

// B.6 Highlight polygon
const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
});

let highlight;
const highlightFeature = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });
  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }
};

const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feat) {
    return feat;
  });
  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.get('Kabupaten') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }
};

// B.7 Event pointer
map.on('pointermove', function (evt) {
  if (evt.dragging) {
    popup.setPosition(undefined);
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  highlightFeature(pixel);
  displayFeatureInfo(pixel);
});

// B.8 Checkbox visibilitas layer
const polygonLayerCheckbox = document.getElementById('polygon');
const pointLayerCheckbox = document.getElementById('point');

polygonLayerCheckbox.addEventListener('change', function () {
  kabRiau.setVisible(polygonLayerCheckbox.checked);
});

pointLayerCheckbox.addEventListener('change', function () {
  sampah.setVisible(pointLayerCheckbox.checked);
});

map.on("singleclick", function (evt) {
  const feature = map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature) {
      return feature;
    },
    {
      hitTolerance: 5,
      layerFilter: function (layer) {
        return layer === sampah;
      },
    }
  );
  if (!feature) {
    return;
  }
  const nama = (feature.get("name") || "").trim();
  const waktu = new Date(feature.get("timestamp")).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
  content_element.innerHTML =
    "<h3>" + nama + "</h3>" + "<p>Waktu: " + waktu + "</p>";
  overlay.setPosition(evt.coordinate);
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};