"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { getUpcomingReminders, markReminderTaken } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface MedicationReminder {
  id: string
  reminderTime: string
  status: string
  medication: {
    id: string
    name: string
    dose: string
    frequency: string
    prescription: {
      visit: {
        appointment: {
          doctor: {
            firstName: string
            lastName: string
            specialisation: string
          }
        }
      }
    }
  }
}

interface MedicationRemindersProps {
  token: string
}

export function MedicationReminders({ token }: MedicationRemindersProps) {
  const [reminders, setReminders] = useState<MedicationReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [takingReminder, setTakingReminder] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchReminders = async () => {
    try {
      const data = await getUpcomingReminders(token)
      setReminders(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch reminders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
    // Refresh every minute
    const interval = setInterval(fetchReminders, 60000)
    return () => clearInterval(interval)
  }, [token])

  const handleMarkTaken = async (reminderId: string) => {
    setTakingReminder(reminderId)
    try {
      await markReminderTaken(token, reminderId)
      toast({
        title: "Success",
        description: "Medication marked as taken"
      })
      // Remove from list
      setReminders(reminders.filter(r => r.id !== reminderId))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as taken",
        variant: "destructive"
      })
    } finally {
      setTakingReminder(null)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Today's Medication Reminders
          </CardTitle>
          <CardDescription>You have no pending medication reminders for today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-muted-foreground">
            You're all caught up! Check back later for new reminders.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Today's Medication Reminders
        </CardTitle>
        <CardDescription>
          {reminders.length} pending {reminders.length === 1 ? 'reminder' : 'reminders'} for today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.map((reminder) => {
          const overdue = isOverdue(reminder.reminderTime)
          const doctor = reminder.medication.prescription.visit.appointment.doctor

          return (
            <Card key={reminder.id} className={overdue ? "border-orange-500" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {reminder.medication.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {reminder.medication.dose}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${overdue ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className={overdue ? 'text-orange-500 font-medium' : ''}>
                          {formatTime(reminder.reminderTime)}
                          {overdue && " (Overdue)"}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {reminder.medication.frequency.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        Prescribed by Dr. {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-xs">{doctor.specialisation}</p>
                    </div>

                    {overdue && (
                      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span>This medication reminder is overdue</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleMarkTaken(reminder.id)}
                    disabled={takingReminder === reminder.id}
                    className="shrink-0"
                  >
                    {takingReminder === reminder.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark as Taken
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
