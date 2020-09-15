import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'queryModal',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.css']
})
export class QueryModalComponent implements OnInit {

  public radioButtonValue = null;
  @Output() emitService = new EventEmitter();

  constructor(config: NgbModalConfig, public activeModal: NgbActiveModal){
    // customize default values of modals used by this component tree
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
  }

  onItemChange(value) {
    this.radioButtonValue = value;
    // this.emitService.next(value);
  }

  runQuery() {
    this.emitService.next(this.radioButtonValue);
    this.activeModal.close();
  }

}
