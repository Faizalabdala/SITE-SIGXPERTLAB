import React, { useState } from "react";
import api from "../services/api";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/login", { email, password });
      // Salva dados
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Notifica a Home que o login foi feito
      onLoginSuccess(response.data.user);
      onClose(); // Fecha o modal
    } catch (err) {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-header">
          <h2>Bem-vindo à Geomatica360</h2>
          <p>Introduza as suas credenciais de acesso</p>
        </div>

        {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

        <form className="modal-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-modal-submit">
            Entrar
          </button>
        </form>

        <div style={{ marginTop: "20px", fontSize: "0.9rem" }}>
          <p>
            Não tem conta?{" "}
            <a href="#contato" onClick={onClose} style={{ color: "#2E86AB" }}>
              Fale conosco
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
