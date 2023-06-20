export interface FriendRequest {
    friendRequests?: {
        [key: string]: UserMetaWithStatus
    },
    ownRequests?: {
        [key: string]: UserMetaWithStatus
    },
    allFriends?: {
        [key: string]: UserMeta
    }
}

export interface UserMeta {
    displayName: string;
    photoUrl?: string;
    dateOfActionIso: string

}

export interface UserMetaWithStatus extends UserMeta {
    status: 'Pending';
}