import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, Query, QueryFn } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, flatMap, forkJoin, map, merge, mergeAll, mergeMap, of, switchMap, tap, toArray } from 'rxjs';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  constructor(public afs: AngularFirestore) { }


  public fetchFriends(ownerUid: string) {
    const friends = this.afs.collection<User>('users', ref => ref.where('uid', '==', ownerUid).limit(1));

    return friends
      .get()
      .pipe(
        switchMap(friend => friend.docs),
        map(f => f.data()),
        mergeMap(user => {
          return forkJoin({
            user: of(user),
            friends: this.fetchUsers(user.friend_ids)
          });
        }));
  }

  public fetchUsers(uids: string[] | undefined): Observable<User[] | undefined> {
    if (uids) {
      return this.afs.collection<User>('users', ref => ref.where('uid', 'in', uids))
        .get()
        .pipe(
          switchMap(friends => friends.docs),
          map(f => f.data()),
          toArray())
    } else {
      return of(undefined);
    }
  }
}
