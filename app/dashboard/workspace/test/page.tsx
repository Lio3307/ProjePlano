import ProjectList from "@/components/dashboard/project-list";
import { Button } from "@/components/ui/button";
import { CircleUserRound, EllipsisVertical, Plus } from "lucide-react";

export default function DetailWorkspace() {
  return (
    <div className="flex flex-col space-y-6 p-4 mt-4">
      <div className="flex justify-between">
        {/*Workspace title*/}
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Workspace</h1>
          <h4 className="text-lg font-semibold">Title tester for detail workspace</h4>
          <p className="text-sm"> here some example of description for workspace detail page</p>
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-gray-500">Created By : Aurelio</p>
            <p className="text-sm text-gray-500">Created At : 12/03/2026</p>
          </div>
        </div>
        
        {/*Workspace action*/}
        <div className="flex flex-col justify-between">
          <EllipsisVertical size={22} />

          {/*TODO: Avatar user/member list*/}
          <CircleUserRound size={24} />
        </div>
        
      </div>

      {/*Project fiter*/}
      <div className="mt-2 flex justify-between">
        <Button size={"lg"}><Plus />New</Button>

        {/*TODO: Combobox project filter by title/type*/}
        
      </div>

      {/*Project List*/}
      <ProjectList/>
      
    </div>
  )
}