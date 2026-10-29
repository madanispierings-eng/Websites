import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuestionPage } from "../question-page";

export const metadata: Metadata = { title: "Nieuwe vraag", robots: { index: false, follow: false } };

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ onderwerp?: string }> }) {
  const { onderwerp } = await searchParams;
  if (!onderwerp) notFound();
  return (
    <QuestionPage
      topicId={onderwerp}
      draft={{
        id: null,
        examId: null,
        stem: "",
        imagePath: "",
        imageUrl: null,
        imageAlt: "",
        difficulty: "",
        source: "Eigen werk",
        copyrightStatus: "own_work",
        isPremium: false,
        reviewed: false,
        status: "draft",
        options: ["A", "B", "C", "D"].map((label) => ({ label, body: "", feedback: "" })),
        correctLabel: "",
        explanation: "",
        concept: "",
      }}
    />
  );
}
