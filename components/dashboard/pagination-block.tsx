import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

export default function PaginationBlock() {
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <select className="h-7 rounded-md border border-border bg-transparent px-2 text-xs outline-none">
          <option>8</option>
          <option>16</option>
          <option>32</option>
        </select>
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
          <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationLink href="#">6</PaginationLink></PaginationItem>
          <PaginationItem><PaginationNext href="#" /></PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
