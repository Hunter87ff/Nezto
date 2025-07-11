import { Response } from "express";

class ResponseHandler{

    async unAuthorised(res: Response, content: any =  "Unauthorized" , ...args: any[]) {
        res.status(401).json({
            status: 401,
            content: content,
            ...args
        });
    }

    async forbidden(res: Response, content: any =  "Forbidden" , ...args: any[]) {
        res.status(403).json({
            status: 403,
            message: content,
            ...args
        });
    }


    async notFound(res: Response, content: any =  "Not Found" , ...args: any[]) {
        res.status(404).json({
            status: 404,
            message: content,
            ...args
        });
    }

    async internalServerError(res: Response, content: any =  "Internal Server Error" , ...args: any[]) {
        res.status(500).json({
            status: 500,
            message: content,
            ...args
        });
    }

    async success(res: Response, content: any =  "Success" , ...args: any[]) {
        res.status(200).json({
            status: 200,
            content: content,
            ...args
        });
    }

    async created(res: Response, content: any =  "Created" , ...args: any[]) {
        res.status(201).json({
            status: 201,
            content: content,
            ...args
        });
    }

    async noContent(res: Response, content: any =  "No Content" ) {
        res.status(204).json({
            status: 204,
            message: content
        });
    }

    async notModified(res: Response, content: any =  "Not Modified" ) {
        res.status(304).json({
            status: 304,
            message: content
        });
    }

    async badRequest(res: Response, content: any =  "Bad Request") {
        res.status(400).json({
            status: 400,
            message: content
        });
    }

    async unAuthorized(res: Response, content: any =  "Unauthorized") {
        res.status(401).json({
            status: 401,
            message: content
        });
    }


}

export {
    ResponseHandler
}