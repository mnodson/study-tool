import { Injectable } from '@angular/core';
import { AngularFireRemoteConfig } from '@angular/fire/compat/remote-config';
@Injectable({
  providedIn: 'root'
})
export class RemoteConfigService {
  constructor(private remoteConfig: AngularFireRemoteConfig) { }

  public async getBooleanValue(key: string): Promise<boolean> {
    
    this.remoteConfig.getAll().then((all) => console.log('ALL', all));
    
    return this.remoteConfig.getBoolean(key).then((value) => {
      console.log(key, value);
      return value;
    }).catch((err) => {
      return err;
    });
  }
}