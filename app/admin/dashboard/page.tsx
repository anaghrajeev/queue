"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogOut, Plus, Trash, Edit, Save, X, Loader2 } from "lucide-react";
import { 
  TableState, 
  TableStatus, 
  fetchTables, 
  addTable, 
  updateTable, 
  deleteTable 
  ,subscribeToTables
} from "../../Redux/slice/tableSlice";
import { AppDispatch, RootState } from "../../Redux/store/store";
import store from "../../Redux/store/store";

export default function AdminDashboard() {
  return (
    <Provider store={store}>
      <AdminDashboardPage />
    </Provider>
  )
}

function AdminDashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { tables, loading, error } = useSelector((state: RootState) => state.tables);
  const { toast } = useToast();

  const [newTable, setNewTable] = useState<Omit<TableState, 'tableId'>>({
    tableNumber: 0,
    capacity: 0,
    status: TableStatus.free,
    engagedTime: null,
    cleaningTime: null
  });

  const [editingTable, setEditingTable] = useState<TableState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchTables());
    dispatch(subscribeToTables());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate table number is unique
    if (tables.some((table: TableState) => table.tableNumber === newTable.tableNumber)) {
      toast({
        title: "Error",
        description: "Table number already exists",
        variant: "destructive",
      });
      return;
    }

    await dispatch(addTable(newTable));
    setNewTable({
      tableNumber: 0,
      capacity: 2,
      status: TableStatus.free,
      engagedTime: null,
      cleaningTime: null
    });
    
    toast({
      title: "Success",
      description: "Table added successfully",
    });
  };

  const handleEditTable = (table: TableState) => {
    setEditingTable(table);
    setIsEditing(true);
  };

  const saveEditedTable = async () => {
    if (editingTable) {
      await dispatch(updateTable(editingTable));
      setIsEditing(false);
      setEditingTable(null);
      
  
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingTable(null);
  };

  const confirmDelete = (tableId: number) => {
    setTableToDelete(tableId);
  };

  const handleDeleteTable = async () => {
    if (tableToDelete !== null) {
      await dispatch(deleteTable(tableToDelete));
      setTableToDelete(null);
      
     
    }
  };

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case TableStatus.free:
        return <Badge className="bg-green-500">Free</Badge>;
      case TableStatus.engaged:
        return <Badge className="bg-red-500">Engaged</Badge>;
      case TableStatus.cleaning:
        return <Badge className="bg-yellow-500">Cleaning</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-primary px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">Waiter Dashboard</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Table</CardTitle>
              <CardDescription>Create a new table for the restaurant</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTable} className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Table Number</Label>
                  <Input 
                    id="tableNumber" 
                    type="number" 
                    value={newTable.tableNumber || ""} 
                    onChange={(e) => setNewTable({ ...newTable, tableNumber: Number(e.target.value) })} 
                    className="w-32" 
                    min="1" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableCapacity">Capacity</Label>
                  <Input 
                    id="tableCapacity" 
                    type="number" 
                    value={newTable.capacity || ""} 
                    onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })} 
                    className="w-32" 
                    min="1" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableStatus">Status</Label>
                  <Select 
                    value={newTable.status} 
                    onValueChange={(value) => setNewTable({ ...newTable, status: value as TableStatus })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TableStatus.free}>Free</SelectItem>
                      <SelectItem value={TableStatus.engaged}>Engaged</SelectItem>
                      <SelectItem value={TableStatus.cleaning}>Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} 
                  Add Table
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Manage Tables</CardTitle>
              <CardDescription>View, edit or delete restaurant tables</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !tables.length ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No tables found. Add a table to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Number</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((table) => (
                      <TableRow key={table.tableId}>
                        {isEditing && editingTable?.tableId === table.tableId ? (
                          // Editing mode
                          <>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={editingTable.tableNumber} 
                                onChange={(e) => setEditingTable({ 
                                  ...editingTable, 
                                  tableNumber: Number(e.target.value) 
                                })} 
                                className="w-20" 
                                min="1" 
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={editingTable.capacity} 
                                onChange={(e) => setEditingTable({ 
                                  ...editingTable, 
                                  capacity: Number(e.target.value) 
                                })} 
                                className="w-20" 
                                min="1" 
                              />
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={editingTable.status} 
                                onValueChange={(value) => setEditingTable({ 
                                  ...editingTable, 
                                  status: value as TableStatus 
                                })}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={TableStatus.free}>Free</SelectItem>
                                  <SelectItem value={TableStatus.engaged}>Engaged</SelectItem>
                                  <SelectItem value={TableStatus.cleaning}>Cleaning</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={saveEditedTable} 
                                className="mr-2"
                                disabled={loading}
                              >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={cancelEdit}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </>
                        ) : (
                          // Display mode
                          <>
                            <TableCell>{table.tableNumber}</TableCell>
                            <TableCell>{table.capacity} people</TableCell>
                            <TableCell>{getStatusBadge(table.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditTable(table)}
                                className="mr-2"
                                disabled={loading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog open={tableToDelete === table.tableId} onOpenChange={(open) => !open && setTableToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => confirmDelete(table.tableId)}
                                    disabled={loading}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action will permanently delete table #{table.tableNumber}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={handleDeleteTable}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}