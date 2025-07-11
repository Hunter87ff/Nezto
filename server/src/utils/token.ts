import { verifyJWT } from "./helpers";
import { sign } from "jsonwebtoken";
import { jwtConfig } from "@/config";
import type { Types } from "mongoose";



/**
 * TokenUser class represents a user extracted from a JWT token.
 * It provides methods to create a token and extract user information.
 */
export class TokenUser {
    _id?: string | Types.ObjectId | null
    email?: string | null
    name?: string | null
    roles?: string[] | null
    picture?: string | null
    createdAt?: Date | null
    updatedAt?: Date | null

    isAdmin:boolean=false;
    isRider:boolean=false;
    isVendor:boolean=false;
    isUser:boolean=true;


    constructor(token: string | undefined) {
        try {
            const jwtuser = verifyJWT(token || "");
            this._id = jwtuser?._id || null;
            this.email = jwtuser?.email || null;
            this.name = jwtuser?.name || null;
            this.roles = Array.from(jwtuser?.roles || []);
            this.picture = jwtuser?.picture || null;
            this.createdAt = jwtuser?.createdAt ? new Date(jwtuser.createdAt) : null;
            this.updatedAt = jwtuser?.updatedAt ? new Date(jwtuser.updatedAt) : null;
            this.initialize();

        } catch (error) {
            console.error("Failed to verify JWT:", error);
        }
    }

    private initialize(){
        if (this.roles) {
            this.isAdmin = this.roles.includes("admin");
            this.isRider = this.roles.includes("rider");
            this.isVendor = this.roles.includes("vendor");
            this.isUser = this.roles.includes("user");
        }
    }

    public static sign(payload: Partial<TokenUser>): string {
        return sign({
            ...payload
        }, jwtConfig.secret);
    }
}

