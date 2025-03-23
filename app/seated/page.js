import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Utensils } from "lucide-react"
import Image from "next/image"

function Status() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center space-y-3 pb-2 text-center bg-black rounded-md">
          <div className="relative h-12 w-36">
            <Image src="/greenspoon.png" alt="Company Logo" fill className="object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Table Status</CardTitle>
            <CardDescription>Your party has been seated and is ready to dine</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="flex flex-col items-center justify-center rounded-lg border bg-success/5 p-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="mt-4 text-xl font-medium text-green-500">Seated</h3>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <Utensils className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Your server is on the way</h3>
                <p className="text-sm text-muted-foreground">
                  Your server will be with you shortly to take your order. Thank you for your patience.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Status

