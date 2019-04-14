if (typeof params === 'undefined') { return; }

var result = MessageFormat.format(text, params.product.name, params.charges.amount.formattedAmount);
output.addText(result);