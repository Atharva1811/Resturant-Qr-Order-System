import React from 'react';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { AlertOctagon, RotateCcw, ArrowLeft } from 'lucide-react';

export default function SystemErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full border border-border shadow-md rounded-2xl text-center p-8">
        <CardContent className="space-y-4 pt-2">
          <div className="size-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">500 - Internal System Error</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while communicating with the order processing service. The restaurant error log has recorded this incident.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Retry Request</span>
            </Button>
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold rounded-xl gap-1.5">
                <ArrowLeft className="size-3.5" />
                <span>Return to Safety</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
