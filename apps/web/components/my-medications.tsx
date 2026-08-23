"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Pill, FileText, Loader2, Clock } from "lucide-react"
import { getMyPrescriptions } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { MedicationReminders } from "./medication-reminders"

interface Prescription {
  id: string
  createdAt: string
  visit: {
    clinicalNotes: string
    followUpSteps: string[]
    appointment: {
      startTime: string
      doctor: {
        firstName: string
        lastName: string
        specialisation: string
      }
    }
  }
  medications: Array<{
    id: string
    name: string
    dose: string
    frequency: string
    duration: string
    reminders: Array<{
      id: string
      reminderTime: string
      status: string
    }>
  }>
}

interface MyMedicationsProps {
  token: string
}

export function MyMedications({ token }: MyMedicationsProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await getMyPrescriptions(token)
        setPrescriptions(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch prescriptions",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [token])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Reminders
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prescription History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="mt-6">
          <MedicationReminders token={token} />
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-6 space-y-6">
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Prescriptions Yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your prescription history will appear here after doctor visits
                </p>
              </CardContent>
            </Card>
          ) : (
            prescriptions.map((prescription) => {
              const doctor = prescription.visit.appointment.doctor
              const appointmentDate = formatDate(prescription.visit.appointment.startTime)

              return (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Visit on {appointmentDate}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialisation}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {prescription.medications.length} {prescription.medications.length === 1 ? 'medication' : 'medications'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Clinical Notes */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                        Clinical Notes
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {prescription.visit.clinicalNotes}
                      </p>
                    </div>

                    {/* Medications */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                        Prescribed Medications
                      </h4>
                      <div className="space-y-3">
                        {prescription.medications.map((medication) => {
                          const nextReminder = medication.reminders[0]
                          const hasActiveReminders = medication.reminders.length > 0

                          return (
                            <Card key={medication.id} className="bg-muted/50">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="rounded-full bg-primary/10 p-2">
                                      <Pill className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <h5 className="font-semibold">{medication.name}</h5>
                                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                        <span>Dose: {medication.dose}</span>
                                        <span>•</span>
                                        <span>{medication.frequency.replace(/_/g, ' ')}</span>
                                        <span>•</span>
                                        <span>Duration: {medication.duration}</span>
                                      </div>
                                      {hasActiveReminders && nextReminder && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <Clock className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            Next reminder: {new Date(nextReminder.reminderTime).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {hasActiveReminders && (
                                    <Badge variant="outline" className="shrink-0">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>

                    {/* Follow-up Steps */}
                    {prescription.visit.followUpSteps.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                          Follow-up Instructions
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {prescription.visit.followUpSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
