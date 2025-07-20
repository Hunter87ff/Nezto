import { Request, Response } from "express";
import { ApiResponse } from "@utils/helpers";
import { BaseRider } from "@/core/rider";

interface CreateRiderRequest {
    user: string;
}

interface UpdateRiderRequest {
    user?: string;
}

interface CreatePayoutRequest {
    amount: number;
    status?: "pending" | "done";
}

interface UpdatePayoutRequest {
    amount?: number;
    status?: "pending" | "done";
}

interface RiderQueryParams {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    payoutStatus?: "pending" | "done";
    hasPayouts?: string;
}

/**
 * Create a new rider
 * @route POST /api/riders
 * @access Admin level operation
 */
export async function createRider(req: Request, res: Response) {
    try {
        if (!req.user?.isAdmin){
            return res.handler.forbidden(res, { message: "You do not have permission to create a rider." });
        }
        const { user }: CreateRiderRequest = req.body;
        if (!user) {
            return res.handler.internalServerError(res, { message: 'User ID is required' });
        }

        // Check if user exists
        const existingUser = await res.ctx.models.User.findById(user);
        if (!existingUser) {
            return res.handler.internalServerError(res, { message: 'User not found' });
        }
        // Check if another rider already exists for this user
        const riderWithUser = await res.ctx.models.Rider.findOne({ user });

        if (riderWithUser) {
            return res.handler.internalServerError(res, { message: 'Another rider already exists for this user' });
        }

        // Create new rider
        const newRider = new res.ctx.models.Rider({
            user
        });

        const savedRider = await newRider.save();
        // Populate the saved rider with user data
        const populatedRider = await res.ctx.models.Rider.findById(savedRider._id).populate('user', 'name email phone picture location').exec();
        // Update cache
        const baseRider = new BaseRider(populatedRider);
        res.ctx.riders.set(String(savedRider._id), baseRider);

        res.handler.success(res, baseRider);

    } catch (error: any) {
        res.ctx.logger.error('Error creating rider:', error);
        res.handler.internalServerError(res, { message: 'Failed to create rider', error: error.message });
    }
}

/**
 * Get riders with optional filtering
 * @route GET /api/riders
 * @access Admin level operation
 */
export async function getRiders(req: Request, res: Response) {
    try {
        const {
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc",
            payoutStatus,
            hasPayouts
        }: RiderQueryParams = req.query;

        // Build filter object
        const filter: any = {};

        // Filter by payout status
        if (payoutStatus) {
            filter['payouts.status'] = payoutStatus;
        }

        // Filter by whether rider has payouts
        if (hasPayouts !== undefined) {
            const hasPayoutsBool = hasPayouts === 'true';
            if (hasPayoutsBool) {
                filter['payouts'] = { $exists: true, $ne: [] };
            } else {
                filter['$or'] = [
                    { 'payouts': { $exists: false } },
                    { 'payouts': { $size: 0 } }
                ];
            }
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
        const skip = (pageNum - 1) * limitNum;

        // Sort
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Get riders from database with population
        const riders = await res.ctx.models.Rider
            .find(filter)
            .populate('user', 'name email phone picture location')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .exec();

        // Get total count for pagination
        const totalCount = await res.ctx.models.Rider.countDocuments(filter);

        const response = {
            riders: riders.map(rider => new BaseRider(rider)),
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                itemsPerPage: limitNum,
                hasNext: pageNum * limitNum < totalCount,
                hasPrev: pageNum > 1
            }
        };

        res.handler.success(res, response);

    } catch (error: any) {
        res.ctx.logger.error('Error fetching riders:', error);
        res.handler.internalServerError(res, { message: 'Failed to fetch riders', error: error.message });
    }
}

/**
 * Get rider by ID
 * @route GET /api/riders/:id
 * @access Admin/Rider level operation
 */
export async function getRiderById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Rider ID is required' });
        }

        const rider = await res.ctx.riders.get(id);

        if (!rider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        res.handler.success(res, rider);

    } catch (error: any) {
        res.ctx.logger.error('Error fetching rider:', error);
        res.handler.internalServerError(res, { message: 'Failed to fetch rider', error: error.message });
    }
}

