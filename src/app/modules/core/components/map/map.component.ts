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
  selector: "tot-map",
  templateUrl: "./map.component.html",
  styleUrls: ['./map.component.css'],
})

export class MapComponent extends deepCopy implements OnInit {

	private messager: ToastrService;
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


	public get LayersControl(){
    return this.MapService.layersControl;
  }

  public get MapOptions() {
    return this.MapService.options;//this.MapService.options;
  }

  public onMapReady(map: L.Map) {
    this.MapService.onMapReady(map);
  }

  ngOnInit() {

    this.getNavResource();

  }

    constructor(mapservice:MapService, toastr: ToastrService, public navigationService: NavigationService, public mapService: MapService) {
		super();
		this.messager = toastr;		  
        this.MapService = mapservice;
     }
     
    public getNavResource() {
        this.navigationService.getNavigationResource("3")
        .toPromise().then(data => {
          this.Site_reference = data['configuration'];
        });
    }

	public onZoomChange(zoom: number) {	
		this.MapService.CurrentZoomLevel=zoom;
		// this.sm("Zoom changed to "+ zoom);
	}

	public addMarker(e) {
		if (this.MapService.CurrentZoomLevel > 9 && this.mapReady === true) {
			let mySpill = new site([this.Site_reference]);
			if (this.markers.length > 0) {
				while (this.markers.length != 0) {
					this.markers.splice(0, 1)
				}
			}
		} else { }
	}

	public MarkerClick(e, lat, lng, cond, option, len) {
		e[0]['value']['coordinates'] = [lng, lat]; // add lat long
		e[1]['value'] = cond;
		e[3]['value'] = option;
		//for upstream only
		if (e[2].value instanceof Array) { //if array, set limit of 100, copy parameters into a tuple, else do nothing since it should be already set
		  e[2].value[0].value = len;
		  e[2].value.splice(1, 1);
		  let myvar = new parameter(e[2].value[0]);
		  e[2].value = myvar;
		}
	}
	//#region "Helper methods"
	private sm(msg: string, mType:string = messageType.INFO,title?:string,timeout?:number) {
		try {
		  let options:Partial<IndividualConfig> = null;
		  if(timeout) options ={timeOut:timeout};
	
		  this.messager.show(msg,title,options, mType)
		}
		catch (e) {
		}
	  }
      //#endregion

      private onMouseClick(event) {
          this.navigationService.getComid(event.latlng.lng, event.latlng.lat)
            .subscribe(result => {
                this.navigationService.getBasin(result[0].COMID)
                    .subscribe(result => {
                        console.log(result);
                        this.mapService.addCollection(result);
                    })

                // this.mapService.addCollection(result);
            });
      }
}
