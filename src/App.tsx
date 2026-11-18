import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Cockpit from "./components/Cockpit";
import ProjectPage from "./components/ProjectPage";
import ArchivePage from "./components/ArchivePage";
import NotFoundPage from "./components/NotFoundPage";
import ScrollManager from "./components/ScrollManager";
import SitePet from "./components/SitePet";
import { startParallax } from "./lib/parallax";

function App() {
  useEffect(() => startParallax(), []);

  return (
    <>
      <ScrollManager />
      <Routes>
      <Route path="/" element={<Cockpit />} />
      <Route path="/work/:slug" element={<ProjectPage />} />
      <Route path="/other-work/:slug" element={<ArchivePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
      <SitePet />
    </>
  );
}

export default App;
