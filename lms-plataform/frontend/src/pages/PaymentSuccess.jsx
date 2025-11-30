import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const courseId = searchParams.get("course_id");

    if (sessionId && courseId) {
      // Verifica o status do pagamento
      verifyPayment(sessionId, courseId);
    } else {
      setMessage("Parâmetros inválidos");
      setLoading(false);
    }
  }, []);

  const verifyPayment = async (sessionId, courseId) => {
    try {
      const response = await api.post("/verify-payment", {
        sessionId,
        courseId,
      });

      if (response.data.success) {
        setMessage("Pagamento confirmado! Redirecionando para o curso...");
        setTimeout(() => {
          navigate(`/player/${courseId}`);
        }, 3000);
      } else {
        setMessage("Pagamento ainda não confirmado. Aguarde...");
      }
    } catch (error) {
      setMessage("Erro ao verificar pagamento. Entre em contato conosco.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {loading ? (
        <div>Verificando pagamento...</div>
      ) : (
        <>
          <div
            style={{ fontSize: "3rem", color: "#4CAF50", marginBottom: "20px" }}
          >
            ✅
          </div>
          <h2>Pagamento Processado!</h2>
          <p>{message}</p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Voltar para Home
          </button>
        </>
      )}
    </div>
  );
}
