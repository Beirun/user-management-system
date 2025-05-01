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
};