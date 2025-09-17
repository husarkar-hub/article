import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from './ui/button';
const AdminNavbar = () => {
  return (
    <Sheet>
      <SheetTrigger>
        {" "}
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="">
        <SheetHeader>
          <SheetTitle>Admin Panel</SheetTitle>
        </SheetHeader>
        <SheetDescription>
          <div className="flex flex-col gap-4 mt-4 text-md font-medium p-4 bg-background">
            <Link
              href="/admin"
              className="text-primary hover:bg-muted rounded-m p-3"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/articles"
              className="text-primary hover:bg-muted rounded-m p-3"
            >
              Articles
            </Link>
            <Link
              href="/admin/users"
              className="text-primary hover:bg-muted rounded-m p-3"
            >
              Users
            </Link>
            <Link
              href="/admin/settings"
              className="text-primary hover:bg-muted rounded-m p-3"
            >
              Settings
            </Link>
          </div>
        </SheetDescription>
        <SheetFooter>
          <Button variant="destructive" >
            Logout
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default AdminNavbar