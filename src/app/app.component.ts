import { Component, OnInit } from '@angular/core';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap'; 
import {AboutModalComponent} from './components/about/about.component'
import { MapService } from './modules/core/services/map.services'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers:[NgbModalConfig, NgbModal]
})

export class AppComponent implements OnInit {
  public title: string;
  public show: boolean;
  

  constructor(config: NgbModalConfig, private modalService: NgbModal, private _mapService: MapService,) {
   this.title = "SS National Demo";

    config.backdrop = 'static';
    config.keyboard = false;
   }

   ngOnInit() {
     this._mapService.currentShow.subscribe(show => this.show = show)
   }

//#region "Methods"
  public open() {
    const modalRef = this.modalService.open(AboutModalComponent);
    modalRef.componentInstance.title = 'About';
  }
//#endregion
  public Activate() {
    this._mapService.changeShow(true)
    console.log(this.show)
  }

  public Deactivate() {
    this._mapService.changeShow(false)
    console.log(this.show)
  }

}
