const FeeController = {
    /**
     * Calculate order fees
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    calculateFees: async (req, res) => {
      try {
        const { subtotal, distance, promoCode } = req.body;
  
        // Validate input
        if (!subtotal || !distance) {
          return res.status(400).json({
            error: "Missing required fields",
            required: ["subtotal", "distance"]
          });
        }
  
        // Hard-coded fee values (in a real app, these would come from a database)
        const DELIVERY_FEE_BASE = 60;
        const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% of subtotal
        const DISTANCE_FEE_PER_KM = 10;
        
        // Calculate fees
        const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENTAGE);
        const deliveryFee = DELIVERY_FEE_BASE + (distance * DISTANCE_FEE_PER_KM);
        
        // Calculate discount if promo code is provided
        let discount = 0;
        let discountMessage = "No promo code applied";
        
        if (promoCode) {
          // Hard-coded promo codes (in a real app, these would come from a database)
          const promoCodes = {
            "WELCOME10": { type: "percentage", value: 0.1 },
            "FLAT50": { type: "flat", value: 50 },
            "FREEDEL": { type: "free_delivery", value: true }
          };
          
          const promoDetails = promoCodes[promoCode];
          
          if (promoDetails) {
            if (promoDetails.type === "percentage") {
              discount = Math.round(subtotal * promoDetails.value);
              discountMessage = `${promoDetails.value * 100}% discount applied`;
            } else if (promoDetails.type === "flat") {
              discount = promoDetails.value;
              discountMessage = `Flat ₹${promoDetails.value} discount applied`;
            } else if (promoDetails.type === "free_delivery") {
              discount = deliveryFee;
              discountMessage = "Free delivery applied";
            }
          } else {
            discountMessage = "Invalid promo code";
          }
        }
        
        // Calculate totals
        const totalBeforeDiscount = subtotal + platformFee + deliveryFee;
        const totalAfterDiscount = totalBeforeDiscount - discount;
        
        // Return response
        return res.status(200).json({
          success: true,
          data: {
            subtotal: subtotal,
            fees: {
              deliveryFee: deliveryFee,
              platformFee: platformFee,
            },
            discount: {
              amount: discount,
              message: discountMessage
            },
            totals: {
              beforeDiscount: totalBeforeDiscount,
              afterDiscount: totalAfterDiscount
            }
          }
        });
        
      } catch (error) {
        console.error("Error calculating fees:", error);
        return res.status(500).json({
          error: "Failed to calculate fees",
          details: error.message
        });
      }
    }
  };
  
  module.exports = FeeController;