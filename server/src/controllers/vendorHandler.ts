import { verifyJWT } from "@/utils/helpers";
import { Vendor } from "@/models/Vendor";
import { Request, Response } from "express";


/**
 * @desc    Get all vendor services
 * @param  {import("express").Request} req - Express request object
 * @param  {import("express").Response} res - Express response object
 * @route   GET /api/vendors
 * @access  Public
 */
export async function getAllVendors(req: Request, res: Response) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skipN = (Number(page) - 1) * Number(limit);

        const vendors = await Vendor.find().populate("owner", "name email phone").skip(skipN).limit(Number(limit));

        if (!vendors.length) {
            res.status(200).json({
                success: true,
                count: 0,
                message: "No vendors found",
                data: []
            });
        }

        res.status(200).json({
            success: true,
            count: vendors.length,
            data: vendors
        });
    }

    catch (error: any) {
        console.error("Error fetching vendor services:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching vendor services",
            error: error.message
        });
    }
};

/**Get vendor service by ID
 * @route   GET /api/vendors/:id
 * @access  Public
 */
export async function getVendorById(req: Request, res: Response) {
    res.ctx.response.success(res, await res.ctx.vendors.get(req.params.id));
};



/**
 * @desc    Create new vendor service
 * @route   POST /api/vendors
 * @access  Private (Owner)
 */
export async function createVendor(req: Request, res: Response) {
    try {

        const { status, location } = req.body;
        const user = verifyJWT(req.cookies.token || req.headers.authorization?.split(' ')[1]);

        // Validate location data
        if (!location || !location.coordinates) {
            res.status(400).json({
                success: false,
                message: "Please provide valid location data with coordinates"
            });
        }

        // Create new laundry service
        const newVendor = new Vendor({
            status: status || true,
            location,
            owner: user?._id
        });

        const savedLaundryService = await newVendor.save();

        res.status(201).json({
            success: true,
            message: "Laundry service created successfully",
            data: savedLaundryService
        });
    } catch (error: any) {
        console.error("Error creating laundry service:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating laundry service",
            error: error.message
        });
    }
};



/**
 * @desc    Update vendor rating
 * @route   PATCH /api/vendors/:id/rating
 * @access  Private (Authenticated user)
 */
export async function updateVendorRating(req: Request, res: Response) {
    try {
        const { rating } = req.body;

        if (rating === undefined || rating < 0 || rating > 5) {
            res.status(400).json({
                success: false,
                message: "Please provide a valid rating between 0 and 5"
            });
        }

        // Find vendor
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
            return;
        }

        // Update rating
        vendor.rating = rating;

        // Save updated vendor
        const updatedVendor = await vendor.save();

        res.status(200).json({
            success: true,
            message: "Vendor rating updated successfully",
            data: updatedVendor
        });
    } catch (error: any) {
        console.error("Error updating vendor rating:", error);

        if (error.kind === "ObjectId") {
            res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while updating rating",
            error: error.message
        });
    }
};


/**Toggle vendor status (active/inactive)
 * @route   PATCH /api/vendors/:id/toggle-status
 * @access  Private (Owner)
 */
export async function toggleVendorStatus(req: Request, res: Response) {
    try {
        // Find vendor, next step to cache the data for fast retrieval
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
            return;
        }

        // Toggle status
        vendor.status = !vendor.status;

        // Save updated vendor
        const updatedVendor = await vendor.save();

        res.status(200).json({
            success: true,
            message: `Vendor ${updatedVendor.status ? 'activated' : 'deactivated'} successfully`,
            data: updatedVendor
        });

    } catch (error: any) {
        console.error("Error toggling vendor status:", error);

        if (error.kind === "ObjectId") {
            res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while toggling service status",
            error: error.message
        });
    }
};
