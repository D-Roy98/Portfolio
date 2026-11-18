// Renders text containing **bold** markers as React nodes with <strong> spans.
// Avoids dangerouslySetInnerHTML entirely — splits on the marker and maps to elements.
export default function Highlighted({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </>
  );
}
