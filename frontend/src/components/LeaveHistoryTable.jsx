import React, { useState } from "react";
import { 
  Card, CardHeader, CardBody, Divider, Table, TableHeader, 
  TableColumn, TableBody, TableRow, TableCell, Chip, Skeleton, Button
} from "@heroui/react";

const LeaveHistoryTable = ({ data, loading, onCancelSuccess }) => {
  // Manage selection state for the "Success" highlight
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  // Track which specific row is currently being cancelled for the loading spinner
  const [isActionLoading, setIsActionLoading] = useState(null);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: '2-digit'
    });
  };

  const handleCancel = async (leaveId) => {
    const myToken = localStorage.getItem("access_token");
    
    // Safety check before proceeding
    if (!window.confirm(`Are you sure you want to cancel request #${leaveId}?`)) return;

    setIsActionLoading(leaveId);
    try {
      const response = await fetch(`http://172.96.10.161:8000/LeaveHistory/Cancel/${leaveId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${myToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Triggers fetchData() in App.js to refresh Leave Credits and Table data
        onCancelSuccess(); 
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to cancel request.");
      }
    } catch (error) {
      console.error("Cancel Error:", error);
      alert("An error occurred. Please check your connection.");
    } finally {
      setIsActionLoading(null);
    }
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
          // Selection Configuration
          selectionMode="single"
          color="success"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <TableHeader>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 uppercase">ID</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 uppercase">Filed</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 uppercase">Begin</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 uppercase">End</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 uppercase">Type</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 text-center uppercase">Status</TableColumn>
            <TableColumn className="bg-gray-50/80 text-gray-400 text-[10px] py-3 uppercase w-0">Action</TableColumn>
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
                  <TableCell><Skeleton className="h-3 w-8 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : (
              data.map((item) => (
                <TableRow 
                  key={item.LeaveApplicationId} 
                  className="cursor-pointer transition-colors border-b border-gray-100 last:border-none"
                >
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
                  <TableCell>
                    <Button 
                      color="danger" 
                      variant="flat" 
                      size="sm"
                      radius="full" 
                      className="font-bold h-8 text-[10px]"
                      // Only allow cancellation for "Pending" requests
                      isDisabled={item.ApprovalStatus !== "Pending"}
                      // Show loading state for the specific row being processed
                      isLoading={isActionLoading === item.LeaveApplicationId}
                      onPress={() => handleCancel(item.LeaveApplicationId)}
                    >
                      Cancel
                    </Button>
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