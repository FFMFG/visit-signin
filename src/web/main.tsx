import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import { KioskApp } from "./KioskApp";
import { AdminApp } from "./admin/AdminApp";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<KioskApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
