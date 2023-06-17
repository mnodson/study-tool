import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule, SETTINGS } from '@angular/fire/compat/auth';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFireRemoteConfig, AngularFireRemoteConfigModule, DEFAULTS, filterFresh, scanToObject } from '@angular/fire/compat/remote-config';

import { environment } from '../environments/environment';
import { AuthService } from './shared/services/auth.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './shared/guard/auth.guard';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { BannerComponent } from './components/banner/banner.component';
import { first } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', redirectTo: '/sign-in', pathMatch: 'full' },
  { path: 'sign-in', component: SignInComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

];

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    DashboardComponent,
    BannerComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    RouterModule.forRoot(routes),
    AppRoutingModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    AngularFireRemoteConfigModule
  ],
  providers: [
    AuthService,
    { provide: DEFAULTS, useValue: { friend_list: true, maintenance_message: 'test' } },
    { provide: SETTINGS, useFactory: () => { minimumFetchIntervalMillis: 0 } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
