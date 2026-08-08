export const theme = {
  "extend": {
    "colors": {
      "ui": {
        "tag": {
          "neutral": {
            "border": {
              "DEFAULT": "var(--tag-neutral-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-neutral-icon)"
            },
            "text": {
              "DEFAULT": "var(--tag-neutral-text)"
            },
            "bg": {
              "hover": {
                "DEFAULT": "var(--tag-neutral-bg-hover)"
              },
              "DEFAULT": "var(--tag-neutral-bg)"
            }
          },
          "red": {
            "text": {
              "DEFAULT": "var(--tag-red-text)"
            },
            "bg": {
              "DEFAULT": "var(--tag-red-bg)",
              "hover": {
                "DEFAULT": "var(--tag-red-bg-hover)"
              }
            },
            "border": {
              "DEFAULT": "var(--tag-red-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-red-icon)"
            }
          },
          "blue": {
            "text": {
              "DEFAULT": "var(--tag-blue-text)"
            },
            "border": {
              "DEFAULT": "var(--tag-blue-border)"
            },
            "bg": {
              "DEFAULT": "var(--tag-blue-bg)",
              "hover": {
                "DEFAULT": "var(--tag-blue-bg-hover)"
              }
            },
            "icon": {
              "DEFAULT": "var(--tag-blue-icon)"
            }
          },
          "orange": {
            "text": {
              "DEFAULT": "var(--tag-orange-text)"
            },
            "border": {
              "DEFAULT": "var(--tag-orange-border)"
            },
            "icon": {
              "DEFAULT": "var(--tag-orange-icon)"
            },
            "bg": {
              "hover": {
                "DEFAULT": "var(--tag-orange-bg-hover)"
              },
              "DEFAULT": "var(--tag-orange-bg)"
            }
          },
          "green": {
            "icon": {
              "DEFAULT": "var(--tag-green-icon)"
            },
            "border": {
              "DEFAULT": "var(--tag-green-border)"
            },
            "text": {
              "DEFAULT": "var(--tag-green-text)"
            },
            "bg": {
              "hover": {
                "DEFAULT": "var(--tag-green-bg-hover)"
              },
              "DEFAULT": "var(--tag-green-bg)"
            }
          },
          "purple": {
            "bg": {
              "DEFAULT": "var(--tag-purple-bg)",
              "hover": {
                "DEFAULT": "var(--tag-purple-bg-hover)"
              }
            },
            "text": {
              "DEFAULT": "var(--tag-purple-text)"
            },
            "icon": {
              "DEFAULT": "var(--tag-purple-icon)"
            },
            "border": {
              "DEFAULT": "var(--tag-purple-border)"
            }
          }
        },
        "bg": {
          "switch": {
            "off": {
              "hover": {
                "DEFAULT": "var(--bg-switch-off-hover)"
              },
              "DEFAULT": "var(--bg-switch-off)"
            }
          },
          "subtle": {
            "hover": {
              "DEFAULT": "var(--bg-subtle-hover)"
            },
            "DEFAULT": "var(--bg-subtle)",
            "pressed": {
              "DEFAULT": "var(--bg-subtle-pressed)"
            }
          },
          "field": {
            "component": {
              "hover": {
                "DEFAULT": "var(--bg-field-component-hover)"
              },
              "DEFAULT": "var(--bg-field-component)"
            },
            "DEFAULT": "var(--bg-field)",
            "hover": {
              "DEFAULT": "var(--bg-field-hover)"
            }
          },
          "base": {
            "pressed": {
              "DEFAULT": "var(--bg-base-pressed)"
            },
            "hover": {
              "DEFAULT": "var(--bg-base-hover)"
            },
            "DEFAULT": "var(--bg-base)"
          },
          "highlight": {
            "DEFAULT": "var(--bg-highlight)",
            "hover": {
              "DEFAULT": "var(--bg-highlight-hover)"
            }
          },
          "component": {
            "pressed": {
              "DEFAULT": "var(--bg-component-pressed)"
            },
            "DEFAULT": "var(--bg-component)",
            "hover": {
              "DEFAULT": "var(--bg-component-hover)"
            }
          },
          "interactive": {
            "DEFAULT": "var(--bg-interactive)"
          },
          "disabled": {
            "DEFAULT": "var(--bg-disabled)"
          },
          "overlay": {
            "DEFAULT": "var(--bg-overlay)"
          }
        },
        "border": {
          "menu": {
            "bot": {
              "DEFAULT": "var(--border-menu-bot)"
            },
            "top": {
              "DEFAULT": "var(--border-menu-top)"
            }
          },
          "strong": {
            "DEFAULT": "var(--border-strong)"
          },
          "interactive": {
            "DEFAULT": "var(--border-interactive)"
          },
          "base": {
            "DEFAULT": "var(--border-base)"
          },
          "danger": {
            "DEFAULT": "var(--border-danger)"
          },
          "error": {
            "DEFAULT": "var(--border-error)"
          },
          "transparent": {
            "DEFAULT": "var(--border-transparent)"
          }
        },
        "contrast": {
          "fg": {
            "primary": {
              "DEFAULT": "var(--contrast-fg-primary)"
            },
            "secondary": {
              "DEFAULT": "var(--contrast-fg-secondary)"
            }
          },
          "bg": {
            "base": {
              "pressed": {
                "DEFAULT": "var(--contrast-bg-base-pressed)"
              },
              "DEFAULT": "var(--contrast-bg-base)",
              "hover": {
                "DEFAULT": "var(--contrast-bg-base-hover)"
              }
            },
            "subtle": {
              "DEFAULT": "var(--contrast-bg-subtle)"
            }
          },
          "border": {
            "base": {
              "DEFAULT": "var(--contrast-border-base)"
            },
            "bot": {
              "DEFAULT": "var(--contrast-border-bot)"
            },
            "top": {
              "DEFAULT": "var(--contrast-border-top)"
            }
          }
        },
        "button": {
          "inverted": {
            "pressed": {
              "DEFAULT": "var(--button-inverted-pressed)"
            },
            "hover": {
              "DEFAULT": "var(--button-inverted-hover)"
            },
            "DEFAULT": "var(--button-inverted)"
          },
          "transparent": {
            "DEFAULT": "var(--button-transparent)",
            "hover": {
              "DEFAULT": "var(--button-transparent-hover)"
            },
            "pressed": {
              "DEFAULT": "var(--button-transparent-pressed)"
            }
          },
          "danger": {
            "pressed": {
              "DEFAULT": "var(--button-danger-pressed)"
            },
            "DEFAULT": "var(--button-danger)",
            "hover": {
              "DEFAULT": "var(--button-danger-hover)"
            }
          },
          "neutral": {
            "DEFAULT": "var(--button-neutral)",
            "hover": {
              "DEFAULT": "var(--button-neutral-hover)"
            },
            "pressed": {
              "DEFAULT": "var(--button-neutral-pressed)"
            }
          }
        },
        "fg": {
          "on": {
            "color": {
              "DEFAULT": "var(--fg-on-color)"
            },
            "inverted": {
              "DEFAULT": "var(--fg-on-inverted)"
            }
          },
          "interactive": {
            "hover": {
              "DEFAULT": "var(--fg-interactive-hover)"
            },
            "DEFAULT": "var(--fg-interactive)"
          },
          "error": {
            "DEFAULT": "var(--fg-error)"
          },
          "subtle": {
            "DEFAULT": "var(--fg-subtle)"
          },
          "base": {
            "DEFAULT": "var(--fg-base)"
          },
          "disabled": {
            "DEFAULT": "var(--fg-disabled)"
          },
          "muted": {
            "DEFAULT": "var(--fg-muted)"
          }
        },
        "alpha": {
          "250": {
            "DEFAULT": "var(--alpha-250)"
          },
          "400": {
            "DEFAULT": "var(--alpha-400)"
          }
        },
        "ember": {
          "50": "var(--color-ember-50)",
          "100": "var(--color-ember-100)",
          "200": "var(--color-ember-200)",
          "300": "var(--color-ember-300)",
          "400": "var(--color-ember-400)",
          "500": "var(--color-ember-500)",
          "600": "var(--color-ember-600)",
          "700": "var(--color-ember-700)",
          "800": "var(--color-ember-800)",
          "900": "var(--color-ember-900)"
        },
        "solar": {
          "50": "var(--color-solar-50)",
          "100": "var(--color-solar-100)",
          "200": "var(--color-solar-200)",
          "300": "var(--color-solar-300)",
          "400": "var(--color-solar-400)",
          "500": "var(--color-solar-500)",
          "600": "var(--color-solar-600)",
          "700": "var(--color-solar-700)",
          "800": "var(--color-solar-800)",
          "900": "var(--color-solar-900)"
        },
        "crimson": {
          "50": "var(--color-crimson-50)",
          "100": "var(--color-crimson-100)",
          "200": "var(--color-crimson-200)",
          "300": "var(--color-crimson-300)",
          "400": "var(--color-crimson-400)",
          "500": "var(--color-crimson-500)",
          "600": "var(--color-crimson-600)",
          "700": "var(--color-crimson-700)",
          "800": "var(--color-crimson-800)",
          "900": "var(--color-crimson-900)"
        },
        "bloom": {
          "50": "var(--color-bloom-50)",
          "100": "var(--color-bloom-100)",
          "200": "var(--color-bloom-200)",
          "300": "var(--color-bloom-300)",
          "400": "var(--color-bloom-400)",
          "500": "var(--color-bloom-500)",
          "600": "var(--color-bloom-600)",
          "700": "var(--color-bloom-700)",
          "800": "var(--color-bloom-800)",
          "900": "var(--color-bloom-900)"
        },
        "blush": {
          "50": "var(--color-blush-50)",
          "100": "var(--color-blush-100)",
          "200": "var(--color-blush-200)",
          "300": "var(--color-blush-300)",
          "400": "var(--color-blush-400)",
          "500": "var(--color-blush-500)",
          "600": "var(--color-blush-600)",
          "700": "var(--color-blush-700)",
          "800": "var(--color-blush-800)",
          "900": "var(--color-blush-900)"
        },
        "mist": {
          "50": "var(--color-mist-50)",
          "100": "var(--color-mist-100)",
          "200": "var(--color-mist-200)",
          "300": "var(--color-mist-300)",
          "400": "var(--color-mist-400)",
          "500": "var(--color-mist-500)",
          "600": "var(--color-mist-600)",
          "700": "var(--color-mist-700)",
          "800": "var(--color-mist-800)",
          "900": "var(--color-mist-900)"
        },
        "bg-base": "var(--color-bg-base)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-subtle": "var(--color-bg-subtle)",
        "bg-muted": "var(--color-bg-muted)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-inverse": "var(--color-text-inverse)",
        "accent-primary": "var(--color-accent-primary)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-secondary": "var(--color-accent-secondary)",
        "accent-tertiary": "var(--color-accent-tertiary)",
        "border-default": "var(--color-border-default)",
        "border-strong": "var(--color-border-strong)",
        "success": "var(--color-success)",
        "warning": "var(--color-warning)",
        "info": "var(--color-info)",
        "destructive": "var(--color-destructive)"
      }
    },
    "spacing": {
      "0": "var(--spacing-0)",
      "px": "var(--spacing-px)",
      "0.5": "var(--spacing-0\\.5)",
      "1": "var(--spacing-1)",
      "1.5": "var(--spacing-1\\.5)",
      "2": "var(--spacing-2)",
      "2.5": "var(--spacing-2\\.5)",
      "3": "var(--spacing-3)",
      "3.5": "var(--spacing-3\\.5)",
      "4": "var(--spacing-4)",
      "5": "var(--spacing-5)",
      "6": "var(--spacing-6)",
      "7": "var(--spacing-7)",
      "8": "var(--spacing-8)",
      "9": "var(--spacing-9)",
      "10": "var(--spacing-10)",
      "11": "var(--spacing-11)",
      "12": "var(--spacing-12)",
      "14": "var(--spacing-14)",
      "16": "var(--spacing-16)",
      "20": "var(--spacing-20)",
      "24": "var(--spacing-24)",
      "28": "var(--spacing-28)",
      "32": "var(--spacing-32)",
      "36": "var(--spacing-36)",
      "40": "var(--spacing-40)",
      "44": "var(--spacing-44)",
      "48": "var(--spacing-48)",
      "52": "var(--spacing-52)",
      "56": "var(--spacing-56)",
      "60": "var(--spacing-60)",
      "64": "var(--spacing-64)",
      "72": "var(--spacing-72)",
      "80": "var(--spacing-80)",
      "96": "var(--spacing-96)"
    },
    "borderRadius": {
      "none": "var(--radius-none)",
      "xs": "var(--radius-xs)",
      "sm": "var(--radius-sm)",
      "md": "var(--radius-md)",
      "lg": "var(--radius-lg)",
      "xl": "var(--radius-xl)",
      "2xl": "var(--radius-2xl)",
      "3xl": "var(--radius-3xl)",
      "4xl": "var(--radius-4xl)",
      "full": "var(--radius-full)",
      "theme": "var(--theme-radius)"
    },
    "boxShadow": {
      "buttons-danger-focus": "var(--buttons-danger-focus)",
      "details-contrast-on-bg-interactive": "var(--details-contrast-on-bg-interactive)",
      "borders-error": "var(--borders-error)",
      "borders-focus": "var(--borders-focus)",
      "buttons-danger": "var(--buttons-danger)",
      "buttons-inverted-focus": "var(--buttons-inverted-focus)",
      "elevation-card-hover": "var(--elevation-card-hover)",
      "details-switch-handle": "var(--details-switch-handle)",
      "buttons-neutral": "var(--buttons-neutral)",
      "borders-base": "var(--borders-base)",
      "elevation-card-rest": "var(--elevation-card-rest)",
      "buttons-neutral-focus": "var(--buttons-neutral-focus)",
      "details-switch-background-focus": "var(--details-switch-background-focus)",
      "details-switch-background": "var(--details-switch-background)",
      "elevation-flyout": "var(--elevation-flyout)",
      "elevation-tooltip": "var(--elevation-tooltip)",
      "elevation-modal": "var(--elevation-modal)",
      "elevation-code-block": "var(--elevation-code-block)",
      "buttons-inverted": "var(--buttons-inverted)",
      "elevation-commandbar": "var(--elevation-commandbar)",
      "borders-interactive-with-focus": "var(--borders-interactive-with-focus)",
      "borders-interactive-with-shadow": "var(--borders-interactive-with-shadow)",
      "borders-interactive-with-active": "var(--borders-interactive-with-active)",
      "shadow-2xs": "var(--shadow-2xs)",
      "shadow-xs": "var(--shadow-xs)",
      "shadow-sm": "var(--shadow-sm)",
      "shadow-md": "var(--shadow-md)",
      "shadow-lg": "var(--shadow-lg)",
      "shadow-xl": "var(--shadow-xl)",
      "shadow-2xl": "var(--shadow-2xl)",
      "shadow-none": "var(--shadow-none)",
      "inner-shadow-2xs": "var(--inner-shadow-2xs)",
      "inner-shadow-xs": "var(--inner-shadow-xs)",
      "inner-shadow-sm": "var(--inner-shadow-sm)"
    },
    "blur": {
      "none": "var(--blur-none)",
      "xs": "var(--blur-xs)",
      "sm": "var(--blur-sm)",
      "md": "var(--blur-md)",
      "lg": "var(--blur-lg)",
      "xl": "var(--blur-xl)",
      "2xl": "var(--blur-2xl)",
      "3xl": "var(--blur-3xl)"
    },
    "backdropBlur": {
      "none": "var(--backdrop-blur-none)",
      "xs": "var(--backdrop-blur-xs)",
      "sm": "var(--backdrop-blur-sm)",
      "md": "var(--backdrop-blur-md)",
      "lg": "var(--backdrop-blur-lg)",
      "xl": "var(--backdrop-blur-xl)",
      "2xl": "var(--backdrop-blur-2xl)",
      "3xl": "var(--backdrop-blur-3xl)"
    },
    "opacity": {
      "0": "var(--opacity-0)",
      "5": "var(--opacity-5)",
      "10": "var(--opacity-10)",
      "15": "var(--opacity-15)",
      "20": "var(--opacity-20)",
      "25": "var(--opacity-25)",
      "30": "var(--opacity-30)",
      "35": "var(--opacity-35)",
      "40": "var(--opacity-40)",
      "45": "var(--opacity-45)",
      "50": "var(--opacity-50)",
      "55": "var(--opacity-55)",
      "60": "var(--opacity-60)",
      "65": "var(--opacity-65)",
      "70": "var(--opacity-70)",
      "75": "var(--opacity-75)",
      "80": "var(--opacity-80)",
      "85": "var(--opacity-85)",
      "90": "var(--opacity-90)",
      "95": "var(--opacity-95)",
      "100": "var(--opacity-100)"
    },
    "backgroundImage": {
      "gradient-aurora": "var(--gradient-aurora)",
      "gradient-sunset": "var(--gradient-sunset)",
      "gradient-bloom": "var(--gradient-bloom)"
    }
  }
}