import { Metadata } from "next";
import { apiBase } from "@/server/apiBase";

export const metadata: Metadata = {
  title: "LOGOS — Personal AI Assistant",
  description: "Manage your digital world as naturally as a highly capable personal assistant.",
};

interface Project {
  id: string;
  name: string;
  description: string;
  lastActivity: string;
  lastActivityTime: string;
  nextAction: string;
  status: "active" | "paused" | "completed";
  projectName?: string;
}

interface ActivityItem {
  id: string;
  time: string;
  description: string;
  projectName?: string;
}

async function fetchHomeData() {
  try {
    const projectsRes = await fetch(`${apiBase()}/api/documents?limit=10`, {
      next: { revalidate: 30 },
    });
    const projectsData = await projectsRes.json();

    const transformedProjects: Project[] = (projectsData.documents || []).map((doc: any) => ({
      id: doc.id,
      name: doc.path.replace(/\.md$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description: `Last updated: ${new Date(doc.updated_at).toLocaleDateString()}`,
      lastActivity: doc.path,
      lastActivityTime: new Date(doc.updated_at).toISOString(),
      nextAction: "Continue editing",
      status: "active" as const,
    }));

    const eventsRes = await fetch(`${apiBase()}/api/memory/promote/events?limit=20`, {
      next: { revalidate: 30 },
    });
    const eventsData = await eventsRes.json();

    const transformedActivities: ActivityItem[] = (eventsData.events || []).map((event: any) => ({
      id: event.id,
      time: new Date(event.timestamp).toISOString(),
      description: `${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}: ${event.path}`,
      projectName: event.path.split("/")[0],
    }));

    return {
      projects: transformedProjects.slice(0, 5),
      activities: transformedActivities.slice(0, 10),
    };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return { projects: [], activities: [] };
  }
}

import HomeClient from "./components/HomeClient";

export default async function Home() {
  const { projects, activities } = await fetchHomeData();
  return <HomeClient initialProjects={projects} initialActivities={activities} />;
}