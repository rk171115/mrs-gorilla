const VendorModel = require('../../models/Vendor/fetchvendor.js');

// Get vendor information (all or by ID)
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

// Get vendor names and IDs
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

// Search vendor by ID
exports.searchVendorById = async (req, res) => {
  try {
    const id = req.params.vendorId; // Updated to match the route parameter name
    if (!id) {
      return res.status(400).json({
        message: 'Vendor ID is required'
      });
    }
    
    // Get vendor information
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

// Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const vendorData = {
      name: req.body.name,
      address: req.body.address,
      emailId: req.body.emailId,
      phone_no: req.body.phone_no,
      vendorId: req.body.vendorId // Optional, will be generated if not provided
    };

    // Validate required fields
    if (!vendorData.name || !vendorData.emailId || !vendorData.phone_no) {
      return res.status(400).json({
        message: 'Name, email, and phone number are required fields'
      });
    }

    const newVendor = await VendorModel.createVendor(vendorData);
    
    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: newVendor
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating vendor',
      error: error.message
    });
  }
};

// Update vendor details
exports.updateVendor = async (req, res) => {
  try {
    const id = req.params.vendorId;
    if (!id) {
      return res.status(400).json({
        message: 'Vendor ID is required'
      });
    }

    // Check if vendor exists
    const existingVendors = await VendorModel.getVendorBasicInfoById(id);
    if (!existingVendors || existingVendors.length === 0) {
      return res.status(404).json({
        message: `No vendor found with ID: ${id}`
      });
    }

    const vendorData = {
      name: req.body.name,
      address: req.body.address,
      emailId: req.body.emailId,
      phone_no: req.body.phone_no,
      vendorId: req.body.vendorId
    };

    // Check if at least one field to update is provided
    if (!vendorData.name && !vendorData.address && !vendorData.emailId && 
        !vendorData.phone_no && !vendorData.vendorId) {
      return res.status(400).json({
        message: 'At least one field to update is required'
      });
    }

    const updatedVendor = await VendorModel.updateVendor(id, vendorData);
    
    res.status(200).json({
      message: 'Vendor updated successfully',
      vendor: updatedVendor
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating vendor',
      error: error.message
    });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const id = req.params.vendorId;
    if (!id) {
      return res.status(400).json({
        message: 'Vendor ID is required'
      });
    }

    // Check if vendor exists
    const existingVendors = await VendorModel.getVendorBasicInfoById(id);
    if (!existingVendors || existingVendors.length === 0) {
      return res.status(404).json({
        message: `No vendor found with ID: ${id}`
      });
    }

    const isDeleted = await VendorModel.deleteVendor(id);
    
    if (isDeleted) {
      res.status(200).json({
        message: 'Vendor deleted successfully'
      });
    } else {
      res.status(500).json({
        message: 'Failed to delete vendor'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting vendor',
      error: error.message
    });
  }
};