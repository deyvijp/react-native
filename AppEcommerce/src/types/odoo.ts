export interface OdooConfig {
    url: string;
    db: string;
}

export interface OdooRpcRequest {
    jsonrpc: '2.0';
    method: 'call';
    params: {
        service: string;
        method: string;
        args: any[];
    };
    id: number;
}

export interface OdooRpcError {
    code: number;
    message: string;
    data: {
        name: string;
        debug: string;
        message: string;
        arguments: any[];
        exception_type: string;
    };
}

export interface OdooRpcResponse<T> {
    jsonrpc: '2.0';
    id: number;
    result?: T;
    error?: OdooRpcError;
}

export interface LoginResult {
    success: boolean;
    uid?: number;
    username?: string;
    sessionId?: string;
    partnerId?: number;
    userContext?: any;
    companyId?: number;
    error?: string;
}
