import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import * as messageType from '../../../shared/messageType'

@Injectable()
export class NavigationService {
public get baseURL() {return "https://test.streamstats.usgs.gov/NavigationServices";}
private messanger:ToastrService;
  constructor(private http: HttpClient,toastr: ToastrService) {
    this.messanger = toastr;
   }

  public getAvailableNavigationResources(): Observable <any>{
    let url = this.baseURL+"/navigation";
    return this.http.get<any>(url)
        .pipe(catchError(this.handleError('getAvailableNavigationResources',[])));
  }
  public getNavigationResource(identifier:string): Observable <any>{
    let url = this.baseURL+"/navigation/"+identifier;
    return this.http.get<any>(url)
        .pipe(catchError(this.handleError('getNavigationResource',[])));
  }
  
  public getRoute(identifier:string, configuredResource, includeproperties:boolean = true): Observable <any>{
    let url = this.baseURL+"/NavigationServices/navigation/"+identifier+"/route?properties="+includeproperties;
    return this.http.post<any>(url, configuredResource)
        .pipe(catchError(this.handleError('getRoute',[])));
  }

  private handleError<T>(operation ='operation', result?:T){
    return (error:any):Observable<T> => {
      console.error(error);
      this.sm("Please try again.", messageType.ERROR, "Http Error Occured!",0);
      return of(result as T)
    }
  }
  private sm(msg: string, mType:string = messageType.INFO,title?:string,timeout?:number) {
    try {
      let options:Partial<IndividualConfig> = null;
      if(timeout) options ={timeOut:timeout};

      this.messanger.show(msg,title,options, mType)
    }
    catch (e) {
    }
  }


  public getComid(long, lat): Observable<any> {
      /* console.log('long: ' + long);
      console.log('lat: ' + lat);
      const crs = 'EPSG:4326';

      const wfsUrl = '/nwc/geoserver/nhdplus/ows?service=wfs&version=1.0.0&request=GetFeature&typeName=nhdplus:catchmentsp&srsName=' + crs +
        '&outputFormat=json&filter=<Filter xmlns=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\"><Contains><PropertyName>' +
        'the_geom</PropertyName><gml:Point srsName=\"' + crs + '\"><gml:coordinates>' + long + ',' + lat + '</gml:coordinates></gml:Point></Contains></Filter>';
      const baseUrl = 'https://cida.usgs.gov';
      console.log(baseUrl + wfsUrl);
      return this.http.get<any>(baseUrl + wfsUrl)
        .pipe(catchError(this.handleError('getNavigationResource', []))); */

        // const config = [{"id":1,"name":"Start point location","required": true,"description":"Specified lat/long/crs  navigation start location","valueType":"geojson point geometry","value":{"type":"Point","coordinates":[-94.99785661697388,46.01194069320304],"crs":{"properties":{"name":"EPSG:4326"},"type":"name"}}},{"id":6,"name":"Query Source","required":true,"description":"Specified data source to query","valueType":"option","value":["flowline"]},{"id":5,"name":"Direction","required":true,"description":"Network operation direction","valueType":"exclusiveOption","value":"upstream"}];
        const url = 'https://test.streamstats.usgs.gov/NavigationServices/attributes?x=' + long + '&y=' + lat;
        return this.http.get(url)
            .pipe(catchError(this.handleError('getNavigationResource', [])));
  }

  public getBasin(comID): Observable<any> {
      const url = 'https://cida.usgs.gov/nldi/comid/' + comID + '/basin';
      return this.http.get(url)
            .pipe(catchError(this.handleError('getNavigationResource', [])));

  }
}
