const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Criar Curso (CORRIGIDO)
exports.createCourse = async (req, res) => {
  // ADICIONAMOS 'isFree' AQUI NA DESESTRUTURAÇÃO
  const { title, description, price, thumbnail, isFree } = req.body;

  try {
    // Se não for grátis, preço é obrigatório. Se for grátis, preço pode ser 0.
    if (!title || (price === undefined && !isFree)) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price || 0), // Garante número
        thumbnail: thumbnail || "",
        isFree: Boolean(isFree), // Agora a variável existe!
        published: true,
      },
    });
    res.status(201).json(course);
  } catch (error) {
    console.error("Erro no createCourse:", error); // Log para ajudar no debug
    res.status(500).json({ error: "Erro ao criar curso" });
  }
};

// 2. Criar Módulo (NOVO)
exports.createModule = async (req, res) => {
  const { courseId, title } = req.body;
  try {
    const lastModule = await prisma.module.findFirst({
      where: { courseId: Number(courseId) },
      orderBy: { order: "desc" },
    });
    const newOrder = lastModule ? lastModule.order + 1 : 1;

    const module = await prisma.module.create({
      data: { title, courseId: Number(courseId), order: newOrder },
    });
    res.status(201).json(module);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar módulo" });
  }
};

// 3. Criar Aula (NOVO)
exports.createLesson = async (req, res) => {
  const { moduleId, title, description, vimeoId, duration } = req.body;
  try {
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId: Number(moduleId) },
      orderBy: { order: "desc" },
    });
    const newOrder = lastLesson ? lastLesson.order + 1 : 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        vimeoId,
        duration: Number(duration),
        moduleId: Number(moduleId),
        order: newOrder,
      },
    });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar aula" });
  }
};
// ... (funções anteriores)

// 4. Apagar Módulo
exports.deleteModule = async (req, res) => {
  const { id } = req.params;
  try {
    // O Prisma apaga as aulas dentro do módulo automaticamente se configurado com "Cascata",
    // mas por segurança vamos apagar as aulas primeiro manualmente ou confiar no delete do módulo.
    // Vamos assumir delete simples:
    await prisma.lesson.deleteMany({ where: { moduleId: Number(id) } }); // Limpa aulas
    await prisma.module.delete({ where: { id: Number(id) } }); // Apaga módulo
    res.json({ message: "Módulo apagado" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao apagar módulo" });
  }
};

// 5. Apagar Aula
exports.deleteLesson = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.lesson.delete({ where: { id: Number(id) } });
    res.json({ message: "Aula apagada" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao apagar aula" });
  }
};

// ... funções anteriores ...

// 6. Atualizar Curso (Novo)
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, thumbnail, isFree } = req.body;

  try {
    const course = await prisma.course.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        price: parseFloat(price),
        thumbnail,
        isFree: Boolean(isFree), // Garante que é boleano
      },
    });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar curso" });
  }
};
