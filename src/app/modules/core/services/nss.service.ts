import { throwError as observableThrowError, Observable, Subject, BehaviorSubject } from 'rxjs';
import { map } from "rxjs/operators";
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Station } from '../../../shared/interfaces/station';
import { GagePage } from '../../../shared/interfaces/gagepage';

@Injectable()
export class NSSService { 
    public authHeader: HttpHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('auth') || ''
    });

    constructor(private _http: HttpClient) {

    }

    // -+-+-+-+-+-+-+-+-+ show gagepage -+-+-+-+-+-+-+-+
    private _showHideGagePageModal: Subject<GagePage> = new Subject<GagePage>();
    public setGagePageModal(val: GagePage) {
        this._showHideGagePageModal.next(val);
    }

    // show gagepage modal in the mainview
    public get showtheGagePageModal(): any {
        return this._showHideGagePageModal.asObservable();
    }

    // get gage page info
    public getGagePageInfo(code) {
        return this._http
        .get('https://test.streamstats.usgs.gov/gagestatsservices/stations/' + code)
        .pipe(map(res => res as Station));
    }

    public getEntities(url: string) {
        return this._http
            .get("https://test.streamstats.usgs.gov/nssservices/" + url, { headers: this.authHeader })
            .pipe(map(res => { if (res) {return <Array<any>>res }}))
            //.catch(this.errorHandler);
    }

    // public showGagePageModal(id) {
    //     const gagePageForm: GagePage = {
    //       show: true,
    //       gageCode: id
    //     }
    //     this.setGagePageModal(gagePageForm);
    //   };

    // public errorHandler(error: Response | any) {
    //     //if (error._body !== '') {error._body = JSON.parse(error._body); }
    //     return Observable.throwError(error);
    // }
}
