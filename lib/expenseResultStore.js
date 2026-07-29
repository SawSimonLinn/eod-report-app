let state = { payload: null, result: null };

function setExpenseResult(payload, result) {
  state = { payload, result };
}

function getExpenseResult() {
  return state;
}

function clearExpenseResult() {
  state = { payload: null, result: null };
}

module.exports = { setExpenseResult, getExpenseResult, clearExpenseResult };
