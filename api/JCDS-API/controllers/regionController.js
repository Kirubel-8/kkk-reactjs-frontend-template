const { Region } = require("../models");
const { v4: uuidv4 } = require('uuid');

exports.createRegion = async (req, res) => {
    try {

        const existingRegion = await Region.findOne({ where: { name: req.body.name } });
        if (existingRegion) {
            return res.status(400).json({ error: 'Region with this name already exists.' });
        }

        const region = await Region.create({
            region_id: uuidv4(),
            ...req.body
        });
        res.status(201).json(region);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllRegions = async (req, res) => {
    try {
        const regions = await Region.findAll();
        res.status(200).json(regions);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getRegionById = async (req, res) => {
    try {
        const { id } = req.params;
        const region = await Region.findByPk(id);

        if (!region) {
            return res.status(404).json({ error: 'Region not found.' });
        }

        res.status(200).json(region);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRegion = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const region = await Region.findByPk(id);
        if (!region) {
            return res.status(404).json({ error: 'Region not found.' });
        }

        if (name && name !== region.name) {
            const existingRegion = await Region.findOne({ where: { name } });
            if (existingRegion) {
                return res.status(400).json({ error: 'Another region with this name already exists.' });
            }
        }

        await region.update(req.body);
        res.status(200).json(region);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteRegion = async (req, res) => {
    try {
        const { id } = req.params;
        const region = await Region.findByPk(id);

        if (!region) {
            return res.status(404).json({ error: 'Region not found.' });
        }

        await region.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};