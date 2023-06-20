import { Component, OnInit } from '@angular/core';
import { AngularFireRemoteConfig } from '@angular/fire/compat/remote-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private remoteConfig: AngularFireRemoteConfig) {

  }

async ngOnInit(): Promise<void> {

  const isFetched = await this.remoteConfig.fetchAndActivate();

  if(isFetched) {
    const fl = this.remoteConfig.getBoolean('friendList');
  } else {
    this.remoteConfig.strings.subscribe(x => x)
  }
}

}
