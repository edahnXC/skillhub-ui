export interface AuthResponse{
    token:string;
    email:string;
    fullName:string;
    refreshToken:string;
    roles:string[];
}