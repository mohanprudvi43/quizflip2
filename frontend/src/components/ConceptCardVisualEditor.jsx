import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Text as KonvaText, Arrow as KonvaArrow, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";

const CANVAS_WIDTH = 840;
const CANVAS_HEIGHT = 480;

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultCard = {
  subject: "",
  chapter: "",
  concept_title: "",
  definition: "",
  key_points: [""],
  short_explanation: "",
  memory_trick: "",
  layout_json: []
};

const clampSize = (value, min = 20) => Math.max(min, Number(value) || min);

const loadFrom = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const CanvasImageNode = ({ element, onSelect, onDragEnd, nodeRef }) => {
  const [img] = useImage(element.src || "", "anonymous");

  return (
    <KonvaImage
      ref={nodeRef}
      image={img}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
    />
  );
};

const ToolButton = ({ label, onClick }) => (
  <button type="button" className="btn-secondary w-full justify-start" onClick={onClick}>
    {label}
  </button>
);

const ConceptCardVisualEditor = ({
  onSave,
  saving = false,
  initialCard,
  domains = [],
  selectedDomain = "",
  onDomainChange,
  overwriteExisting = false,
  onOverwriteChange
}) => {
  const [cardMeta, setCardMeta] = useState(defaultCard);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [inlineEditor, setInlineEditor] = useState(null);
  const [inlineEditorText, setInlineEditorText] = useState("");
  const transformerRef = useRef(null);
  const nodeRefs = useRef({});
  const historyIndexRef = useRef(-1);
  const stageContainerRef = useRef(null);
  const inlineInputRef = useRef(null);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    if (!initialCard) return;

    setCardMeta((prev) => ({
      ...prev,
      subject: initialCard.subject || "",
      chapter: initialCard.chapter || initialCard.chapterName || "",
      concept_title: initialCard.concept_title || initialCard.topic || "",
      definition: initialCard.definition || "",
      key_points: Array.isArray(initialCard.key_points || initialCard.keyPoints)
        ? (initialCard.key_points || initialCard.keyPoints)
        : [""],
      short_explanation: initialCard.short_explanation || "",
      memory_trick: initialCard.memory_trick || ""
    }));

    const loaded = loadFrom(initialCard.layout_json);
    setElements(loaded);
    setHistory([loaded]);
    setHistoryIndex(0);
  }, [initialCard]);

  const selectedElement = useMemo(() => elements.find((el) => el.id === selectedId) || null, [elements, selectedId]);

  useEffect(() => {
    if (selectedElement?.type === "text") {
      setTextDraft(selectedElement.text || "");
    } else {
      setTextDraft("");
    }
  }, [selectedElement]);

  useEffect(() => {
    if (inlineEditor && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEditor]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const node = selectedId ? nodeRefs.current[selectedId] : null;
    if (node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  const commitElements = (nextElements) => {
    setElements(nextElements);

    setHistory((prev) => {
      const base = prev.slice(0, historyIndexRef.current + 1);
      const updated = [...base, nextElements];
      return updated.slice(-50);
    });

    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  };

  const commitCurrentSnapshot = () => {
    setHistory((prev) => {
      const base = prev.slice(0, historyIndexRef.current + 1);
      const updated = [...base, elements];
      return updated.slice(-50);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  };

  const readImageFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read image file"));
      reader.readAsDataURL(file);
    });

  const addImageFromSrc = (src) => {
    if (!src) return;

    const base = {
      id: makeId(),
      type: "image",
      x: 120,
      y: 120,
      width: 200,
      height: 130,
      src,
      fill: "#111827",
      stroke: "#2563eb",
      rotation: 0
    };

    const next = [...elements, base];
    commitElements(next);
    setSelectedId(base.id);
  };

  const onUploadImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const src = await readImageFileAsDataUrl(file);
    addImageFromSrc(src);
  };

  const addElement = (type) => {
    const base = {
      id: makeId(),
      type,
      x: 120,
      y: 120,
      width: 180,
      height: 70,
      fill: "#111827",
      stroke: "#2563eb",
      rotation: 0
    };

    let element = base;
    if (type === "text") {
      element = { ...base, text: "New Text", width: 240, height: 48, fontSize: 30, fontFamily: "Sora", fill: "#0f172a" };
    }

    if (type === "shape") {
      element = { ...base, width: 150, height: 100, fill: "#93c5fd", stroke: "#1d4ed8" };
    }

    if (type === "arrow") {
      element = { ...base, width: 170, height: 36, stroke: "#2563eb", fill: "#2563eb" };
    }

    if (type === "image") {
      const src = window.prompt("Paste image URL");
      if (!src) return;
      element = { ...base, src, width: 180, height: 120 };
    }

    const next = [...elements, element];
    commitElements(next);
    setSelectedId(element.id);
  };

  const updateElement = (id, updater, options = { recordHistory: true }) => {
    const next = elements.map((el) => (el.id === id ? { ...el, ...updater } : el));
    if (options.recordHistory) {
      commitElements(next);
      return;
    }
    setElements(next);
  };

  const onTransformEnd = () => {
    if (!selectedElement) return;
    const node = nodeRefs.current[selectedElement.id];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    updateElement(selectedElement.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: clampSize((selectedElement.width || 120) * scaleX, 20),
      height: clampSize((selectedElement.height || 80) * scaleY, 20)
    });
  };

  const onUndo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setElements(history[nextIndex] || []);
  };

  const onRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setElements(history[nextIndex] || []);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    const next = elements.filter((el) => el.id !== selectedId);
    commitElements(next);
    setSelectedId(null);
  };

  const moveSelectedLayer = (direction) => {
    if (!selectedId) return;
    const index = elements.findIndex((el) => el.id === selectedId);
    if (index === -1) return;

    const next = [...elements];
    if (direction === "up" && index < next.length - 1) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    }
    if (direction === "down" && index > 0) {
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
    }
    if (direction === "front" && index < next.length - 1) {
      const [item] = next.splice(index, 1);
      next.push(item);
    }
    if (direction === "back" && index > 0) {
      const [item] = next.splice(index, 1);
      next.unshift(item);
    }

    commitElements(next);
  };

  const updateMeta = (key, value) => {
    setCardMeta((prev) => ({ ...prev, [key]: value }));
  };

  const saveCard = () => {
    if (!selectedDomain) {
      window.alert("Please select a domain before saving this visual concept card.");
      return;
    }

    const payload = {
      ...cardMeta,
      domainId: selectedDomain,
      overwrite: overwriteExisting,
      key_points: cardMeta.key_points.filter((point) => String(point || "").trim()),
      layout_json: elements,
      diagram: "",
      diagramText: "",
      front: `${cardMeta.concept_title || "Concept"}: What is the core definition?`,
      back: `${cardMeta.definition || ""} ${cardMeta.short_explanation || ""}`.trim(),
      topic: cardMeta.concept_title || "Concept",
      chapterName: cardMeta.chapter || cardMeta.concept_title || "Concept",
      answer: cardMeta.definition || cardMeta.concept_title || "Concept",
      mcqOptions: []
    };

    onSave(payload);
  };

  const editTextElement = (element) => {
    const nextText = window.prompt("Edit text", element.text || "");
    if (nextText === null) return;
    updateElement(element.id, { text: nextText });
    setSelectedId(element.id);
  };

  const openInlineEditor = (element) => {
    const node = nodeRefs.current[element.id];
    const container = stageContainerRef.current;
    if (!node || !container) {
      editTextElement(element);
      return;
    }

    const stage = node.getStage();
    const box = node.getClientRect({ skipStroke: true });
    const stageBox = stage.container().getBoundingClientRect();
    const parentBox = container.getBoundingClientRect();
    const offsetLeft = stageBox.left - parentBox.left;
    const offsetTop = stageBox.top - parentBox.top;

    setInlineEditor({
      id: element.id,
      x: offsetLeft + box.x,
      y: offsetTop + box.y,
      width: Math.max(80, box.width + 10),
      height: Math.max(32, box.height + 10),
      fontSize: element.fontSize || 28,
      fontFamily: element.fontFamily || "Sora",
      color: element.fill || "#0f172a"
    });
    setInlineEditorText(element.text || "");
    setSelectedId(element.id);
  };

  const commitInlineEditor = () => {
    if (!inlineEditor?.id) {
      setInlineEditor(null);
      return;
    }

    const text = inlineEditorText;
    const target = elements.find((el) => el.id === inlineEditor.id);
    if (target && (target.text || "") !== text) {
      updateElement(inlineEditor.id, { text });
    }
    setInlineEditor(null);
  };

  const cancelInlineEditor = () => {
    setInlineEditor(null);
  };

  const commitTextDraft = () => {
    if (!selectedElement || selectedElement.type !== "text") return;
    if ((selectedElement.text || "") === textDraft) return;
    const next = elements.map((el) => (el.id === selectedElement.id ? { ...el, text: textDraft } : el));
    commitElements(next);
  };

  return (
    <section className="panel mt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="section-title">Visual Concept Card Editor</h4>
          <p className="mt-1 text-xs text-slate-500">Design card layout and save into a selected domain.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Domain
            <select
              className="input-field mt-1 min-w-44"
              value={selectedDomain}
              onChange={(e) => onDomainChange?.(e.target.value)}
            >
              <option value="">Select domain</option>
              {domains.map((domain) => (
                <option key={String(domain._id)} value={String(domain._id)}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/45">
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => onOverwriteChange?.(e.target.checked)}
            />
            Remove old cards first
          </label>
          <button type="button" className="btn-secondary" onClick={onUndo} disabled={historyIndex <= 0}>Undo</button>
          <button type="button" className="btn-secondary" onClick={onRedo} disabled={historyIndex >= history.length - 1}>Redo</button>
          <button type="button" className="btn-primary" onClick={saveCard} disabled={saving || !selectedDomain}>{saving ? "Saving..." : "Save Card"}</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="space-y-2 rounded-2xl border border-white/60 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Elements</p>
          <ToolButton label="Add Text" onClick={() => addElement("text")} />
          <ToolButton label="Add Image" onClick={() => addElement("image")} />
          <label className="btn-secondary w-full cursor-pointer justify-start">
            Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await onUploadImage(file);
                }
                e.target.value = "";
              }}
            />
          </label>
          <ToolButton label="Add Shape" onClick={() => addElement("shape")} />
          <ToolButton label="Add Arrow" onClick={() => addElement("arrow")} />
          <button type="button" className="btn-secondary w-full justify-start border border-red-200 text-red-700" onClick={removeSelected}>Delete Selected</button>
          <p className="pt-2 text-xs text-slate-500">Tips: double-click text on canvas to edit, and drag image files onto canvas.</p>
        </aside>

        <div
          ref={stageContainerRef}
          className={`overflow-auto rounded-2xl border p-3 transition ${
            isCanvasDragOver
              ? "border-blue-400 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/25"
              : "border-white/60 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-950/35"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsCanvasDragOver(true);
          }}
          onDragLeave={() => setIsCanvasDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsCanvasDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              await onUploadImage(file);
            }
          }}
        >
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="mx-auto rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              {elements.map((element) => {
                if (element.type === "text") {
                  return (
                    <KonvaText
                      key={element.id}
                      ref={(node) => {
                        if (node) nodeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      text={element.text || "Text"}
                      fontSize={element.fontSize || 28}
                      fontFamily={element.fontFamily || "Sora"}
                      fill={element.fill || "#0f172a"}
                      width={element.width}
                      height={element.height}
                      rotation={element.rotation || 0}
                      draggable
                      onClick={() => setSelectedId(element.id)}
                      onTap={() => setSelectedId(element.id)}
                      onDblClick={() => openInlineEditor(element)}
                      onDblTap={() => openInlineEditor(element)}
                      onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
                    />
                  );
                }

                if (element.type === "shape") {
                  return (
                    <Rect
                      key={element.id}
                      ref={(node) => {
                        if (node) nodeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      rotation={element.rotation || 0}
                      fill={element.fill || "#93c5fd"}
                      stroke={element.stroke || "#1d4ed8"}
                      strokeWidth={2}
                      cornerRadius={12}
                      draggable
                      onClick={() => setSelectedId(element.id)}
                      onTap={() => setSelectedId(element.id)}
                      onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
                    />
                  );
                }

                if (element.type === "arrow") {
                  return (
                    <KonvaArrow
                      key={element.id}
                      ref={(node) => {
                        if (node) nodeRefs.current[element.id] = node;
                      }}
                      x={element.x}
                      y={element.y}
                      points={[0, 0, element.width || 160, 0]}
                      rotation={element.rotation || 0}
                      pointerLength={8}
                      pointerWidth={8}
                      fill={element.stroke || "#2563eb"}
                      stroke={element.stroke || "#2563eb"}
                      strokeWidth={3}
                      draggable
                      onClick={() => setSelectedId(element.id)}
                      onTap={() => setSelectedId(element.id)}
                      onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
                    />
                  );
                }

                if (element.type === "image") {
                  return (
                    <CanvasImageNode
                      key={element.id}
                      element={element}
                      onSelect={() => setSelectedId(element.id)}
                      onDragEnd={(e) => updateElement(element.id, { x: e.target.x(), y: e.target.y() })}
                      nodeRef={(node) => {
                        if (node) nodeRefs.current[element.id] = node;
                      }}
                    />
                  );
                }

                return null;
              })}
              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                onTransformEnd={onTransformEnd}
              />
            </Layer>
          </Stage>

          {inlineEditor ? (
            <textarea
              ref={inlineInputRef}
              value={inlineEditorText}
              onChange={(e) => setInlineEditorText(e.target.value)}
              onBlur={commitInlineEditor}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelInlineEditor();
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commitInlineEditor();
                }
              }}
              style={{
                position: "absolute",
                left: inlineEditor.x,
                top: inlineEditor.y,
                width: inlineEditor.width,
                minHeight: inlineEditor.height,
                fontSize: inlineEditor.fontSize,
                fontFamily: inlineEditor.fontFamily,
                color: inlineEditor.color,
                lineHeight: 1.2,
                padding: "6px 8px",
                border: "2px solid #3b82f6",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.95)",
                resize: "none",
                zIndex: 30
              }}
            />
          ) : null}
        </div>

        <aside className="space-y-3 rounded-2xl border border-white/60 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Card Data</p>
          <input className="input-field" placeholder="Subject" value={cardMeta.subject} onChange={(e) => updateMeta("subject", e.target.value)} />
          <input className="input-field" placeholder="Chapter" value={cardMeta.chapter} onChange={(e) => updateMeta("chapter", e.target.value)} />
          <input className="input-field" placeholder="Concept Title" value={cardMeta.concept_title} onChange={(e) => updateMeta("concept_title", e.target.value)} />
          <textarea className="input-field min-h-16" placeholder="Definition" value={cardMeta.definition} onChange={(e) => updateMeta("definition", e.target.value)} />
          <textarea
            className="input-field min-h-20"
            placeholder="Key points (one per line)"
            value={(cardMeta.key_points || []).join("\n")}
            onChange={(e) => updateMeta("key_points", e.target.value.split(/\r?\n/).filter(Boolean))}
          />
          <textarea className="input-field min-h-20" placeholder="Short explanation" value={cardMeta.short_explanation} onChange={(e) => updateMeta("short_explanation", e.target.value)} />
          <input className="input-field" placeholder="Memory trick" value={cardMeta.memory_trick} onChange={(e) => updateMeta("memory_trick", e.target.value)} />

          <p className="pt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Selected Element</p>
          {selectedElement ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-secondary" onClick={() => moveSelectedLayer("up")}>Layer +</button>
                <button type="button" className="btn-secondary" onClick={() => moveSelectedLayer("down")}>Layer -</button>
                <button type="button" className="btn-secondary" onClick={() => moveSelectedLayer("front")}>To Front</button>
                <button type="button" className="btn-secondary" onClick={() => moveSelectedLayer("back")}>To Back</button>
              </div>
              {selectedElement.type === "text" ? (
                <div className="space-y-2 rounded-xl border border-blue-200/70 bg-blue-50/60 p-2 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Text Writer</p>
                  <textarea
                    className="input-field min-h-24"
                    value={textDraft}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTextDraft(value);
                      updateElement(selectedElement.id, { text: value }, { recordHistory: false });
                    }}
                    onBlur={commitTextDraft}
                    placeholder="Write your concept heading or notes..."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="input-field"
                      value={selectedElement.fontFamily || "Sora"}
                      onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                    >
                      <option value="Sora">Sora</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                    <input
                      className="input-field"
                      type="number"
                      value={selectedElement.fontSize || 28}
                      onChange={(e) => updateElement(selectedElement.id, { fontSize: clampSize(e.target.value, 10) }, { recordHistory: false })}
                      onBlur={commitCurrentSnapshot}
                      placeholder="Font size"
                    />
                  </div>
                </div>
              ) : null}
              <input
                className="input-field"
                type="number"
                value={selectedElement.width || 120}
                onChange={(e) => updateElement(selectedElement.id, { width: clampSize(e.target.value) })}
                placeholder="Width"
              />
              <input
                className="input-field"
                type="number"
                value={selectedElement.height || 80}
                onChange={(e) => updateElement(selectedElement.id, { height: clampSize(e.target.value) })}
                placeholder="Height"
              />
              <input
                className="input-field"
                type="number"
                value={selectedElement.rotation || 0}
                onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) || 0 })}
                placeholder="Rotation"
              />
              <label className="text-xs font-semibold text-slate-500">
                Fill
                <input
                  type="color"
                  className="mt-1 h-9 w-full rounded-lg"
                  value={selectedElement.fill || "#1f2937"}
                  onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Stroke
                <input
                  type="color"
                  className="mt-1 h-9 w-full rounded-lg"
                  value={selectedElement.stroke || "#2563eb"}
                  onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
                />
              </label>
              {selectedElement.type === "text" ? null : null}
            </>
          ) : (
            <p className="text-xs text-slate-500">Select an element from canvas to edit properties.</p>
          )}
        </aside>
      </div>
    </section>
  );
};

export default ConceptCardVisualEditor;
