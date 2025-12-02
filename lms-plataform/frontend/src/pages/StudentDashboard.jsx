// StudentDashboard.jsx - NOVA VERSÃO COM LAYOUT DO HOME
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("meus-cursos");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // StudentDashboard.jsx - No início do useEffect
  useEffect(() => {
    console.log("🎯 StudentDashboard carregado");

    // Verificar imediatamente se está logado
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.log("❌ Nenhum usuário - redirecionando para home");
      navigate("/");
      return; // Não carrega mais nada
    }

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

  const handleLogout = () => {
    if (confirm("Deseja sair?")) {
      localStorage.clear();
      setUser(null);
      setMyCourses([]);
      window.location.href = "/"; // Vai para home e recarrega
    }
  };

  // Função de imagens (mesma do Home)
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

  // --- FUNÇÃO DE COMPRA ---
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
      {/* HEADER NO ESTILO DO HOME */}

      <header className="dash-header">
        <div className="logo">
          <h1>Geomatica360</h1>
        </div>
        <div style={{ position: "relative" }}>
          <div
            className="user-pill"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="pill-avatar">{user?.name?.charAt(0) || "U"}</div>
            <div>
              <div style={{ fontWeight: "bold" }}>
                {user?.name || "Usuário"}
              </div>
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
              {user?.role === "admin" && (
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
              {/* REMOVER BOTÃO "Voltar para Site" */}
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
      {/* ABAS DO DASHBOARD (MEUS CURSOS, CATÁLOGO, CERTIFICADOS) */}
      <div className="nav-tabs">
        <button
          className={`dash-btn ${activeTab === "meus-cursos" ? "active" : ""}`}
          onClick={() => setActiveTab("meus-cursos")}
        >
          Meus Cursos
        </button>
        <button
          className={`dash-btn ${activeTab === "catalogo" ? "active" : ""}`}
          onClick={() => setActiveTab("catalogo")}
        >
          Catálogo Completo
        </button>
        <button
          className={`dash-btn ${activeTab === "certificados" ? "active" : ""}`}
          onClick={() => setActiveTab("certificados")}
        >
          Certificados
        </button>
      </div>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* MEUS CURSOS (COM PROGRESSO E LAYOUT DO HOME) */}
        {activeTab === "meus-cursos" && (
          <div>
            <h2 style={{ marginBottom: "20px" }}>Meus Cursos</h2>
            {myCourses.length > 0 ? (
              <div className="cursos-grid">
                {myCourses.map((course) => (
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
                        alt={course.title}
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

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "15px",
                        }}
                      >
                        <button
                          onClick={() => navigate(`/player/${course.id}`)}
                          className="btn-primary"
                          style={{ flex: 1 }}
                        >
                          Continuar
                        </button>

                        {user?.role === "admin" && (
                          <button
                            onClick={() =>
                              navigate(`/admin/courses/${course.id}`)
                            }
                            className="btn-outline"
                            style={{ padding: "5px 10px" }}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
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

        {/* CATÁLOGO COMPLETO */}
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
                          <>
                            <span className="preco-original">
                              MT {parseFloat(course.price) + 2000}
                            </span>
                            <span className="preco-atual">
                              MT {course.price}
                            </span>
                          </>
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

                      {user?.role === "admin" && (
                        <button
                          onClick={() =>
                            navigate(`/admin/courses/${course.id}`)
                          }
                          className="btn-outline"
                          style={{
                            width: "100%",
                            marginTop: "10px",
                            padding: "5px",
                          }}
                        >
                          Editar (Admin)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CERTIFICADOS */}
        {activeTab === "certificados" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <h2 style={{ marginBottom: "20px" }}>Meus Certificados</h2>
            <p style={{ color: "#666", marginBottom: "30px" }}>
              Aqui você encontrará seus certificados de conclusão de curso.
            </p>

            {/* Exemplo de certificado */}
            {myCourses.filter((course) => course.totalProgress >= 100).length >
            0 ? (
              <div className="cursos-grid">
                {myCourses
                  .filter((course) => course.totalProgress >= 100)
                  .map((course) => (
                    <div
                      key={course.id}
                      className="curso-card"
                      style={{ textAlign: "center" }}
                    >
                      <div className="curso-img">
                        <img
                          src={getCourseImage(course.title)}
                          alt={course.title}
                        />
                      </div>
                      <h3>{course.title}</h3>
                      <p style={{ color: "#4CAF50", fontWeight: "bold" }}>
                        ✓ Curso Concluído
                      </p>
                      <button
                        onClick={() =>
                          alert(
                            `Certificado do curso: ${course.title}\nEm breve disponível para download!`
                          )
                        }
                        className="btn-primary"
                        style={{ width: "100%" }}
                      >
                        Ver Certificado
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
                  Você ainda não completou nenhum curso.
                </p>
                <button
                  onClick={() => setActiveTab("meus-cursos")}
                  className="btn-primary"
                >
                  Ver Meus Cursos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
