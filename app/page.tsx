"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Plus, Bell, Merge, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: Date
  dueTime?: string
  priority: "low" | "medium" | "high"
  listId: string
  createdAt: Date
}

interface TaskList {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export default function TaskManagementApp() {
  const [taskLists, setTaskLists] = useState<TaskList[]>([
    {
      id: "1",
      name: "個人タスク",
      color: "bg-primary",
      tasks: [],
    },
    {
      id: "2",
      name: "仕事",
      color: "bg-accent",
      tasks: [],
    },
  ])

  const [selectedListId, setSelectedListId] = useState("1")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date>()
  const [newTaskDueTime, setNewTaskDueTime] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [isAddListOpen, setIsAddListOpen] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  // 通知の許可を求める
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // リマインダーチェック
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      taskLists.forEach((list) => {
        list.tasks.forEach((task) => {
          if (!task.completed && task.dueDate && task.dueTime) {
            const taskDateTime = new Date(task.dueDate)
            const [hours, minutes] = task.dueTime.split(":").map(Number)
            taskDateTime.setHours(hours, minutes)

            const timeDiff = taskDateTime.getTime() - now.getTime()

            // 5分前に通知
            if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
              if (Notification.permission === "granted") {
                new Notification(`タスクのリマインダー: ${task.title}`, {
                  body: `5分後に期限です`,
                  icon: "/favicon.ico",
                })
              }
            }
          }
        })
      })
    }

    const interval = setInterval(checkReminders, 60000) // 1分ごとにチェック
    return () => clearInterval(interval)
  }, [taskLists])

  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      completed: false,
      dueDate: newTaskDueDate,
      dueTime: newTaskDueTime,
      priority: newTaskPriority,
      listId: selectedListId,
      createdAt: new Date(),
    }

    setTaskLists((prev) =>
      prev.map((list) => (list.id === selectedListId ? { ...list, tasks: [...list.tasks, newTask] } : list)),
    )

    // フォームをリセット
    setNewTaskTitle("")
    setNewTaskDescription("")
    setNewTaskDueDate(undefined)
    setNewTaskDueTime("")
    setNewTaskPriority("medium")
    setIsAddTaskOpen(false)
  }

  const toggleTask = (taskId: string) => {
    setTaskLists((prev) =>
      prev.map((list) => ({
        ...list,
        tasks: list.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
      })),
    )
  }

  const deleteTask = (taskId: string) => {
    setTaskLists((prev) =>
      prev.map((list) => ({
        ...list,
        tasks: list.tasks.filter((task) => task.id !== taskId),
      })),
    )
  }

  const addTaskList = () => {
    if (!newListName.trim()) return

    const colors = ["bg-primary", "bg-accent", "bg-chart-1", "bg-chart-2", "bg-chart-3"]
    const newList: TaskList = {
      id: Date.now().toString(),
      name: newListName,
      color: colors[taskLists.length % colors.length],
      tasks: [],
    }

    setTaskLists((prev) => [...prev, newList])
    setNewListName("")
    setIsAddListOpen(false)
  }

  const mergeLists = () => {
    if (selectedTasks.length < 2) return

    const selectedListsData = taskLists.filter((list) => selectedTasks.includes(list.id))
    const allTasks = selectedListsData.flatMap((list) => list.tasks)

    const mergedList: TaskList = {
      id: Date.now().toString(),
      name: `統合リスト - ${selectedListsData.map((l) => l.name).join(", ")}`,
      color: "bg-primary",
      tasks: allTasks,
    }

    setTaskLists((prev) => [...prev.filter((list) => !selectedTasks.includes(list.id)), mergedList])
    setSelectedTasks([])
  }

  const currentList = taskLists.find((list) => list.id === selectedListId)
  const completedTasks = currentList?.tasks.filter((task) => task.completed) || []
  const pendingTasks = currentList?.tasks.filter((task) => !task.completed) || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive"
      case "medium":
        return "bg-accent"
      case "low":
        return "bg-muted"
      default:
        return "bg-muted"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        return "中"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">タスク管理</h1>
          <p className="text-muted-foreground">効率的にタスクを管理し、生産性を向上させましょう</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* サイドバー */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  タスクリスト
                  <Dialog open={isAddListOpen} onOpenChange={setIsAddListOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しいリストを作成</DialogTitle>
                        <DialogDescription>新しいタスクリストの名前を入力してください</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="listName">リスト名</Label>
                          <Input
                            id="listName"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="例: 買い物リスト"
                          />
                        </div>
                        <Button onClick={addTaskList} className="w-full">
                          作成
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {taskLists.map((list) => (
                  <div key={list.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTasks.includes(list.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks((prev) => [...prev, list.id])
                        } else {
                          setSelectedTasks((prev) => prev.filter((id) => id !== list.id))
                        }
                      }}
                    />
                    <Button
                      variant={selectedListId === list.id ? "default" : "ghost"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectedListId(list.id)}
                    >
                      <div className={cn("w-3 h-3 rounded-full mr-2", list.color)} />
                      {list.name}
                      <Badge variant="secondary" className="ml-auto">
                        {list.tasks.length}
                      </Badge>
                    </Button>
                  </div>
                ))}

                {selectedTasks.length >= 2 && (
                  <Button onClick={mergeLists} variant="outline" className="w-full mt-4 bg-transparent">
                    <Merge className="h-4 w-4 mr-2" />
                    選択したリストを統合
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <div className={cn("w-4 h-4 rounded-full mr-2", currentList?.color)} />
                      {currentList?.name}
                    </CardTitle>
                    <CardDescription>
                      {pendingTasks.length}個の未完了タスク、{completedTasks.length}個の完了済みタスク
                    </CardDescription>
                  </div>
                  <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        タスクを追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>新しいタスクを追加</DialogTitle>
                        <DialogDescription>タスクの詳細を入力してください</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="taskTitle">タスク名 *</Label>
                          <Input
                            id="taskTitle"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="例: 資料を作成する"
                          />
                        </div>
                        <div>
                          <Label htmlFor="taskDescription">説明</Label>
                          <Textarea
                            id="taskDescription"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            placeholder="タスクの詳細説明（任意）"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>期日</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal bg-transparent"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newTaskDueDate ? format(newTaskDueDate, "yyyy/MM/dd", { locale: ja }) : "日付を選択"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={newTaskDueDate}
                                  onSelect={setNewTaskDueDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label htmlFor="taskTime">時間</Label>
                            <Input
                              id="taskTime"
                              type="time"
                              value={newTaskDueTime}
                              onChange={(e) => setNewTaskDueTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>優先度</Label>
                          <Select
                            value={newTaskPriority}
                            onValueChange={(value: "low" | "medium" | "high") => setNewTaskPriority(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">低</SelectItem>
                              <SelectItem value="medium">中</SelectItem>
                              <SelectItem value="high">高</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={addTask} className="w-full">
                          タスクを追加
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">未完了 ({pendingTasks.length})</TabsTrigger>
                    <TabsTrigger value="completed">完了済み ({completedTasks.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4 mt-4">
                    {pendingTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">未完了のタスクはありません</div>
                    ) : (
                      pendingTasks.map((task) => (
                        <Card key={task.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{task.title}</h3>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {getPriorityText(task.priority)}
                                  </Badge>
                                  <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                              {(task.dueDate || task.dueTime) && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {task.dueDate && format(task.dueDate, "yyyy/MM/dd", { locale: ja })}
                                  {task.dueTime && ` ${task.dueTime}`}
                                  {task.dueDate && task.dueTime && <Bell className="h-4 w-4 ml-2" />}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4 mt-4">
                    {completedTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">完了済みのタスクはありません</div>
                    ) : (
                      completedTasks.map((task) => (
                        <Card key={task.id} className="p-4 opacity-60">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium line-through">{task.title}</h3>
                                <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground line-through">{task.description}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
