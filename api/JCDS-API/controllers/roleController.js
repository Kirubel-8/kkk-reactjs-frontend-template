const paginationMiddleware = require("../middleware/paginationMiddleware");
const { Role, RoleHasPermission, Permission, User } = require("../models");
const { v4: uuidv4 } = require("uuid");

const createRole = async (req, res) => {
  const { name, permissions, description } = req.body;


  try {
    const role_id = uuidv4();
    const role = await Role.create({ name, description, role_id });

    if (permissions && permissions.length > 0) {
      const rolePermissionPromises = permissions.map((permissionId) => {
        const role_has_permission_id = uuidv4();


        RoleHasPermission.create({
          role_has_permission_id,
          role_id: role.role_id,
          permission_id: permissionId,
        });
      });

      await Promise.all(rolePermissionPromises);
    }

    res.status(201).json({
      message: "Role created successfully",
      role,
      permissions,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(400).json({ error: error.message });
  }
};

const getAllRoles = [
  paginationMiddleware,
  async (req, res) => {
    try {
      const { page, limit, offset } = req.pagination;

      const roles = await Role.findAll({
        include: [
          {
            model: User,
            as: "users",
          },
          {
            model: Permission,
            as: "permissions",
          },
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });
      const totalRoles = await Role.count();
      const totalPages = Math.ceil(totalRoles / limit);
      res.status(200).json({
        roles,
        pagination: {
          totalRoles,
          totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }]


const getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "users",
        },
        {
          model: Permission,
          as: "permissions",
        },
      ],
    });
    if (role) {
      res.status(200).json(role);
    } else {
      res.status(404).json({ error: "Role not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRole = async (req, res) => {
  const { name, permissions, description } = req.body;
  const roleId = req.params.id;
  try {
    const existingRole = await Role.findByPk(roleId, {
      include: [
        {
          model: User,
          as: "users",
        },
        {
          model: Permission,
          as: "permissions",
        },
      ],
    });

    if (!existingRole) {
      return res.status(404).json({
        message: "Role not found.",
      });
    }

    const updatedRoleData = {
      name: name || existingRole.name,
      description: description || existingRole.description,
    };

    const [updated] = await Role.update(updatedRoleData, {
      where: { role_id: roleId },
    });

    if (permissions && permissions.length > 0) {
      await RoleHasPermission.destroy({
        where: { role_id: roleId },
      });

      const rolePermissionPromises = permissions.map((permissionId) => {
        const role_has_permission_id = uuidv4();

        RoleHasPermission.create({
          role_has_permission_id,
          role_id: roleId,
          permission_id: permissionId,
        })
      }
      );

      await Promise.all(rolePermissionPromises);
    }
    const updatedRole = await Role.findByPk(roleId, {
      include: [
        {
          model: User,
          as: "users",
        },
        {
          model: Permission,
          as: "permissions",
        },
      ],
    });
    res.status(200).json({
      message: "Role updated successfully",
      role: updatedRole,
      permissions,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(400).json({ error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const deleted = await Role.destroy({
      where: { role_id: req.params.id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Role not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
