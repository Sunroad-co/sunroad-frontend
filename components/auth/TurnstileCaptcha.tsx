"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          size?: "normal" | "compact";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileCaptchaHandle {
  reset: () => void;
}

interface TurnstileCaptchaProps {
  onToken: (token: string | null) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
  size?: "normal" | "compact";
}

export const TurnstileCaptcha = forwardRef<TurnstileCaptchaHandle, TurnstileCaptchaProps>(
  ({ onToken, onExpire, onError, className, size = "normal" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Load Turnstile script
    useEffect(() => {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      
      if (!siteKey) {
        console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
        setError(true);
        setIsLoading(false);
        return;
      }

      // Check if script is already loaded
      if (window.turnstile) {
        renderWidget(siteKey);
        return;
      }

      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
      if (existingScript) {
        // Script is loading, wait for it
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget(siteKey);
          }
        }, 100);
        
        return () => {
          clearInterval(checkInterval);
          // Remove widget if it exists
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        };
      }

      // Load the script
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderWidget(siteKey);
      };
      script.onerror = () => {
        console.error("Failed to load Turnstile script");
        setError(true);
        setIsLoading(false);
        onError?.();
      };
      document.body.appendChild(script);

      return () => {
        // Don't remove the script - it may be used by other instances
        // Just remove the widget
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };
    }, []);

    const renderWidget = (siteKey: string) => {
      if (!containerRef.current || !window.turnstile) {
        return;
      }

      try {
        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: size,
          callback: (token: string) => {
            onToken(token);
            setError(false);
            setIsLoading(false);
          },
          "error-callback": () => {
            onToken(null);
            setError(true);
            setIsLoading(false);
            onError?.();
          },
          "expired-callback": () => {
            onToken(null);
            onExpire?.();
          },
        });
        widgetIdRef.current = widgetId;
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to render Turnstile widget", e);
        setError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
            onToken(null);
            setError(false);
          } catch (e) {
            console.error("Failed to reset Turnstile widget", e);
          }
        }
      },
    }));

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      return (
        <div className={cn("text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg", className)}>
          CAPTCHA configuration error. Please contact support.
        </div>
      );
    }

    if (error) {
      return (
        <div className={cn("text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg", className)}>
          CAPTCHA failed to load. Please refresh the page.
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        {isLoading && (
          <div className="mb-2 text-xs text-sunroad-brown-600 font-body">
            Loading CAPTCHA...
          </div>
        )}
        <div ref={containerRef} className="w-full flex justify-center" />
      </div>
    );
  }
);

TurnstileCaptcha.displayName = "TurnstileCaptcha";