/**
 * Update rider by ID
 * @route PATCH /api/riders/:id
 * @access Admin level operation
 */
export async function updateRiderById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { user }: UpdateRiderRequest = req.body;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Rider ID is required' });
        }

        // Check if rider exists
        const existingRider = await res.ctx.riders.get(id);
        if (!existingRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Build update object with only provided fields
        const updateData: any = {};
        
        if (user !== undefined) {
            // Check if user exists
            const existingUser = await res.ctx.models.User.findById(user);
            if (!existingUser) {
                return res.handler.notFound(res, { message: 'User not found' });
            }

            // Check if another rider already exists for this user
            const riderWithUser = await res.ctx.models.Rider.findOne({ user, _id: { $ne: id } });
            if (riderWithUser) {
                return res.handler.internalServerError(res, { message: 'Another rider already exists for this user' });
            }

            updateData.user = user;
        }

        // Update rider in database
        const updatedRider = await res.ctx.models.Rider.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('user', 'name email phone picture location')
        .exec();

        if (!updatedRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Update cache
        const baseRider = new BaseRider(updatedRider);
        res.ctx.riders.set(String(updatedRider._id), baseRider);

        res.handler.success(res, baseRider);

    } catch (error: any) {
        res.ctx.logger.error('Error updating rider:', error);
        res.handler.internalServerError(res, { message: 'Failed to update rider', error: error.message });
    }
}

/**
 * Delete rider by ID
 * @route DELETE /api/riders/:id
 * @access Admin level operation
 */
export async function deleteRiderById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Rider ID is required' });
        }

        // Check if rider exists
        const existingRider = await res.ctx.riders.get(id);
        if (!existingRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Check if rider has active orders
        const activeOrders = await res.ctx.models.Order.find({ 
            rider: id, 
            status: { $in: ['pending', 'accepted', 'processing', 'to_client', 'to_vendor'] }
        });

        if (activeOrders.length > 0) {
            return res.handler.internalServerError(res, { 
                message: 'Cannot delete rider with active orders',
                activeOrdersCount: activeOrders.length
            });
        }

        // Delete rider from database and cache
        await res.ctx.riders.delete(id);

        res.handler.success(res, { message: 'Rider deleted successfully' });

    } catch (error: any) {
        res.ctx.logger.error('Error deleting rider:', error);
        res.handler.internalServerError(res, { message: 'Failed to delete rider', error: error.message });
    }
}

/**
 * Add payout to rider
 * @route POST /api/riders/:id/payouts
 * @access Admin level operation
 */
export async function addPayoutToRider(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { amount, status = "pending" }: CreatePayoutRequest = req.body;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Rider ID is required' });
        }

        if (!amount || amount <= 0) {
            return res.handler.internalServerError(res, { message: 'Valid amount is required' });
        }

        // Check if rider exists
        const existingRider = await res.ctx.riders.get(id);
        if (!existingRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        const newPayout = {
            amount: Number(amount),
            status,
            date: new Date()
        };

        // Add payout to rider
        const updatedRider = await res.ctx.models.Rider.findByIdAndUpdate(
            id,
            { $push: { payouts: newPayout } },
            { new: true, runValidators: true }
        )
        .populate('user', 'name email phone picture location')
        .exec();

        if (!updatedRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Update cache
        const baseRider = new BaseRider(updatedRider);
        res.ctx.riders.set(String(updatedRider._id), baseRider);

        res.handler.success(res, baseRider);

    } catch (error: any) {
        res.ctx.logger.error('Error adding payout to rider:', error);
        res.handler.internalServerError(res, { message: 'Failed to add payout', error: error.message });
    }
}

/**
 * Update payout for rider
 * @route PATCH /api/riders/:riderId/payouts/:payoutId
 * @access Admin level operation
 */
