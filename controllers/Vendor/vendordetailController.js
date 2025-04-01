const VendorModel = require('../../models/Vendor/fetchvendor.js');

exports.getVendorBasicInfo = async (req, res) => {
  try {
    const vendors = await VendorModel.getVendorBasicInfo();
    
    if (!vendors || vendors.length === 0) {
      return res.status(404).json({ 
        message: 'No vendor details found' 
      });
    }

    res.status(200).json({
      count: vendors.length,
      vendors: vendors
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching vendor details', 
      error: error.message 
    });
  }
};

exports.getVendorNameAndId = async (req, res) => {
  try {
    const vendors = await VendorModel.getVendorNameAndId();
    
    if (!vendors || vendors.length === 0) {
      return res.status(404).json({ 
        message: 'No vendor IDs found' 
      });
    }

    res.status(200).json({
      count: vendors.length,
      vendors: vendors
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching vendor IDs', 
      error: error.message 
    });
  }
};