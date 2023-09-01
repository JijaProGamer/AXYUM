export class CookieHandler {
    constructor(url: string);
    parseCookies(cookies: any[]): any[];
    formatCookies(cookies: any[]): any[];
    getCookies(): any[];
    setCookies(cookies: string);
}