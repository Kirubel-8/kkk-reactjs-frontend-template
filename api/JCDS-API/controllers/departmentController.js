const { Department, User } = require("../models");
const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const createDepartment = async (req, res) => {
  try {
    const department_id = uuidv4();

    const existingDepartment = await Department.findOne({
      where: {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          Sequelize.fn("LOWER", req.body.name)
        ),
      },
    });

    if (existingDepartment) {
      return res
        .status(400)
        .json({ error: "A department with this name already exists" });
    }

    const department = await Department.create({ ...req.body, department_id });
    return res.status(201).json(department);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "users",
        },
      ],
    });
    if (department) {
      res.status(200).json(department);
    } else {
      res.status(404).json({ error: "Department not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id.trim();
    const department = await Department.findByPk(departmentId);
    if (!department) {
      console.log(`No department found with ID: ${departmentId}`);
      return res.status(404).json({ error: "Department not found" });
    }

    const { name } = req.body;
    if (name) {
      const existingDepartment = await Department.findOne({
        where: {
          name: Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("name")),
            Sequelize.fn("LOWER", name)
          ),
        },
      });

      if (
        existingDepartment &&
        existingDepartment.department_id !== departmentId
      ) {
        return res
          .status(400)
          .json({ error: "A department with this name already exists" });
      }
    }

    const updatedData = { ...req.body };

    department.set(updatedData);

    const updatedDepartment = await department.save();

    console.log(`Department updated successfully: ${departmentId}`);
    return res.status(200).json({
      message: "Department updated successfully",
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const deleted = await Department.destroy({
      where: { department_id: req.params.id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Department not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
