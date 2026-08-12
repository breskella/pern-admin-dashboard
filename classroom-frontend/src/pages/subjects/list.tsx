import { ListView } from "@/components/refine-ui/views/list-view.tsx";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb.tsx";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { CreateButton } from "@/components/refine-ui/buttons/create.tsx";
import { DataTable } from "@/components/refine-ui/data-table/data-table.tsx";
import { useTable } from "@refinedev/react-table";
import type { Subject } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { useList } from "@refinedev/core";
import { DEPARTMENT_OPTIONS } from "@/constants";

const SubjectsList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const { query: subjectsQuery } = useList<Subject>({
    resource: "subjects",
    pagination: { pageSize: 100 },
  });

  const subjects: Subject[] = Array.isArray(subjectsQuery?.data)
    ? subjectsQuery.data
    : [];

  const departmentFilters =
    selectedDepartment === "all"
      ? []
      : [{ field: "department", operator: "eq" as const, value: selectedDepartment }];

  const searchFilters = searchQuery
    ? [{ field: "name", operator: "contains" as const, value: searchQuery }]
    : [];

  const subjectColumns = useMemo<ColumnDef<Subject>[]>(() => [
    {
      id: "code",
      accessorKey: "code",
      size: 120,
      header: () => <p className="column-title">Code</p>,
      cell: ({ getValue }) => (
        <span className="text-foreground font-medium">{String(getValue())}</span>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      size: 220,
      header: () => <p className="column-title">Name</p>,
      cell: ({ getValue }) => <span className="text-foreground">{String(getValue())}</span>,
    },
    {
      id: "department",
      accessorKey: "department",
      size: 180,
      header: () => <p className="column-title">Department</p>,
      cell: ({ getValue }) => {
        const department = getValue<Subject["department"]>();
        const departmentName = typeof department === "string" ? department : department?.name ?? "-";
        return <span className="text-foreground">{departmentName}</span>;
      },
    },
    {
      id: "description",
      accessorKey: "description",
      size: 260,
      header: () => <p className="column-title">Description</p>,
      cell: ({ getValue }) => <span className="text-foreground">{String(getValue())}</span>,
    },
  ], []);

  const subjectTable = useTable<Subject>({
    columns: subjectColumns,
    refineCoreProps: {
      resource: "subjects",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [...departmentFilters, ...searchFilters],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  });

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Subjects</h1>

      <div className="intro-row">
        <p>Quick access to essential metrics and management tools.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />

            <Input
              type="text"
              placeholder="Search by name..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENT_OPTIONS.map((department) => (
                  <SelectItem key={department.value} value={department.value}>
                    {department.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CreateButton resource="subjects" />
          </div>
        </div>
      </div>

      <DataTable table={subjectTable} />
    </ListView>
  );
};

export default SubjectsList;