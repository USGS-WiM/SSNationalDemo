import { throwError as observableThrowError, Observable, Subject, BehaviorSubject } from 'rxjs';
import { map } from "rxjs/operators";
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Station } from '../../../shared/interfaces/station';
import { GagePage } from '../../../shared/interfaces/gagepage';

@Injectable()
export class NSSService { 
    constructor(private _http: HttpClient) {

    }

    // -+-+-+-+-+-+-+-+-+ show gagepage -+-+-+-+-+-+-+-+
    private _showHideGagePageModal: Subject<GagePage> = new Subject<GagePage>();
    public setGagePageModal(val: GagePage) {
        this._showHideGagePageModal.next(val);
    }
    // show gagepage modal in the mainview
    public get showGagePageModal(): any {
        return this._showHideGagePageModal.asObservable();
    }

    // get gage page info
    public getGagePageInfo(code) {
        return this._http
        .get('https://test.streamstats.usgs.gov/gagestatsservices/stations/' + code)
        .pipe(map(res => <Station>res));
    }
}
