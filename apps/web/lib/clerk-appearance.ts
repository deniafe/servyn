export const servynClerkAppearance = {
  variables: {
    colorPrimary: "var(--sv-leaf-800)",
    colorTextOnPrimaryBackground: "var(--sv-cream)",
    colorBackground: "var(--sv-surface)",
    colorInputBackground: "var(--sv-surface-2)",
    colorInputText: "var(--sv-ink)",
    colorText: "var(--sv-ink)",
    colorTextSecondary: "var(--sv-mut)",
    colorDanger: "var(--sv-danger)",
    colorSuccess: "var(--sv-success)",
    colorWarning: "var(--sv-warn)",
    borderRadius: "16px",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border-0 bg-transparent",
    card: "w-full shadow-none border-0 bg-transparent p-0",
    headerTitle: "font-serif text-ink text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-mut text-sm",
    socialButtonsBlockButton:
      "border border-line-2 bg-surface hover:bg-surface-2 text-ink rounded-full font-medium transition-colors",
    formFieldLabel: "text-ink-2 text-xs font-semibold",
    formFieldInput:
      "bg-surface-2 border border-line-2 rounded-md text-ink focus:border-gold-500 focus:bg-surface",
    formButtonPrimary:
      "bg-linear-to-b from-grad-gold-1 to-grad-gold-2 text-gold-ink rounded-full font-semibold shadow-gold hover:brightness-105 active:scale-[0.98] transition-all",
    footerActionLink: "text-leaf-600 hover:text-leaf-700 font-semibold",
    dividerLine: "bg-line",
    dividerText: "text-mut text-xs",
    userButtonPopoverCard: "bg-surface border border-line rounded-lg shadow-lift",
    userButtonPopoverActionButton: "text-ink-2 hover:bg-surface-2",
  },
} as const;
