import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet'
import * as esri from 'esri-leaflet';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import * as messageType from "../../../../shared/messageType";
import { MapService } from '../../services/map.services';
import { NavigationService } from '../../services/navigationservices.service';
import { StudyAreaService } from '../../services/studyArea.service';
import {site} from '../../models/site';
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
  private innerHeight = window.innerHeight - 20;

  public get LayersControl() {
    return this.MapService.layersControl;
  }

  public get MapOptions() {
    return this.MapService.options; // this.MapService.options;
  }

  public onMapReady(map: L.Map) {
    this.MapService.onMapReady(map);
  }

  ngOnInit() {
    this.getNavResource();
  }

  constructor(mapservice: MapService, toastr: ToastrService, public navigationService: NavigationService, public mapService: MapService) {
    super();
    this.messanger = toastr;
    this.MapService = mapservice;
  }

  public getNavResource() {
    this.navigationService
      .getNavigationResource('3')
      .toPromise()
      .then(data => {
        this.Site_reference = data['configuration'];
      });
  }

  public onZoomChange(zoom: number) {
    this.MapService.CurrentZoomLevel = zoom;
  }

  //#region "Helper methods"
  private sm(msg: string, mType: string = messageType.INFO, title?: string, timeout?: number) {
    try {
      let options: Partial<IndividualConfig> = null;
      if (timeout) {options = { timeOut: timeout }; }

      this.messanger.show(msg, title, options, mType);
    } catch (e) {}
  }
  //#endregion

  public onMouseClick(event) {
    this.mapService.addPoint(event.latlng);
    this.messanger.show('Loading, please wait', '', {disableTimeOut: true}, 'wait');
    this.navigationService.getComid(event.latlng.lng, event.latlng.lat).subscribe(result => {
        if (result[0]) {
            this.navigationService.getBasin(result[0].COMID).subscribe(collection => {
                this.mapService.addCollection(collection);
            });
        } else {
            this.messanger.clear();
            this.sm('No basin returned', 'error');
        }
    });
  }
}
