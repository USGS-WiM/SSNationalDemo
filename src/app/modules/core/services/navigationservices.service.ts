import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService, IndividualConfig } from 'ngx-toastr';
import * as messageType from '../../../shared/messageType';

@Injectable()
export class NavigationService {
  public get baseURL() {
    return 'https://test.streamstats.usgs.gov/NavigationServices';
  }
  private messanger: ToastrService;
  constructor(private http: HttpClient, toastr: ToastrService) {
    this.messanger = toastr;
  }

  public getAvailableNavigationResources(): Observable<any> {
    const url = this.baseURL + '/navigation';
    return this.http
      .get<any>(url)
      .pipe(
        catchError(this.handleError('getAvailableNavigationResources', []))
      );
  }
  public getNavigationResource(identifier: string): Observable<any> {
    const url = this.baseURL + '/navigation/' + identifier;
    return this.http
      .get<any>(url)
      .pipe(catchError(this.handleError('getNavigationResource', [])));
  }

  public getRoute(
    identifier: string,
    configuredResource,
    includeproperties: boolean = true
  ): Observable<any> {
    const url = this.baseURL + '/NavigationServices/navigation/' + identifier + '/route?properties=' + includeproperties;
    return this.http
      .post<any>(url, configuredResource)
      .pipe(catchError(this.handleError('getRoute', [])));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    const self = this;
    return (error: any): Observable<T> => {
      this.messanger.clear();
      console.error(error);
      this.sm('Please try again.', messageType.ERROR, 'Http Error Occured!', 0);
      return of(result as T);
    };
  }
  private sm(
    msg: string,
    mType: string = messageType.INFO,
    title?: string,
    timeout?: number
  ) {
    try {
      let options: Partial<IndividualConfig> = null;
      if (timeout) { options = { timeOut: timeout }; }

      this.messanger.show(msg, title, options, mType);
    } catch (e) {}
  }

  public getComid(long, lat): Observable<any> {
    const url = 'https://test.streamstats.usgs.gov/NavigationServices/attributes?x=' + long + '&y=' + lat;
    return this.http
      .get(url)
      .pipe(catchError(this.handleError('getNavigationResource', [])));
  }

  public getBasin(comID): Observable<any> {
    const url = 'https://cida.usgs.gov/nldi/comid/' + comID + '/basin';
    return this.http
      .get(url)
      .pipe(catchError(this.handleError('getNavigationResource', [])));
  }

  public getBasinLocal(long, lat, region) {
      const url = 'http://127.0.0.1:5000/delineate?region=' + region + '&lng=' + long + '&lat=' + lat;
      return this.http
        .get(url)
        .pipe(catchError(this.handleError('getNavigationResource', [])));
  }
}
