import { Injectable, ElementRef, EventEmitter, Injector } from '@angular/core';
import * as L from 'leaflet';
import { Map } from 'leaflet';
import * as esri from 'esri-leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/images/marker-icon-2x.png";

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
  private conf;

  constructor(private http: HttpClient, toastr: ToastrService) {
    this.Options = {
      zoom: 5,
      center: L.latLng(39.828, -98.5795)
    };

    this.messanger = toastr;

    http.get('assets/config.json').subscribe(data => {
      // load baselayers
      this.conf = data;
      this.conf.mapLayers.baseLayers.forEach(ml => {
        ml.layer = this.loadLayer(ml);
        if (ml.layer != null) { this._layersControl.baseLayers.push(ml); }
      });
      this.conf.mapLayers.overlayLayers.forEach(ml => {
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
    if (ml != null) {
      ml.layer = newlayer.layer;
    } else { this._layersControl.overlays.push(newlayer); }

    // Notify subscribers
    this.LayersControl.next(this._layersControl);
  }

  public Trace(geojson: any) {
    console.log("Input GeoJSON: " + geojson);
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
    return this.http.post<any>('http://firehydrology.streamstats.usgs.gov:8000/trace', geojson, httpOptions);
  }

  public ToggleLayerVisibility(layername: string) {
    const ml = this._layersControl.overlays.find(
      (l: any) => l.name === layername
    );
    if (!ml) { return; }

    if (ml.visible) {
      ml.visible = false;
    } else { ml.visible = true; }
    console.log('visibility toggled');
    this.LayersControl.next(this._layersControl);
  }

  public isLayerVisible(layername: string) {
    const ml = this._layersControl.overlays.find(
      (l: any) => l.name === layername
    );
    if (!ml) {
      return;
    } else {
      return ml.visible;
    }
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
          const dynamicLayer = esri.dynamicMapLayer(options);
          if (ml.name === 'StreamStats Gages') {
            dynamicLayer.bindPopup((error, featureCollection) => {
              if (error || featureCollection.features.length === 0) {
                return false;
              } else {
                const featureData = featureCollection.features[0].properties;
                const popupContent = '<h4>NWIS Streamgages<h4><ul>' +
                '<li>Station ID: ' + featureData.STA_ID + '</li>' +
                '<li>Station Name: ' + featureData.STA_NAME + '</li>' +
                '<li><a href="' + featureData.FeatureURL + '">NWIS Site Page</a> </li>' +
                 '</ul>';
                return popupContent;
              }
            });
          }
          return dynamicLayer;
        case 'agsTile':
          options = ml.layerOptions;
          options.url = ml.url;
          return esri.tiledMapLayer(options);
        case 'agsFeature':
          options = ml.layerOptions;
          options.url = ml.url;
          const featLayer = esri.featureLayer(options);
          if (this.conf.symbols[ml.name]) { featLayer.setStyle(this.conf.symbols[ml.name]); }
          return featLayer;
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
    this.addToMap(layer, 'Basin');

    this.FitBounds = layer.getBounds();
  }
  public addItem(obj, name) {
    const layer = L.geoJSON(obj);
    this.addToMap(layer, name);
  }
}
