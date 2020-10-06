import { Injectable, OnInit, ElementRef, EventEmitter, Injector } from '@angular/core';
import * as L from 'leaflet';
import { Map } from 'leaflet';
import * as esri from 'esri-leaflet';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
//import { MapComponent } from '../components/map/map.component';
import { GagePage } from '../../../shared/interfaces/gagepage';
import { Station } from '../../../shared/interfaces/station';
import { NSSService } from '../services/nss.service';
import { map } from "rxjs/operators";
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
  private showSource = new BehaviorSubject(false);
  currentShow = this.showSource.asObservable();
  public displayGagePage;

  constructor(private http: HttpClient, toastr: ToastrService, nssService: NSSService) {
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

  changeShow(show: boolean) {
    this.showSource.next(show)
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
    };
    
  }



  // // -+-+-+-+-+-+-+-+-+ show gagepage -+-+-+-+-+-+-+-+
  //   private _showHideGagePageModal: Subject<GagePage> = new Subject<GagePage>();
  //   public setGagePageModal(val: GagePage) {
  //       this._showHideGagePageModal.next(val);
  //   }
  //   // show gagepage modal in the mainview
  //   // public get showGagePageModal(): any {
  //   //     return this._showHideGagePageModal.asObservable();
  //   // }

  //   // get gage page info
  //   public getGagePageInfo(code) {
  //       return this.http
  //       .get('https://test.streamstats.usgs.gov/gagestatsservices/stations/' + code)
  //       .pipe(map(res => <Station>res));
  //   }

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


