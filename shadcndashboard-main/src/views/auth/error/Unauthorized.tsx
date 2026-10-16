import React from 'react';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Lock, ArrowLeft, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full border border-border shadow-md rounded-2xl text-center p-8">
        <CardContent className="space-y-4 pt-2">
          <div className="size-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">401 - Authentication Required</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You must be signed in to access this restaurant management portal. Please log in with your staff or administrator credentials.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/login">
              <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl gap-1.5">
                <LogIn className="size-3.5" />
                <span>Go to Login</span>
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold rounded-xl gap-1.5">
                <ArrowLeft className="size-3.5" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
