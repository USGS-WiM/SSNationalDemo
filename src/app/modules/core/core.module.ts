import {NgModule} from '@angular/core';
import {SidebarComponent} from './components/sidebar/sidebar.component';
import {MapComponent} from './components/map/map.component';
import { GagepageComponent } from './components/gagepage/gagepage.component';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {CoreComponent} from './core.component';
import {MatExpansionModule, MatInputModule} from '@angular/material';
import { CommonModule } from '@angular/common';  
import { BrowserModule } from '@angular/platform-browser';
import { MatProgressButtonsModule } from 'mat-progress-buttons';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import {MapService} from './services/map.services';
import { NavigationService } from './services/navigationservices.service';
import { NSSService } from './services/nss.service';


@NgModule({
  declarations: [SidebarComponent, MapComponent, CoreComponent, GagepageComponent],
  imports: [LeafletModule.forRoot(), MatExpansionModule, MatInputModule, CommonModule, BrowserModule, MatProgressButtonsModule, BrowserAnimationsModule, FormsModule],
  providers: [MapService, NavigationService, NSSService],
  exports:[SidebarComponent, MapComponent, CoreComponent, GagepageComponent]
})
export class CoreModule { }
