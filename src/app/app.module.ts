import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AboutModalComponent } from './components/about/about.component';
import { NavbarComponent} from './components/navbar/navbar.component';
import {NgbTabsetModule, NgbModule, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ToastrModule, ToastNoAnimation, ToastNoAnimationModule} from 'ngx-toastr';
import { CoreModule } from './modules/core/core.module';
import { HttpClientModule } from '@angular/common/http';
import { NavigationService } from './modules/core/services/navigationservices.service';
import { ErrorDialogComponent } from './shared/components/error-dialog/error-dialog.component';
import { QueryModalComponent } from './components/query/query.component';
import { FormsModule } from '@angular/forms';
import { GagepageComponent } from './modules/core/components/gagepage/gagepage.component';
import { ModalModule } from 'ngx-bootstrap/modal';

@NgModule({
  declarations: [
    AppComponent,
    AboutModalComponent,
    NavbarComponent,
    ErrorDialogComponent,
    QueryModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CoreModule,
    NgbTabsetModule,
    ToastNoAnimationModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-bottom-right',
      progressAnimation: 'decreasing',
      preventDuplicates: true,
      countDuplicates: true
    }),
    NgbModule,
    FormsModule,
    ModalModule.forRoot()
  ],
  providers: [NgbActiveModal, NavigationService],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent, AboutModalComponent, QueryModalComponent, GagepageComponent]
})
export class AppModule {}
