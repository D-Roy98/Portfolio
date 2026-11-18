import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeftIcon } from "./Icons";
import { projects } from "../data/projects";
import Highlighted from "./Highlighted";
import Lightbox, { type LightboxState } from "./Lightbox";
import NotFoundPage from "./NotFoundPage";
import DetailIndexNav from "./DetailIndexNav";
import ValueSections, { hasValues } from "./ValueSections";
import StoryBlocks, { useStory } from "./StoryBlocks";
import "./DetailPage.css";

// A real, separate page for each case study (its own URL, back button works,
// shareable/linkable) instead of the old modal popup — borrowed structurally
// from the reference site's pattern of case studies opening as their own
// pages rather than an overlay.
export default function ProjectPage() {
  const { slug } = useParams();
  const project = projects.find((p) => p.id === slug);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const story = useStory(project?.story);

  if (!project) return <NotFoundPage />;

  return (
    <div className="detail-page">
      <header className="detail-header">
        <Link to="/" className="detail-back">
          <ArrowLeftIcon size={16} />
          Back to portfolio
        </Link>
      </header>

      <div className={`detail-hero${story ? " detail-hero--banner" : ""}`}>
        <img {...(story ? {} : { "data-parallax": "0.12", "data-parallax-fit": true })} src={project.image} alt="" />
      </div>

      <div className="detail-layout">
        <DetailIndexNav
          items={[
            { id: "problem", label: "The Problem" },
            { id: "contributions", label: "Contributions" },
            { id: "impact", label: "Impact" },
            ...(story ? story.sections.filter((s) => s.heading).map((s) => ({ id: s.id, label: s.heading as string })) : []),
            ...(hasValues(project.values) || import.meta.env.DEV ? [{ id: "value", label: "Value" }] : []),
            ...(project.gallery.length > 0 ? [{ id: "gallery", label: "Gallery" }] : []),
          ]}
        />

        <div className={`detail-body${story ? " detail-body--wide" : ""}`}>
          <div className="detail-tags">
            <span className="tag">{project.category}</span>
            <span className="tag">{project.year}</span>
          </div>
          <h1>{project.title}</h1>
          <p className="detail-client">For {project.client}</p>

          <section className="detail-section" id="problem">
            <h2>The Problem</h2>
            <p><Highlighted text={project.problem} /></p>
          </section>

          <section className="detail-section" id="contributions">
            <h2>Contributions</h2>
            <ul>
              {project.contributions.map((c) => (
                <li key={c}><Highlighted text={c} /></li>
              ))}
            </ul>
          </section>

          <section className="detail-section" id="impact">
            <h2>Impact</h2>
            <p><Highlighted text={project.impact} /></p>
          </section>

          {story && <StoryBlocks sections={story.sections} images={story.images} showCaptions />}

          <ValueSections values={project.values} />

          {project.gallery.length > 0 && (
            <section className="detail-section" id="gallery">
              <h2>Gallery</h2>
              <div className="detail-gallery">
                {project.gallery.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    data-cursor="explore"
                    onClick={() => setLightbox({ images: project.gallery, captions: project.captions, index: i })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Lightbox
        state={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
      />
    </div>
  );
}
