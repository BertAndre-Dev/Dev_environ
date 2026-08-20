/** ITU E.164: + followed by 8–15 digits, no leading zero after +. */
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export const PHONE_E164_EXAMPLE = "+2348141153727";

export const PHONE_E164_ERROR =
  'Invalid phone number. It must include a country code in E.164 format. Example: +2348141153727. Do not use 08141153727 or 8141153727.';

export const DEFAULT_COUNTRY_CODE = "+234";

function compactPhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Convert a local or international number to E.164.
 * `+2348100001427` is returned as-is; `8100001427` + `+234` becomes that value.
 */
export function toE164PhoneNumber(
  phoneNumber: string,
  countryCode?: string,
): string | null {
  const compact = compactPhone(phoneNumber);
  if (!compact) return null;

  if (compact.startsWith("+")) {
    const e164 = `+${digitsOnly(compact.slice(1))}`;
    return E164_PATTERN.test(e164) ? e164 : null;
  }

  const dial = digitsOnly(countryCode ?? "");
  let national = digitsOnly(compact);
  if (!dial || !national) return null;

  national = national.replace(/^0+/, "");
  if (!national) return null;

  if (national.startsWith(dial) && national.length > dial.length) {
    const withoutDial = national.slice(dial.length).replace(/^0+/, "");
    if (withoutDial) national = withoutDial;
  }

  const e164 = `+${dial}${national}`;
  return E164_PATTERN.test(e164) ? e164 : null;
}

/** Split a stored E.164 (or local) number for country-code + national inputs. */
export function splitPhoneFields(
  phoneNumber = "",
  countryCode = "",
): { countryCode: string; nationalNumber: string } {
  const compact = compactPhone(phoneNumber);
  const dialDigits = digitsOnly(countryCode);
  const normalizedCode = dialDigits ? `+${dialDigits}` : "";

  if (compact.startsWith("+")) {
    const digits = digitsOnly(compact.slice(1));
    if (dialDigits && digits.startsWith(dialDigits)) {
      return {
        countryCode: normalizedCode,
        nationalNumber: digits.slice(dialDigits.length),
      };
    }
    return {
      countryCode: normalizedCode,
      nationalNumber: `+${digits}`,
    };
  }

  return {
    countryCode: normalizedCode,
    nationalNumber: digitsOnly(compact).replace(/^0+/, "") || compact,
  };
}

export function withE164PhoneNumber<
  T extends { phoneNumber?: string; countryCode?: string },
>(data: T): T {
  const phone = data.phoneNumber?.trim();
  if (!phone) return data;
  const e164 = toE164PhoneNumber(phone, data.countryCode);
  if (!e164) return data;
  return { ...data, phoneNumber: e164 };
}
