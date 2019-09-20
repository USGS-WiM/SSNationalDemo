import { Injectable, ElementRef, EventEmitter, Injector } from '@angular/core';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';
import { HttpClient } from '@angular/common/http';
export interface layerControl{
  baseLayers:any;
  overlays:any
}
@Injectable()
export class MapService {

  // for layers that will show up in the leaflet control
  //public layersControl: layerControl = { baseLayers: {}, overlays: {} };
    //any; //
  public CurrentZoomLevel;
  public myurl;
  public layers;
  public options: L.MapOptions;
  public layersControl: layerControl = { baseLayers: {}, overlays: {} };
  public map: L.Map; //reference to the object
  
  constructor(public http: HttpClient) {
    this.options = {
      layers: [],
      zoom: 5,
      center: L.latLng(39.828, -98.5795)
    };
  }

  public onMapReady(map) {
    this.map = map;
    this.http.get("../../../.././assets/config.json").subscribe(data => {
      var conf: any = data;      //load baselayers

      conf.mapLayers.baseLayers.forEach(ml => {
        this.layersControl.baseLayers[ml.name] = this.loadLayer(ml, map);
      });

      conf.mapLayers.overlays.forEach(ml => {
        this.layersControl.overlays[ml.name] = this.loadLayer(ml, map);
      });

      this.CurrentZoomLevel = 8;
    });
  }
  
  private loadLayer(ml, map):L.Layer{
    var layer:L.Layer = null;
    switch (ml.type) {
      case 'agsbase':
          if (ml.visible) {
            layer = esri.basemapLayer(ml.layer);
            layer.addTo(map);
          }
      case 'tile':
        layer = L.tileLayer(ml.url, ml.layerOptions);
      case 'overlay':
        layer = L.tileLayer(ml.url, ml.layerOptions);
        if (ml.visible) {
            layer.addTo(map);
        }
      case 'agsDynamic':
        layer = esri.dynamicMapLayer({
            url: ml.url,
            zIndex: 1,
            format: "png8",
            layers: [6],
            f: "image"
        })
        if (ml.visible) {
            layer.addTo(map);
        }
    }//end switch
    if (ml.visible && layer != null) {
      this.options.layers.splice(0, 1);
      this.options.layers.push(layer);
    }
    return layer;
  }

  public interactwOverlayer(LayerName: string) {

    if (this.map.hasLayer(this.layersControl.overlays[LayerName])) {
      this.map.removeLayer(this.layersControl.overlays[LayerName]);
    }
    else {
      this.map.addLayer(this.layersControl.overlays[LayerName]);
    }
  }

  public interactwBaselayer(LayerName: string) {

    if (this.map.hasLayer(this.layersControl.baseLayers[LayerName])) {
      this.map.removeLayer(this.layersControl.baseLayers[LayerName]);
    }
    else {
      this.map.addLayer(this.layersControl.baseLayers[LayerName]);
    }
  }

  public changeCursor(cursorType) {
    //L.DomUtil.addClass(._container,'crosshair-cursor-enabled');
  }

  public addCollection(obj) {
      // TODO: check if basin returned (will do after jeremy edits services)
      if (this.map.hasLayer(this.layersControl.overlays['basin'])) {
        this.map.removeLayer(this.layersControl.overlays['basin']);
      }
      
      const layer = L.geoJSON(obj);
      this.layersControl.overlays['basin'] = layer;
      this.map.addLayer(this.layersControl.overlays['basin']);

      this.map.fitBounds(layer.getBounds());
  }
}
