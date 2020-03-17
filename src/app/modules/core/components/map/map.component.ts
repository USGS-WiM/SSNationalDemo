import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import * as messageType from '../../../../shared/messageType';
import { MapService } from '../../services/map.services';
import { NavigationService } from '../../services/navigationservices.service';
import { StudyAreaService } from '../../services/studyArea.service';
import { site } from '../../models/site';
import { parameter } from '../../models/parameter';
import { deepCopy } from '../../../../shared/extensions/object.DeepCopy';

@Component({
  selector: 'tot-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent extends deepCopy implements OnInit {
  private messanger: ToastrService;
  private MapService: MapService;
  private NavigationService: NavigationService;
  private StudyAreaService: StudyAreaService;
  private markers: L.Layer[] = [];
  private Site_reference: site;
  //private results = [];
  private sites_upstream = [];
  private sites_downstream = [];
  private bounds: any = null;
  private marker_sites = [];
  private nodemarker = [];
  private mapReady: boolean = false;
  private methodType: string = null;
  public innerHeight = window.innerHeight;
  public marker: L.Marker;
  public streamGridLayer: L.esri.DynamicMapLayer;
  public map: L.Map;

  private _layersControl;
  public get LayersControl() {
    return this._layersControl;
  }
  public get MapOptions() {
    return this.MapService.Options;
  }

  public get FitBounds() {
    return this.MapService.FitBounds;
  }

  private _layers = [];
  public get Layers() {
    return this._layers;
  }

  constructor(mapService: MapService, toastr: ToastrService, navservice: NavigationService) {
    super();
    this.messanger = toastr;
    this.MapService = mapService;
    this.NavigationService = navservice;
  }

  ngOnInit() {
    this.MapService.LayersControl.subscribe(data => {
      this._layersControl = {
        baseLayers: data.baseLayers.reduce((acc, ml) => {
          acc[ml.name] = ml.layer;
          return acc;
        }, {}),
        overlays: data.overlays.reduce((acc, ml) => {
          acc[ml.name] = ml.layer;
          return acc;
        }, {})
      };
    });

    this.MapService.LayersControl.subscribe(data => {
      const activelayers = data.overlays.filter((l: any) => l.visible).map((l: any) => l.layer);
      activelayers.unshift(data.baseLayers.find((l: any) => l.visible).layer);
      this._layers = activelayers;
    });

    this.MapService.StreamGridLayer.subscribe(layer => {
        this.streamGridLayer = layer;
    })
  }

  public onMapReady(map: L.Map) {
    this.map = map;
  }

  public onZoomChange(zoom: number) {
    this.MapService.CurrentZoomLevel = zoom;
    this.MapService.ToggleLayerVisibility('Big Circle');
  }

  // region "Helper methods"
  private sm(msg: string, mType: string = messageType.INFO, title?: string, timeout?: number) {
    try {
      let options: Partial<IndividualConfig> = null;
      if (timeout) {
        options = { timeOut: timeout };
      }

      this.messanger.show(msg, title, options, mType);
    } catch (e) {}
  }
  // endregion

  public onMouseClick(event) {
    const startTime = new Date().getTime();
    console.log(event.latlng);
    // add point to map
    this.addPoint(event.latlng);
    const popup = this.marker.getPopup(); let popupContent = String(popup.getContent());
    this.messanger.clear();

    // get region name
    let region = ''; const self = this;
    const config = this.MapService.config["streamGridLayers"];
    const layers = config["layers"].join(',');
    this.streamGridLayer.identify().on(this.map).at(event.latlng).returnGeometry(false).tolerance(5).layers('visible:' + layers)
        .run(function (error, featureCollection, response) {
            console.log(response)
            if (error) {
                console.log(error);
                return;
            }
            if (response.results[0].attributes['Pixel Value'] === '1') {

                const layerId = config.layers.indexOf(response.results[0].layerId);
                region = config.regions[layerId];

            }
            else {
                self.messanger.warning('Please click on a stream cell');
            }

            if (region != '') {
                self.getBasin(event.latlng, region, startTime, popupContent, popup);
            }
            
        });
  }

  getBasin(latlng, region, startTime, popupContent, popup) {

    this.sm('Loading basin, please wait...', 'wait', '', 60000);
    this.NavigationService.getBasinLocal(latlng.lng, latlng.lat, region).subscribe((result: object) => {
        console.log(result);
        if (result) {
            this.messanger.clear();
            const loadTime = (new Date().getTime() - startTime) / 1000;
            this.sm('Basin load time: ' + loadTime + ' seconds', messageType.INFO, '', 10000);
            Object.keys(result).forEach((item) => {
                this.MapService.addCollection(result[item], item, result['mergedCatchment'] != null);
            })
        } else {
            this.messanger.clear();
            this.sm('No basin returned', 'error');
            this.marker.openPopup();
        }
    })
    this.NavigationService.getComid(latlng.lng, latlng.lat).subscribe(result => {
      if (result[0]) {
        const bsn = result[0];
        // update popup with returned properties
        popupContent = popupContent.replace('N/A', bsn.COMID).split('</div>')[0] +
            '<br><b>Drainage Area:</b> ' + bsn.DrainageArea + '<br><b>Slope:</b> ' + bsn.Slope + '<br><b>Length:</b> ' +
            bsn.Length + '<br><b>Discharge:</b> ' + bsn.Discharge + '<br><b>Velocity:</b> ' + bsn.Velocity + '</div>';
        popup.setContent(popupContent);
        popup.update();
      }
    });
  }

  public addPoint(latlng) {
    this.MapService.removeLayer('basin');
    const content = '<div><b>Latitude:</b> ' + latlng.lat + '<br><b>Longitude:</b> ' + latlng.lng + '<br><b>Comid:</b> N/A</div>';
    this.marker = L.marker(latlng).bindPopup(content);
    this.MapService.addToMap(this.marker, 'marker');
  }
}
