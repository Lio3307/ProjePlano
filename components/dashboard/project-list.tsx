import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export default function ProjectList() {
  return (
    <>
      <Link href="/check" className="contents">
      <Card className="hover:cursor-pointer">
        <CardHeader>
          <CardTitle>title</CardTitle>
          <CardDescription>Type: Docs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">By: Name</p>
        </CardContent>
      </Card>
      </Link>
    </>
  )
}