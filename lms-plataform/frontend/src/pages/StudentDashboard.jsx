import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("catalogo");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🎯 StudentDashboard carregado");
    checkUser();
    loadAllCourses();
  }, []);

  const checkUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log("👤 Usuário no dashboard:", userData);
      setUser(userData);
      loadMyCourses();
    } else {
      console.log("❌ Nenhum usuário - redirecionando para home");
      navigate("/");
    }
  };

  const loadAllCourses = () => {
    console.log("🔄 Carregando todos os cursos...");
    api
      .get("/courses")
      .then((res) => {
        console.log("✅ Todos os cursos carregados:", res.data.length);
        setCourses(res.data);
      })
      .catch((error) => {
        console.error("❌ Erro ao carregar cursos:", error);
      });
  };

  const loadMyCourses = () => {
    console.log("🔄 Carregando meus cursos...");
    api
      .get("/my-courses")
      .then((res) => {
        console.log("✅ Meus cursos carregados:", res.data.length);
        setMyCourses(res.data);
      })
      .catch((error) => {
        console.error("❌ Erro meus cursos:", error);
      });
  };

  // Função de imagens
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

  // --- FUNÇÃO DE COMPRA SIMPLES (SEM ERROS DE API KEY) ---
  const handleBuyCourse = (course) => {
    console.log("💳 Iniciando compra do curso:", course.title);

    if (!user) {
      alert("Por favor, faça login primeiro.");
      return;
    }

    const config = {
      public_key: "FLWPUBK_TEST-8126b750bc2546fd5e6e3bf309c46c6a-X",
      tx_ref: `curso-${course.id}-${Date.now()}-${user.id}`,
      amount: course.price,
      currency: "MZN",
      payment_options: "card, mobilemoney, ussd",
      redirect_url: `${window.location.origin}/payment-success?course_id=${course.id}&user_id=${user.id}`,
      customer: {
        email: user.email,
        name: user.name,
      },
      customizations: {
        title: "SigXpert Lab",
        description: `Curso: ${course.title}`,
      },
    };

    console.log("🔄 Abrindo Flutterwave...");

    if (typeof window.FlutterwaveCheckout === "function") {
      window.FlutterwaveCheckout(config);
    } else {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.onload = () => window.FlutterwaveCheckout(config);
      document.body.appendChild(script);
    }
  };

  const handleCourseAction = (course) => {
    const hasAccess = myCourses.some((c) => c.id === course.id);
    const canAccess = hasAccess || course.isFree;

    if (canAccess) {
      navigate(`/player/${course.id}`);
    } else {
      handleBuyCourse(course);
    }
  };

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div className="logo">
          <h1>SigXpert Lab - Área do Aluno</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ color: "#666" }}>Bem-vindo, {user?.name}</span>
          <button onClick={() => navigate("/")} className="btn-outline">
            ← Voltar para Site
          </button>
        </div>
      </header>

      <div className="nav-tabs">
        <button
          className={`dash-btn ${activeTab === "catalogo" ? "active" : ""}`}
          onClick={() => setActiveTab("catalogo")}
        >
          Catálogo Completo
        </button>
        <button
          className={`dash-btn ${activeTab === "meus-cursos" ? "active" : ""}`}
          onClick={() => setActiveTab("meus-cursos")}
        >
          Meus Cursos
        </button>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* CATÁLOGO - TODOS OS CURSOS */}
        {activeTab === "catalogo" && (
          <div>
            <h2 style={{ marginBottom: "20px" }}>
              Todos os Cursos Disponíveis
            </h2>
            {courses.length === 0 ? (
              <p>Carregando cursos...</p>
            ) : (
              <div className="cursos-grid">
                {courses.map((course) => {
                  const hasAccess = myCourses.some((c) => c.id === course.id);
                  const canAccess = hasAccess || course.isFree;

                  return (
                    <div key={course.id} className="curso-card">
                      <div className="curso-img">
                        <img
                          src={getCourseImage(course.title)}
                          alt={course.title}
                        />
                      </div>
                      <h3>{course.title}</h3>
                      <p>
                        {course.description?.substring(0, 80) + "..." ||
                          "Sem descrição"}
                      </p>

                      <div className="curso-preco">
                        {course.isFree ? (
                          <span className="preco-free">GRATUITO</span>
                        ) : (
                          <span className="preco-atual">MT {course.price}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCourseAction(course)}
                        className={canAccess ? "btn-primary" : "btn-outline"}
                        style={{ width: "100%" }}
                      >
                        {canAccess ? "Acessar Curso" : "Comprar Agora"}
                      </button>

                      {!canAccess && !course.isFree && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#666",
                            textAlign: "center",
                            marginTop: "10px",
                          }}
                        >
                          Compre para ter acesso vitalício
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MEUS CURSOS - APENAS OS COM ACESSO */}
        {activeTab === "meus-cursos" && (
          <div>
            <h2 style={{ marginBottom: "20px" }}>Meus Cursos</h2>
            {myCourses.length > 0 ? (
              <div className="cursos-grid">
                {myCourses.map((course) => (
                  <div key={course.id} className="curso-card">
                    <div className="curso-img">
                      <img
                        src={getCourseImage(course.title)}
                        alt={course.title}
                      />
                    </div>
                    <h3>{course.title}</h3>
                    <p>
                      {course.description?.substring(0, 80) + "..." ||
                        "Sem descrição"}
                    </p>

                    <div className="curso-preco">
                      {course.isFree ? (
                        <span className="preco-free">GRATUITO</span>
                      ) : (
                        <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
                          COMPRADO
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/player/${course.id}`)}
                      className="btn-primary"
                      style={{ width: "100%" }}
                    >
                      Continuar Estudando
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p>Você ainda não tem cursos.</p>
                <button
                  onClick={() => setActiveTab("catalogo")}
                  className="btn-primary"
                  style={{ marginTop: "15px" }}
                >
                  Explorar Catálogo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
