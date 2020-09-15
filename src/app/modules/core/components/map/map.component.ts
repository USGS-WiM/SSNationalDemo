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
import area from '@turf/area';
import intersect from '@turf/intersect';
import dissolve from '@turf/dissolve';
import union from '@turf/union';
import combine from '@turf/combine';
import explode from '@turf/explode';

import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {QueryModalComponent} from '../../../../components/query/query.component';

@Component({
  selector: 'tot-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  providers:[NgbModalConfig, NgbModal]
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
  public map: L.Map;
  public selectedLayers = new L.FeatureGroup();
  public queryModalRef;

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

  constructor(mapService: MapService, toastr: ToastrService, navservice: NavigationService, private modalService: NgbModal) {
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
  }

  public onZoomChange(zoom: number) {
    this.MapService.CurrentZoomLevel = zoom;
    document.getElementById('zoomLevel').innerHTML = 'Zoom Level: ' + zoom;
    this.MapService.ToggleLayerVisibility('Big Circle');
  }

  public onMapReady(map: L.Map) {
    this.map = map;
    this.selectedLayers.addTo(map);
    L.control.scale().addTo(map);
    const zoomInfo = new (L.Control.extend({
        options: {position: 'bottomleft'}
    }));
    const self = this;
    zoomInfo.onAdd = function() {
        this._div = L.DomUtil.create('div', 'zoom-level');
        this._div.innerHTML = 'Zoom Level: ' + self.MapService.CurrentZoomLevel;
        this._div.id = 'zoomLevel';
        return this._div;
    };

    zoomInfo.addTo(this.map);
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
    this.queryModalRef = this.modalService.open(QueryModalComponent);
    this.queryModalRef.componentInstance.emitService.subscribe((result) => {
      if (result === 'query-basin') {
        this.queryBasin(event);
      } else if (result === 'query-fire') {
        this.selectFirePerims(event);
      }
    });
  }

  public queryBasin(event) {
    this.selectedLayers.clearLayers();
    const startTime = new Date().getTime();
    this.addPoint(event.latlng);
    const popup = this.marker.getPopup(); let popupContent = String(popup.getContent());
    this.messanger.clear();
    this.sm('Loading basin, please wait...', 'wait', '', 60000);
    this.NavigationService.getComid(event.latlng.lng, event.latlng.lat).subscribe(result => {
      if (result[0]) {
        const bsn = result[0];
        // update popup with returned properties
        popupContent = popupContent.replace('N/A', bsn.COMID).split('</div>')[0] +
            '<br><b>Drainage Area:</b> ' + bsn.DrainageArea + ' sq km';
        popup.setContent(popupContent);
        popup.update();

        this.NavigationService.getBasin(result[0].COMID).subscribe(collection => {
          this.MapService.addCollection(collection);
          this.messanger.clear();
          const loadTime = (new Date().getTime() - startTime) / 1000;
          this.sm('Basin load time: ' + loadTime + ' seconds', messageType.INFO, '', 10000);
          this.queryNIFC(collection.features[0].geometry, popup, area(collection) / 1000000);
          this.marker.openPopup();
        });
      } else {
        this.messanger.clear();
        this.sm('No basin returned', 'error');
        this.marker.openPopup();
      }
    });
  }

  public queryNIFC(basin, popup, basinArea) {
    let count = 0;
    const features = [];
    // 'where': 'FIRE_YEAR >= 2005 AND FIRE_YEAR <= 2020'
    let popupContent = String(popup.getContent()) + '<br><br><b>Measured area: </b>: ' + Number((basinArea).toPrecision(3)) + ' sq km';
    let intArea = 0;
    /*let startYear = prompt('Start year (e.g. 2005)');
    let endYear = prompt('End year (e.g. 2020)');
    let yearString = 'FIRE_YEAR >= ' + startYear + ' AND FIRE_YEAR <= ' + endYear;*/
    Object.keys(this._layersControl.overlays).forEach(key => {
        //&& Number(endYear) >= 2020 )
        if (key === 'Active WildFire Perimeters' || key === 'Archived WildFire Perimeters') {
            //if (key === 'Active WildFire Perimeters') {yearString = '';}
            // just add .where(yearString) before returngeometry
            this._layersControl.overlays[key].query().intersects(basin).returnGeometry(true)
                .run((error: any, results: any) => {
                  if (error) {
                      this.messanger.clear();
                      this.sm('Error occurred, check console');
                  }
                  if (results && results.features.length > 0) {
                      // TODO: Issue with overlapping polygons when in the same layer
                      // convert into multipolygon
                      let layerPolygon = combine(results).features[0];
                      console.log(layerPolygon);
                      //layerPolygon = dissolve(...layerPolygon);
                      //console.log(layerPolygon);
                      features.push(layerPolygon);
                      console.log('All perim area:' + (area(layerPolygon) / 1000000).toString());
                      const test = intersect(layerPolygon, basin);
                      console.log('Intersected area: ' + (area(test) / 1000000).toString());
                      intArea += (area(test) / 1000000);
                      console.log(intArea);
                  }
                  count ++;
                  if (count === 2) {
                    //let featUnion = features[0];
                    // features[0] and features[1] are multipolygons
                    if (features.length === 2) {
                        //featUnion = union(...features);
                        //console.log(featUnion);
                        const testInt = intersect(features[0], features[1]);
                        if (testInt && area(testInt)) {
                            console.log('Duplicated area: ' + (area(testInt)).toString());
                            intArea -= (area(testInt) / 1000000);
                        }
                    }
                    popupContent += '<br><b>NIFC Burned Area in Basin:</b> ' + Number((intArea).toPrecision(3)) + ' sq km (' + Number((intArea / basinArea * 100).toPrecision(3)) + ' %)';
                    popup.setContent(popupContent);
                    popup.update();
                    this.marker.openPopup();
                  }
              });
        }
    });
  }

  public selectFirePerims(event) {
      let count = 0;
      this.selectedLayers.clearLayers();
      this.sm('Querying layers, please wait...', 'wait', '', 60000);
      Object.keys(this._layersControl.overlays).forEach(key => {
          if (key === 'Active WildFire Perimeters' || key === 'Archived WildFire Perimeters') {
              this._layersControl.overlays[key].query().nearby(event.latlng, 4).returnGeometry(true)
                .run((error: any, results: any) => {
                    if (error) {
                        this.messanger.clear();
                        this.sm('Error occurred, check console');
                    }
                    if (results && results.features.length > 0) {
                        this.MapService.Trace(results).subscribe((data => {
                            console.log(data);
                            const layer = L.geoJSON(data);
                            this.selectedLayers.addLayer(layer);
                        }));

                        results.features.forEach(feat => {
                            let popupcontent = '<div class="popup-header"><b>' + key + ':</b></div><br>';
                            Object.keys(feat.properties).forEach(prop => {
                                let val = feat.properties[prop];
                                if (prop.toLowerCase().indexOf('date') > -1) {
                                    val = new Date(val).toLocaleDateString();
                                }
                                popupcontent += '<b>' + prop + ':</b> ' + val + '<br>';
                            });
                            popupcontent += '<br>';
                            const col = key.indexOf('Active') > -1 ? 'yellow' : 'red';
                            const layer = L.geoJSON(feat.geometry, {style: {color: col}});
                            this.selectedLayers.addLayer(layer);
                            this.addBurnPoint(layer.getBounds().getCenter(), popupcontent);
                        });
                    }
                    count ++;
                    this.checkCount(count, 3);
                });
          } else if (key === 'MTBS Fire Boundaries') {
            this._layersControl.overlays[key].identify().on(this.map).at(event.latlng).returnGeometry(true).tolerance(5)
                .run((error: any, results: any) => {
                    if (error) {
                        this.messanger.clear();
                        this.sm('Error occurred, check console');
                    }
                    if (results && results.features.length > 0) {
                        this.MapService.Trace(results).subscribe((data => {
                            console.log(data);
                            const layer = L.geoJSON(data);
                            this.selectedLayers.addLayer(layer);
                        }));
                        results.features.forEach(feat => {
                            let popupcontent = '<div class="popup-header"><b>' + key + ':</b></div><br>';
                            let date = feat.properties.STARTMONTH + '/' + feat.properties.STARTDAY + '/' +
                            feat.properties.YEAR;
                            if (date.indexOf('undefined') > -1) date = 'N/A';
                            Object.keys(feat.properties).forEach(key => {
                                let val = feat.properties[key];
                                if (key.toLowerCase().indexOf('date') > -1) {
                                    val = new Date(val).toLocaleDateString();
                                }
                                popupcontent += '<b>' + key + ':</b> ' + val + '<br>';
                            });
                            popupcontent += '<br>';
                            const layer = L.geoJSON(feat.geometry);
                            this.selectedLayers.addLayer(layer);
                            this.addBurnPoint(layer.getBounds().getCenter(), popupcontent);
                        });
                    }
                    count ++;
                    this.checkCount(count, 3);
                });
          }
      });
  }

  public checkCount(count, goal) {
    if (count === goal) {
        this.messanger.clear();
        this.map.fitBounds(this.selectedLayers.getBounds());
    }
  }

  public addBurnPoint(latlng, popupcontent) {
    this.marker = L.marker(latlng).bindPopup(popupcontent).openPopup();
    this.selectedLayers.addLayer(this.marker);
    this.marker.openPopup();
  }

  public addPoint(latlng) {
    this.MapService.removeLayer('basin');
    const content = '<div><b>Latitude:</b> ' + latlng.lat + '<br><b>Longitude:</b> ' + latlng.lng + '<br><b>Comid:</b> N/A</div>';
    this.marker = L.marker(latlng).bindPopup(content);
    this.MapService.addToMap(this.marker, 'marker');
  }
}
