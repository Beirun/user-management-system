import { Role } from './role';

export type Account =  {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    jwtToken?: string;
    status: string;
    lastLogin: string;
};
export type NewAccount = {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    acceptTerms: boolean;
}