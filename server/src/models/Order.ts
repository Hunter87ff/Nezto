import { model, Schema } from "mongoose";



const OrderSchema = new Schema(
    {
        price: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "completed", "canceled", "processing", "refunded", "to_client", "to_vendor"],
            default: "pending",
        },
        service: { type: Schema.Types.ObjectId, ref: "Service", required: true }, // Reference to the service
        type: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user who placed the order
        rider: { type: Schema.Types.ObjectId, ref: "Rider" }, // Optional if assigned
        otp: { type: String, required: true }, // String to prevent leading-zero issues
        pick_time: { type: Date, required: true }, // Date when the order is to be picked up from the user
        drop_time: { type: Date, required: true },  // Date when the order is to be dropped off at the vendor
        pickup_location: { type: [Number], required: true, index: "2dsphere" }, // [longitude, latitude]
        drop_location: { type: [Number], required: true, index: "2dsphere" }, // [longitude, latitude]
        vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true }, // Reference to the vendor providing the service
        completed_at: { type: Date, default: null }, // Date when the order was completed
    },
    { timestamps: true }
);


export const Order = model("Order", OrderSchema);