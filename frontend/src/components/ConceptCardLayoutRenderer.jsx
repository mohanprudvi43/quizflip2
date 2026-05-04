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

const normalizeHex = (value) => {
  const color = String(value || "").trim();
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;

  const raw = match[1];
  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((part) => part + part)
      .join("")}`;
  }

  return `#${raw}`;
};

const toRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
};

const channelToLinear = (channel) => {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const getLuminance = (hex) => {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  return 0.2126 * channelToLinear(rgb.r) + 0.7152 * channelToLinear(rgb.g) + 0.0722 * channelToLinear(rgb.b);
};

const getContrastRatio = (a, b) => {
  const la = getLuminance(a);
  const lb = getLuminance(b);
  if (la == null || lb == null) return 1;

  const bright = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (bright + 0.05) / (dark + 0.05);
};

const ensureTextContrast = (textColor, backgroundColor = "#ffffff") => {
  const color = normalizeHex(textColor);
  if (!color) return "#0f172a";
  return getContrastRatio(color, backgroundColor) >= 4.5 ? color : "#0f172a";
};

const ensureStrokeContrast = (strokeColor, fillColor) => {
  const stroke = normalizeHex(strokeColor) || "#1e293b";
  const fill = normalizeHex(fillColor) || "#ffffff";
  return getContrastRatio(stroke, fill) >= 2.2 ? stroke : "#1e293b";
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
    <div
      className={`relative h-full min-h-[260px] w-full overflow-hidden rounded-2xl border border-slate-300/85 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:border-slate-200/65 dark:bg-white/95 ${className}`}
    >
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
          const textColor = ensureTextContrast(element.fill || "#0f172a", "#ffffff");
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
                color: textColor,
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
                textShadow: "0 1px 1px rgba(255,255,255,0.9), 0 0 1.2px rgba(15,23,42,0.45)",
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
            <div
              key={element.id}
              style={{
                ...commonStyle,
                overflow: "hidden",
                borderRadius: 12,
                border: "1px solid rgba(15, 23, 42, 0.2)",
                background: "repeating-linear-gradient(45deg, #f8fafc 0 10px, #eef2f7 10px 20px)"
              }}
            >
              <img
                src={element.src}
                alt="card element"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
              />
            </div>
          );
        }

        if (element.type === "arrow") {
          return (
            <div key={element.id} style={commonStyle}>
              <ArrowElement element={element} />
            </div>
          );
        }

        const shapeFill = normalizeHex(element.fill || "#60a5fa") || "#60a5fa";
        const shapeStroke = ensureStrokeContrast(element.stroke || "#1d4ed8", shapeFill);

        return (
          <div
            key={element.id}
            style={{
              ...commonStyle,
              borderRadius: 14,
              background: shapeFill,
              border: `2px solid ${shapeStroke}`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)"
            }}
          />
        );
      })}
    </div>
  );
};

export default ConceptCardLayoutRenderer;
