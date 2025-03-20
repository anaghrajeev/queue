"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Plus, Trash, Edit, Save, X } from "lucide-react"

// Table interface
interface TableData {
  id: number
  number: number
  capacity: number
  status: "free" | "engaged" | "cleaning"
}

export default function AdminDashboardPage() {
  const [tables, setTables] = useState<TableData[]>([])
  const [newTable, setNewTable] = useState({ number: "", capacity: "" })
  const [editingTable, setEditingTable] = useState<TableData | null>(null)
  const { toast } = useToast()

  // Load tables from localStorage on component mount
  useEffect(() => {
    const savedTables = localStorage.getItem('restaurantTables')
    if (savedTables) {
      setTables(JSON.parse(savedTables))
    }
  }, [])

  // Save tables to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('restaurantTables', JSON.stringify(tables))
  }, [tables])

  // Add a new table
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!newTable.number || !newTable.capacity) {
      toast({
        title: "Validation error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const tableNumber = Number.parseInt(newTable.number)
    const tableCapacity = Number.parseInt(newTable.capacity)

    // Check if table number already exists
    if (tables.some((table) => table.number === tableNumber)) {
      toast({
        title: "Validation error",
        description: "Table number already exists",
        variant: "destructive",
      })
      return
    }

    // Create new table
    const newTableObj: TableData = {
      id: tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1,
      number: tableNumber,
      capacity: tableCapacity,
      status: "free",
    }

    setTables([...tables, newTableObj])
    setNewTable({ number: "", capacity: "" })

    toast({
      title: "Table added",
      description: `Table ${tableNumber} has been added successfully`,
    })
  }

  // Delete a table
  const handleDeleteTable = (id: number) => {
    setTables(tables.filter((table) => table.id !== id))

    toast({
      title: "Table deleted",
      description: "Table has been removed successfully",
    })
  }

  // Start editing a table
  const handleEditTable = (table: TableData) => {
    setEditingTable(table)
  }

  // Save edited table
  const handleSaveEdit = () => {
    if (!editingTable) return

    setTables(tables.map((table) => (table.id === editingTable.id ? editingTable : table)))
    setEditingTable(null)

    toast({
      title: "Table updated",
      description: `Table ${editingTable.number} has been updated successfully`,
    })
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTable(null)
  }

  // Get status badge color
  const getStatusBadge = (status: "free" | "engaged" | "cleaning") => {
    switch (status) {
      case "free":
        return <Badge className="bg-green-500">Free</Badge>
      case "engaged":
        return <Badge className="bg-red-500">Engaged</Badge>
      case "cleaning":
        return <Badge className="bg-yellow-500">Cleaning</Badge>
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-primary px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Waiter Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
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
                    placeholder="e.g. 101"
                    value={newTable.number}
                    onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
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
                    placeholder="e.g. 4"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                    className="w-32"
                    min="1"
                    required
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <Plus className="h-4 w-4" />
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
                  {tables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No tables found. Add your first table above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tables.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell>
                          {editingTable?.id === table.id ? (
                            <Input
                              type="number"
                              value={editingTable.number}
                              onChange={(e) =>
                                setEditingTable({ ...editingTable, number: Number.parseInt(e.target.value) })
                              }
                              className="w-20"
                              min="1"
                            />
                          ) : (
                            table.number
                          )}
                        </TableCell>
                        <TableCell>
                          {editingTable?.id === table.id ? (
                            <Input
                              type="number"
                              value={editingTable.capacity}
                              onChange={(e) =>
                                setEditingTable({ ...editingTable, capacity: Number.parseInt(e.target.value) })
                              }
                              className="w-20"
                              min="1"
                            />
                          ) : (
                            `${table.capacity} people`
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(table.status)}</TableCell>
                        <TableCell className="text-right">
                          {editingTable?.id === table.id ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditTable(table)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteTable(table.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}