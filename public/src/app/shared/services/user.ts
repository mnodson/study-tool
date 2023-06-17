export interface User {
    uid: string;
    email: string;
    displayName: string;
    displayNameLower: string;
    photoURL: string;
    emailVerified: boolean;
    friend_ids?: string[];
 }