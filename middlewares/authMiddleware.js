import { expressjwt } from "express-jwt";


export const isAuthenticated = expressjwt({
    secret: process.env.JWT_SECRET_KEY,
    algorithms: ['HS256'],
    requestProperty: 'auth'
});
