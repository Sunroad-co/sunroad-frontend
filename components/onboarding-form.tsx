"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { sanitizeAndTrim } from "@/lib/utils/sanitize";
import { useClickOutside } from "@/hooks/use-click-outside";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface GeoapifySuggestion {
  properties: {
    formatted: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export default function OnboardingForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<GeoapifySuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeoapifySuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(null);
  const router = useRouter();
  const locationRef = useRef<HTMLDivElement>(null);

  // Debounced handle suggestions from display_name
  useEffect(() => {
    if (!displayName || displayName.length < 2) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: suggestions, error: suggestError } = await supabase.rpc('suggest_handles', {
          p_display_name: displayName,
          p_limit: 5
        });
        if (!suggestError && suggestions && suggestions.length > 0) {
          // Only set suggestions if handle is empty or has error
          if (!handle || handleError) {
            setHandleSuggestions(suggestions.map((s: { handle: string }) => s.handle));
          }
        }
      } catch (e) {
        // Ignore suggestion errors
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [displayName, handle, handleError]);

  // Debounced handle validation
  useEffect(() => {
    if (!handle || handle.length < 2) {
      setHandleError(null);
      setIsHandleAvailable(null);
      setHandleSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingHandle(true);
      setHandleError(null);
      setIsHandleAvailable(null);
      
      try {
        const supabase = createClient();
        const { data: isAvailable, error } = await supabase.rpc('is_handle_available', {
          p_handle: handle.toLowerCase().trim()
        });

        if (error) {
          console.error('Error checking handle:', error);
          setHandleError('Unable to verify handle availability');
          setIsHandleAvailable(false);
          return;
        }

        if (!isAvailable) {
          setHandleError('This handle is already taken');
          setIsHandleAvailable(false);
          // Try to get suggestions
          try {
            const { data: suggestions, error: suggestError } = await supabase.rpc('suggest_handles', {
              p_display_name: displayName || handle,
              p_limit: 5
            });
            if (!suggestError && suggestions) {
              setHandleSuggestions(suggestions.map((s: { handle: string }) => s.handle));
            }
          } catch (e) {
            // Ignore suggestion errors
          }
        } else {
          setHandleError(null);
          setIsHandleAvailable(true);
          setHandleSuggestions([]);
        }
      } catch (err) {
        console.error('Unexpected error checking handle:', err);
        setHandleError('Unable to verify handle availability');
        setIsHandleAvailable(false);
      } finally {
        setIsCheckingHandle(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [handle, displayName]);

  // Debounced location search
  useEffect(() => {
    if (!locationQuery || locationQuery.length < 2 || selectedLocation) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geoapify/autocomplete?q=${encodeURIComponent(locationQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        setLocationSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
        setLocationSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationQuery, selectedLocation]);

  // Close suggestions when clicking outside
  useClickOutside([locationRef], () => {
    setShowSuggestions(false);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Validation
    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (!displayName.trim()) {
      setError("Display name is required");
      setIsLoading(false);
      return;
    }

    if (!handle.trim()) {
      setError("Handle is required");
      setIsLoading(false);
      return;
    }

    if (handleError) {
      setError("Please choose an available handle");
      setIsLoading(false);
      return;
    }

    try {
      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });
      if (passwordError) throw passwordError;

      // Create profile
      const sanitizedDisplayName = sanitizeAndTrim(displayName);
      const sanitizedHandle = handle.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const postalCode = selectedLocation?.properties.postcode || null;

      const { data: profile, error: profileError } = await supabase.rpc('create_artist_profile', {
        p_display_name: sanitizedDisplayName,
        p_handle: sanitizedHandle,
        p_location_id: null,
        p_postal_code: postalCode
      });

      if (profileError) {
        // Check if profile already exists (user might have refreshed)
        if (profileError.message.includes('already exists') || profileError.message.includes('duplicate')) {
          router.push('/dashboard/profile');
          return;
        }
        // Check if handle is taken
        if (profileError.message.includes('handle') || profileError.message.includes('unique')) {
          setError('This handle is already taken. Please choose another.');
          setIsHandleAvailable(false);
          // Request suggestions again
          try {
            const { data: suggestions, error: suggestError } = await supabase.rpc('suggest_handles', {
              p_display_name: displayName || handle,
              p_limit: 5
            });
            if (!suggestError && suggestions) {
              setHandleSuggestions(suggestions.map((s: { handle: string }) => s.handle));
            }
          } catch (e) {
            // Ignore suggestion errors
          }
          setIsLoading(false);
          return;
        }
        throw profileError;
      }

      // Success - redirect to dashboard
      router.push('/dashboard/profile');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (suggestion: GeoapifySuggestion) => {
    setSelectedLocation(suggestion);
    setLocationQuery(suggestion.properties.formatted);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleLocationClear = () => {
    setSelectedLocation(null);
    setLocationQuery("");
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>
            Set up your account to start connecting with local creatives
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Password fields */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={8}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  disabled={isLoading}
                  minLength={8}
                  className="h-12"
                />
              </div>

              {/* Display name */}
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  maxLength={100}
                  className="h-12"
                />
              </div>

              {/* Handle */}
              <div className="grid gap-2">
                <Label htmlFor="handle">Handle</Label>
                <div className="relative">
                  <Input
                    id="handle"
                    type="text"
                    placeholder="your-handle"
                    required
                    value={handle}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setHandle(value);
                      setIsHandleAvailable(null);
                    }}
                    disabled={isLoading}
                    maxLength={50}
                    className={cn(
                      "h-12 pr-10",
                      isHandleAvailable === true && "border-green-500 focus-visible:ring-green-500",
                      isHandleAvailable === false && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingHandle && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!isCheckingHandle && isHandleAvailable === true && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {!isCheckingHandle && isHandleAvailable === false && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {handleError && (
                  <p className="text-xs text-red-500">{handleError}</p>
                )}
                {handleSuggestions.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground mb-2">
                      {handleError ? "Suggestions:" : "Suggested handles:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {handleSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setHandle(suggestion);
                            setHandleError(null);
                            setIsHandleAvailable(null);
                            setHandleSuggestions([]);
                          }}
                          className="text-xs px-3 py-1.5 bg-sunroad-amber-100 text-sunroad-amber-800 rounded-md hover:bg-sunroad-amber-200 transition-colors font-medium"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Your unique identifier (letters, numbers, and hyphens only)
                </p>
              </div>

              {/* Location */}
              <div className="grid gap-2">
                <Label htmlFor="location">Location (optional)</Label>
                <div className="relative" ref={locationRef}>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Search for your city..."
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      if (selectedLocation) {
                        setSelectedLocation(null);
                      }
                    }}
                    onFocus={() => {
                      if (locationSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    disabled={isLoading}
                    className="h-12"
                  />
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={handleLocationClear}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleLocationSelect(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {suggestion.properties.formatted}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Help others find you by location
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={isLoading || isCheckingHandle || !!handleError || isHandleAvailable !== true}
              >
                {isLoading ? "Creating profile..." : "Complete setup"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

