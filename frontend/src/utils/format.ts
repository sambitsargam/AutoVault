/**
 * Formats an Ethereum address to a shortened form
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.substring(0, 6)}…${address.slice(-4)}`;
}

/**
 * Formats a number to a specified number of decimal places
 */
export function formatNumber(value: string | number, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toFixed(decimals);
}