import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Navbar from "./components/Navbar/Navbar";
import Content from "./components/Content/Content";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Navbar />
        <Header />
        <Content />
        <Footer />
    </StrictMode>,
);