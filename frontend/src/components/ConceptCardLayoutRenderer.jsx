const normalizeLayout = (layoutJson) => {
  if (!layoutJson) return [];
  if (Array.isArray(layoutJson)) return layoutJson;
  if (typeof layoutJson === "string") {
    try {
      const parsed = JSON.parse(layoutJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const ArrowElement = ({ element }) => {
  const width = Math.max(20, Number(element.width) || 140);
  const height = Math.max(20, Number(element.height) || 40);
  const stroke = element.stroke || "#2563eb";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="pointer-events-none">
      <defs>
        <marker id={`arrow-head-${element.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill={stroke} />
        </marker>
      </defs>
      <line x1="3" y1={height / 2} x2={width - 4} y2={height / 2} stroke={stroke} strokeWidth="2.5" markerEnd={`url(#arrow-head-${element.id})`} />
    </svg>
  );
};

const ConceptCardLayoutRenderer = ({ layoutJson, className = "" }) => {
  const elements = normalizeLayout(layoutJson);

  if (!elements.length) {
    return null;
  }

  return (
    <div className={`relative h-full min-h-[260px] w-full overflow-hidden rounded-2xl border border-white/60 bg-white/65 dark:border-slate-700 dark:bg-slate-900/40 ${className}`}>
      {elements.map((element) => {
        const commonStyle = {
          position: "absolute",
          left: Number(element.x) || 0,
          top: Number(element.y) || 0,
          width: Number(element.width) || (element.type === "text" ? 180 : 120),
          height: Number(element.height) || (element.type === "text" ? 40 : 80),
          transform: `rotate(${Number(element.rotation) || 0}deg)`
        };

        if (element.type === "text") {
          return (
            <p
              key={element.id}
              style={{
                ...commonStyle,
                color: element.fill || "#0f172a",
                fontSize: Number(element.fontSize) || 24,
                fontFamily: element.fontFamily || "Sora",
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "pre-wrap"
              }}
            >
              {element.text || "Text"}
            </p>
          );
        }

        if (element.type === "image") {
          return (
            <img
              key={element.id}
              src={element.src}
              alt="card element"
              style={{ ...commonStyle, objectFit: "cover", borderRadius: 12 }}
            />
          );
        }

        if (element.type === "arrow") {
          return (
            <div key={element.id} style={commonStyle}>
              <ArrowElement element={element} />
            </div>
          );
        }

        return (
          <div
            key={element.id}
            style={{
              ...commonStyle,
              borderRadius: 14,
              background: element.fill || "#60a5fa",
              border: `2px solid ${element.stroke || "#1d4ed8"}`
            }}
          />
        );
      })}
    </div>
  );
};

export default ConceptCardLayoutRenderer;
