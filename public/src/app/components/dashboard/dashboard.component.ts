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
  public showFriendList: boolean | undefined;

  constructor(public authService: AuthService, public friendService: FriendsService, public remoteConfig: RemoteConfigService) {}

  public userObject: Observable<{user: User, friends: User[] | undefined}> | undefined

  ngOnInit(): void {

    this.remoteConfig.getBooleanValue('friend_list')
      .then(value => {
        console.log('value', value);
        this.showFriendList = value
      });

    const userData = this.authService.userData;

    if (userData) {
      this.userObject = this.friendService.fetchFriends(userData.uid);
    }
  }
}