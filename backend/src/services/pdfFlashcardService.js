import { createRequire } from "module";
import { generateConceptCardsWithAI } from "./aiConceptCardService.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const MAX_CARDS = 40;
const MIN_LINE_LENGTH = 8;
const MIN_SENTENCE_LENGTH = 45;
const MIN_KEY_POINTS = 3;
const MAX_KEY_POINTS = 5;
const AI_TEXT_CHAR_LIMIT = 12000;

const DOMAIN_KEYWORDS = {
  physics: [
    "force",
    "energy",
    "momentum",
    "acceleration",
    "velocity",
    "current",
    "voltage",
    "resistance",
    "wave",
    "frequency"
  ],
  chemistry: [
    "atom",
    "molecule",
    "bond",
    "reaction",
    "compound",
    "acid",
    "base",
    "ph",
    "equilibrium",
    "oxidation"
  ],
  mathematics: [
    "equation",
    "theorem",
    "proof",
    "derivative",
    "integral",
    "matrix",
    "function",
    "probability",
    "geometry",
    "algebra"
  ],
  biology: [
    "cell",
    "dna",
    "rna",
    "enzyme",
    "organism",
    "evolution",
    "photosynthesis",
    "respiration",
    "genetics",
    "metabolism"
  ],
  java: [
    "class",
    "object",
    "inheritance",
    "encapsulation",
    "polymorphism",
    "interface",
    "jvm",
    "method",
    "constructor",
    "exception"
  ],
  "c++": [
    "pointer",
    "reference",
    "template",
    "constructor",
    "destructor",
    "polymorphism",
    "inheritance",
    "namespace",
    "raii",
    "stl"
  ],
  sql: [
    "query",
    "select",
    "join",
    "index",
    "transaction",
    "normalization",
    "schema",
    "constraint",
    "group by",
    "where"
  ],
  english: [
    "grammar",
    "sentence",
    "noun",
    "verb",
    "adjective",
    "synonym",
    "antonym",
    "tense",
    "clause",
    "vocabulary"
  ]
};

const NOISE_HEADING_REGEX =
  /^(table of contents|contents|index|glossary|references|bibliography|acknowledg(e)?ments?)\b/i;

const normalizeForCompare = (value = "") => value.toLowerCase().replace(/\s+/g, " ").trim();

const normalizeLine = (line = "") => line.replace(/\s+/g, " ").trim();

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveDomainKeywords = (domainName = "") => {
  const normalized = normalizeForCompare(domainName);
  if (!normalized) return [];

  if (DOMAIN_KEYWORDS[normalized]) {
    return DOMAIN_KEYWORDS[normalized];
  }

  return Object.entries(DOMAIN_KEYWORDS).find(([key]) => normalized.includes(key))?.[1] || [];
};

const detectFallbackDomainKeywords = (text = "") => {
  const corpus = normalizeForCompare(text);
  if (!corpus) return [];

  const domainScores = Object.entries(DOMAIN_KEYWORDS).map(([domain, keywords]) => {
    const score = keywords.reduce((sum, keyword) => {
      const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "gi");
      const matches = corpus.match(pattern);
      return sum + (matches ? matches.length : 0);
    }, 0);

    return { domain, score };
  });

  const best = domainScores.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 2) return [];

  return DOMAIN_KEYWORDS[best.domain] || [];
};

const getDomainRelevanceBoost = (sentence, domainKeywords) => {
  if (!domainKeywords.length) return 0;

  const hits = domainKeywords.reduce((count, keyword) => {
    const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    return pattern.test(sentence) ? count + 1 : count;
  }, 0);

  if (!hits) return 0;
  return Math.min(4, hits * 2);
};

const isLikelyPageArtifact = (line) =>
  /^(page\s*)?\d{1,4}$/i.test(line) || /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(line);

const isLikelyIndexLine = (line) => {
  if (!line) return false;

  return (
    NOISE_HEADING_REGEX.test(line) ||
    /^\d+(\.\d+){0,3}\s+.+\.{2,}\s*\d+$/i.test(line) ||
    /^(chapter|unit|lesson|module)\s+\d+[:.\-]?\s+.+\.{2,}\s*\d+$/i.test(line) ||
    /^.{6,}\s\d{1,4}$/.test(line)
  );
};

