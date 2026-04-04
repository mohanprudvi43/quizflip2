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

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeElement = (element, idx) => {
  if (!element || typeof element !== "object") return null;
  const type = String(element.type || "").trim();
  if (!["text", "image", "shape", "arrow"].includes(type)) return null;

  const normalized = {
    id: String(element.id || `layout-${idx}`),
    type,
    x: toNumber(element.x, 0),
    y: toNumber(element.y, 0),
    width: Math.max(20, toNumber(element.width, type === "text" ? 180 : 120)),
    height: Math.max(20, toNumber(element.height, type === "text" ? 40 : 80)),
    rotation: toNumber(element.rotation, 0),
    fill: String(element.fill || (type === "shape" ? "#60a5fa" : "#0f172a")),
    stroke: String(element.stroke || "#2563eb")
  };

  if (type === "text") {
    normalized.text = String(element.text || "Text");
    normalized.fontSize = Math.max(10, toNumber(element.fontSize, 24));
    normalized.fontFamily = String(element.fontFamily || "Sora");
    normalized.align = ["left", "center", "right"].includes(String(element.align || "")) ? String(element.align) : "left";
    normalized.verticalAlign = ["top", "middle", "bottom"].includes(String(element.verticalAlign || ""))
      ? String(element.verticalAlign)
      : "top";
    normalized.lineHeight = Math.max(0.6, toNumber(element.lineHeight, 1.2));
    normalized.letterSpacing = toNumber(element.letterSpacing, 0);
    normalized.padding = Math.max(0, toNumber(element.padding, 0));
  }

  if (type === "image") {
    const src = String(element.src || "").trim();
    if (!src) return null;
    normalized.src = src;
  }

  return normalized;
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
  const elements = normalizeLayout(layoutJson).map((element, idx) => normalizeElement(element, idx)).filter(Boolean);

  if (!elements.length) {
    return null;
  }

  return (
    <div className={`relative h-full min-h-[260px] w-full overflow-hidden rounded-2xl border border-white/60 bg-white/65 dark:border-slate-700 dark:bg-slate-900/40 ${className}`}>
      {elements.map((element) => {
        const commonStyle = {
          position: "absolute",
          left: toNumber(element.x, 0),
          top: toNumber(element.y, 0),
          width: toNumber(element.width, element.type === "text" ? 180 : 120),
          height: toNumber(element.height, element.type === "text" ? 40 : 80),
          transform: `rotate(${toNumber(element.rotation, 0)}deg)`
        };

        if (element.type === "text") {
          const justifyContent =
            element.verticalAlign === "middle"
              ? "center"
              : element.verticalAlign === "bottom"
                ? "flex-end"
                : "flex-start";
          return (
            <p
              key={element.id}
              style={{
                ...commonStyle,
                color: element.fill || "#0f172a",
                fontSize: toNumber(element.fontSize, 24),
                fontFamily: element.fontFamily || "Sora",
                fontWeight: 700,
                lineHeight: toNumber(element.lineHeight, 1.2),
                letterSpacing: toNumber(element.letterSpacing, 0),
                padding: toNumber(element.padding, 0),
                textAlign: element.align || "left",
                display: "flex",
                flexDirection: "column",
                justifyContent,
                whiteSpace: "pre-wrap",
                boxSizing: "border-box"
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
