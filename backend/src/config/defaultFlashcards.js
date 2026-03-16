export const DEFAULT_FLASHCARDS_BY_DOMAIN = {
  Physics: [
    {
      topic: "Mechanics",
      chapterName: "Newtonian Motion",
      keyPoints: [
        "Force changes motion when applied to mass.",
        "Acceleration grows when force increases for same mass.",
        "For constant force, heavier objects accelerate less."
      ],
      diagramText: "Force -> [Object: m] -> Acceleration",
      answer: "Force changes motion when applied to mass",
      mcqOptions: [
        "Force changes motion when applied to mass",
        "Mass is created by acceleration",
        "Velocity is always constant",
        "Gravity is zero on Earth"
      ]
    },
    {
      topic: "Waves",
      chapterName: "Wave Fundamentals",
      keyPoints: [
        "Frequency means cycles completed each second.",
        "Wavelength and frequency are inversely related for fixed speed.",
        "Wave speed equals frequency multiplied by wavelength."
      ],
      answer: "Hertz",
      mcqOptions: ["Hertz", "Pascal", "Newton", "Kelvin"]
    }
  ],
  Chemistry: [
    {
      topic: "Atomic Structure",
      chapterName: "Atoms and Nucleus",
      keyPoints: [
        "Atomic number equals number of protons.",
        "Mass number equals protons plus neutrons.",
        "Electrons occupy shells around nucleus."
      ],
      answer: "Number of protons",
      mcqOptions: ["Number of neutrons", "Number of protons", "Number of shells", "Number of isotopes"]
    },
    {
      topic: "Solutions",
      chapterName: "Acids, Bases, and pH",
      keyPoints: [
        "pH less than 7 is acidic.",
        "pH equal to 7 is neutral.",
        "pH greater than 7 is basic."
      ],
      answer: "Neutral",
      mcqOptions: ["Acidic", "Basic", "Neutral", "Salt"]
    }
  ],
  Mathematics: [
    {
      topic: "Algebra",
      chapterName: "Quadratic Equations",
      keyPoints: [
        "Standard form is ax^2 + bx + c = 0.",
        "Discriminant b^2 - 4ac indicates root nature.",
        "Quadratic formula provides exact roots."
      ],
      answer: "Discriminant b squared minus 4ac indicates root nature",
      mcqOptions: [
        "Discriminant b squared minus 4ac indicates root nature",
        "Roots are always equal",
        "Linear equation has two variables only",
        "Algebra has no formulas"
      ]
    },
    {
      topic: "Geometry",
      chapterName: "Triangles",
      keyPoints: [
        "Interior angles of a triangle sum to 180 degrees.",
        "Side lengths must satisfy triangle inequality.",
        "Area can be found using half times base times height."
      ],
      answer: "180 degrees",
      mcqOptions: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"]
    }
  ],
  Biology: [
    {
      topic: "Cell Biology",
      chapterName: "Cell Organelles",
      keyPoints: [
        "Mitochondria produce ATP energy.",
        "Nucleus stores genetic information.",
        "Ribosomes synthesize proteins."
      ],
      diagramText: "Cell -> Nucleus | Mitochondria | Ribosome",
      answer: "Mitochondria",
      mcqOptions: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"]
    },
    {
      topic: "Human Body",
      chapterName: "Circulatory System",
      keyPoints: [
        "Heart pumps blood across the body.",
        "Arteries carry blood away from heart.",
        "Veins bring blood back to heart."
      ],
      answer: "Heart",
      mcqOptions: ["Lungs", "Liver", "Heart", "Kidney"]
    }
  ],
  Java: [
    {
      topic: "Basics",
      chapterName: "Java Runtime",
      keyPoints: [
        "JVM executes compiled bytecode.",
        "JRE contains JVM and runtime libraries.",
        "JDK includes tools for development."
      ],
      answer: "Java Virtual Machine",
      mcqOptions: ["Java Variable Method", "Java Virtual Machine", "Just Visual Module", "Joint Version Manager"]
    },
    {
      topic: "OOP",
      chapterName: "Object-Oriented Principles",
      keyPoints: [
        "Encapsulation groups data with methods.",
        "Inheritance enables reuse across classes.",
        "Polymorphism allows one interface with many forms."
      ],
      answer: "Encapsulation",
      mcqOptions: ["Encapsulation", "Compilation", "Indexing", "Hashing"]
    }
  ],
  "C++": [
    {
      topic: "Basics",
      chapterName: "C++ Core Concepts",
      keyPoints: [
        "C++ supports classes and objects.",
        "It allows procedural and object-oriented styles.",
        "Templates enable generic programming."
      ],
      answer: "Object oriented programming",
      mcqOptions: ["Pointers", "Object oriented programming", "Header files", "Loops"]
    },
    {
      topic: "Memory",
      chapterName: "Dynamic Memory",
      keyPoints: [
        "new allocates memory on heap.",
        "delete releases heap memory.",
        "RAII patterns help avoid leaks."
      ],
      answer: "new",
      mcqOptions: ["malloc", "new", "alloc", "create"]
    }
  ],
  SQL: [
    {
      topic: "Queries",
      chapterName: "Data Retrieval",
      keyPoints: [
        "SELECT retrieves rows from tables.",
        "WHERE filters records by conditions.",
        "ORDER BY sorts output rows."
      ],
      answer: "SELECT",
      mcqOptions: ["INSERT", "UPDATE", "SELECT", "DELETE"]
    },
    {
      topic: "Aggregation",
      chapterName: "Aggregate Functions",
      keyPoints: [
        "COUNT returns row totals.",
        "SUM and AVG work on numeric columns.",
        "GROUP BY combines rows into summary buckets."
      ],
      answer: "COUNT",
      mcqOptions: ["SUM", "COUNT", "AVG", "MAX"]
    }
  ],
  English: [
    {
      topic: "Grammar",
      chapterName: "Parts of Speech",
      keyPoints: [
        "Nouns name people places things or ideas.",
        "Verbs express actions or states.",
        "Adjectives describe nouns."
      ],
      answer: "A word that names a person place thing or idea",
      mcqOptions: [
        "A word that describes a verb",
        "A word that names a person place thing or idea",
        "A joining word",
        "An action word"
      ]
    },
    {
      topic: "Vocabulary",
      chapterName: "Meaning Relationships",
      keyPoints: [
        "Synonyms have similar meanings.",
        "Antonyms have opposite meanings.",
        "Context helps pick the correct word."
      ],
      answer: "A word with similar meaning",
      mcqOptions: [
        "A word with opposite meaning",
        "A word with similar meaning",
        "A short sentence",
        "A punctuation mark"
      ]
    }
  ]
};
