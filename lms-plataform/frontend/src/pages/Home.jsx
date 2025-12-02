import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import "../styles/Landing.css";
import "../styles/Dashboard.css";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    loadPublicCourses();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      // Se o usuário está logado E está na Home, redireciona para /student
      console.log("🔍 Usuário logado na Home - redirecionando para /student");
      navigate("/student", { replace: true }); // replace: true para limpar histórico
    }
  }, [user, navigate]);

  const checkUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const loadPublicCourses = () => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data))
      .catch(console.error);
  };

  const handleLoginSuccess = (userData) => {
    console.log("🔑 Login success - redirecionando...");
    setUser(userData);

    const pendingCourse = localStorage.getItem("pendingPaymentCourse");

    if (pendingCourse) {
      const course = JSON.parse(pendingCourse);
      localStorage.removeItem("pendingPaymentCourse");

      // Verificar acesso após login
      setTimeout(() => {
        api
          .get("/my-courses")
          .then((res) => {
            const myCourses = res.data;
            const hasAccess = myCourses.some((c) => c.id === course.id);

            if (hasAccess || course.isFree) {
              console.log("✅ Tem acesso - indo para player");
              navigate(`/player/${course.id}`);
            } else {
              console.log("💳 Sem acesso - indo para pagamento");
              handleBuyCourse(course, userData);
            }
          })
          .catch(console.error);
      }, 500);
    } else {
      console.log("🏠 Login normal - indo para /student");
      navigate("/student");
      // Fechar modal se estiver aberto
      setIsModalOpen(false);
    }
  };

  // Função Imagens
  const getCourseImage = (title) => {
    const t = title.toLowerCase();
    if (t.includes("arcgis")) return "/arcgis logo.png";
    if (t.includes("qgis")) return "/qgis logo.png";
    if (t.includes("terrset")) return "/terrset logo.png";
    if (t.includes("postgis") || t.includes("base de dados"))
      return "/postgis logo.png";
    if (t.includes("programação")) return "/Programacao logo.png";
    return "/mapa.jpg";
  };

  // --- LOGIC DE BOTÃO DE CURSO (PAGO/GRATIS) ---
  const handleCourseAction = (course) => {
    if (!user) {
      // Se não logado: Login → depois Pagamento direto
      setIsModalOpen(true);
      // Guarda o curso específico para pagamento pós-login
      localStorage.setItem("pendingPaymentCourse", JSON.stringify(course));
      return;
    }

    // Se logado, verifica acesso
    api
      .get("/my-courses")
      .then((res) => {
        const myCourses = res.data;
        const hasAccess = myCourses.some((c) => c.id === course.id);

        if (hasAccess || course.isFree) {
          navigate(`/player/${course.id}`);
        } else {
          handleBuyCourse(course, user);
        }
      })
      .catch(console.error);
  };

  // --- FUNÇÃO SIMPLES E FUNCIONAL PARA COMPRAR CURSO ---
  const handleBuyCourse = (course, userData) => {
    console.log("🎯 Curso clicado:", course.title);

    const config = {
      public_key: "FLWPUBK_TEST-SANDBOXDEMOKEY-X",
      tx_ref: `curso-${course.id}-${Date.now()}-${userData.id}`,
      amount: course.price,
      currency: "MZN",
      payment_options: "card, mobilemoney, ussd",
      redirect_url: `${window.location.origin}/payment-success?course_id=${course.id}&user_id=${userData.id}`,
      customer: {
        email: userData.email,
        name: userData.name,
        phone_number: userData.phone || "",
      },
      customizations: {
        title: "SigXpert Lab",
        description: `Curso: ${course.title}`,
        logo: `${window.location.origin}/logo.png`,
      },
      meta: {
        course_id: course.id,
        user_id: userData.id,
        course_name: course.title,
      },
    };

    console.log("🔄 Configuração Flutterwave:", config);

    if (typeof window.FlutterwaveCheckout === "function") {
      console.log("✅ Flutterwave carregado - abrindo checkout");
      window.FlutterwaveCheckout(config);
    } else {
      console.log("📥 Carregando Flutterwave...");
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.onload = () => {
        console.log("✅ Script carregado - abrindo checkout");
        window.FlutterwaveCheckout(config);
      };
      document.body.appendChild(script);
    }
  };

  // === RENDERIZAÇÃO APENAS LANDING PAGE (SEM DASHBOARD) ===
  return (
    <div className="landing-page">
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <header className="navbar">
        <div className="logo">
          <h1>SigXpert Lab</h1>
          <p className="logo-slogan">
            A bússola rumo à formação em geotecnologias
          </p>
        </div>
        <div className="nav-links">
          <a href="#hero">Início</a>
          <a href="#cursos">Cursos</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato">Contato</a>
          {!user ? (
            <button className="btn-login" onClick={() => setIsModalOpen(true)}>
              Login
            </button>
          ) : (
            // Quando logado, mostra apenas o nome do usuário (não é clicável)
            <span
              style={{ color: "#4CAF50", fontWeight: "bold", padding: "10px" }}
            >
              {user.name}
            </span>
          )}
        </div>
      </header>
      <section id="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Domine o GIS com Excelência</h1>
            <p>Aprenda com especialistas e transforme sua carreira.</p>
            <button
              className="btn-secondary"
              onClick={() => document.getElementById("cursos").scrollIntoView()}
            >
              Comece Agora
            </button>
          </div>
          <div className="hero-image">
            <img src="/mapa.jpg" alt="Mapa GIS" />
          </div>
        </div>
      </section>
      <section id="cursos">
        <h2>Nossos Cursos</h2>
        <div className="cursos-grid">
          {courses.map((course) => (
            <div key={course.id} className="curso-card">
              <div className="curso-img">
                <img src={getCourseImage(course.title)} alt={course.title} />
              </div>
              <h3>{course.title}</h3>
              <p>
                {course.description
                  ? course.description.substring(0, 80) + "..."
                  : ""}
              </p>

              <div className="curso-preco">
                {course.isFree ? (
                  <span className="preco-free">GRATUITO</span>
                ) : (
                  <>
                    <span className="preco-original">
                      MT {parseFloat(course.price) + 2000}
                    </span>
                    <span className="preco-atual">MT {course.price}</span>
                  </>
                )}
              </div>

              <button
                onClick={() => handleCourseAction(course)}
                className="btn-outline"
              >
                {course.isFree ? "Acessar Agora" : "Comprar / Saiba Mais"}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section id="sobre">
        <h2>Sobre Nós</h2>
        <div className="sobre-container">
          <div className="sobre-card">
            <h3>
              <i className="fas fa-bullseye"></i> Missão
            </h3>
            <p>
              Capacitar profissionais e estudantes com conhecimentos de
              excelência em Sistemas de Informação Geográfica, fornecendo
              formação especializada que combina teoria sólida com prática
              aplicada, preparando nossos alunos para enfrentar os desafios do
              mercado geoespacial com competência e inovação.
            </p>
          </div>
          <div className="sobre-card">
            <h3>
              <i className="fas fa-eye"></i> Visão
            </h3>
            <p>
              Ser reconhecida como a principal referência em formação GIS na
              região, destacando-se pela excelência no ensino, inovação
              tecnológica e pela capacidade de transformar dados geoespaciais em
              soluções inteligentes que impulsionam o desenvolvimento
              sustentável e a tomada de decisões estratégicas.
            </p>
          </div>
          <div className="sobre-card">
            <h3>
              <i className="fas fa-gem"></i> Valores
            </h3>
            <p>
              <b>Excelência:</b> Compromisso com os mais altos padrões de
              qualidade em ensino e serviços. <br />
              <br /> <b>Inovação:</b> Busca contínua por soluções criativas e
              tecnologicamente avançadas. <br />
              <br />
              <b>Integridade:</b>
              Ética e transparência em todas as nossas relações e processos.
              <br />
              <br />
              <b>Colaboração:</b> Trabalho em equipe e parcerias estratégicas
              para amplificar resultados.
            </p>
          </div>
        </div>
      </section>
      <section id="beneficios">
        <h2>Por que escolher a SigXpert?</h2>
        <div className="cursos-grid" style={{ color: "white" }}>
          <div className="sobre-card">
            <h3>Certificação</h3>
            <p>Reconhecida internacionalmente.</p>
          </div>
          <div className="sobre-card">
            <h3>Suporte</h3>
            <p>Mentoria personalizada.</p>
          </div>
          <div className="sobre-card">
            <h3>Flexibilidade</h3>
            <p>Estude ao seu ritmo.</p>
          </div>
        </div>
      </section>
      <section id="contato">
        <div className="contato-container">
          <h2>Entrar em Contato</h2>
          <div style={{ marginBottom: "3rem" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
              Converse diretamente conosco.
            </p>
            <button
              className="btn-whatsapp"
              onClick={() =>
                window.open(
                  "https://wa.me/258845478733?text=Olá, tenho interesse nos cursos",
                  "_blank"
                )
              }
            >
              <i className="fab fa-whatsapp" style={{ fontSize: "1.5rem" }}></i>{" "}
              CLIQUE PARA FALAR NO WHATSAPP
            </button>
          </div>

          <div className="cadastro-section">
            <h2 style={{ fontSize: "2rem" }}>Crie sua conta gratuita</h2>
            <p>Cadastre-se e comece a aprender agora!</p>

            <form
              className="cadastro-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const userData = {
                  name: formData.get("name"),
                  email: formData.get("email"),
                  password: formData.get("password"),
                };

                try {
                  const response = await api.post("/register", userData);
                  alert(
                    "Cadastro realizado com sucesso! Faça login para continuar."
                  );
                  e.target.reset();
                } catch (error) {
                  alert(
                    error.response?.data?.error ||
                      "Erro ao cadastrar. Tente novamente."
                  );
                }
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="Seu nome completo"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Seu melhor email"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Crie uma senha"
                required
                minLength="6"
              />
              <button type="submit" className="btn-cadastrar">
                CRIAR MINHA CONTA
              </button>

              <p
                style={{
                  marginTop: "15px",
                  fontSize: "0.9rem",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4CAF50",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Faça login aqui
                </button>
              </p>
            </form>
          </div>
        </div>
      </section>
      <footer>
        <div className="footer-content">
          <div className="footer-info">
            <h3>SigXpert Lab</h3>
            <p>A bússola rumo à formação.</p>
          </div>
          <div className="footer-links">
            <a href="#">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 SigXpert Lab.</p>
        </div>
      </footer>
    </div>
  );
}
