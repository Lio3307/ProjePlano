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

const workspaces = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  title: `Project ${["Alpha", "Beta", "Gamma", "Delta", "Echo", "Foxtrot", "Hotel", "IQ", "Jade", "Kappa"][i % 10]}`,
  author: ["Aurelio", "Sari", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita"][i % 8],
  desc: ["Frontend revamp", "API migration", "Design system", "Mobile app", "Data pipeline", "Docs portal", "Admin panel", "Marketing site"][i % 8],
}));

export default function WorkspaceList() {
  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {workspaces.length !== 0 ? workspaces.map((w) => (
        <Card key={w.id}>
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