export async function updateRiderPayout(req: Request, res: Response) {
    try {
        const { riderId, payoutId } = req.params;
        const { amount, status }: UpdatePayoutRequest = req.body;

        if (!riderId || !payoutId) {
            return res.handler.internalServerError(res, { message: 'Rider ID and Payout ID are required' });
        }

        // Check if rider exists
        const existingRider = await res.ctx.riders.get(riderId);
        if (!existingRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Build update object for the specific payout
        const updateFields: any = {};
        if (amount !== undefined) updateFields['payouts.$.amount'] = Number(amount);
        if (status !== undefined) updateFields['payouts.$.status'] = status;

        // Update the specific payout
        const updatedRider = await res.ctx.models.Rider.findOneAndUpdate(
            { _id: riderId, 'payouts._id': payoutId },
            { $set: updateFields },
            { new: true, runValidators: true }
        )
        .populate('user', 'name email phone picture location')
        .exec();

        if (!updatedRider) {
            return res.handler.notFound(res, { message: 'Rider or payout not found' });
        }

        // Update cache
        const baseRider = new BaseRider(updatedRider);
        res.ctx.riders.set(String(updatedRider._id), baseRider);

        res.handler.success(res, baseRider);

    } catch (error: any) {
        res.ctx.logger.error('Error updating rider payout:', error);
        res.handler.internalServerError(res, { message: 'Failed to update payout', error: error.message });
    }
}

/**
 * Delete payout from rider
 * @route DELETE /api/riders/:riderId/payouts/:payoutId
 * @access Admin level operation
 */
export async function deleteRiderPayout(req: Request, res: Response) {
    try {
        const { riderId, payoutId } = req.params;

        if (!riderId || !payoutId) {
            return res.handler.internalServerError(res, { message: 'Rider ID and Payout ID are required' });
        }

        // Check if rider exists
        const existingRider = await res.ctx.riders.get(riderId);
        if (!existingRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Remove the specific payout
        const updatedRider = await res.ctx.models.Rider.findByIdAndUpdate(
            riderId,
            { $pull: { payouts: { _id: payoutId } } },
            { new: true }
        )
        .populate('user', 'name email phone picture location')
        .exec();

        if (!updatedRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Update cache
        const baseRider = new BaseRider(updatedRider);
        res.ctx.riders.set(String(updatedRider._id), baseRider);

        res.handler.success(res, { message: 'Payout deleted successfully', rider: baseRider });

    } catch (error: any) {
        res.ctx.logger.error('Error deleting rider payout:', error);
        res.handler.internalServerError(res, { message: 'Failed to delete payout', error: error.message });
    }
}

/**
 * Get rider statistics
 * @route GET /api/riders/:id/stats
 * @access Admin/Rider level operation
 */
export async function getRiderStats(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Rider ID is required' });
        }

        // Check if rider exists
        const existingRider = await res.ctx.riders.get(id);
        if (!existingRider) {
            return res.handler.notFound(res, { message: 'Rider not found' });
        }

        // Get order statistics
        const orderStats = await res.ctx.models.Order.aggregate([
            { $match: { rider: id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalEarnings: { $sum: '$price' }
                }
            }
        ]);

        // Get payout statistics
        const payoutStats = await res.ctx.models.Rider.aggregate([
            { $match: { _id: id } },
            { $unwind: '$payouts' },
            {
                $group: {
                    _id: '$payouts.status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$payouts.amount' }
                }
            }
        ]);

        const totalOrders = orderStats.reduce((sum, stat) => sum + stat.count, 0);
        const totalEarnings = orderStats.reduce((sum, stat) => sum + stat.totalEarnings, 0);
        const totalPayouts = payoutStats.reduce((sum, stat) => sum + stat.totalAmount, 0);

        const stats = {
            rider: existingRider,
            orders: {
                total: totalOrders,
                byStatus: orderStats,
                totalEarnings
            },
            payouts: {
                total: payoutStats.reduce((sum, stat) => sum + stat.count, 0),
                byStatus: payoutStats,
                totalAmount: totalPayouts
            },
            balance: totalEarnings - totalPayouts
        };

        res.handler.success(res, stats);

    } catch (error: any) {
        res.ctx.logger.error('Error fetching rider stats:', error);
        res.handler.internalServerError(res, { message: 'Failed to fetch rider statistics', error: error.message });
    }
}
