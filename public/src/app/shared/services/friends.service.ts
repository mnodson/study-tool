import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, DocumentReference } from '@angular/fire/compat/firestore';
import { FieldValue, arrayUnion } from 'firebase/firestore';
import { BehaviorSubject, Observable, catchError, forkJoin, map, mergeMap, of, switchMap, throwError, toArray } from 'rxjs';
import { User } from './user';
import { FriendRequest, UserMetaWithStatus } from './friendRequest';

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
    return this.fetchUsers([uid, friendUid])
      .pipe(
        map(friendPair => ({ thisUser: friendPair[0], friendUser: friendPair[1] })),
        map(async pair => {
          const newThisUser = removeFriend(pair.thisUser);
          const newFriendUSer = removeFriend(pair.friendUser);

          await this.setUserData(newThisUser);
          await this.setUserData(newFriendUSer);

          return true;

          function removeFriend(user: User) {
            const newUserObject = Object.assign({}, user);
            const indexOfFriend = user.friend_ids!.indexOf(friendUid);

            user.friend_ids!.splice(indexOfFriend, 1);
            return newUserObject;
          }
        }),
        switchMap(isSuccess => isSuccess)
      );
  }

  public rejectFriendRequest(currentUser: User, request: { userId: string; meta: UserMetaWithStatus; }): Observable<[boolean, boolean]> {
    const targetFriendDoc$ = this.afs.collection<FriendRequest>('friend_requests').doc(request.userId);
    const currentUserDoc$ = this.afs.collection<FriendRequest>('friend_requests').doc(currentUser.uid);

    const removeFromOwnRequests = new BehaviorSubject<boolean>(false);
    const removeFromRequester = new BehaviorSubject<boolean>(false);

    targetFriendDoc$.get().pipe(map(a => a.data())).subscribe(res => {
      if (res?.ownRequests) {
        delete res?.ownRequests[currentUser.uid]
        targetFriendDoc$.set(res, { merge: true })
          .then(() => {
            removeFromOwnRequests.next(true);
            removeFromOwnRequests.complete();
          });
      }
    });

    currentUserDoc$.get().pipe(map(a => a.data())).subscribe(res => {
      if (res?.friendRequests) {
        delete res?.friendRequests[request.userId]
        currentUserDoc$.set(res, { merge: true })
          .then(() => {
            removeFromRequester.next(true);
            removeFromRequester.complete();
          });
      }
    });

    return forkJoin([removeFromOwnRequests, removeFromRequester]);
  }

  public cancelFriendRequest(currentUser: User, request: { userId: string; meta: UserMetaWithStatus; }) {

    const targetFriendDoc$ = this.afs.collection<FriendRequest>('friend_requests').doc(request.userId);
    const currentUserDoc$ = this.afs.collection<FriendRequest>('friend_requests').doc(currentUser.uid);

    const removeFromOwnRequests = new BehaviorSubject<boolean>(false);
    const removeFromRequester = new BehaviorSubject<boolean>(false);

    targetFriendDoc$.get().pipe(map(a => a.data())).subscribe(res => {
      if (res?.friendRequests) {
        delete res?.friendRequests[currentUser.uid]
        targetFriendDoc$.set(res, { merge: true })
          .then(() => {
            removeFromOwnRequests.next(true);
            removeFromOwnRequests.complete();
          });
      }
    });

    currentUserDoc$.get().pipe(map(a => a.data())).subscribe(res => {
      if (res?.ownRequests) {
        delete res?.ownRequests[request.userId]
        currentUserDoc$.set(res, { merge: true })
          .then(() => {
            removeFromRequester.next(true);
            removeFromRequester.complete();
          });
      }
    });

    return forkJoin([removeFromOwnRequests, removeFromRequester]);
  }

  public sendFriendRequest(currentUser: User, requestedFriend: User): Promise<[void, void]> {
    const targetFriendDoc$ = this.afs.collection<FriendRequest>('friend_requests').doc(requestedFriend.uid);
    const currentUserDoc$ = this.afs.collection<FriendRequest>('friend_requests').doc(currentUser.uid);

    const fr: FriendRequest = {
      friendRequests: {
        [currentUser.uid]: {
          displayName: currentUser.displayName,
          status: 'Pending',
          dateOfActionIso: new Date().toISOString()
        }
      }
    };

    const currentRecord: FriendRequest = {
      ownRequests: {
        [requestedFriend.uid]: {
          displayName: requestedFriend.displayName,
          status: 'Pending',
          dateOfActionIso: new Date().toISOString()
        }
      }
    }

    return Promise.all([
      targetFriendDoc$.set(fr, { merge: true }),
      currentUserDoc$.set(currentRecord, { merge: true })
    ]);
  }

  public getRequestedFriends(uid: string): Observable<{ myRequests: { userId: string; meta: UserMetaWithStatus; }[]; otherRequests: { userId: string; meta: UserMetaWithStatus; }[]; }> {
    return this.afs.collection<FriendRequest>('friend_requests').doc(uid).get().pipe(
      map(d => d.data()),
      map(request => {
        if (request) {
          const friendRequests = Object.entries(request.friendRequests || [])
            .map(([key, value]) => ({ userId: key, meta: value }));

          const requestedFriends = Object.entries(request.ownRequests || [])
            .map(([key, value]) => ({ userId: key, meta: value }));

          return { myRequests: requestedFriends, otherRequests: friendRequests };
        }

        return { myRequests: [], otherRequests: [] };
      })
    )
  }

  public acceptFriendRequest(currentUser: User, request: { userId: string; meta: UserMetaWithStatus; }): Promise<[DocumentReference<User>, DocumentReference<User>]> {

    this.cancelFriendRequest(currentUser, request);
    this.rejectFriendRequest(currentUser, request);

    const currentUpdate = this.afs.collection<User>('users').doc(currentUser.uid).ref;
    currentUpdate.update({'friend_ids': arrayUnion(request.userId)});

    const requestUpdate = this.afs.collection<User>('users').doc(request.userId).ref;
    requestUpdate.update({'friend_ids': arrayUnion(currentUser.uid)});

    return Promise.all([currentUpdate, requestUpdate]);
  }

  public search(term: string): Observable<User[]> {
    if (term == '' || !term) return of([]);

    const lowercaseTerm = term.toLowerCase();
    return this.afs.collection<User>('users', ref => { return ref.orderBy('displayNameLower').startAt(lowercaseTerm).endAt(lowercaseTerm + '\uf8ff') }).get().pipe(
      switchMap(r => {
        if (r.size == 0) {
          return throwError(() => new Error('No users match the supplied term'));
        } else {
          return r.docs;
        }
      }),
      map(doc => doc.data()),
      toArray(),
      catchError(() => {
        return of([])
      })
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
