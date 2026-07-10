const { Team, Department, User, CaseType } = require("../models");
const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const createTeam = async (req, res) => {
  try {
    const team_id = uuidv4();
    const { department_id, name, case_type_id } = req.body;

    const department = await Department.findOne({
      where: { department_id },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const caseType = await CaseType.findByPk(case_type_id);

    if (!caseType) {
      return res.status(404).json({ error: "Case type not found" });
    }

    const existingTeam = await Team.findOne({
      where: {
        name: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          Sequelize.fn("LOWER", name)
        ),
        department_id: department_id,
      },
    });

    if (existingTeam) {
      return res.status(400).json({
        error: "A team with this name already exists in this department",
      });
    }

    const team = await Team.create({
      team_id,
      name,
      department_id: department_id,
      case_type_id,
    });
    return res.status(201).json(team);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getTeamsByDepartmentId = async (req, res) => {
  const { departmentId } = req.params;
  try {
    const teams = await Team.findAll({
      where: { department_id: departmentId },
    });

    if (!teams) {
      return res
        .status(404)
        .json({ message: "No teams found for this department." });
    }

    return res.status(200).json(teams);
  } catch (error) {
    console.error("Error fetching teams by department:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching the teams." });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: Department,
          as: "department",
        },
        {
          model: CaseType,
          as: "caseType",
        },
      ],
    });
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeamById = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: "department",
        },
        {
          model: User,
          as: "Users",
        },
      ],
    });
    if (team) {
      res.status(200).json(team);
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTeam = async (req, res) => {
  try {
    const teamId = req.params.id.trim();
    const team = await Team.findByPk(teamId);
    if (!team) {
    
      return res.status(404).json({ error: "Team not found" });
    }

    const { name } = req.body;
    if (name) {
      const existingTeam = await Team.findOne({
        where: {
          name: Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("name")),
            Sequelize.fn("LOWER", name)
          ),
        },
      });

      if (existingTeam && existingTeam.team_id !== teamId) {
        return res
          .status(400)
          .json({ error: "A team with this name already exists" });
      }
    }

    const updatedData = { ...req.body };

    team.set(updatedData);

    const updatedTeam = await team.save();

 
    return res.status(200).json({
      message: "Team updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const deleted = await Team.destroy({
      where: { team_id: req.params.id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeamsByDepartment = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

   

    const user = await User.findOne({
      where: { user_id: userId },
      include: [
        {
          model: Department,
          as: "department",
        },
      ],
    });

    if (!user || !user.department) {
      return res
        .status(404)
        .json({ error: "Department not found for this user." });
    }

    const departmentId = user.department.department_id;

    if (!departmentId) {
      return res.status(400).json({ error: "department_id is required." });
    }

    const teamsbyd = await Team.findAll({
      where: { department_id: departmentId },
      include: [
        {
          model: Department,
          as: "department",
        },
      ],
    });

    if (teamsbyd.length === 0) {
      return res
        .status(404)
        .json({ message: "No teams found for this department." });
    }

    res.status(200).json(teamsbyd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamsByDepartment,
  getTeamsByDepartmentId,
};
