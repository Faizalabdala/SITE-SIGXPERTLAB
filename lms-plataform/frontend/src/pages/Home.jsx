import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import "../styles/Landing.css";
import "../styles/Dashboard.css";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("meus-cursos");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  console.log("🔍 DEBUG - Home carregado");
  console.log("👤 User:", user);
  console.log("📚 Cursos públicos:", courses.length);
  console.log("🎓 Meus cursos:", myCourses.length);
  useEffect(() => {
    checkUser();
    loadPublicCourses();
  }, []);

  const checkUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadMyCourses();
    }
  };

  const loadPublicCourses = () => {
    api
      .get("/courses")
      .then((res) => setCourses(res.data))
      .catch(console.error);
  };

  const loadMyCourses = () => {
    api
      .get("/my-courses")
      .then((res) => setMyCourses(res.data))
      .catch(console.error);
  };

  const handleLoginSuccess = (userData) => {
    console.log("🔑 Login success - redirecionando...");
    setUser(userData);
    loadMyCourses();

    const pendingCourse = localStorage.getItem("pendingPaymentCourse");
    console.log("📦 Curso pendente?", pendingCourse);

    if (pendingCourse) {
      const course = JSON.parse(pendingCourse);
      localStorage.removeItem("pendingPaymentCourse");
      console.log("🎯 Fluxo: Home → Login → Pagamento");

      setTimeout(() => {
        const hasAccess = myCourses.some((c) => c.id === course.id);

        if (hasAccess || course.isFree) {
          console.log("✅ Tem acesso - indo para player");
          navigate(`/player/${course.id}`);
        } else {
          console.log("💳 Sem acesso - indo para pagamento");
          handleBuyCourse(course);
        }
      }, 500);
    } else {
      console.log("🏠 Login normal - indo para /student");
      navigate("/student"); // ← DEVE REDIRECIONAR AQUI
    }
  };
  const handleLogout = () => {
    if (confirm("Deseja sair?")) {
      localStorage.clear();
      setUser(null);
      setMyCourses([]);
      window.location.reload();
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
    const hasAccess = myCourses.some((c) => c.id === course.id);

    if (hasAccess || course.isFree) {
      // Tem acesso - vai direto para o curso
      navigate(`/player/${course.id}`);
    } else {
      // Não tem acesso - vai para pagamento
      handleBuyCourse(course);
    }
  };

  // --- FUNÇÃO SIMPLES E FUNCIONAL PARA COMPRAR CURSO ---
  const handleBuyCourse = (course) => {
    console.log("🎯 Curso clicado:", course.title);
    console.log("🔐 User logado?", !!user);
    console.log("💵 Curso é grátis?", course.isFree);

    if (!user) {
      console.log("❌ Usuário não definido");
      setIsModalOpen(true);
      return;
    }

    // Configuração direta do Flutterwave
    const config = {
      public_key: "FLWPUBK_TEST-SANDBOXDEMOKEY-X",
      tx_ref: `curso-${course.id}-${Date.now()}-${user.id}`,
      amount: course.price,
      currency: "MZN",
      payment_options: "card, mobilemoney, ussd",
      redirect_url: `${window.location.origin}/payment-success?course_id=${course.id}&user_id=${user.id}`,
      customer: {
        email: user.email,
        name: user.name,
        phone_number: user.phone || "",
      },
      customizations: {
        title: "SigXpert Lab",
        description: `Curso: ${course.title}`,
        logo: `${window.location.origin}/logo.png`,
      },
      meta: {
        course_id: course.id,
        user_id: user.id,
        course_name: course.title,
      },
    };

    console.log("🔄 Configuração Flutterwave:", config);

    // Método direto - sem hooks complexos
    if (typeof window.FlutterwaveCheckout === "function") {
      console.log("✅ Flutterwave carregado - abrindo checkout");
      window.FlutterwaveCheckout(config);
    } else {
      console.log("📥 Carregando Flutterwave...");
      // Carrega o script dinamicamente
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.onload = () => {
        console.log("✅ Script carregado - abrindo checkout");
        window.FlutterwaveCheckout(config);
      };
      document.body.appendChild(script);
    }
  };
  // Função para verificar pagamento
  const verifyPayment = async (transactionId, courseId, userId) => {
    try {
      console.log("🔍 Verificando pagamento:", {
        transactionId,
        courseId,
        userId,
      });

      const response = await api.post("/verify-payment", {
        transaction_id: transactionId,
        course_id: courseId,
        user_id: userId,
      });

      console.log("✅ Resposta do pagamento:", response.data);

      if (response.data.success) {
        alert("🎉 Pagamento confirmado! Agora você tem acesso ao curso.");
        // Recarrega os cursos para atualizar a lista
        await loadMyCourses();
        // Vai direto para o curso
        navigate(`/player/${courseId}`);
      } else {
        alert("⏳ Pagamento em processamento. Aguarde a confirmação.");
      }
    } catch (error) {
      console.error("❌ Erro ao verificar pagamento:", error);
      alert("😕 Erro ao verificar pagamento. Entre em contato conosco.");
    }
  };

  // === RENDERIZAÇÃO DASHBOARD (SE LOGADO) ===
  if (user) {
    return (
      <div className="dash-container">
        <header className="dash-header">
          <div className="logo">
            <h1>Geomatica360</h1>
          </div>
          <div style={{ position: "relative" }}>
            <div
              className="user-pill"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="pill-avatar">{user.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: "bold" }}>{user.name}</div>
                <div style={{ fontSize: "0.8rem" }}>Online</div>
              </div>
              <i className="fas fa-chevron-down" style={{ marginLeft: 5 }}></i>
            </div>
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  right: 0,
                  background: "white",
                  color: "#333",
                  borderRadius: "8px",
                  boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
                  zIndex: 100,
                  width: "200px",
                  overflow: "hidden",
                }}
              >
                {user.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin/courses/new")}
                    style={{
                      width: "100%",
                      padding: "15px",
                      border: "none",
                      background: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "red",
                      fontWeight: "bold",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    + Criar Curso
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "15px",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="nav-tabs">
          <button
            className={`dash-btn ${
              activeTab === "meus-cursos" ? "active" : ""
            }`}
            onClick={() => setActiveTab("meus-cursos")}
          >
            Meus Cursos
          </button>
          <button
            className={`dash-btn ${
              activeTab === "certificados" ? "active" : ""
            }`}
            onClick={() => setActiveTab("certificados")}
          >
            Certificados
          </button>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
          {activeTab === "meus-cursos" && (
            <div className="cursos-grid">
              {(myCourses.length > 0 ? myCourses : []).map((course) => (
                <div
                  key={course.id}
                  className="dash-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "white",
                    borderRadius: "10px",
                    overflow: "hidden",
                    padding: 0,
                  }}
                >
                  <div style={{ height: "150px", width: "100%" }}>
                    <img
                      src={getCourseImage(course.title)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div style={{ padding: "20px", width: "100%" }}>
                    <h3>{course.title}</h3>
                    {course.isFree && (
                      <span
                        style={{
                          color: "green",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                        }}
                      >
                        GRATUITO
                      </span>
                    )}
                    <div className="dash-progress-bg">
                      <div
                        className="dash-progress-fill"
                        style={{ width: `${course.totalProgress || 0}%` }}
                      ></div>
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#666",
                        marginTop: "5px",
                      }}
                    >
                      {course.totalProgress || 0}% Concluído
                    </p>
                    <button
                      onClick={() => navigate(`/player/${course.id}`)}
                      className="btn-primary"
                      style={{ marginTop: "15px", width: "100%" }}
                    >
                      Continuar
                    </button>
                    {user.role === "admin" && (
                      <button
                        onClick={() => navigate(`/admin/courses/${course.id}`)}
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          padding: "5px",
                          background: "none",
                          border: "1px solid #ccc",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === RENDERIZAÇÃO LANDING PAGE (NÃO LOGADO) ===
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
          <button className="btn-login" onClick={() => setIsModalOpen(true)}>
            Login
          </button>
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

              {/* Lógica do Botão Inteligente */}
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
          {" "}
          {/* Reutilizando grid de cursos para layout */}
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

          {/* === NOVA SEÇÃO DE CADASTRO === */}
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
                  // Limpa o formulário
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
