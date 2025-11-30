const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    // req.userId vem do authMiddleware anterior
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilizador não encontrado." });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({
          error:
            "Acesso negado. Apenas administradores podem realizar esta ação.",
        });
    }

    next(); // É admin, pode passar!
  } catch (error) {
    return res.status(500).json({ error: "Erro ao verificar permissões." });
  }
};
