import Link from "next/link";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

export default function ProjectList() {
  return (
    <>
      <Link href="/check" className="contents">
      <Card className="hover:cursor-pointer">
        <CardHeader>
          <CardTitle>title</CardTitle>
          <CardDescription>Type: Docs</CardDescription>
          {/*<CardAction>
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
          </CardAction>*/}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">By: Name</p>
        </CardContent>
      </Card>
      </Link>
    </>
  )
}