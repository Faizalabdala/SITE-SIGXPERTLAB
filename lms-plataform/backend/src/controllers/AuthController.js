const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = "segredo_super_secreto_mude_em_producao"; // Em produção, use .env!

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Verifica se já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email já registado" });

    // Encripta a senha
    const hashPassword = await bcrypt.hash(password, 10);

    // Cria o utilizador
    const user = await prisma.user.create({
      data: { name, email, password: hashPassword },
    });

    res.json({ message: "Utilizador criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registar" });
  }
};

// ... (mantenha o topo do arquivo igual)

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Credenciais inválidas" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(400).json({ error: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "segredo_super_secreto_mude_em_producao",
      { expiresIn: "1d" }
    );

    // A CORREÇÃO ESTÁ AQUI EMBAIXO:
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // <--- ADICIONE ESTA LINHA! Sem ela, o Frontend fica cego.
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer login" });
  }
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body; // Novo: Inclui 'name' e 'password'

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email já registado" });

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          error: "Nome, Email e Senha são obrigatórios para o cadastro.",
        });
    }

    // Encripta a senha antes de salvar
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashPassword, role: "student" },
    });

    res.json({ message: "Utilizador criado com sucesso! Faça Login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registar" });
  }
};
