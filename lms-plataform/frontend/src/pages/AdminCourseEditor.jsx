import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import "./../styles/AdminCourseEditor.css";

export default function AdminCourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isCreating = !courseId; // DETERMINA SE É CRIAÇÃO OU EDIÇÃO

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(!isCreating); // Só loading se for edição
  const [error, setError] = useState("");

  // Estados para o formulário do curso
  const [editingCourse, setEditingCourse] = useState(isCreating); // Em criação, já começa editando
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: "",
    isFree: false,
  });

  // Estados para módulos e aulas (só para edição)
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showLessonForm, setShowLessonForm] = useState(null);
  const [lessonData, setLessonData] = useState({
    title: "",
    vimeoId: "",
    duration: "",
    description: "",
  });

  useEffect(() => {
    if (courseId) {
      // MODO EDIÇÃO: Carrega dados existentes
      loadCourseData(courseId);
    } else {
      // MODO CRIAÇÃO: Não precisa carregar nada
      setLoading(false);
    }
  }, [courseId]);

  const loadCourseData = async (id) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/courses/${id}`);
      const courseData = res.data;

      setCourse(courseData);
      setCourseForm({
        title: courseData.title || "",
        description: courseData.description || "",
        price: courseData.price || "",
        thumbnail: courseData.thumbnail || "",
        isFree: courseData.isFree || false,
      });
    } catch (err) {
      console.error("Erro ao carregar curso:", err);
      setError("Erro ao carregar curso. Verifique o ID.");
    } finally {
      setLoading(false);
    }
  };

  // --- SALVAR CURSO (CREATE OU UPDATE) ---
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...courseForm,
        price: courseForm.isFree ? 0 : parseFloat(courseForm.price) || 0,
      };

      let response;
      if (isCreating) {
        // MODO CRIAÇÃO
        response = await api.post("/admin/courses", payload);
        alert("Curso criado com sucesso!");
        // Redireciona para a edição do curso criado
        navigate(`/admin/courses/${response.data.id}`);
      } else {
        // MODO EDIÇÃO
        response = await api.put(`/admin/courses/${courseId}`, payload);
        setEditingCourse(false);
        await loadCourseData(courseId);
        alert("Curso atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
      alert(
        error.response?.data?.error ||
          `Erro ao ${isCreating ? "criar" : "atualizar"} curso.`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- MÓDULOS E AULAS (só para edição) ---
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return alert("Digite um nome para o módulo");
    try {
      await api.post("/admin/modules", {
        courseId: course.id,
        title: newModuleTitle,
      });
      setNewModuleTitle("");
      await loadCourseData(course.id);
    } catch (e) {
      console.error("Erro ao criar módulo:", e);
      alert("Erro ao criar módulo");
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm("Tem a certeza? Isso apagará todas as aulas deste módulo!"))
      return;
    try {
      await api.delete(`/admin/modules/${moduleId}`);
      await loadCourseData(course.id);
    } catch (e) {
      console.error("Erro ao apagar módulo:", e);
      alert("Erro ao apagar módulo");
    }
  };

  const handleAddLesson = async (moduleId) => {
    if (!lessonData.title.trim() || !lessonData.vimeoId.trim())
      return alert("Preencha os dados obrigatórios");
    try {
      await api.post("/admin/lessons", {
        moduleId,
        ...lessonData,
        duration: lessonData.duration || 0,
      });
      setLessonData({ title: "", vimeoId: "", duration: "", description: "" });
      setShowLessonForm(null);
      await loadCourseData(course.id);
    } catch (e) {
      console.error("Erro ao criar aula:", e);
      alert("Erro ao criar aula");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Apagar esta aula?")) return;
    try {
      await api.delete(`/admin/lessons/${lessonId}`);
      await loadCourseData(course.id);
    } catch (e) {
      console.error("Erro ao apagar aula:", e);
      alert("Erro ao apagar aula");
    }
  };

  // --- RENDERIZAÇÃO DE ESTADOS ---
  if (loading) {
    return (
      <div className="loading-container">
        <div>A carregar {isCreating ? "criador" : "editor"}...</div>
        <div style={{ fontSize: "0.9rem", color: "#666", marginTop: 10 }}>
          {isCreating
            ? "Preparando formulário..."
            : "A buscar dados do curso..."}
        </div>
      </div>
    );
  }

  if (error && !isCreating) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate("/")} className="retry-btn">
          Voltar para Home
        </button>
      </div>
    );
  }

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="admin-course-editor">
      {/* CABEÇALHO */}
      <div className="admin-header">
        <div>
          <button onClick={() => navigate("/")} className="back-button">
            ← Voltar
          </button>
          <h1>
            {isCreating
              ? "Criar Novo Curso"
              : editingCourse
              ? "Editando: "
              : "Editar: "}
            {!isCreating && course?.title}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="admin-badge">Modo Administrador</div>

          {/* Só mostra botão de editar se não for criação */}
          {!isCreating && (
            <button
              onClick={() => setEditingCourse(!editingCourse)}
              className={`edit-toggle-btn ${editingCourse ? "edit" : "view"}`}
            >
              {editingCourse ? "Cancelar Edição" : "Editar Informações"}
            </button>
          )}
        </div>
      </div>

      {/* FORMULÁRIO DO CURSO (sempre visível em criação, condicional em edição) */}
      {(isCreating || editingCourse) && (
        <div className="course-form-container">
          <h3>
            {isCreating ? "Informações do Novo Curso" : "Informações do Curso"}
          </h3>

          <form onSubmit={handleSaveCourse} className="course-form">
            <div className="form-group">
              <label className="form-label">Título</label>
              <input
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, title: e.target.value })
                }
                required
                className="form-input"
                placeholder="Nome do curso"
              />
            </div>

            <div className="price-free-container">
              <div className="price-container">
                <label className="form-label">Preço (MZN)</label>
                <input
                  type="number"
                  value={courseForm.price}
                  disabled={courseForm.isFree}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, price: e.target.value })
                  }
                  required={!courseForm.isFree}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="free-checkbox">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={courseForm.isFree}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, isFree: e.target.checked })
                  }
                />
                <label htmlFor="isFree" className="checkbox-label">
                  Curso Gratuito?
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea
                value={courseForm.description}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, description: e.target.value })
                }
                className="form-textarea"
                placeholder="Descrição do curso..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">URL da Imagem</label>
              <input
                value={courseForm.thumbnail}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, thumbnail: e.target.value })
                }
                className="form-input"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading
                ? "A guardar..."
                : isCreating
                ? "Criar Curso"
                : "Salvar Alterações"}
            </button>
          </form>
        </div>
      )}

      {/* MÓDULOS E AULAS (só mostra se NÃO for criação e se NÃO estiver editando o curso) */}
      {!isCreating && !editingCourse && course && (
        <div className="modules-section">
          <h3 className="modules-title">
            Módulos e Aulas ({course.modules?.length || 0})
          </h3>

          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module) => (
              <div key={module.id} className="module-card">
                <div className="module-header">
                  <h3 className="module-title">{module.title}</h3>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="delete-module-btn"
                  >
                    Apagar Módulo
                  </button>
                </div>

                <div className="module-content">
                  {/* Aulas */}
                  {module.lessons && module.lessons.length === 0 ? (
                    <p className="empty-lessons">Sem aulas ainda.</p>
                  ) : (
                    <ul className="lessons-list">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id} className="lesson-item">
                          <div className="lesson-info">
                            <span className="video-icon">▶</span>
                            <strong>{lesson.title}</strong>
                            <span className="lesson-duration">
                              ({Math.floor(lesson.duration / 60)} min)
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="delete-lesson-btn"
                          >
                            Apagar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Formulário Nova Aula */}
                  {showLessonForm === module.id ? (
                    <div className="lesson-form">
                      <h4 className="lesson-form-title">Nova Aula</h4>
                      <input
                        placeholder="Título da aula"
                        value={lessonData.title}
                        onChange={(e) =>
                          setLessonData({
                            ...lessonData,
                            title: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                      <div className="lesson-form-row">
                        <input
                          placeholder="Vimeo ID (Ex: 76979871)"
                          value={lessonData.vimeoId}
                          onChange={(e) =>
                            setLessonData({
                              ...lessonData,
                              vimeoId: e.target.value,
                            })
                          }
                          className="form-input"
                        />
                        <input
                          placeholder="Duração (s)"
                          type="number"
                          value={lessonData.duration}
                          onChange={(e) =>
                            setLessonData({
                              ...lessonData,
                              duration: e.target.value,
                            })
                          }
                          className="form-input"
                          style={{ width: "120px" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleAddLesson(module.id)}
                          className="submit-btn"
                          style={{ padding: "8px 15px" }}
                        >
                          Salvar Aula
                        </button>
                        <button
                          onClick={() => setShowLessonForm(null)}
                          style={{
                            padding: "8px 15px",
                            background: "#ccc",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLessonForm(module.id)}
                      className="add-lesson-btn"
                    >
                      + Adicionar Aula
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="not-found-container">
              Nenhum módulo encontrado. Adicione o primeiro módulo abaixo.
            </div>
          )}

          {/* Criar Novo Módulo */}
          <div className="new-module-container">
            <h4 className="new-module-title">Novo Módulo:</h4>
            <input
              placeholder="Nome do Módulo"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="new-module-input"
            />
            <button
              onClick={handleAddModule}
              disabled={!newModuleTitle.trim()}
              className="add-module-btn"
            >
              Adicionar Módulo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
