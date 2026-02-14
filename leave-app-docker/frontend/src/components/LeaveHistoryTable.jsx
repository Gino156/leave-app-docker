import React from "react";
import { 
  Card, CardHeader, CardBody, Divider, Table, TableHeader, 
  TableColumn, TableBody, TableRow, TableCell, Chip, Skeleton 
} from "@heroui/react";

const LeaveHistoryTable = ({ data, loading }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <Card className="shadow-sm border-none h-112.5">
      <CardHeader className="px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-20">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Leave History</h2>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Record Logs</p>
        </div>
        <Chip size="sm" variant="flat" color="primary" className="font-mono text-[10px]">
          {data.length} Total
        </Chip>
      </CardHeader>
      <Divider />
      
      <CardBody className="p-0 overflow-y-auto scrollbar-hide">
        <Table 
          isHeaderSticky
          aria-label="Leave History Table" 
          removeWrapper 
          shadow="none" 
          className="min-w-full"
        >
          <TableHeader>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3">ID</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3">FILED</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3">BEGIN</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3">END</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3">TYPE</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 text-center">STATUS</TableColumn>
          </TableHeader>
          
          <TableBody emptyContent={!loading && "No records found."}>
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-3 w-6 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-10 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-10 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-10 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-14 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-14 rounded-full mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              data.map((item) => (
                <TableRow key={item.LeaveApplicationId} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-none">
                  <TableCell className="text-[11px] font-bold text-slate-500">{item.LeaveApplicationId}</TableCell>
                  <TableCell className="text-[11px] font-medium text-slate-600">{formatDate(item.DateCreated)}</TableCell>
                  <TableCell className="text-[11px] text-slate-600">{formatDate(item.BeginDate)}</TableCell>
                  <TableCell className="text-[11px] text-slate-600">{formatDate(item.EndDate)}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {item.TimeOffType}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Chip 
                      size="sm" 
                      color={getStatusColor(item.ApprovalStatus)} 
                      variant="dot" 
                      className="border-none font-bold uppercase text-[9px] h-6"
                    >
                      {item.ApprovalStatus || "Pending"}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default LeaveHistoryTable;