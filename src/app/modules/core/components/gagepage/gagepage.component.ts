import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NSSService } from '../../services/nss.service';
import { MapService } from '../../services/map.services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GagePage } from '../../../../shared/interfaces/gagepage';
import { Station } from '../../../../shared/interfaces/station';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'gagePageModal',
  templateUrl: './gagepage.component.html',
  styleUrls: ['./gagepage.component.css']
})
export class GagepageComponent implements OnInit, OnDestroy {
  @ViewChild('gagePage', { static: false }) gagePageModal: GagepageComponent;
  bsModalRef: BsModalRef;

  private modalSubscript;
  private modalElement: any;
  public modalRef;
  public code;
  public gage: Station;
  public statisticGroups;

  constructor(
    private _nssService: NSSService,
    private modalService: BsModalService
  ) { }

  ngOnInit() {
    this.modalSubscript = this._nssService.showtheGagePageModal.subscribe((result) => {
      console.log(result);
      if (result.show) {
        this.code = result.gageCode;
        this._nssService.getGagePageInfo(this.code).subscribe((res: Station) => {
          this.gage = res;
          // this.getCitations();
          this.modalElement = this.gagePageModal;
          this.showGagePageForm();
        });
      }
    });

  }  // end OnInit

  public showGagePageForm() {
    // this.modalRef = this._modalService.open(this.modalElement, { backdrop: 'static', size: 'lg' });
    this.bsModalRef = this.modalService.show(this.gagePageModal);
    console.log('pass');
  }

  getStatGroup(id) {
    return this.statisticGroups.find(sg => sg.id === id).name;
  }

  ngOnDestroy() {
    this.modalSubscript.unsubscribe();
  }

  // public getCitations(){
  //   this.gage.citations = [];
  //   this.gage.characteristics.forEach((c: any) => {
  //     if (c.citationID && !this.gage.citations.some((cit: any) => cit.id === c.citationID)) {
  //       this.gage.citations.push(c.citation);
  //     }
  //   });

  //   this.gage.statistics.forEach((s: any) => {
  //     if (s.citationID && !this.gage.citations.some((cit: any) => cit.id === s.citationID)) {
  //       this.gage.citations.push(s.citation);
  //     }
  //   });
  // }



}
