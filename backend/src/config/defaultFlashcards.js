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
  ],
  "Operating Systems": [
    {
      topic: "Operating System Role",
      chapterName: "OS Basics",
      keyPoints: [
        "The OS manages CPU, memory, storage, and devices.",
        "It provides services and interfaces for programs.",
        "It schedules resources to keep the system responsive."
      ],
      answer: "The OS manages hardware resources and provides services to programs",
      mcqOptions: [
        "The OS manages hardware resources and provides services to programs",
        "The OS compiles source code into binaries",
        "The OS designs CPU circuits",
        "The OS stores web pages"
      ]
    },
    {
      topic: "Kernel vs User Mode",
      chapterName: "OS Basics",
      keyPoints: [
        "Kernel mode can execute privileged instructions.",
        "User mode is restricted for safety.",
        "System calls switch into kernel mode."
      ],
      answer: "Kernel mode allows privileged instructions while user mode is restricted",
      mcqOptions: [
        "Kernel mode allows privileged instructions while user mode is restricted",
        "User mode has more hardware access",
        "Kernel mode disables system calls",
        "User mode can modify device firmware"
      ]
    },
    {
      topic: "Process vs Thread",
      chapterName: "Processes",
      keyPoints: [
        "A process is a running program instance.",
        "Threads share a process address space.",
        "Threads reduce context switch overhead."
      ],
      answer: "Threads share a process address space",
      mcqOptions: [
        "Threads share a process address space",
        "Threads always run on different machines",
        "Processes cannot be scheduled",
        "Threads contain their own kernels"
      ]
    },
    {
      topic: "CPU Scheduling",
      chapterName: "Scheduling",
      keyPoints: [
        "Scheduling chooses which ready process runs next.",
        "Round Robin improves responsiveness for time-sharing.",
        "SJF minimizes average waiting time."
      ],
      answer: "Round Robin",
      mcqOptions: [
        "Round Robin",
        "Shortest Job First",
        "First Come First Served",
        "Priority Inversion"
      ]
    },
    {
      topic: "Context Switching",
      chapterName: "Scheduling",
      keyPoints: [
        "CPU state is saved and restored between processes.",
        "Switching enables multitasking.",
        "Excessive switching adds overhead."
      ],
      answer: "Context switching",
      mcqOptions: [
        "Context switching",
        "Demand paging",
        "Cache coherence",
        "I/O polling"
      ]
    },
    {
      topic: "Critical Section and Mutex",
      chapterName: "Synchronization",
      keyPoints: [
        "A critical section must be executed by one thread at a time.",
        "A mutex enforces mutual exclusion.",
        "Locks prevent race conditions."
      ],
      answer: "Ensure only one thread enters a critical section",
      mcqOptions: [
        "Ensure only one thread enters a critical section",
        "Speed up disk I/O",
        "Allocate extra memory",
        "Create new processes"
      ]
    },
    {
      topic: "Semaphores",
      chapterName: "Synchronization",
      keyPoints: [
        "Semaphores coordinate access to shared resources.",
        "Counting semaphores allow multiple permits.",
        "Binary semaphores act like locks."
      ],
      answer: "Limiting access to a pool of N printers",
      mcqOptions: [
        "Limiting access to a pool of N printers",
        "Encrypting data",
        "Compiling code",
        "Sorting arrays"
      ]
    },
    {
      topic: "Deadlocks",
      chapterName: "Concurrency",
      keyPoints: [
        "Deadlock happens when processes wait forever.",
        "Circular wait is one necessary condition.",
        "Prevention breaks at least one condition."
      ],
      answer: "Circular wait",
      mcqOptions: [
        "Circular wait",
        "Preemptive scheduling",
        "Cache hits",
        "Kernel mode"
      ]
    },
    {
      topic: "Memory Management",
      chapterName: "Memory",
      keyPoints: [
        "Paging splits memory into fixed-size pages.",
        "Page tables map virtual to physical addresses.",
        "Paging reduces external fragmentation."
      ],
      answer: "Reduce external fragmentation",
      mcqOptions: [
        "Reduce external fragmentation",
        "Eliminate caches",
        "Increase CPU clock speed",
        "Disable virtual memory"
      ]
    },
    {
      topic: "Virtual Memory",
      chapterName: "Memory",
      keyPoints: [
        "Virtual memory extends RAM using disk.",
        "A page fault triggers a disk read.",
        "Replacement policies include LRU and FIFO."
      ],
      answer: "The OS loads the missing page from disk",
      mcqOptions: [
        "The OS loads the missing page from disk",
        "The CPU stops permanently",
        "The program skips the instruction",
        "The disk wipes RAM"
      ]
    },
    {
      topic: "File Systems",
      chapterName: "Storage",
      keyPoints: [
        "File systems organize data into files and directories.",
        "Inodes store metadata and block pointers.",
        "Permissions control access to files."
      ],
      answer: "File metadata and block pointers",
      mcqOptions: [
        "File metadata and block pointers",
        "Only file contents",
        "Network addresses",
        "CPU registers"
      ]
    },
    {
      topic: "I/O and Device Drivers",
      chapterName: "Devices",
      keyPoints: [
        "Drivers translate OS requests to device commands.",
        "Interrupts signal I/O completion.",
        "Buffering smooths speed differences."
      ],
      answer: "To provide a uniform interface to hardware",
      mcqOptions: [
        "To provide a uniform interface to hardware",
        "To create user accounts",
        "To compile kernels",
        "To format RAM"
      ]
    },
    {
      topic: "System Calls",
      chapterName: "Interfaces",
      keyPoints: [
        "System calls are the API for OS services.",
        "They trigger a mode switch into the kernel.",
        "Examples include open, read, fork, and exec."
      ],
      answer: "open",
      mcqOptions: [
        "open",
        "printf",
        "malloc",
        "strlen"
      ]
    },
    {
      topic: "Protection and Security",
      chapterName: "Security",
      keyPoints: [
        "Access control restricts resource usage.",
        "Authentication verifies identity.",
        "Sandboxing limits damage from failures."
      ],
      answer: "Restrict who can use a resource",
      mcqOptions: [
        "Restrict who can use a resource",
        "Increase clock speed",
        "Reduce file sizes",
        "Allocate more CPU cores"
      ]
    }
  ]
};
