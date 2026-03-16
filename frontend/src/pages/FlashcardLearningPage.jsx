import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Focus, Minimize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import CenteredFlashcard from "../components/CenteredFlashcard.jsx";
import api from "../services/api.js";

const SWIPE_THRESHOLD = 60;

const FlashcardLearningPage = () => {
  const navigate = useNavigate();
  const domainId = localStorage.getItem("qf_domain");
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      if (!domainId) return;
      const { data } = await api.get(`/domains/${domainId}/flashcards`);
      setCards(data);
    };
    load();
  }, [domainId]);

  const current = cards[index];

  const pct = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round(((index + 1) / cards.length) * 100);
  }, [cards.length, index]);

  const markViewed = useCallback(async () => {
    if (!current) return;
    const seconds = Math.round((Date.now() - startTime) / 1000);
    const { data } = await api.post("/learner/flashcard/view", {
      domainId,
      flashcardId: current._id,
      timeSpentSeconds: seconds
    });
    setProgress(data.progressPercent);
    setStartTime(Date.now());
    return data;
  }, [current, domainId, startTime]);

  const next = useCallback(async () => {
    const viewRes = await markViewed();
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, cards.length - 1));

    if (viewRes?.shouldGenerateQuiz) {
      navigate("/quiz");
    }
  }, [cards.length, markViewed, navigate]);

  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const onCardTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const onCardTouchEnd = (event) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches?.[0]?.clientX ?? null;
    touchStartXRef.current = null;

    if (startX == null || endX == null) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      next();
    } else {
      prev();
    }
  };

  const onCardSwipe = (direction) => {
    if (direction === "left") {
      next();
      return;
    }

    if (direction === "right") {
      prev();
    }
  };

  return (
    <AppShell focusMode={focusMode}>
      <section className="relative space-y-5">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-slate-950/5 backdrop-blur-[1px] dark:bg-slate-100/5" />

        <div className="mx-auto w-full max-w-[920px] rounded-3xl border border-white/70 bg-white/60 p-4 shadow-[0_18px_55px_rgba(18,43,69,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Learning Progress</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{progress || pct}%</span>
              <button
                type="button"
                onClick={() => setFocusMode((v) => !v)}
                className="btn-secondary p-2"
                aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
                title={focusMode ? "Exit focus mode" : "Enter focus mode"}
              >
                {focusMode ? <Minimize2 className="h-4 w-4" /> : <Focus className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
            <motion.div
              className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress || pct}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[860px]">
          <CenteredFlashcard
            card={current}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            cardIndex={index}
            totalCards={cards.length}
            onTouchStart={onCardTouchStart}
            onTouchEnd={onCardTouchEnd}
            onSwipe={onCardSwipe}
          />

          <button
            type="button"
            className="absolute inset-y-8 left-0 z-10 w-14 rounded-l-3xl md:hidden"
            aria-label="Previous concept"
            onClick={prev}
          />
          <button
            type="button"
            className="absolute inset-y-8 right-0 z-10 w-14 rounded-r-3xl md:hidden"
            aria-label="Next concept"
            onClick={next}
          />
        </div>

        <div className="mx-auto flex w-full max-w-[860px] items-center justify-between gap-3">
          <button type="button" onClick={prev} className="btn-secondary gap-2 px-5 py-3">
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <p className="hidden text-xs uppercase tracking-[0.16em] text-slate-500 md:block">
            Keyboard: left/right arrows, space to flip
          </p>
          <button type="button" onClick={next} className="btn-primary gap-2 px-5 py-3">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </AppShell>
  );
};

export default FlashcardLearningPage;
