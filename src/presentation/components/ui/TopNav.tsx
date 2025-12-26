/**
 * 🟪 COUCHE PRÉSENTATION - Floating Top Navigation
 * Glassmorphism efektli üst navigasyon çubuğu
 */

'use client';

import { Menu, Search, User, Settings, History, LogOut } from 'lucide-react';
import { Button } from './button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

export function TopNav() {
  return (
    <div className="pointer-events-auto px-4 pt-safe-top">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border border-white/20 dark:border-zinc-800/50 shadow-lg rounded-full px-4 py-3">
          {/* Hamburger Menu with Side Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                aria-label="Menü"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>EV Router</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    // TODO: Navigate to profile
                    console.log('Profil tıklandı');
                  }}
                >
                  <User className="h-5 w-5" />
                  Profil
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    // TODO: Navigate to settings
                    console.log('Ayarlar tıklandı');
                  }}
                >
                  <Settings className="h-5 w-5" />
                  Ayarlar
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    // TODO: Navigate to route history
                    console.log('Geçmiş Rotalar tıklandı');
                  }}
                >
                  <History className="h-5 w-5" />
                  Geçmiş Rotalar
                </Button>
                <div className="border-t border-border mt-2 pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                    onClick={() => {
                      // TODO: Implement logout
                      console.log('Çıkış Yap tıklandı');
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Çıkış Yap
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Hedef ara..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              readOnly
            />
          </div>

          {/* Profile Avatar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Profil"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

