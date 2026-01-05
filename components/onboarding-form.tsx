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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { sanitizeAndTrim } from "@/lib/utils/sanitize";
import { useClickOutside } from "@/hooks/use-click-outside";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [repeatPasswordError, setRepeatPasswordError] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true); // Checked by default
  const [locationError, setLocationError] = useState<string | null>(null);
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
      setIsSearchingLocations(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingLocations(true);
      try {
        const response = await fetch(`/api/geoapify/autocomplete?q=${encodeURIComponent(locationQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        const features = data.features || [];
        setLocationSuggestions(features);
        setShowSuggestions(features.length > 0);
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearchingLocations(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationQuery, selectedLocation]);

  // Close suggestions when clicking outside
  useClickOutside([locationRef], () => {
    setShowSuggestions(false);
  });

  // Password validation
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }
    if (!/[^a-zA-Z0-9]/.test(pwd)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
    }
    return null;
  };

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      setPasswordError(validatePassword(value));
      // Re-validate repeat password if it exists
      if (repeatPassword && repeatPassword !== value) {
        setRepeatPasswordError("Passwords do not match.");
      } else if (repeatPassword) {
        setRepeatPasswordError(null);
      }
    } else {
      setPasswordError(null);
      if (repeatPassword) {
        setRepeatPasswordError(null);
      }
    }
  };

  // Handle repeat password change with validation
  const handleRepeatPasswordChange = (value: string) => {
    setRepeatPassword(value);
    if (value) {
      if (value !== password) {
        setRepeatPasswordError("Passwords do not match.");
      } else {
        setRepeatPasswordError(null);
      }
    } else {
      setRepeatPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setRepeatPasswordError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!displayName.trim()) {
      setError("Name is required");
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

    if (!selectedLocation) {
      setLocationError("Location is required");
      setIsLoading(false);
      return;
    }

    try {
      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });
      if (passwordError) {
        // Map Supabase password policy errors to user-friendly messages
        if (passwordError.message.includes('password') || passwordError.message.includes('policy')) {
          throw new Error("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
        }
        throw passwordError;
      }

      // Create profile
      const sanitizedDisplayName = sanitizeAndTrim(displayName);
      const sanitizedHandle = handle.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      
      // Prepare location data if selected
      const rpcParams: {
        p_display_name: string;
        p_handle: string;
        p_location_id: null;
        p_city?: string | null;
        p_state?: string | null;
        p_country_code?: string;
        p_formatted?: string | null;
      } = {
        p_display_name: sanitizedDisplayName,
        p_handle: sanitizedHandle,
        p_location_id: null,
      };

      if (selectedLocation) {
        // Extract city from formatted if city property is missing
        const city = selectedLocation.properties.city || 
          (selectedLocation.properties.formatted?.split(',')[0]?.trim() || null);
        
        rpcParams.p_city = city;
        rpcParams.p_state = selectedLocation.properties.state || null;
        rpcParams.p_country_code = 'us';
        rpcParams.p_formatted = selectedLocation.properties.formatted || null;
      }

      const { data: profile, error: profileError } = await supabase.rpc('create_artist_profile', rpcParams);

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
    setLocationError(null); // Clear error when location is selected
  };

  const handleLocationClear = () => {
    setSelectedLocation(null);
    setLocationQuery("");
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full pb-4 sm:pb-8", className)} {...props}>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-body">Complete your profile</CardTitle>
          <CardDescription className="font-body">
            Set up your account to start connecting with local creatives
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column: Name, Handle, Location */}
              <div className="flex flex-col gap-6">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="display-name" className="font-body">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Your name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    maxLength={100}
                    className="h-12 font-body"
                  />
                </div>

                {/* Handle */}
                <div className="grid gap-2">
                  <Label htmlFor="handle" className="font-body">
                    Handle <span className="text-red-500">*</span>
                  </Label>
                  <div className={cn(
                    "relative flex items-center rounded-md border border-input bg-transparent shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring min-w-0",
                    isHandleAvailable === true && "border-green-500 focus-within:ring-green-500",
                    isHandleAvailable === false && "border-red-500 focus-within:ring-red-500"
                  )}>
                    <span className="px-2 sm:px-3 text-xs text-sunroad-brown-500 whitespace-nowrap select-none flex-shrink-0 font-body">
                      sunroad.io/artists/
                    </span>
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
                        "h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-10 flex-1 min-w-0 font-body",
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
                    <p className="text-xs text-red-500 font-body">{handleError}</p>
                  )}
                  {handleSuggestions.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground mb-2 font-body">
                        {handleError ? "Suggestions:" : "Suggested handles:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {handleSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              // Ensure suggestion only contains valid chars
                              const sanitized = suggestion.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              setHandle(sanitized);
                              setHandleError(null);
                              setIsHandleAvailable(null);
                              setHandleSuggestions([]);
                            }}
                            className="text-xs px-3 py-1.5 bg-sunroad-amber-100 text-sunroad-amber-800 rounded-md hover:bg-sunroad-amber-200 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-1"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground font-body">
                    Your unique identifier (letters, numbers, and hyphens only)
                  </p>
                </div>

                {/* Location */}
                <div className="grid gap-2">
                  <Label htmlFor="location" className="font-body">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  {selectedLocation ? (
                    <div className="flex items-center gap-2 p-3 bg-sunroad-amber-50 border border-sunroad-amber-200 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-sunroad-brown-900">
                          {selectedLocation.properties.formatted}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLocationClear}
                        className="text-sunroad-brown-500 hover:text-sunroad-brown-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                        aria-label="Clear location"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative" ref={locationRef}>
                      <Input
                        id="location"
                        type="text"
                        placeholder="Search for your city..."
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          setLocationError(null); // Clear error when user starts typing
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
                        required
                        className={cn("h-12 pr-10 font-body", locationError && "border-red-500 focus-visible:ring-red-500")}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isSearchingLocations && (
                          <Loader2 className="h-4 w-4 animate-spin text-sunroad-brown-500" />
                        )}
                      </div>
                      {showSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-sunroad-amber-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {locationSuggestions.length > 0 ? (
                            locationSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleLocationSelect(suggestion)}
                                className="w-full text-left px-4 py-2 hover:bg-sunroad-amber-50 focus:bg-sunroad-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-1"
                              >
                                <p className="text-sm text-sunroad-brown-900">{suggestion.properties.formatted}</p>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-sunroad-brown-600">
                              No results found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {locationError && (
                    <p className="text-xs text-red-500 font-body">{locationError}</p>
                  )}
                  {!locationError && (
                    <p className="text-xs text-muted-foreground font-body">
                      Help others find you by location
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Password, Confirm Password, Submit */}
              <div className="flex flex-col gap-6">
                {/* Password fields */}
                <div className="grid gap-2">
                  <Label htmlFor="password" className="font-body">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      disabled={isLoading}
                      minLength={8}
                      className={cn("h-12 pr-10 font-body", passwordError && "border-red-500 focus-visible:ring-red-500")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError ? (
                    <p className="text-xs text-red-500 font-body">{passwordError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground font-body">
                      Must be at least 8 characters with uppercase, lowercase, a number, and a special character
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="font-body">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="repeat-password"
                      type={showRepeatPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      required
                      value={repeatPassword}
                      onChange={(e) => handleRepeatPasswordChange(e.target.value)}
                      disabled={isLoading}
                      minLength={8}
                      className={cn("h-12 pr-10 font-body", repeatPasswordError && "border-red-500 focus-visible:ring-red-500")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      aria-label={showRepeatPassword ? "Hide password" : "Show password"}
                    >
                      {showRepeatPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {repeatPasswordError && (
                    <p className="text-xs text-red-500 font-body">Passwords do not match.</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600 font-body">{error}</p>
                  </div>
                )}

                {/* Terms and Conditions Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms-checkbox"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="terms-checkbox"
                    className="text-sm text-sunroad-brown-700 font-body leading-relaxed cursor-pointer"
                  >
                    By creating an account, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 mt-auto bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl" 
                  disabled={
                    isLoading || 
                    isCheckingHandle || 
                    !!handleError || 
                    isHandleAvailable !== true || 
                    !!passwordError || 
                    !!repeatPasswordError ||
                    !password.trim() ||
                    !repeatPassword.trim() ||
                    !displayName.trim() ||
                    !handle.trim() ||
                    !agreedToTerms ||
                    !selectedLocation
                  }
                >
                  {isLoading ? "Creating profile..." : "Complete setup"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

