/**
 * CurrencySelector — compact header control to override the display currency.
 *
 * Reads the active currency from useCurrency() (which stays reactive) and
 * writes the preference via setPreferredCurrency(). Selecting "Auto" clears
 * the override so the locale-derived currency takes over. All price displays
 * that use useCurrency()/formatPrice update live, without a reload.
 */

import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/hooks/useCurrency";
import {
  setPreferredCurrency,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currency";

const AUTO_VALUE = "auto";

function hasOverride(): boolean {
  try {
    return !!localStorage.getItem("preferredCurrency");
  } catch {
    return false;
  }
}

export function CurrencySelector() {
  const { currency } = useCurrency();
  const value = hasOverride() ? currency : AUTO_VALUE;

  const onValueChange = (next: string) => {
    if (next === AUTO_VALUE) {
      setPreferredCurrency(null);
    } else {
      setPreferredCurrency(next as SupportedCurrency);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex h-9 gap-1.5 border-border/50 bg-secondary/30 text-xs font-semibold text-muted-foreground hover:text-accent hover:border-accent/40"
        >
          <Coins className="h-3.5 w-3.5 text-accent" />
          {currency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-popover">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Display Currency
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          <DropdownMenuRadioItem value={AUTO_VALUE} className="cursor-pointer text-sm">
            Auto (locale)
          </DropdownMenuRadioItem>
          {SUPPORTED_CURRENCIES.map((code) => (
            <DropdownMenuRadioItem
              key={code}
              value={code}
              className="cursor-pointer text-sm"
            >
              {code}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
