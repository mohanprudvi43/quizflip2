import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import ConceptCardLayoutRenderer from "./ConceptCardLayoutRenderer.jsx";

const SWIPE_THRESHOLD = 120;

const CenteredFlashcard = ({ card, flipped, onFlip, cardIndex, totalCards, onTouchStart, onTouchEnd, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 0, 180], [-8, 0, 8]);
  const suppressClickRef = useRef(false);

  if (!card) {
    return <div className="skeleton mx-auto h-[420px] w-full max-w-4xl rounded-[2rem]" />;
  }

  const conceptTitle = card.concept_title || card.topic || "Concept";
  const definition = card.definition || card.front || "";
  const keyPointsRaw = card.key_points || card.keyPoints || [];
  const keyPoints = Array.isArray(keyPointsRaw)
    ? keyPointsRaw.filter(Boolean)
    : String(keyPointsRaw || "")
        .split(/\r?\n|;/)
        .map((item) => item.trim())
        .filter(Boolean);
  const explanation = card.short_explanation || card.back || "";
  const memoryTrick = card.memory_trick || "";
  const hasLayout = Boolean(
    (Array.isArray(card.layout_json) && card.layout_json.length) ||
      (typeof card.layout_json === "string" && card.layout_json.trim().length > 2)
  );

  return (
    <motion.div
      key={`${card._id || conceptTitle}-${cardIndex}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto w-full max-w-[860px]"
    >
      <motion.button
        type="button"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        style={{ x, rotate }}
        whileTap={{ scale: 0.995 }}
        onDragEnd={(_event, info) => {
          if (Math.abs(info.offset.x) < SWIPE_THRESHOLD) {
            x.set(0);
            return;
          }

          suppressClickRef.current = true;
          if (typeof onSwipe === "function") {
            onSwipe(info.offset.x < 0 ? "left" : "right");
          }
          x.set(0);
        }}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          onFlip();
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`flip-card-inner relative h-[460px] w-full cursor-grab overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-cyan-100/70 via-white to-blue-100/70 p-8 text-left shadow-[0_28px_80px_rgba(17,88,162,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_36px_90px_rgba(17,88,162,0.24)] active:cursor-grabbing dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 ${
          flipped ? "flipped" : ""
        }`}
      >
        <div className="flip-face absolute inset-0 overflow-y-auto p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Concept {cardIndex + 1} of {totalCards}</p>
          <h2 className="mt-4 font-display text-3xl leading-tight md:text-4xl">{conceptTitle}</h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">{definition}</p>
          {hasLayout ? <ConceptCardLayoutRenderer className="mt-4" layoutJson={card.layout_json} /> : null}
          <p className="mt-8 text-sm text-slate-500">Click card or press Space to flip</p>
        </div>

        <div className="flip-face back absolute inset-0 overflow-y-auto p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Key Points + Explanation</p>
          {memoryTrick ? (
            <div className="mt-3 inline-flex max-w-full items-center rounded-full border border-emerald-300/70 bg-emerald-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
              Mnemonic: {memoryTrick}
            </div>
          ) : null}
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-slate-700 dark:text-slate-100 md:text-lg">
            {keyPoints.slice(0, 5).map((point, idx) => (
              <li key={`${idx}-${point}`}>{point}</li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
            {explanation}
          </p>
        </div>
      </motion.button>
    </motion.div>
  );
};

export default CenteredFlashcard;
