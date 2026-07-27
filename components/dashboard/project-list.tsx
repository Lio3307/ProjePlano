import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const projects = [
  { id: "1", title: "API Design", type: "Docs", author: "Alice" },
  { id: "2", title: "Sprint Board", type: "Kanban", author: "Bob" },
  { id: "3", title: "Budget Tracker", type: "Table", author: "Charlie" },
  { id: "4", title: "Roadmap", type: "Timeline", author: "Diana" },
  { id: "5", title: "Team Wiki", type: "Docs", author: "Eve" },
];

export default function ProjectList() {
  return (
    <>
      {projects.map((p) => (
        <Link key={p.id} href={`/project/${p.id}`} className="contents">
          <Card className="hover:cursor-pointer">
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
              <CardDescription>Type: {p.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">By: {p.author}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
  )
}