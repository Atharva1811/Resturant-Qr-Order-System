import React from 'react';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full border border-border shadow-md rounded-2xl text-center p-8">
        <CardContent className="space-y-4 pt-2">
          <div className="size-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">403 - Access Forbidden</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current role does not have permission to view or manage this area. Cross-tenant data isolation and role privileges are strictly enforced.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/login">
              <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl gap-1.5">
                <LogIn className="size-3.5" />
                <span>Switch Role</span>
              </Button>
            </Link>
            <Link to="/admin/dashboard">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold rounded-xl gap-1.5">
                <ArrowLeft className="size-3.5" />
                <span>Return to Admin</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
