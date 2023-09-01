export class HTTPResponse {
    status: number
    headers: any
    body: string | Buffer
}

export class HTTPRequest {
    constructor (url: string, page: any, isNavigation: boolean, resourceType: string, method: string, postData: string | null, proxy: string, headers: any, onFinished: Function) 

    abort(errorCode: string, priority: number): null

    respond(response: HTTPResponse): null

    continue(): null
    
    abortErrorReason(): string

    failure(): string

    url(): string

    headers(): any

    frame (): any

    resourceType(): string

    isNavigationRequest(): boolean

    method(): string

    postData(): string | null
}