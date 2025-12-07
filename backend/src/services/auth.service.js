const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppDataSource } = require("../config/database");

class AuthService {
  async register(userData) {
    const userRepository = AppDataSource.getRepository("User");

    // check if email OR username already exist
    const existingUser = await userRepository.findOne({
      where: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // create user with default role 'user'
    const user = userRepository.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || "user", // Add role, default to 'user'
    });

    return await userRepository.save(user);
  }

  async login(identifier, password) {
    const userRepository = AppDataSource.getRepository("User");

    // separate if identifier is email or username
    const isEmail = identifier.includes("@");

    const user = await userRepository.findOne({
      where: isEmail ? { email: identifier } : { username: identifier },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // generate JWT token WITH role
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET || "nisclfasdlkd3553235f4d65fd",
      { expiresIn: "24h" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getUserById(userId) {
    const userRepository = AppDataSource.getRepository("User");
    return await userRepository.findOne({
      where: { id: userId },
      select: ["id", "email", "username", "createdAt"],
    });
  }
}

module.exports = new AuthService();
