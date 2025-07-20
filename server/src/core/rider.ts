import { BaseUser } from "./user";
import { Payout } from "./types";



export class BaseRider extends BaseUser {
    _id: string;
    name: string;
    payouts: Payout[];


    constructor(obj: any) {
        // If rider has a populated user field, use that for the BaseUser constructor
        const userObj = obj.user || obj;
        super(userObj);
        this._id = String(obj._id || "");
        this.name = String(userObj.name || "");
        this.payouts = obj.payouts || [];
    }
}