const containsEnoughWords = (line) => {
  const words = line.match(/[A-Za-z][A-Za-z\-']+/g) || [];
  return words.length >= 5;
};

const isNoiseLine = (line) => {
  if (!line) return true;
  if (line.length < MIN_LINE_LENGTH) return true;
  if (isLikelyPageArtifact(line)) return true;
  if (isLikelyIndexLine(line)) return true;

  const alphaChars = (line.match(/[A-Za-z]/g) || []).length;
  const density = alphaChars / Math.max(line.length, 1);
  return density < 0.45;
};

const isHeading = (line) => {
  if (!line) return false;

  return (
    /^(chapter|unit|lesson|module)\s+\d+[:.\-]?\s+/i.test(line) ||
    /^\d+(\.\d+){0,2}\s+[A-Z][A-Za-z0-9\-\s]{4,}$/.test(line) ||
    (/^[A-Z][A-Z\s\-:&]{5,}$/.test(line) && line.length <= 80)
  );
};

const splitIntoSections = (text) => {
  const rawLines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => !isNoiseLine(line));

  const lines = [];
  const seen = new Set();
  rawLines.forEach((line) => {
    const signature = normalizeForCompare(line);
    if (seen.has(signature)) return;
    seen.add(signature);
    lines.push(line);
  });

  const sections = [];
  let current = { title: "Core Concepts", lines: [] };

  lines.forEach((line) => {
    if (isHeading(line)) {
      if (current.lines.length) {
        sections.push(current);
      }
      current = { title: line, lines: [] };
      return;
    }

    current.lines.push(line);
  });

  if (current.lines.length) {
    sections.push(current);
  }

  return sections.length ? sections : [{ title: "Core Concepts", lines }];
};

const extractKeyPoints = (content, domainKeywords = []) => {
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((s) => normalizeLine(s))
    .filter((s) => s.length >= MIN_SENTENCE_LENGTH && s.length <= 240)
    .filter((s) => !isLikelyIndexLine(s) && !NOISE_HEADING_REGEX.test(s))
    .filter((s) => containsEnoughWords(s));

  const scored = sentences.map((sentence) => {
    const keywordBoost = /(important|key|must|core|remember|principle|definition|process|diagram|example)/i.test(
      sentence
    )
      ? 2
      : 0;

    const conceptBoost = /(because|therefore|results in|leads to|causes|consists of|is defined as|includes)/i.test(
      sentence
    )
      ? 2
      : 0;

    const indexPenalty = isLikelyIndexLine(sentence) ? -3 : 0;
    const domainBoost = getDomainRelevanceBoost(sentence, domainKeywords);

    const lengthScore = sentence.length > 80 && sentence.length < 180 ? 2 : 1;
    return { sentence, score: keywordBoost + conceptBoost + domainBoost + lengthScore + indexPenalty };
  });

  const unique = [];
  scored
    .sort((a, b) => b.score - a.score)
    .forEach((item) => {
      if (!unique.some((s) => s.toLowerCase() === item.sentence.toLowerCase())) {
        unique.push(item.sentence);
      }
    });

  return unique.slice(0, 4);
};

const toShortPhrase = (text = "", maxWords = 6) =>
  normalizeLine(text)
    .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "")
    .split(" ")
    .slice(0, maxWords)
    .join(" ");

const buildDefinition = (keyPoints) => {
  const first = normalizeLine(keyPoints[0] || "").replace(/[;:]+$/g, "");
  if (!first) return "This concept explains an important principle from the chapter.";

  const oneSentence = first.split(/(?<=[.!?])\s+/)[0] || first;
  return /[.!?]$/.test(oneSentence) ? oneSentence : `${oneSentence}.`;
};

const buildShortExplanation = (definition, keyPoints) => {
  const extra = keyPoints.slice(1, 3).map((point) => {
    const clean = normalizeLine(point).replace(/[;:]+$/g, "");
    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  });

  const explanation = [definition, ...extra].slice(0, 3).join(" ").trim();
  if (!explanation) {
    return "This concept appears repeatedly in the chapter and supports related topics and problems.";
  }

  return explanation;
};

const buildMemoryTrick = (conceptTitle, keyPoints) => {
  const words = conceptTitle.match(/[A-Za-z][A-Za-z0-9]*/g) || [];
  if (words.length < 2) return "";

  const acronym = words.map((word) => word[0].toUpperCase()).join("");
  if (acronym.length < 2) return "";

  const clue = toShortPhrase(keyPoints[0] || conceptTitle, 5);
  return `${acronym}: ${clue}`;
};

