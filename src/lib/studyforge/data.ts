import type { StudySet, TrashSet } from "./types";

export const INITIAL_SETS: StudySet[] = [
  {
    id: "set_1",
    title: "Philippine History: Pre-Colonial to Spanish Era",
    subject: "History",
    documentName: "PH_History_101.pdf",
    progress: 45,
    totalQuestions: 25,
    estimatedTime: "30 min",
    lastStudied: "2 hours ago",
    topics: [
      "Pre-Colonial Society",
      "Arrival of Magellan",
      "Spanish Colonization",
      "Galleon Trade",
    ],
    lessons: [
      {
        id: "l1",
        title: "Pre-Colonial Period",
        expanded: false,
        questions: [
          {
            id: "q1",
            type: "mcq",
            prompt:
              "What was the system of writing used by early Filipinos before the arrival of the Spanish?",
            choices: ["Alibata", "Baybayin", "Sanskrit", "Cyrillic"],
            correctAnswer: 1,
            explanation:
              "Baybayin is the pre-colonial ancient writing script of the Philippines. Alibata is a misnomer coined in the early 20th century.",
            mastery: "needs-review",
            hints: ["It starts with a B.", "It is often confused with Alibata."],
            tags: ["culture", "pre-colonial"],
          },
          {
            id: "q3",
            type: "tf",
            prompt:
              "The Barangay was the basic socio-political unit in the pre-colonial Philippines.",
            choices: ["True", "False"],
            correctAnswer: 0,
            explanation:
              "The Barangay consisted of 30 to 100 families led by a Datu.",
            mastery: "mastered",
            hints: [],
            tags: ["politics"],
          },
        ],
      },
      {
        id: "l2",
        title: "Spanish Era",
        expanded: true,
        questions: [
          {
            id: "q2",
            type: "mcq",
            prompt:
              "Who was the Portuguese explorer who led the Spanish expedition that arrived in the Philippines in 1521?",
            choices: [
              "Miguel López de Legazpi",
              "Ferdinand Magellan",
              "Christopher Columbus",
              "Ruy López de Villalobos",
            ],
            correctAnswer: 1,
            explanation:
              "Ferdinand Magellan arrived in Homonhon in 1521, marking the beginning of Spanish influence.",
            mastery: "needs-review",
            hints: ["He died in Mactan."],
            tags: ["exploration"],
          },
          {
            id: "q6",
            type: "type",
            prompt:
              "Name the trade system connecting Manila and Acapulco during the Spanish colonial period.",
            choices: [],
            correctAnswer: "Galleon Trade",
            explanation:
              "The Manila-Acapulco Galleon Trade was the main source of income for the colony during its early years.",
            mastery: "learning",
            hints: ["It involves a type of large ship."],
            tags: ["economics"],
          },
        ],
      },
    ],
  },
  {
    id: "set_2",
    title: "Introduction to Computing (Java & Linux Basics)",
    subject: "Computer Science",
    documentName: "CS101_Midterms.docx",
    progress: 0,
    totalQuestions: 40,
    estimatedTime: "45 min",
    lastStudied: "Never",
    topics: [
      "Hardware Components",
      "Linux File System",
      "Java Basics",
      "Object-Oriented Concepts",
    ],
    lessons: [
      {
        id: "l3",
        title: "Linux Basics",
        expanded: true,
        questions: [
          {
            id: "q4",
            type: "flashcard",
            prompt: "Command to change directory in Linux",
            choices: [],
            correctAnswer: "cd",
            explanation:
              'The "cd" (change directory) command navigates the file system.',
            mastery: "learning",
            hints: [],
            tags: ["commands"],
          },
        ],
      },
    ],
  },
];

export const INITIAL_TRASH: TrashSet[] = [];

export function flattenQuestions(set: StudySet) {
  return set.lessons.flatMap((lesson) => lesson.questions);
}

export function correctLabel(question: {
  type: string;
  choices: string[];
  correctAnswer: number | string;
}): string {
  if (
    (question.type === "mcq" || question.type === "tf") &&
    typeof question.correctAnswer === "number"
  ) {
    return question.choices[question.correctAnswer] ?? String(question.correctAnswer);
  }
  return String(question.correctAnswer);
}
