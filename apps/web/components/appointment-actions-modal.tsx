"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, XCircle, Loader2, AlertCircle } from "lucide-react"
import { cancelAppointment, rescheduleAppointment } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface AppointmentActionsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: {
    id: string
    startTime: string
    endTime: string
    doctor?: {
      firstName: string
      lastName: string
      specialisation: string
    }
    patient?: {
      firstName: string
      lastName: string
    }
    status: string
  }
  token: string
  userRole: 'PATIENT' | 'DOCTOR'
}

export function AppointmentActionsModal({
  isOpen,
  onClose,
  appointment,
  token,
  userRole
}: AppointmentActionsModalProps) {
  const [activeTab, setActiveTab] = useState<'reschedule' | 'cancel'>('reschedule')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      await cancelAppointment(token, appointment.id, { reason: cancelReason })
      
      toast({
        title: "Success",
        description: "Appointment cancelled successfully. Both parties have been notified."
      })

      // Invalidate queries to refresh appointment list
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      
      // Reset and close
      setCancelReason('')
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReschedule = async () => {
    if (!newDate || !newStartTime || !newEndTime) {
      toast({
        title: "Validation Error",
        description: "Please select a new date and time",
        variant: "destructive"
      })
      return
    }

    // Construct new datetime strings
    const newStartDateTime = `${newDate}T${newStartTime}:00.000Z`
    const newEndDateTime = `${newDate}T${newEndTime}:00.000Z`

    // Validate times
    if (new Date(newStartDateTime) >= new Date(newEndDateTime)) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive"
      })
      return
    }

    // Validate not in the past
    if (new Date(newStartDateTime) < new Date()) {
      toast({
        title: "Validation Error",
        description: "Cannot schedule appointments in the past",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      await rescheduleAppointment(token, appointment.id, {
        newStartTime: newStartDateTime,
        newEndTime: newEndDateTime
      })
      
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully. Both parties have been notified."
      })

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      
      // Reset and close
      setNewDate('')
      setNewStartTime('')
      setNewEndTime('')
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatAppointmentDetails = () => {
    const date = new Date(appointment.startTime)
    const otherPartyName = userRole === 'PATIENT' 
      ? `Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`
      : `${appointment.patient?.firstName} ${appointment.patient?.lastName}`
    
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      otherPartyName
    }
  }

  const details = formatAppointmentDetails()

  // Cannot reschedule/cancel completed or already cancelled appointments
  const canModify = !['COMPLETED', 'CANCELLED'].includes(appointment.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Appointment</DialogTitle>
          <DialogDescription>
            Appointment with {details.otherPartyName} on {details.date} at {details.time}
            {!canModify && (
              <div className="flex items-center gap-2 mt-3 text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  This appointment is {appointment.status.toLowerCase()} and cannot be modified
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {canModify ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reschedule" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Reschedule
              </TabsTrigger>
              <TabsTrigger value="cancel" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reschedule" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="new-date">New Date</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-start-time">Start Time</Label>
                  <Input
                    id="new-start-time"
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-end-time">End Time</Label>
                  <Input
                    id="new-end-time"
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Both parties will be notified of the change and calendar events will be updated automatically.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button onClick={handleReschedule} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    'Confirm Reschedule'
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="cancel" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Please provide a reason for cancelling this appointment..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> This action cannot be undone. Both parties will be notified and calendar events will be deleted.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                  Keep Appointment
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancel} 
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        ) : (
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
