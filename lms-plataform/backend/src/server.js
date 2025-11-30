const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios"); // ← ADICIONE ESTA LINHA

// Importações
const AuthController = require("./controllers/AuthController");
const AdminController = require("./controllers/AdminController");
const authMiddleware = require("./middlewares/auth");
const adminMiddleware = require("./middlewares/admin");

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// Rotas Públicas
app.post("/register", AuthController.register);
app.post("/login", AuthController.login);

app.get("/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: { _count: { select: { modules: true } } },
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar cursos" });
  }
});

app.get("/courses/:id", async (req, res) => {
  const { id } = req.params;

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = require("jsonwebtoken").decode(token);
      if (decoded) userId = decoded.id;
    } catch (e) {}
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                progress: {
                  where: { userId: userId ? userId : -1 },
                  select: {
                    status: true,
                    progressPercent: true,
                    lastWatchedSecond: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course) return res.status(404).json({ error: "Curso não encontrado" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar detalhes" });
  }
});

// Rota: Meus Cursos (Dashboard Inteligente)
app.get("/my-courses", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user)
      return res.status(404).json({ error: "Utilizador não encontrado" });

    let coursesData = [];

    if (user.role === "admin") {
      const allCourses = await prisma.course.findMany({
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  progress: { where: { userId } },
                },
              },
            },
          },
        },
      });
      coursesData = allCourses;
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
                    include: {
                      progress: { where: { userId } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      coursesData = enrollments.map((e) => e.course);
    }

    const formattedCourses = coursesData.map((course) => {
      let totalLessons = 0;
      let completedLessons = 0;

      course.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          totalLessons++;
          if (
            lesson.progress.length > 0 &&
            lesson.progress[0].status === "completed"
          ) {
            completedLessons++;
          }
        });
      });

      const totalProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      return {
        ...course,
        totalProgress,
      };
    });

    res.json(formattedCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar cursos" });
  }
});

// Rota de Progresso Inteligente
app.post("/progress", authMiddleware, async (req, res) => {
  const { lessonId, seconds, percent, status } = req.body;
  const userId = req.userId;

  try {
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    let newPercent = percent;
    let newStatus = status;

    if (existingProgress) {
      newPercent = Math.max(existingProgress.progressPercent, percent);
      if (existingProgress.status === "completed") {
        newStatus = "completed";
      }
    }

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        lastWatchedSecond: seconds,
        progressPercent: newPercent,
        status: newStatus,
        updatedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        lastWatchedSecond: seconds,
        progressPercent: percent,
        status,
      },
    });

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar progresso" });
  }
});

// --- ROTAS DE ADMIN ---
app.put(
  "/admin/courses/:id",
  authMiddleware,
  adminMiddleware,
  AdminController.updateCourse
);

app.delete(
  "/admin/modules/:id",
  authMiddleware,
  adminMiddleware,
  AdminController.deleteModule
);

app.delete(
  "/admin/lessons/:id",
  authMiddleware,
  adminMiddleware,
  AdminController.deleteLesson
);

app.post(
  "/admin/courses",
  authMiddleware,
  adminMiddleware,
  AdminController.createCourse
);

app.post(
  "/admin/modules",
  authMiddleware,
  adminMiddleware,
  AdminController.createModule
);

app.post(
  "/admin/lessons",
  authMiddleware,
  adminMiddleware,
  AdminController.createLesson
);

// --- ROTA DE VERIFICAÇÃO DE PAGAMENTO (CORRIGIDA) ---
app.post("/verify-payment", async (req, res) => {
  try {
    const { transaction_id, course_id, user_id } = req.body;

    // Verifica o pagamento na Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status === "successful") {
      // PAGAMENTO CONFIRMADO - Matricular usuário
      try {
        // Verifica se já está matriculado usando Prisma
        const existingEnrollment = await prisma.enrollment.findFirst({
          where: {
            userId: parseInt(user_id),
            courseId: parseInt(course_id),
          },
        });

        if (!existingEnrollment) {
          // Cria nova matrícula
          await prisma.enrollment.create({
            data: {
              userId: parseInt(user_id),
              courseId: parseInt(course_id),
              enrolledAt: new Date(),
              paymentMethod: paymentData.payment_type,
              transactionId: transaction_id.toString(),
              amount: paymentData.amount,
            },
          });

          console.log(
            `✅ Usuário ${user_id} matriculado no curso ${course_id}`
          );
        }

        res.json({
          success: true,
          message: "Pagamento confirmado e usuário matriculado!",
          payment_data: paymentData,
        });
      } catch (dbError) {
        console.error("Erro no banco de dados:", dbError);
        res.status(500).json({
          success: false,
          error: "Erro ao matricular usuário",
        });
      }
    } else {
      res.json({
        success: false,
        message: "Pagamento não confirmado",
        status: paymentData.status,
      });
    }
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar pagamento",
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
});
