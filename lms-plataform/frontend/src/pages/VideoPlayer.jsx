import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlayerVimeo from "@vimeo/player";
import api from "../services/api";
import "../styles/Player.css";

export default function VideoPlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [user, setUser] = useState(null);

  const videoRef = useRef(null);
  const vimeoPlayerRef = useRef(null);

  // Refs para o intervalo de salvamento acessar o estado mais recente sem bugs
  const activeLessonRef = useRef(null);
  const userRef = useRef(null);

  // Atualiza as refs sempre que o estado muda
  useEffect(() => {
    activeLessonRef.current = activeLesson;
  }, [activeLesson]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 1. Carregar Dados Iniciais
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    userRef.current = parsedUser;

    api.get(`/courses/${courseId}`).then((response) => {
      const courseData = response.data;
      setCourse(courseData);

      // Encontrar última aula assistida
      let lastLesson = null;
      let maxDate = 0;

      if (courseData.modules) {
        courseData.modules.forEach((mod) => {
          mod.lessons.forEach((les) => {
            if (les.progress && les.progress.length > 0) {
              const pDate = new Date(les.progress[0].updatedAt).getTime();
              if (pDate > maxDate) {
                maxDate = pDate;
                lastLesson = les;
              }
            }
          });
        });
      }

      if (lastLesson) setActiveLesson(lastLesson);
      else if (
        courseData.modules.length > 0 &&
        courseData.modules[0].lessons.length > 0
      ) {
        setActiveLesson(courseData.modules[0].lessons[0]);
      }
    });
  }, [courseId]);

  // 2. Configurar Player
  useEffect(() => {
    if (!activeLesson || !videoRef.current) return;

    // Destruir anterior
    if (vimeoPlayerRef.current) {
      vimeoPlayerRef.current.destroy().catch(() => {});
    }

    const player = new PlayerVimeo(videoRef.current, {
      id: activeLesson.vimeoId,
      responsive: true,
      autoplay: true,
      // Tenta forçar controles nativos (inclui Fullscreen)
      controls: true,
      dnt: true,
    });

    vimeoPlayerRef.current = player;

    // --- RETOMAR TEMPO ---
    player.on("loaded", () => {
      const currentLesson = activeLessonRef.current; // Usa Ref para garantir valor atual
      if (
        currentLesson &&
        currentLesson.progress &&
        currentLesson.progress.length > 0
      ) {
        const savedTime = currentLesson.progress[0].lastWatchedSecond;
        const isCompleted = currentLesson.progress[0].status === "completed";

        // Pula se > 5s e não acabou
        if (savedTime > 5 && !isCompleted) {
          setTimeout(() => {
            player
              .setCurrentTime(savedTime)
              .catch((e) => console.log("Erro seek:", e));
          }, 500); // Pequeno delay para estabilidade
        }
      }
    });

    // Salvar a cada 5 segundos
    const saveInterval = setInterval(async () => {
      // Pega o tempo direto do player
      const time = await player.getCurrentTime();
      const duration = await player.getDuration();

      if (duration > 0 && time > 0) {
        const percent = Math.round((time / duration) * 100);
        // Usa a Ref para garantir que salvamos na aula certa
        if (userRef.current && activeLessonRef.current) {
          updateProgress(activeLessonRef.current.id, Math.floor(time), percent);
        }
      }
    }, 5000);

    player.on("ended", () => {
      if (activeLessonRef.current)
        updateProgress(activeLessonRef.current.id, 0, 100);
    });

    return () => clearInterval(saveInterval);
  }, [activeLesson]); // Recria apenas quando muda a aula

  const updateProgress = async (lessonId, seconds, percent) => {
    if (!userRef.current) return;
    const status = percent >= 90 ? "completed" : "started";

    try {
      await api.post("/progress", { lessonId, seconds, percent, status });

      // Atualiza visualmente se concluiu
      if (status === "completed") {
        setCourse((prev) => {
          if (!prev) return null;
          const newMods = prev.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId
                ? {
                    ...l,
                    progress: [{ status: "completed", progressPercent: 100 }],
                  }
                : l
            ),
          }));
          return { ...prev, modules: newMods };
        });
      }
    } catch (error) {
      console.error("Erro save:", error);
    }
  };

  if (!course || !activeLesson)
    return <div style={{ padding: 20 }}>A carregar aula...</div>;

  return (
    <div className="player-wrapper">
      {/* Header */}
      <header className="player-header">
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate("/")}
            className="player-back-btn"
            title="Voltar"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "normal" }}>
            {course.title}
          </h1>
        </div>
        <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
          {user.name}
        </div>
      </header>

      <div className="player-body">
        {/* Esquerda: Vídeo + Texto */}
        <div className="player-main">
          <div className="video-stage">
            <div className="video-ratio-box">
              <div className="video-frame-absolute" ref={videoRef}></div>
            </div>
          </div>

          <div className="video-info">
            <h2 className="video-title">
              {activeLesson.title}
              {activeLesson.progress &&
                activeLesson.progress[0]?.status === "completed" && (
                  <span
                    style={{
                      background: "#4CAF50",
                      color: "white",
                      padding: "2px 10px",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      marginLeft: "10px",
                      verticalAlign: "middle",
                      fontWeight: "normal",
                    }}
                  >
                    VISTO
                  </span>
                )}
            </h2>

            <div className="video-desc-box">
              <h4 style={{ margin: "0 0 10px 0", color: "#555" }}>Descrição</h4>
              {activeLesson.description || "Sem descrição disponível."}
            </div>
          </div>
        </div>

        {/* Direita: Playlist Fixa */}
        <aside className="player-sidebar">
          <div className="sidebar-header">Conteúdo do Curso</div>
          {course.modules.map((module) => (
            <details
              key={module.id}
              open={module.lessons.some((l) => l.id === activeLesson.id)}
            >
              <summary>
                {module.title}
                <i
                  className="fas fa-chevron-down"
                  style={{ fontSize: "0.8rem" }}
                ></i>
              </summary>
              <div>
                {module.lessons.map((lesson) => {
                  const isCompleted =
                    lesson.progress &&
                    lesson.progress.length > 0 &&
                    lesson.progress[0].status === "completed";
                  const isActive = activeLesson.id === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`lesson-row ${isActive ? "active" : ""}`}
                    >
                      <div style={{ marginTop: "3px" }}>
                        {isCompleted ? (
                          <i
                            className="fas fa-check-circle"
                            style={{ color: "#4CAF50" }}
                          ></i>
                        ) : isActive ? (
                          <i
                            className="fas fa-play"
                            style={{ color: "#4CAF50", fontSize: "0.8rem" }}
                          ></i>
                        ) : (
                          <i
                            className="far fa-circle"
                            style={{ color: "#ccc" }}
                          ></i>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: isActive ? "black" : "#555",
                        }}
                      >
                        <div
                          style={{ fontWeight: isActive ? "bold" : "normal" }}
                        >
                          {lesson.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#999" }}>
                          {Math.floor(lesson.duration / 60)} min
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </aside>
      </div>
    </div>
  );
}
