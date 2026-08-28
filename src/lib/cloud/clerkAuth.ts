/**
 * ARGUS Sovereign OS — Clerk Authentication Engine
 * Connects to Clerk App: app_3IYRaOJAuHPKIk4zRQan3EeIHe5
 * Publishable Key: pk_test_d2VsY29tZS1raW5nZmlzaC03MzY2LmNsZXJrLmFjY291bnRzLmRldiQ
 * Frontend API: https://welcome-kingfish-7366.clerk.accounts.dev
 */

export const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_d2VsY29tZS1raW5nZmlzaC03MzY2LmNsZXJrLmFjY291bnRzLmRldiQ";

export const CLERK_FRONTEND_API =
  import.meta.env.VITE_CLERK_FRONTEND_API ||
  "https://welcome-kingfish-7366.clerk.accounts.dev";

export interface ClerkUserState {
  isSignedIn: boolean;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
  role: "founder" | "pro_member" | "community";
}

let clerkInstance: any = null;
let clerkInitPromise: Promise<any> | null = null;

/**
 * Initialize Clerk JavaScript SDK asynchronously
 */
export async function getClerkInstance(): Promise<any> {
  if (clerkInstance) return clerkInstance;
  if (clerkInitPromise) return clerkInitPromise;

  clerkInitPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    // Check if Clerk script already loaded
    if ((window as any).Clerk) {
      clerkInstance = (window as any).Clerk;
      clerkInstance.load({ publishableKey: CLERK_PUBLISHABLE_KEY }).then(() => {
        resolve(clerkInstance);
      });
      return;
    }

    // Dynamically inject Clerk Browser SDK script
    const script = document.createElement("script");
    script.src = `${CLERK_FRONTEND_API}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-clerk-publishable-key", CLERK_PUBLISHABLE_KEY);

    script.onload = async () => {
      if ((window as any).Clerk) {
        clerkInstance = (window as any).Clerk;
        try {
          await clerkInstance.load({ publishableKey: CLERK_PUBLISHABLE_KEY });
        } catch (err) {
          console.warn("Clerk load warning:", err);
        }
        resolve(clerkInstance);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      console.warn("Failed to load Clerk script, fallback to Sovereign Guest mode");
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return clerkInitPromise;
}

/**
 * Get Current Active User State
 */
export async function getClerkUserState(): Promise<ClerkUserState> {
  try {
    const clerk = await getClerkInstance();
    if (clerk && clerk.user) {
      const user = clerk.user;
      const email = user.primaryEmailAddress?.emailAddress || "user@argus.local";
      const isFounder =
        email.includes("stevedaniel") || email.includes("contact.stevedaniel@gmail.com");

      return {
        isSignedIn: true,
        userId: user.id,
        email,
        fullName: user.fullName || user.firstName || "Sovereign User",
        imageUrl: user.imageUrl || null,
        role: isFounder ? "founder" : "pro_member",
      };
    }
  } catch (err) {
    console.warn("Error getting Clerk state:", err);
  }

  // Fallback / Guest State
  return {
    isSignedIn: false,
    userId: null,
    email: null,
    fullName: "Guest User",
    imageUrl: null,
    role: "community",
  };
}

/**
 * Open Clerk Sign In Modal
 */
export async function openClerkSignIn(targetElement?: HTMLElement): Promise<void> {
  const clerk = await getClerkInstance();
  if (clerk) {
    if (targetElement) {
      clerk.mountSignIn(targetElement);
    } else {
      clerk.openSignIn();
    }
  } else {
    // Dispatch local modal trigger if SDK unavailable
    window.dispatchEvent(new CustomEvent("argus:open-auth-modal", { detail: { mode: "sign-in" } }));
  }
}

/**
 * Open Clerk Sign Up Modal
 */
export async function openClerkSignUp(targetElement?: HTMLElement): Promise<void> {
  const clerk = await getClerkInstance();
  if (clerk) {
    if (targetElement) {
      clerk.mountSignUp(targetElement);
    } else {
      clerk.openSignUp();
    }
  } else {
    window.dispatchEvent(new CustomEvent("argus:open-auth-modal", { detail: { mode: "sign-up" } }));
  }
}

/**
 * Open Clerk User Profile Management
 */
export async function openClerkUserProfile(): Promise<void> {
  const clerk = await getClerkInstance();
  if (clerk) {
    clerk.openUserProfile();
  }
}

/**
 * Sign Out Current User
 */
export async function signOutOfClerk(): Promise<void> {
  const clerk = await getClerkInstance();
  if (clerk) {
    await clerk.signOut();
    window.location.reload();
  }
}
