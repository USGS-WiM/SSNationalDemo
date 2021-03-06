import { Injectable, ElementRef, EventEmitter, Injector } from '@angular/core';
import * as L from 'leaflet';
import { Map } from 'leaflet';
import * as esri from 'esri-leaflet';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
export interface layerControl {
  baseLayers: Array<any>;
  overlays: Array<any>;
}
@Injectable()
export class MapService {
  public Options: L.MapOptions;
  // for layers that will show up in the leaflet control
  public LayersControl: Subject<layerControl> = new Subject<any>();
  private _layersControl: layerControl = { baseLayers: [], overlays: [] };
  public CurrentZoomLevel;
  private messanger: ToastrService;
  public FitBounds: L.LatLngBounds;

  constructor(http: HttpClient, toastr: ToastrService) {
    this.Options = {
      zoom: 5,
      center: L.latLng(39.828, -98.5795)
    };

    this.messanger = toastr;

    http.get('assets/config.json').subscribe(data => {
      // load baselayers
      const conf: any = data;
      conf.mapLayers.baseLayers.forEach(ml => {
        ml.layer = this.loadLayer(ml);
        if (ml.layer != null) { this._layersControl.baseLayers.push(ml); }
      });
      conf.mapLayers.overlayLayers.forEach(ml => {
        ml.layer = this.loadLayer(ml);
        if (ml.layer != null) { this._layersControl.overlays.push(ml); }
      });
      this.LayersControl.next(this._layersControl);
    });

    this.CurrentZoomLevel = this.Options.zoom;
  }

  public AddLayer(point: any) {
    // this is just and example of how to add layers
    const newlayer = {
      name: 'Big Circle',
      layer: L.circle(point, { radius: 5000 }),
      visible: true
    };
    const ml = this._layersControl.overlays.find(
      (l: any) => l.name === newlayer.name
    );
    if (ml != null) {ml.layer = newlayer.layer;
    } else {this._layersControl.overlays.push(newlayer); }

    // Notify subscribers
    this.LayersControl.next(this._layersControl);
  }

  public ToggleLayerVisibility(layername: string) {
    const ml = this._layersControl.overlays.find(
      (l: any) => l.name === layername
    );
    if (!ml) { return; }

    if (ml.visible) { ml.visible = false;
    } else { ml.visible = true; }
    console.log('visibility toggled');
    this.LayersControl.next(this._layersControl);
  }

  private loadLayer(ml): L.Layer {
    try {
      let options;
      switch (ml.type) {
        case 'agsbase':
          return esri.basemapLayer(ml.layer);

        case 'tile':
          // https://leafletjs.com/reference-1.5.0.html#tilelayer
          return L.tileLayer(ml.url, ml.layerOptions);

        case 'agsDynamic':
          // https://esri.github.io/esri-leaflet/api-reference/layers/dynamic-map-layer.html
          options = ml.layerOptions;
          options.url = ml.url;
          return esri.dynamicMapLayer(options);
        case 'agsTile':
          options = ml.layerOptions;
          options.url = ml.url;
          return esri.tiledMapLayer(options);
        default:
          console.warn(
            'No condition exists for maplayers of type ',
            ml.type,
            'see config maplayer for: ' + ml.name
          );
      } // end switch
    } catch (error) {
      console.error(ml.name + ' failed to load mapllayer', error);
      return null;
    }
  }

  public addToMap(lay, layerName: any) {
    const newlayer = {
      name: layerName,
      layer: lay,
      visible: true
    };
    const ml = this._layersControl.overlays.find((l: any) => l.name === newlayer.name);
    if (ml != null) {
      ml.layer = newlayer.layer;
    } else {
      this._layersControl.overlays.push(newlayer);
    }

    // Notify subscribers
    this.LayersControl.next(this._layersControl);
  }

  public removeLayer(layerName: any) {
    const idx = this._layersControl.overlays.findIndex((l: any) => l.name === layerName);
    if (idx > -1) {
      this._layersControl.overlays.splice(idx, 1);
    }
  }

  public addCollection(obj) {
    const layer = L.geoJSON(obj);
    this.addToMap(layer, 'basin');

    this.FitBounds = layer.getBounds();
  }
}
