const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppDataSource } = require("../config/database");
const { JwtConfig } = require("../config/config");

class AuthService {
  async register(userData) {
    const userRepository = AppDataSource.getRepository("User");

    const existingUser = await userRepository.findOne({
      where: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return await userRepository.save(user);
  }

  async login(identifier, password) {
    const userRepository = AppDataSource.getRepository("User");

    const isEmail = identifier.includes("@");

    const user = await userRepository.findOne({
      where: isEmail ? { email: identifier } : { username: identifier },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      JwtConfig.JWT_SECRET,
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
