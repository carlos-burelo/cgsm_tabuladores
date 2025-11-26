'use client';

import { CloudUploadIcon, HomeIcon, TagsIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'
import { ModeToggle } from './ToggleIcon'

export function Header() {
  return (
      <header className="border-b border-border bg-background">
        <div className="px-3 sm:px-4 md:px-6 py-4">
          <div className="grid grid-flow-col items-center gap-4">
          <Link href="/" >
                        <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-foreground">
              Tabuladores
            </h1>
          </Link>

            <nav className="grid grid-flow-col gap-2 justify-end">
              <Button asChild size="icon" title="Inicio">
                <Link href="/" >
                  <HomeIcon className="h-4 w-4" />
                </Link>
              </Button>
                            <Button asChild size="icon" title="Clasificador">
                <Link href="/classifier" >
                  <TagsIcon className="h-4 w-4" />
                </Link>
              </Button>
                            <Button asChild size="icon" title="Subir archivo">
                <Link href="/upload" >
                  <CloudUploadIcon className="h-4 w-4" />
                </Link>
              </Button>
              <ModeToggle />
             
            </nav>
          </div>
        </div>
      </header>
  );
}
