const { Permission, Role } = require("../models");

const createPermission = async (req, res) => {
  try {
    const permission = await Permission.create(req.body);
    res.status(201).json(permission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      include: [
        {
          model: Role,
          as: "role_permisssions",
        },
      ],
    });
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          as: "roles",
        },
      ],
    });
    if (permission) {
      res.status(200).json(permission);
    } else {
      res.status(404).json({ error: "Permission not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePermission = async (req, res) => {
  try {
    const [updated] = await Permission.update(req.body, {
      where: { permission_id: req.params.id },
    });
    if (updated) {
      const updatedPermission = await Permission.findByPk(req.params.id, {
        include: [
          {
            model: Role,
            as: "role_permisssions",
          },
        ],
      });
      res.status(200).json(updatedPermission);
    } else {
      res.status(404).json({ error: "Permission not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deletePermission = async (req, res) => {
  try {
    const deleted = await Permission.destroy({
      where: { permission_id: req.params.id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Permission not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
};
