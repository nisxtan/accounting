const { unitMultipliers } = require("../config/constants");

class SalesItemService {
  getBaseQuantity(quantity, unit) {
    const baseQty = quantity * (unitMultipliers[unit] || 1);
    return baseQty;
  }

  calculateRowTotal(item) {
    const baseQuantity = this.getBaseQuantity(item.quantity, item.unit);

    //calculate the initial cost
    const initialTotal = item.quantity * item.rate; //2 dozen, per dozen 50 vayo vane 2*50 sidhai

    //calculate discount amount
    const discountAmount = initialTotal * (item.discountPercent / 100);

    //calculate the final total
    const finalTotal = initialTotal - discountAmount;
    const adjustedRate = finalTotal / baseQuantity;

    return {
      baseQuantity,
      initialTotal,
      discountAmount,
      finalTotal,
      adjustedRate,
      isTaxable: item.isTaxable,
    };
  }
}

module.exports = new SalesItemService();
