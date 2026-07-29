function formatMainReport(report) {
  return `Title: ${report.title}\n\nBusiness Purpose: ${report.businessPurpose}\n\nComment: ${report.comment}`;
}

function formatReceipt(receipt) {
  return `Receipt Title: ${receipt.receiptTitle}\nExpense Title: ${receipt.expenseTitle}\nNote: ${receipt.note}`;
}

function formatFullExpenseReport(data) {
  const receiptBlocks = data.receipts.map((receipt, i) => `Receipt ${i + 1}\n${formatReceipt(receipt)}`);
  return [formatMainReport(data.report), ...receiptBlocks].join('\n\n');
}

module.exports = { formatMainReport, formatReceipt, formatFullExpenseReport };
