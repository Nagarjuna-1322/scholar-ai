"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";

interface AIMatcherProps {
    isSearching: boolean;
    onSearch: (query: string) => void;
    onClear: () => void;
}

export function AIMatcher({ isSearching, onSearch, onClear }: AIMatcherProps) {
    const [query, setQuery] = useState("");
    
    const handleSearchClick = () => {
        if (query.trim()) {
            onSearch(query.trim());
        }
    }

    const handleClearClick = () => {
        setQuery("");
        onClear();
    }

    return (
        <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                placeholder="Search with AI (e.g., 'scholarships for engineering students')"
                className="pl-10"
              />
              {query && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={handleClearClick}>
                  <X className="h-4 w-4"/>
                </Button>
              )}
            </div>
            <Button onClick={handleSearchClick} disabled={isSearching || !query.trim()}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
    )
}
