const VendorModel = require('../../models/Vendor/fetchvendor.js');

exports.getVendorBasicInfo = async (req, res) => {
  try {
    // Check if id is provided in query parameters (now using vendor_details.id)
    const id = req.query.id;
    let vendors;

    if (id) {
      // If id is provided, fetch specific vendor
      vendors = await VendorModel.getVendorBasicInfoById(id);
      // If no vendor found with that ID
      if (!vendors || vendors.length === 0) {
        return res.status(404).json({
          message: `No vendor found with ID: ${id}`
        });
      }
    } else {
      // If no id, fetch all vendors
      vendors = await VendorModel.getVendorBasicInfo();
      if (!vendors || vendors.length === 0) {
        return res.status(404).json({
          message: 'No vendor details found'
        });
      }
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
    // Check if id is provided in query parameters
    const id = req.query.id;
    let vendors;

    if (id) {
      // If id is provided, fetch specific vendor
      vendors = await VendorModel.getVendorNameAndIdById(id);
      // If no vendor found with that ID
      if (!vendors || vendors.length === 0) {
        return res.status(404).json({
          message: `No vendor found with ID: ${id}`
        });
      }
    } else {
      // If no id, fetch all vendors
      vendors = await VendorModel.getVendorNameAndId();
      if (!vendors || vendors.length === 0) {
        return res.status(404).json({
          message: 'No vendor IDs found'
        });
      }
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

// Method to explicitly search by vendor_details.id
exports.searchVendorById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        message: 'Vendor ID is required'
      });
    }

    // Get both basic info and name/id information
    const basicInfo = await VendorModel.getVendorBasicInfoById(id);
    if (!basicInfo || basicInfo.length === 0) {
      return res.status(404).json({
        message: `No vendor found with ID: ${id}`
      });
    }

    res.status(200).json({
      count: basicInfo.length,
      vendors: basicInfo
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error searching vendor by ID',
      error: error.message
    });
  }
};