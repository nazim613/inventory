const Setting = require('../models/Setting');

const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne({ user: req.user._id });
        if (!settings) {
            settings = await Setting.create({ user: req.user._id });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne({ user: req.user._id });
        if (!settings) {
            settings = new Setting({ user: req.user._id });
        }
        
        settings.companyName = req.body.companyName || settings.companyName;
        settings.companyEmail = req.body.companyEmail || settings.companyEmail;
        settings.companyPhone = req.body.companyPhone || settings.companyPhone;
        settings.companyLogo = req.body.companyLogo || settings.companyLogo;
        settings.invoiceLogo = req.body.invoiceLogo || settings.invoiceLogo;
        settings.invoiceFooterText = req.body.invoiceFooterText || settings.invoiceFooterText;

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
