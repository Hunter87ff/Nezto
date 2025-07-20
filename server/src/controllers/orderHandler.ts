import { Request, Response } from "express";
import { BaseOrder } from "@/core/order";

interface CreateOrderRequest {
    price: number;
    service: string;
    type: string;
    user: string;
    vendor: string;
    rider?: string;
    otp: string;
    pick_time: Date;
    drop_time: Date;
    pickup_location: [number, number];
    drop_location: [number, number];
}

interface UpdateOrderRequest {
    price?: number;
    status?: string;
    service?: string;
    type?: string;
    rider?: string;
    otp?: string;
    pick_time?: Date;
    drop_time?: Date;
    pickup_location?: [number, number];
    drop_location?: [number, number];
    completed_at?: Date;
}

interface OrderQueryParams {
    status?: string;
    user?: string;
    vendor?: string;
    rider?: string;
    service?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
}

/**
 * Create a new order
 * @route POST /api/orders
 * @access User level operation
 */
export async function createOrder(req: Request, res: Response) {
    try {
        const {
            price,
            service,
            type,
            user,
            vendor,
            rider,
            otp,
            pick_time,
            drop_time,
            pickup_location,
            drop_location
        }: CreateOrderRequest = req.body;

        // Validate required fields
        if (!price || !service || !type || !user || !vendor || !otp || !pick_time || !drop_time || !pickup_location || !drop_location) {
            return res.handler.internalServerError(res, { message: 'Missing required fields' });
        }

        // Validate location coordinates
        if (!Array.isArray(pickup_location) || pickup_location.length !== 2 || 
            !Array.isArray(drop_location) || drop_location.length !== 2) {
            return res.handler.internalServerError(res, { message: 'Invalid location coordinates' });
        }

        const orderData = {
            price: Number(price),
            service,
            type,
            user,
            vendor,
            rider: rider || null,
            otp: String(otp),
            pick_time: new Date(pick_time),
            drop_time: new Date(drop_time),
            pickup_location: [Number(pickup_location[0]), Number(pickup_location[1])],
            drop_location: [Number(drop_location[0]), Number(drop_location[1])]
        };

        // Create order in database
        const createdOrder = await res.ctx.models.Order.create(orderData);
        
        // Populate the created order
        const populatedOrder = await res.ctx.models.Order.findById(createdOrder._id)
            .populate('user', 'name email phone')
            .populate('vendor', 'name email phone')
            .populate('rider', 'name email phone')
            .populate('service', 'name price description')
            .exec();

        if (!populatedOrder) {
            return res.handler.internalServerError(res, { message: 'Failed to create order' });
        }

        // Create BaseOrder instance and add to cache
        const newOrder = new BaseOrder(populatedOrder);
        res.ctx.orders.set(String(populatedOrder._id), newOrder);

        res.handler.created(res, newOrder);

    } catch (error: any) {
        res.ctx.logger.error('Error creating order:', error);
        res.handler.internalServerError(res, { message: 'Failed to create order', error: error.message });
    }
}

/**
 * Get orders with optional filtering
 * @route GET /api/orders
 * @access User/Vendor/Rider level operation
 */
export async function getOrders(req: Request, res: Response) {
    try {
        const {
            status,
            user,
            vendor,
            rider,
            service,
            type,
            startDate,
            endDate,
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc"
        }: OrderQueryParams = req.query;

        // Build filter object
        const filter: any = {};
        
        if (status) filter.status = status;
        if (user) filter.user = user;
        if (vendor) filter.vendor = vendor;
        if (rider) filter.rider = rider;
        if (service) filter.service = service;
        if (type) filter.type = type;

        // Date range filtering
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
        const skip = (pageNum - 1) * limitNum;

        // Sort
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Get orders from database with population
        const orders = await res.ctx.models.Order
            .find(filter)
            .populate('user', 'name email phone')
            .populate('vendor', 'name email phone')
            .populate('rider', 'name email phone')
            .populate('service', 'name price description')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .exec();

        // Get total count for pagination
        const totalCount = await res.ctx.models.Order.countDocuments(filter);

        const response = {
            orders: orders.map(order => new BaseOrder(order)),
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
        res.ctx.logger.error('Error fetching orders:', error);
        res.handler.internalServerError(res, { message: 'Failed to fetch orders', error: error.message });
    }
}

/**
 * Get order by ID
 * @route GET /api/orders/:id
 * @access User/Vendor/Rider level operation
 */
export async function getOrderById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Order ID is required' });
        }

        const order = await res.ctx.orders.get(id);

        if (!order) {
            return res.handler.notFound(res, { message: 'Order not found' });
        }

        res.handler.success(res, order);

    } catch (error: any) {
        res.ctx.logger.error('Error fetching order:', error);
        res.handler.internalServerError(res, { message: 'Failed to fetch order', error: error.message });
    }
}

/**
 * Update order by ID
 * @route PATCH /api/orders/:id
 * @access User/Vendor/Rider level operation
 */
export async function updateOrderById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const {
            price,
            status,
            service,
            type,
            rider,
            otp,
            pick_time,
            drop_time,
            pickup_location,
            drop_location,
            completed_at
        }: UpdateOrderRequest = req.body;

        if (!id) {
            return res.handler.internalServerError(res, { message: 'Order ID is required' });
        }

        // Check if order exists
        const existingOrder = await res.ctx.orders.get(id);
        if (!existingOrder) {
            return res.handler.notFound(res, { message: 'Order not found' });
        }

        // Build update object with only provided fields
        const updateData: any = {};
        
        if (price !== undefined) updateData.price = Number(price);
        if (status !== undefined) updateData.status = status;
        if (service !== undefined) updateData.service = service;
        if (type !== undefined) updateData.type = type;
        if (rider !== undefined) updateData.rider = rider;
        if (otp !== undefined) updateData.otp = String(otp);
        if (pick_time !== undefined) updateData.pick_time = new Date(pick_time);
        if (drop_time !== undefined) updateData.drop_time = new Date(drop_time);
        if (pickup_location !== undefined) {
            if (!Array.isArray(pickup_location) || pickup_location.length !== 2) {
                return res.handler.internalServerError(res, { message: 'Invalid pickup location coordinates' });
            }
            updateData.pickup_location = [Number(pickup_location[0]), Number(pickup_location[1])];
        }
        if (drop_location !== undefined) {
            if (!Array.isArray(drop_location) || drop_location.length !== 2) {
                return res.handler.internalServerError(res, { message: 'Invalid drop location coordinates' });
            }
            updateData.drop_location = [Number(drop_location[0]), Number(drop_location[1])];
        }
        if (completed_at !== undefined) updateData.completed_at = completed_at ? new Date(completed_at) : null;

        // If status is being changed to completed, set completed_at automatically
        if (status === 'completed' && !completed_at) {
            updateData.completed_at = new Date();
        }

        // Update order in database
        const updatedOrder = await res.ctx.models.Order.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('rider', 'name email phone')
        .populate('service', 'name price description')
        .exec();

        if (!updatedOrder) {
            return res.handler.notFound(res, { message: 'Order not found' });
        }

        // Update cache
        const baseOrder = new BaseOrder(updatedOrder);
        res.ctx.orders.set(String(updatedOrder._id), baseOrder);

        res.handler.success(res, baseOrder);

    } catch (error: any) {
        res.ctx.logger.error('Error updating order:', error);
        res.handler.internalServerError(res, { message: 'Failed to update order', error: error.message });
    }
}


