import { useParams, Link } from "react-router-dom";
import { ArrowLeftIcon } from "./Icons";
import { archives } from "../data/content";
import NotFoundPage from "./NotFoundPage";
import DetailIndexNav from "./DetailIndexNav";
import StoryBlocks, { useStory } from "./StoryBlocks";
import ValueSections, { hasValues } from "./ValueSections";
import "./DetailPage.css";

// The "Other work" case studies are rendered from the blocks copied over from
// the Notion portfolio: headings, paragraphs, lists and images in their
// original order.
export default function ArchivePage() {
  const { slug } = useParams();
  const archive = archives.find((a) => a.title === slug);
  const story = useStory(archive?.blocks);

  if (!archive || !story) return <NotFoundPage />;
  const meta = [archive.timeline, archive.tools].filter(Boolean).join(" · ");

  return (
    <div className="detail-page">
      <header className="detail-header">
        <Link to="/" className="detail-back">
          <ArrowLeftIcon size={16} />
          Back to portfolio
        </Link>
      </header>

      <div className="detail-hero detail-hero--banner">
        <img src={archive.image} alt="" />
      </div>

      <div className="detail-layout">
        <DetailIndexNav
          items={[
            ...story.sections.filter((s) => s.heading).map((s) => ({ id: s.id, label: s.heading as string })),
            ...(hasValues(archive.values) || import.meta.env.DEV ? [{ id: "value", label: "Value" }] : []),
          ]}
        />

        <div className="detail-body detail-body--wide">
          <div className="detail-tags">
            <span className="tag">{archive.category}</span>
            <span className="tag">{archive.year}</span>
          </div>
          <h1>{archive.title}</h1>
          {meta && <p className="detail-client">{meta}</p>}

          <StoryBlocks sections={story.sections} images={story.images} />
          <ValueSections values={archive.values} />
        </div>
      </div>
    </div>
  );
}