const normalizeConceptCardShape = ({
  card,
  domainId,
  createdBy,
  chapterNameFallback,
  conceptTitleFallback,
  subjectFallback
}) => {
  const conceptTitle = normalizeLine(card?.concept_title || card?.topic || conceptTitleFallback || "Core Concept");
  const chapterName = normalizeLine(card?.chapter || card?.chapterName || chapterNameFallback || conceptTitle);
  const definition = normalizeLine(card?.definition || card?.answer || "");

  let keyPoints = Array.isArray(card?.key_points)
    ? card.key_points.map((point) => normalizeLine(point)).filter(Boolean)
    : [];

  if (!keyPoints.length && Array.isArray(card?.keyPoints)) {
    keyPoints = card.keyPoints.map((point) => normalizeLine(point)).filter(Boolean);
  }

  if (!keyPoints.length && definition) {
    keyPoints = [definition];
  }

  while (keyPoints.length < MIN_KEY_POINTS) {
    keyPoints.push(`Understand how ${conceptTitle.toLowerCase()} applies in this chapter.`);
  }

  keyPoints = keyPoints.slice(0, MAX_KEY_POINTS);

  const shortExplanation = normalizeLine(
    card?.short_explanation || card?.back || buildShortExplanation(definition || keyPoints[0], keyPoints)
  );

  const diagram =
    normalizeLine(card?.diagram || card?.diagramText || "") ||
    [conceptTitle, ...keyPoints.slice(0, 3).map((point) => toShortPhrase(point, 5))].join("\n↓\n");

  const memoryTrick = normalizeLine(card?.memory_trick || buildMemoryTrick(conceptTitle, keyPoints));
  const subject = normalizeLine(card?.subject || subjectFallback || "General");

  return {
    domainId,
    subject,
    chapter: chapterName,
    concept_title: conceptTitle,
    definition: definition || buildDefinition(keyPoints),
    key_points: keyPoints,
    short_explanation: shortExplanation,
    diagram,
    memory_trick: memoryTrick,
    topic: conceptTitle,
    chapterName,
    keyPoints,
    diagramText: diagram,
    diagramUrl: "",
    front: `${conceptTitle}: What is the core definition?`,
    back: `${definition || buildDefinition(keyPoints)} ${shortExplanation}`.trim(),
    mcqOptions: [definition || keyPoints[0], keyPoints[1], "Related supporting detail", "Distractor concept"].filter(
      Boolean
    ).slice(0, 4),
    answer: definition || keyPoints[0],
    createdBy
  };
};

const buildConceptTitle = (topic, definition, index) => {
  const cleanTopic = normalizeLine(topic || "").replace(/[^A-Za-z0-9\s+\-]/g, "").trim();
  if (cleanTopic && cleanTopic.length >= 4) return cleanTopic;

  const fallback = toShortPhrase(definition, 5);
  return fallback || `Concept ${index + 1}`;
};

const extractDiagramHint = (lines, keyPoints) => {
  const explicitLine = lines.find((l) => /(figure|diagram|flowchart|architecture|schema)/i.test(l));
  if (explicitLine && /[\-=>↓]/.test(explicitLine)) return explicitLine;

  const processLike = lines.some((l) => /(process|workflow|pipeline|steps|cycle|lifecycle)/i.test(l));
  if (!processLike && keyPoints.length < 2) return "";

  const steps = keyPoints.slice(0, 4).map((point, idx) => toShortPhrase(point, 4) || `Step ${idx + 1}`);
  if (!steps.length) return "";

  return steps.join("\n↓\n");
};

