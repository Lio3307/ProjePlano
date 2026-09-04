import {
  getWorkspaceMemberInitials,
  type WorkspaceMember,
  type WorkspaceMemberRole,
  type WorkspaceMemberStatus,
} from "./model.ts"

export const WORKSPACE_MEMBER_IDS = {
  aurelio: "member-project-alpha-aurelio",
  mayaChen: "member-project-alpha-maya-chen",
  hadiPratama: "member-project-alpha-hadi-pratama",
  nadiaPutri: "member-project-alpha-nadia-putri",
  rafiAkbar: "member-project-alpha-rafi-akbar",
  dinaMahesa: "member-project-alpha-dina-mahesa",
  sintaLestari: "member-project-alpha-sinta-lestari",
  bimaSantoso: "member-project-alpha-bima-santoso",
  farahWijaya: "member-project-alpha-farah-wijaya",
  sari: "member-project-beta-sari",
  budi: "member-project-gamma-budi",
  citra: "member-project-delta-citra",
  dewi: "member-project-echo-dewi",
  eko: "member-project-foxtrot-eko",
} as const

export const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  createMember(
    WORKSPACE_MEMBER_IDS.aurelio,
    "project-alpha",
    "Aurelio",
    "aurelio@example.com",
    "owner"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.mayaChen,
    "project-alpha",
    "Maya Chen",
    "maya.chen@example.com",
    "editor"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.hadiPratama,
    "project-alpha",
    "Hadi Pratama",
    "hadi.pratama@example.com",
    "editor"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.nadiaPutri,
    "project-alpha",
    "Nadia Putri",
    "nadia.putri@example.com",
    "editor"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.rafiAkbar,
    "project-alpha",
    "Rafi Akbar",
    "rafi.akbar@example.com",
    "viewer"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.dinaMahesa,
    "project-alpha",
    "Dina Mahesa",
    "dina.mahesa@example.com",
    "editor"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.sintaLestari,
    "project-alpha",
    "Sinta Lestari",
    "sinta.lestari@example.com",
    "editor"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.bimaSantoso,
    "project-alpha",
    "Bima Santoso",
    "bima.santoso@example.com",
    "viewer",
    "inactive"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.farahWijaya,
    "project-alpha",
    "Farah Wijaya",
    "farah.wijaya@example.com",
    "editor"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.sari,
    "project-beta",
    "Sari",
    "sari@example.com",
    "owner"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.budi,
    "project-gamma",
    "Budi",
    "budi@example.com",
    "owner"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.citra,
    "project-delta",
    "Citra",
    "citra@example.com",
    "owner"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.dewi,
    "project-echo",
    "Dewi",
    "dewi@example.com",
    "owner"
  ),
  createMember(
    WORKSPACE_MEMBER_IDS.eko,
    "project-foxtrot",
    "Eko",
    "eko@example.com",
    "owner"
  ),
]

function createMember(
  id: string,
  workspaceId: string,
  name: string,
  email: string,
  role: WorkspaceMemberRole,
  status: WorkspaceMemberStatus = "active"
): WorkspaceMember {
  return {
    id,
    workspaceId,
    name,
    email,
    initials: getWorkspaceMemberInitials(name),
    role,
    status,
  }
}
