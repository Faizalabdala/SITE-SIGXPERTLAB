import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.jsx";

// Cria o elemento raiz do React e injeta o App
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
