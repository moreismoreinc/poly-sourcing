import { TEMPLATES, PRICE_RANGES } from './constants.ts';

// STEP 4: Enhanced category detection
export function detectCategory(productName: string, useCase: string): string {
  const combined = `${productName} ${useCase}`.toLowerCase();
  
  if (/\b(gummies|supplement|vitamin|mineral|protein|probiotic|omega|capsule|tablet)\b/.test(combined)) {
    return 'supplement';
  }
  if (/\b(cream|serum|moisturizer|cleanser|toner|mask|sunscreen|anti-aging|skincare|lotion)\b/.test(combined)) {
    return 'skincare';
  }
  if (/\b(snack|food|eat|nutrition|meal|drink|beverage|bar|cookie|sauce)\b/.test(combined)) {
    return 'food';
  }
  if (/\b(watch|band|tracker|wearable|smart|fitness|monitor|device|sensor)\b/.test(combined)) {
    return 'wearable';
  }
  
  return 'wellness';
}

// STEP 5: Enhanced positioning inference
export function inferPositioning(aesthetic: string): 'budget' | 'mid-range' | 'premium' {
  const aes = aesthetic.toLowerCase();
  
  if (/\b(luxury|premium|sophisticated|high-end|elegant|exclusive|designer)\b/.test(aes)) {
    return 'premium';
  }
  if (/\b(affordable|simple|basic|budget|economical|value|minimal)\b/.test(aes)) {
    return 'budget';
  }
  
  return 'mid-range';
}

// STEP 6: Product ID generation
export function generateProductId(productName: string): string {
  return productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// STEP 7: Build prompt function - UPDATED to include requirements
export function buildPrompt(productName: string, useCase: string, aesthetic: string, requirements: string = ''): string {
  const category = detectCategory(productName, useCase);
  const positioning = inferPositioning(aesthetic);
  const productId = generateProductId(productName);
  
  const priceRange = PRICE_RANGES[positioning][category] || [20, 50];
  const priceRangeStr = `$${priceRange[0]}-${priceRange[1]}`;
  
  const template = TEMPLATES[category] || TEMPLATES.wellness;
  
  return template
    .replace(/{product_name}/g, productName)
    .replace(/{product_id}/g, productId)
    .replace(/{use_case}/g, useCase)
    .replace(/{aesthetic}/g, aesthetic)
    .replace(/{positioning}/g, positioning)
    .replace(/{price_range}/g, priceRangeStr)
    .replace(/{requirements}/g, requirements || 'Standard quality and safety requirements');
}
