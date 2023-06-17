import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, DocumentChangeAction, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import { Observable, concatAll, filter, first, flatMap, forkJoin, map, mergeAll, mergeMap, of, single, switchMap, take, tap, toArray } from 'rxjs';
import { User } from './user';
import { FriendRequest } from './friendRequest';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  constructor(public afs: AngularFirestore) { }


  public fetchUserAndFriends(ownerUid: string) {
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

  public fetchUsers(uids: string[] | undefined): Observable<User[]> {
    if (uids && uids?.length > 0) {
      return this.afs.collection<User>('users', ref => ref.where('uid', 'in', uids))
        .get()
        .pipe(
          switchMap(friends => friends.docs),
          map(f => f.data()),
          toArray())
    } else {
      return of([]);
    }
  }

  public removeFriend(uid: string, friendUid: string) {
    return this.fetchUsers([uid])
      .pipe(
        concatAll(),
        first(),
        filter(user => user.friend_ids != undefined),
        map(async user => {
          const newUserObject = Object.assign({}, user);
          const indexOfFriend = user.friend_ids!.indexOf(friendUid);

          newUserObject.friend_ids!.splice(indexOfFriend, 1);

          try {
            await this.setUserData(newUserObject);
            return true;
          } catch (err) {
            console.error('error removing friend', err);
            return false;
          }
        }),
        switchMap(isSuccess => isSuccess)
      );
  }

  public sendFriendRequest(uid: string, friendUid: string): Promise<DocumentReference<FriendRequest>> {
    const friend_requests = this.afs.collection<FriendRequest>('friend_requests');

    const fr: FriendRequest = {
      requesting_uid: uid,
      target_uid: friendUid
    };

    return friend_requests.add(fr);
  }

  public addFriend(uid: string, friendUid: string) {

  }

  public search(term: string): Observable<User> {
    console.log('searching', term)
    const lowercaseTerm = term.toLowerCase();
    return this.afs.collection<User>('users', ref => { return ref.orderBy('displayNameLower').startAt(lowercaseTerm).endAt(lowercaseTerm + '\uf8ff') }).get().pipe(
      tap(r => console.log('search response', r)),
      switchMap(r => r.docs),
      map(u => u.data())
    );
  }

  private setUserData(userData: User) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${userData.uid}`
    );
    return userRef.set(userData, {
      merge: true,
    });
  }
}
