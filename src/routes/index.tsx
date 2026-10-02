import { createFileRoute } from "@tanstack/react-router";
import { StudyForgeApp } from "@/components/studyforge/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <StudyForgeApp />;
}
