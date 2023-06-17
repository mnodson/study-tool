import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FriendsService } from 'src/app/shared/services/friends.service';
import { RemoteConfigService } from 'src/app/shared/services/remote-config.service';
import { User } from 'src/app/shared/services/user';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private _userData: User | null | undefined;

  public showFriendList: boolean | undefined;
  public isSearching: boolean = false;

  constructor(public authService: AuthService, public friendService: FriendsService, public remoteConfig: RemoteConfigService) {}

  public userObject: Observable<{user: User, friends: User[] | undefined}> | undefined

  ngOnInit(): void {

    this.remoteConfig.getBooleanValue('friend_list')
      .then(value => {
        console.log('value', value);
        this.showFriendList = value
      });

    this._userData = this.authService.userData;

    if (this._userData) {
      this.userObject = this.friendService.fetchUserAndFriends(this._userData.uid);
    }
  }

  public removeFriend(friendUid: string) {
    console.log(friendUid);

    this.friendService.removeFriend(this._userData!.uid, friendUid)
      .subscribe(res => {
        console.log('response from service', res);
        this.userObject = this.friendService.fetchUserAndFriends(this._userData!.uid);
      });
  }


  public sendFriendRequest(friendUid: string) {
    this.friendService.sendFriendRequest(this._userData!.uid, friendUid)
      .then(res => {
        
      });
  }
}