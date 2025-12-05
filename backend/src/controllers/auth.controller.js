const authService = require("../services/auth.service");

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          error: "Username, email and password are required",
        });
      }

      const user = await authService.register({
        username,
        email,
        password,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          error: "Invalid Credentials, try again",
        });
      }

      const result = await authService.login(identifier, password);

      res.status(200).json({
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await authService.getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
