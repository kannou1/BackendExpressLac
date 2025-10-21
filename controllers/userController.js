const userModel = require("../models/userSchema");

// Get all users , add user , delete user , update user

// Create a new user
module.exports.createAdmin = async (req, res) => {
  try {
    // logique
    const { nom, prenom, email, password, age, adminCode } = req.body;
    const role = "admin";
    const newUser = new userModel({
      nom,
      prenom,
      email,
      password,
      age,
      role,
      adminCode,
    });
    await newUser.save();
    res.status(201).json({ newUser, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.createClient = async (req, res) => {
  try {
    // logique
    const { nom, prenom, email, password, age, NumTel, Adresse } = req.body;
    const role = "client";
    const newUser = new userModel({
      nom,
      prenom,
      email,
      password,
      age,
      role,
      NumTel,
      Adresse,
    });
    await newUser.save();
    res.status(201).json({ newUser, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getAdmin = async (req, res) => {
  try {
    const users = await userModel.find({ role: "admin" }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getClient = async (req, res) => {
  try {
    const users = await userModel
      .find({ role: "client", age: { $mod: [3, 0] } })
      .select("email nom age ")
      .sort({ age: 1 })
      .limit(3);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getUser18 = async (req, res) => {
  try {
    const users = await userModel
      .find({ age: 18 })
      .select("email nom age ")
      .sort({ age: 1 })
      .limit(3);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getUserIntervalAge = async (req, res) => {
  try {
    const { minAge, MaxAge } = req.body;
    const users = await userModel
      .find({ age: { $gte: minAge, $lte: MaxAge } })
      .select("email nom age ")
      .sort({ age: 1 })
      .limit(3);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getMoyAgeClient = async (req, res) => {
  try {
    const users = await userModel.aggregate([
      {
        $group: {
          _id: "$role",
          averageAge: { $avg: "$age" },
        },
      },
    ]);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.getUserNameE = async (req, res) => {
  try {
    const users = await userModel.find({
      nom: { $regex: /^E/, $options: "i" },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.search = async (req, res) => {
  try {
    const { nom } = req.body;
    const users = await userModel.find({ nom: { $regex: nom, $options: "i" } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await userModel.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully", users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.deleteByCondtion = async (req, res) => {
  try {
    const users = await userModel.deleteMany({ age: { $gt: 30 } });
    res.status(200).json({ message: "User deleted successfully", users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.updateByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, age } = req.body;
    const users = await userModel.findByIdAndUpdate(
      id,
      { nom, prenom, age },
      { new: true }
    );
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.createClientWithImg = async (req, res) => {
  try {
    // logique
    const userData = { ...req.body };
    if (req.file) {
      userData.image_User = req.file.filename;
    }
    userData.role = "client";
    const newUser = new userModel(userData);
    await newUser.save();
    res.status(201).json({ newUser, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
