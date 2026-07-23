import { NormalizedHolding, InvalidHolding } from './types';

export class Validator {
  public validate(holding: NormalizedHolding): InvalidHolding[] {
    const errors: InvalidHolding[] = [];

    if (!holding.companyName || holding.companyName.trim() === '') {
      errors.push({
        sourceRowNumber: holding.sourceRowNumber,
        companyName: holding.companyName,
        field: 'companyName',
        category: 'MISSING_DATA',
        reason: 'Company name is empty or undefined'
      });
    }

    if (isNaN(holding.purchasePrice) || holding.purchasePrice <= 0) {
      errors.push({
        sourceRowNumber: holding.sourceRowNumber,
        companyName: holding.companyName,
        field: 'purchasePrice',
        category: 'INVALID_NUMBER',
        reason: `Purchase price must be > 0. Got: ${holding.purchasePrice}`
      });
    }

    if (isNaN(holding.quantity) || holding.quantity <= 0) {
      errors.push({
        sourceRowNumber: holding.sourceRowNumber,
        companyName: holding.companyName,
        field: 'quantity',
        category: 'INVALID_NUMBER',
        reason: `Quantity must be > 0. Got: ${holding.quantity}`
      });
    }

    if (!holding.securityIdentifier || holding.securityIdentifier.trim() === '') {
      errors.push({
        sourceRowNumber: holding.sourceRowNumber,
        companyName: holding.companyName,
        field: 'securityIdentifier',
        category: 'MISSING_DATA',
        reason: 'Security identifier (NSE/BSE) is empty'
      });
    }

    return errors;
  }
}
