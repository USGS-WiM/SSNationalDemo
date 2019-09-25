import { Injectable, ElementRef, EventEmitter, Injector } from '@angular/core';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';
import { HttpClient } from '@angular/common/http';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
export interface layerControl{
  baseLayers:any;
  overlays:any
}
@Injectable()
export class MapService {

  // for layers that will show up in the leaflet control
  // public layersControl: layerControl = { baseLayers: {}, overlays: {} };
    // any; //
  public CurrentZoomLevel;
  public myurl;
  public layers;
  public options: L.MapOptions;
  public layersControl: layerControl = { baseLayers: {}, overlays: {} };
  public map: L.Map; // reference to the object
  public markerGroup: L.FeatureGroup<any>;
  private messanger: ToastrService;

  constructor(public http: HttpClient, toastr: ToastrService) {
    this.options = {
      layers: [],
      zoom: 5,
      center: L.latLng(39.828, -98.5795)
    };

    this.messanger = toastr;
  }

  public onMapReady(map) {
    this.map = map;
    this.http.get('assets/config.json').subscribe(data => {
      const conf: any = data;      // load baselayers

      conf.mapLayers.baseLayers.forEach(ml => {
        if (ml.visible) {
            if (ml.type === 'agsbase') { //esri layers special case
                this.layersControl.baseLayers[ml.name] = esri.basemapLayer(ml.layer);
            } else {
              this.layersControl.baseLayers[ml.name] = this.loadBaselayer(ml);
            }
          }
      });

      conf.mapLayers.overlays.forEach(ml => {
        if (ml.visible) {
            if (ml.type === "agsDynamic") {//esri layers special case
              ml.layerOptions['url'] = ml.url;
              this.layersControl.overlays[ml.name] = esri.dynamicMapLayer(ml.layerOptions)
            } else {
                this.layersControl.overlays[ml.name] = this.loadOverlaylayer(ml);
            }
        }
      });

      this.CurrentZoomLevel = 8;
    });
    this.markerGroup = new L.FeatureGroup([]).addTo(this.map);
  }

  private loadBaselayer(ml): L.Layer { // baselayers method
    let layer: L.Layer = null;
    switch (ml.type) {
      case 'agsbase':
        layer = esri.basemapLayer(ml.layer); // ml.layer = NationalGeographic
        break;
      case 'tile':
        layer = L.tileLayer(ml.url, ml.layerOptions);
    }// end switch
    if (this.options.layers.length > 0) { } else {
      layer.addTo(this.map);
    }
    return layer;
  }

  private loadOverlaylayer(ml): L.Layer { // overlays method
    let layer: L.Layer = null;
    switch (ml.type) {
      case 'overlay':
        layer = L.tileLayer(ml.url, ml.layerOptions); // ml.layerOptions
    } // end switch
    return layer;
  }

  public interactwOverlayer(LayerName: string) {

    if (this.map.hasLayer(this.layersControl.overlays[LayerName])) {
      this.map.removeLayer(this.layersControl.overlays[LayerName]);
    } else {
      this.map.addLayer(this.layersControl.overlays[LayerName]);
    }
  }

  public interactwBaselayer(LayerName: string) {

    if (this.map.hasLayer(this.layersControl.baseLayers[LayerName])) {
      this.map.removeLayer(this.layersControl.baseLayers[LayerName]);
    } else {
      this.map.addLayer(this.layersControl.baseLayers[LayerName]);
    }
  }

  public changeCursor(cursorType) {
    // L.DomUtil.addClass(._container,'crosshair-cursor-enabled');
  }

  public addPoint(latlng) {
    if (this.map.hasLayer(this.layersControl.overlays['basin'])) {
        this.map.removeLayer(this.layersControl.overlays['basin']);
    }
    if (this.markerGroup) {this.markerGroup.clearLayers(); }
    L.marker(latlng).addTo(this.markerGroup);
  }

  public addCollection(obj) {
    const layer = L.geoJSON(obj);
    this.layersControl.overlays['basin'] = layer;
    this.map.addLayer(this.layersControl.overlays['basin']);

    this.map.fitBounds(layer.getBounds());
    if (this.messanger) {this.messanger.clear(); }
  }
}
