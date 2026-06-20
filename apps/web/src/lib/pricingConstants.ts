/**
 * Approximate pricing rates per 1,000,000 (1M) tokens.
 * IMPORTANT: These values are for demonstration/approximate educational purposes only
 * and do not represent official provider pricing.
 */
export interface PricingRate {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export const PRICING_CONSTANTS: Record<string, PricingRate> = {
  gpt4o_mini: {
    inputCostPer1M: 0.15, // $0.15 per 1M tokens
    outputCostPer1M: 0.60, // $0.60 per 1M tokens
  },
  gpt41: {
    inputCostPer1M: 2.50, // $2.50 per 1M tokens
    outputCostPer1M: 10.00, // $10.00 per 1M tokens
  },
  claude_placeholder: {
    inputCostPer1M: 3.00, // $3.00 per 1M tokens
    outputCostPer1M: 15.00, // $15.00 per 1M tokens
  },
  custom: {
    inputCostPer1M: 1.00, // Customizable rate
    outputCostPer1M: 4.00,
  },
};
