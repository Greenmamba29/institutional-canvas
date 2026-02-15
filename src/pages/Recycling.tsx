import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { listRecyclingProjects, RecyclingProject } from '@/services/recycling.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const Recycling: React.FC = () => {
  const client = useAuthenticatedClient();
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['recyclingProjects'],
    queryFn: () => listRecyclingProjects(client),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Recycling Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.data?.map((project: RecyclingProject) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{format(new Date(project.start_date), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge>{project.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recycling;
