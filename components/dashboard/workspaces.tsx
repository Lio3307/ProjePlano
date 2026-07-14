import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import PaginationBlock from "./pagination-block";
import Link from "next/link"

const workspaces = [
  { id: 1, title: "Project Alpha", author: "Aurelio", desc: "Frontend revamp" },
  { id: 2, title: "Project Beta", author: "Sari", desc: "API migration" },
  { id: 3, title: "Project Gamma", author: "Budi", desc: "Design system" },
  { id: 4, title: "Project Delta", author: "Citra", desc: "Mobile app" },
  { id: 5, title: "Project Echo", author: "Dewi", desc: "Data pipeline" },
  { id: 6, title: "Project Foxtrot", author: "Eko", desc: "Docs portal" },
];

export default function WorkspaceList() {
  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {workspaces.length !== 0 ? workspaces.map((w) => (
        <Link href="/check" key={w.id} className="contents">
        <Card className="hover:cursor-pointer">
          <CardHeader>
            <CardTitle>{w.title}</CardTitle>
            <CardDescription>{w.desc}</CardDescription>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <EllipsisVertical size="18" className="hover:cursor-pointer" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">BY {w.author}</p>
          </CardContent>
        </Card>
        </Link>
      )) : (
        <div className="flex justify-center items-center">
            <h4 className="text-lg text-gray-500">No Workspaces showed</h4>
        </div>
      )}
    </div>
    <PaginationBlock />
    </>
  );
}
