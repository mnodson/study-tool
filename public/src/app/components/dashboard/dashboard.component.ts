import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, debounce, debounceTime, distinctUntilChanged, filter, interval, map, of, scan, switchMap } from 'rxjs';
import { isNonNull } from 'src/app/shared/helpers/non-null';
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
  public userObject: Observable<{ user: User, friends: User[] | undefined }> | undefined
  public userSearchFormControl: FormControl = new FormControl();


  constructor(public authService: AuthService, public friendService: FriendsService, public remoteConfig: RemoteConfigService) { }



  ngOnInit(): void {

    this.remoteConfig.getBooleanValue('friend_list')
      .then(value => {
        this.showFriendList = value
      });

    this._userData = this.authService.userData;

    if (this._userData) {
      this.userObject = this.friendService.fetchUserAndFriends(this._userData.uid);
    }

    this.userSearchFormControl.valueChanges
      .pipe(
        filter(isNonNull),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => this.friendService.search(searchTerm))
      )
      .subscribe(results => {
        console.log('user search form control', results);
      })
  }

  public removeFriend(friendUid: string) {

    this.friendService.removeFriend(this._userData!.uid, friendUid)
      .subscribe(() => {
        this.userObject = this.friendService.fetchUserAndFriends(this._userData!.uid);
      });
  }


  public sendFriendRequest(friendUid: string) {
    this.friendService.sendFriendRequest(this._userData!.uid, friendUid)
      .then(res => {

      });
  }
}