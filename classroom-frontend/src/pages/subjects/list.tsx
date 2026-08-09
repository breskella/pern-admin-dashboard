import { Breadcrumb } from '@/components/refine-ui/layout/breadcrumb'
import { ListView } from '@/components/refine-ui/views/list-view'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEPARTMENT_OPTIONS } from '@/constants/index'
import { CreateButton } from '@/components/refine-ui/buttons/create'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { Subject } from '@/types'
import { useTable } from '@refinedev/react-table' 
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'

const SubjectsList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    
    const departmentFilters = selectedDepartment === 'all' ? [] : [
        { field: 'department', operator: 'eq' as const, value: selectedDepartment }
    ];
    
    const searchFilters = searchQuery ? [
        { field: 'name', operator: 'contains' as const, value: searchQuery }
    ] : [];

    const subjectTable = useTable<Subject>({
        columns: useMemo<ColumnDef<Subject>[]>(() => [
             {
                 id: 'code',
                 accessorKey: 'code',
                 size: 100,
                 header: () => <p className="column-title ml-2">Code</p>,
                 cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>
             },
             {
                id: 'name',
                accessorKey: 'name',
                size: 200,
                header: () => <p className="column-title">Name</p>,
                cell: ({ getValue }) => <span className="text-foreground">{getValue<string>()}</span>,
                filterFn: 'includesString',
             },
             {
                id: 'department',
                accessorKey: 'department',
                size: 150,
                header: () => <p className="column-title">Department</p>,
                cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
             },
             {
                id: 'description',
                accessorKey: 'description',
                size: 300,
                header: () => <p className="column-title">Description</p>,
                cell: ({ getValue }) => <span className="truncate line-clamp-2">{getValue<string>()}</span>,
             },
        ], []),
        refineCoreProps: { 
            resource: 'subjects',
            pagination: {
                pageSize: 10,
                mode: 'server',
            },
            filters: {
                permanent: [...departmentFilters, ...searchFilters],
            },
            sorters: {
                initial: [
                    {
                        field: 'name',
                        order: 'desc',
                    }
                ]
            },
        },
    });

    return (
        <ListView>
            <Breadcrumb />
            <h1 className="page-title">Subjects</h1>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 my-4 w-full">
                <p className="text-muted-foreground text-sm">
                    Quick access to essential metrics and management tools.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by name ..."
                            className="pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                            value={selectedDepartment}
                            onValueChange={setSelectedDepartment}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Departments" />  
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    All Departments
                                </SelectItem>
                                {DEPARTMENT_OPTIONS.map(department => (
                                    <SelectItem key={department.value} value={department.value}>
                                        {department.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <CreateButton />
                    </div>
                </div>
            </div>

            <DataTable table={subjectTable} />
        </ListView>
    )
}

export default SubjectsList