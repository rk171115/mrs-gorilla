const { pool } = require('../db_conn');

const checkOrderStatus = async (req, res) => {
    try {
        const { user_id } = req.params;

        // Validate user_id
        if (!user_id || isNaN(user_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID provided'
            });
        }

        // Get the latest order for the user
        const orderQuery = `
            SELECT 
                id as order_id,
                user_id,
                vendor_id,
                booking_id,
                status,
                reason,
                created_at,
                updated_at
            FROM order_request 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `;

        const [orderResult] = await pool.execute(orderQuery, [user_id]);

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No orders found for this user'
            });
        }

        const order = orderResult[0];

        // Prepare response based on status
        let response = {
            success: true,
            order_id: order.order_id,
            status: order.status,
            created_at: order.created_at,
            updated_at: order.updated_at
        };

        if (order.status === 'pending') {
            response.message = 'We are assigning you a vendor shortly';
            response.vendor_info = null;
            return res.status(200).json(response);
        } 
        else if (order.status === 'accepted') {
            // Get vendor details when order is accepted
            const vendorQuery = `
                SELECT 
                    vd.Name as vendor_name,
                    vd.Permanent_address as vendor_address,
                    va.phone_no as vendor_phone
                FROM vendor_details vd
                LEFT JOIN vendor_auth va ON vd.id = va.vendor_details_id
                WHERE vd.id = ?
            `;

            try {
                const [vendorResult] = await pool.execute(vendorQuery, [order.vendor_id]);

                if (vendorResult.length > 0) {
                    const vendor = vendorResult[0];
                    response.message = 'Your order has been accepted by a vendor';
                    response.vendor_info = {
                        name: vendor.vendor_name,
                        phone: vendor.vendor_phone,
                        address: vendor.vendor_address
                    };
                } else {
                    response.message = 'Your order has been accepted but vendor details are not available';
                    response.vendor_info = null;
                }

                return res.status(200).json(response);

            } catch (vendorErr) {
                console.error('Vendor query error:', vendorErr);
                response.message = 'Your order has been accepted but vendor details are not available';
                response.vendor_info = null;
                return res.status(200).json(response);
            }
        } 
        else {
            response.message = `Order status: ${order.status}`;
            response.vendor_info = null;
            return res.status(200).json(response);
        }

    } catch (error) {
        console.error('Error checking order status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        if (!user_id || isNaN(user_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID provided'
            });
        }

        const ordersQuery = `
            SELECT 
                or_req.id as order_id,
                or_req.user_id,
                or_req.vendor_id,
                or_req.booking_id,
                or_req.status,
                or_req.reason,
                or_req.created_at,
                or_req.updated_at,
                vd.Name as vendor_name,
                va.phone_no as vendor_phone,
                vd.Permanent_address as vendor_address
            FROM order_request or_req
            LEFT JOIN vendor_details vd ON or_req.vendor_id = vd.id
            LEFT JOIN vendor_auth va ON vd.id = va.vendor_details_id
            WHERE or_req.user_id = ?
            ORDER BY or_req.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [orders] = await pool.execute(ordersQuery, [user_id, parseInt(limit), parseInt(offset)]);

        const formattedOrders = orders.map(order => ({
            order_id: order.order_id,
            status: order.status,
            reason: order.reason,
            created_at: order.created_at,
            updated_at: order.updated_at,
            vendor_info: order.vendor_name ? {
                name: order.vendor_name,
                phone: order.vendor_phone,
                address: order.vendor_address
            } : null
        }));

        return res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: formattedOrders,
            total: orders.length
        });

    } catch (error) {
        console.error('Error getting user orders:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    checkOrderStatus,
    getUserOrders
};