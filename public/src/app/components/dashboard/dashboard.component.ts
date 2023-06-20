import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, catchError, debounce, debounceTime, distinctUntilChanged, filter, first, firstValueFrom, forkJoin, interval, map, of, scan, skip, switchMap, take, tap } from 'rxjs';
import { isNonNull } from 'src/app/shared/helpers/non-null';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserMetaWithStatus } from 'src/app/shared/services/friendRequest';
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
  public searchResults: {
    users: User[],
    notFound: boolean
  } = { users: [], notFound: false };
  public friendRequests: any;
  public ownRequests: any;
  public friendHeading: 'My Friends' | 'My Requests' | 'Notifications' | 'Search Results' = 'My Friends';
  public get showNotifications(): boolean {
    return this.friendHeading === 'Notifications';
  }
  public get showMyFriendRequests(): boolean {
    return this.friendHeading === 'My Requests';
  }
  public get showFriends(): boolean {
    return this.friendHeading === 'My Friends';
  }

  constructor(public authService: AuthService, public friendService: FriendsService, public remoteConfig: RemoteConfigService) {
  }

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
        skip(1),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => this.friendService.search(searchTerm)),
      )
      .subscribe(users => {
        this.searchResults = {
          users,
          notFound: users.length == 0
        };
      });

    this.fetchRequestedFriends();
  }

  private fetchRequestedFriends() {
    return firstValueFrom(this.friendService.getRequestedFriends(this._userData!.uid)
      .pipe(
        tap(requests => {
          this.friendRequests = requests.otherRequests
          this.ownRequests = requests.myRequests
        }),
        first()));
  }

  public showSearch(): void {
    this.isSearching = true;
    this.friendHeading = 'Search Results';
  }

  public hideSearch(): void {
    this.isSearching = false;
    this.displayFriends();
    this.userSearchFormControl.setValue('');
  }

  public displayFriends(): void {
    this.friendHeading = 'My Friends';
  }

  public displayNotifications(): void {
    this.friendHeading = 'Notifications'
  }

  public displayFriendRequests(): void {
    this.friendHeading = 'My Requests'
  }

  public removeFriend(friendUid: string) {
    this.friendService.removeFriend(this._userData!.uid, friendUid)
      .subscribe(() => {
        this.userObject = this.friendService.fetchUserAndFriends(this._userData!.uid);
      });
  }

  public requestFriend(user: User) {
    this.friendService.sendFriendRequest(this._userData!, user)
      .then(() => {
        this.isSearching = false;
        this.userSearchFormControl.reset();
        this.fetchRequestedFriends()
          .then(() => {
            this.friendHeading = 'My Requests';
          });
      });
  }

  public reject(request: { userId: string; meta: UserMetaWithStatus; }) {
    this.friendService.rejectFriendRequest(this._userData!, request)
      .subscribe(() => {
        this.fetchRequestedFriends()
          .then(() => {
            this.friendHeading = 'My Friends';
          });
      })
  }

  public cancel(request: { userId: string; meta: UserMetaWithStatus; }) {
    this.friendService.cancelFriendRequest(this._userData!, request)
      .subscribe(() => {
        this.fetchRequestedFriends()
          .then(() => {
            this.friendHeading = 'My Friends';
          });
      })
  }
  public accept(request: { userId: string; meta: UserMetaWithStatus; }) {
    this.friendService.acceptFriendRequest(this._userData!, request)
      .then(() => {
        forkJoin([
        this.friendService.fetchUserAndFriends(this._userData!.uid),
        this.friendService.getRequestedFriends(this._userData!.uid)])
          .subscribe(([friendList, notifications]) => {
            this.userObject = of(friendList);
            this.friendRequests = notifications.otherRequests
            this.ownRequests = notifications.myRequests
            this.friendHeading = 'My Friends'
          })
      });
  }
}