"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { createPrescription, type CreatePrescriptionDto } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Medication {
  name: string
  dose: string
  frequency: string
  duration: string
}

interface PrescribeMedicationFormProps {
  appointmentId: string
  token: string
  onSuccess?: () => void
}

const FREQUENCY_OPTIONS = [
  { value: "ONCE_DAILY", label: "Once Daily (8 AM)" },
  { value: "TWICE_DAILY", label: "Twice Daily (8 AM, 8 PM)" },
  { value: "THREE_TIMES_DAILY", label: "Three Times Daily (8 AM, 2 PM, 8 PM)" },
  { value: "EVERY_6_HOURS", label: "Every 6 Hours" },
  { value: "EVERY_4_HOURS", label: "Every 4 Hours" },
]

export function PrescribeMedicationForm({ appointmentId, token, onSuccess }: PrescribeMedicationFormProps) {
  const [loading, setLoading] = useState(false)
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [followUpSteps, setFollowUpSteps] = useState<string[]>([""])
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dose: "", frequency: "ONCE_DAILY", duration: "7 days" }
  ])
  const { toast } = useToast()

  const addMedication = () => {
    setMedications([...medications, { name: "", dose: "", frequency: "ONCE_DAILY", duration: "7 days" }])
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications]
    updated[index][field] = value
    setMedications(updated)
  }

  const addFollowUpStep = () => {
    setFollowUpSteps([...followUpSteps, ""])
  }

  const removeFollowUpStep = (index: number) => {
    setFollowUpSteps(followUpSteps.filter((_, i) => i !== index))
  }

  const updateFollowUpStep = (index: number, value: string) => {
    const updated = [...followUpSteps]
    updated[index] = value
    setFollowUpSteps(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!clinicalNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Clinical notes are required",
        variant: "destructive"
      })
      return
    }

    const validMedications = medications.filter(m => m.name.trim() && m.dose.trim())
    if (validMedications.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one medication is required",
        variant: "destructive"
      })
      return
    }

    const validFollowUpSteps = followUpSteps.filter(s => s.trim())

    setLoading(true)
    try {
      const dto: CreatePrescriptionDto = {
        appointmentId,
        clinicalNotes,
        followUpSteps: validFollowUpSteps,
        medications: validMedications
      }

      await createPrescription(token, dto)
      
      toast({
        title: "Success",
        description: "Prescription created and medication reminders scheduled"
      })

      // Reset form
      setClinicalNotes("")
      setFollowUpSteps([""])
      setMedications([{ name: "", dose: "", frequency: "ONCE_DAILY", duration: "7 days" }])

      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Complete Visit & Prescribe Medications</CardTitle>
        <CardDescription>
          Create a prescription with medications and automated reminders will be scheduled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clinical Notes */}
          <div className="space-y-2">
            <Label htmlFor="clinical-notes">Clinical Notes *</Label>
            <Textarea
              id="clinical-notes"
              placeholder="Document the visit findings, diagnosis, and treatment plan..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Medications *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>

            {medications.map((med, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medication Name</Label>
                    <Input
                      placeholder="e.g., Amoxicillin"
                      value={med.name}
                      onChange={(e) => updateMedication(index, "name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dose</Label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={med.dose}
                      onChange={(e) => updateMedication(index, "dose", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={med.frequency}
                      onValueChange={(value) => updateMedication(index, "frequency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      placeholder="e.g., 7 days, 2 weeks"
                      value={med.duration}
                      onChange={(e) => updateMedication(index, "duration", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {medications.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-600"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </Card>
            ))}
          </div>

          {/* Follow-up Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Follow-up Steps (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFollowUpStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            {followUpSteps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="e.g., Schedule follow-up in 2 weeks"
                  value={step}
                  onChange={(e) => updateFollowUpStep(index, e.target.value)}
                />
                {followUpSteps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFollowUpStep(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Prescription...
              </>
            ) : (
              "Complete Visit & Create Prescription"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