const buildCardFromSection = (section, domainId, createdBy, index, domainKeywords = []) => {
  if (NOISE_HEADING_REGEX.test(section.title) || isLikelyIndexLine(section.title)) {
    return null;
  }

  const content = section.lines.join(" ");
  const keyPoints = extractKeyPoints(content, domainKeywords);

  if (!keyPoints.length) return null;

  const chapterName = section.title;
  const topic = chapterName
    .replace(/^(chapter|unit|lesson|module)\s+\d+[:.\-]?\s*/i, "")
    .split(" ")
    .slice(0, 6)
    .join(" ")
    .trim() || `Topic ${index + 1}`;

  const conceptTitle = buildConceptTitle(topic, keyPoints[0], index);
  const definition = buildDefinition(keyPoints);
  const shortExplanation = buildShortExplanation(definition, keyPoints);
  const normalizedKeyPoints = keyPoints.slice(0, MAX_KEY_POINTS);
  while (normalizedKeyPoints.length < MIN_KEY_POINTS) {
    normalizedKeyPoints.push(`Understand how ${conceptTitle.toLowerCase()} applies in this chapter.`);
  }

  const generatedDiagram = extractDiagramHint(section.lines, normalizedKeyPoints);
  const diagram = generatedDiagram || [conceptTitle, ...normalizedKeyPoints.slice(0, 3).map((point) => toShortPhrase(point, 5))].join("\n↓\n");
  const memoryTrick = buildMemoryTrick(conceptTitle, normalizedKeyPoints);

  const answer = definition;
  const options = [
    answer,
    normalizedKeyPoints[1] || "Secondary concept from this chapter",
    "Related supporting detail",
    "Distractor concept"
  ].slice(0, 4);

  return {
    domainId,
    subject: "",
    chapter: chapterName,
    concept_title: conceptTitle,
    definition,
    key_points: normalizedKeyPoints,
    short_explanation: shortExplanation,
    diagram,
    memory_trick: memoryTrick,
    topic: conceptTitle,
    chapterName,
    keyPoints: normalizedKeyPoints,
    diagramText: diagram,
    diagramUrl: "",
    front: `${conceptTitle}: What is the core definition?`,
    back: `${definition} ${shortExplanation}`.trim(),
    mcqOptions: options,
    answer,
    createdBy
  };
};

export const generateFlashcardsFromPdf = async ({ fileBuffer, domainId, createdBy, domainName = "" }) => {
  if (typeof PDFParse !== "function") {
    const error = new Error("PDF parser is not available in current runtime");
    error.status = 500;
    throw error;
  }

  const parser = new PDFParse({ data: fileBuffer });
  const parsed = await parser.getText();
  await parser.destroy();

  const rawText = String(parsed.text || "");
  const cleanedLines = rawText
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => !isNoiseLine(line));
  const meaningfulText = cleanedLines.join(" ");

  if (!meaningfulText || meaningfulText.length < 120) {
    const error = new Error("PDF did not contain enough readable text to generate flashcards");
    error.status = 400;
    throw error;
  }

  const explicitDomainKeywords = resolveDomainKeywords(domainName);
  const effectiveDomainKeywords = explicitDomainKeywords.length
    ? explicitDomainKeywords
    : detectFallbackDomainKeywords(meaningfulText);

  const sections = splitIntoSections(rawText.replace(/\t/g, " "));
  const heuristicCards = sections
    .map((section, idx) => buildCardFromSection(section, domainId, createdBy, idx, effectiveDomainKeywords))
    .map((card) => {
      if (!card) return null;
      return {
        ...card,
        subject: domainName || "General"
      };
    })
    .filter(Boolean)
    .slice(0, MAX_CARDS);

  let cards = heuristicCards;

  const shouldUseAI =
    String(process.env.ENABLE_AI_CONCEPT_CARDS || "false").toLowerCase() === "true" &&
    Boolean(process.env.OPENAI_API_KEY);

  if (shouldUseAI) {
    try {
      const aiText = meaningfulText.slice(0, AI_TEXT_CHAR_LIMIT);
      const aiCards = await generateConceptCardsWithAI({
        text: aiText,
        subject: domainName || "General",
        chapter: sections[0]?.title || "Core Concepts"
      });

      if (aiCards.length) {
        const aiNormalized = aiCards
          .map((card, idx) =>
            normalizeConceptCardShape({
              card,
              domainId,
              createdBy,
              chapterNameFallback: sections[idx]?.title || sections[0]?.title || "Core Concepts",
              conceptTitleFallback: `Concept ${idx + 1}`,
              subjectFallback: domainName || "General"
            })
          )
          .filter((card) => card.concept_title && card.definition)
          .slice(0, MAX_CARDS);

        if (aiNormalized.length) {
          cards = aiNormalized;
        }
      }
    } catch (error) {
      // Keep deterministic heuristic cards when AI call fails.
      cards = heuristicCards;
    }
  }

  if (!cards.length) {
    const error = new Error("Could not derive flashcards from PDF content");
    error.status = 400;
    throw error;
  }

  return {
    cards,
    stats: {
      totalPages: parsed.total || parsed.numpages || 0,
      totalSections: sections.length,
      generatedCards: cards.length
    }
  };
};
