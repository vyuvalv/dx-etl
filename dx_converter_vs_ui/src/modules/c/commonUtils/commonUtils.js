/*
 * @author: yvardi
 */
export function createUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}


/*
 * Set LocalStorage
 * @return {String} Unique Id messages
 */
export function UpdateStorage(key, value) {
  // Get Previous Value if exists
  const prevValue = window.localStorage.getItem(key);
  // Set new Value
  window.localStorage.setItem(key, value);
  return {
    key: key,
    previous_value: prevValue,
    current_value: value
  };
}
/*
 * Check all required form inputs are populated and pop input validity on each
 */
export function reportFormValidity(inputs, message = 'Input is required') {
  return [...inputs].reduce((validSoFar, inputField) => {
    if (!inputField.checkValidity()) {
      inputField.setCustomValidity(message);
    }
    inputField.reportValidity();
    return validSoFar && inputField.checkValidity();
  }, true);
}

/**
 * Reduces one or more LDS errors into a string[] of error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String[]} Error messages
 */
export function reduceErrors(errors) {
  if (!Array.isArray(errors)) {
    errors = [errors];
  }

  return (
    errors
      // Remove null/undefined items
      .filter((error) => !!error)
      // Extract an error message
      .map((error) => {
        // UI API read errors
        if (Array.isArray(error.body)) {
          return error.body.map((e) => e.message);
        }
        // UI API DML, Apex and network errors
        else if (error.body && typeof error.body.message === 'string') {
          return error.body.message;
        }
        // JS errors
        else if (typeof error.message === 'string') {
          return error.message;
        }
        // Unknown error shape so try HTTP status text
        return error.statusText;
      })
      // Flatten
      .reduce((prev, curr) => prev.concat(curr), [])
      // Remove empty strings
      .filter((message) => !!message)
  );
}

export function copyToClipboard(text = '') {
  //create and input element
  const inputEle = document.createElement('input');
  //set the value atrribute
  inputEle.value = text;
  //append element to document body
  document.body.appendChild(inputEle);
  // selects all the text  in an < input > element that includes a text field.
  inputEle.select();
  //Copies the current selection to the clipboard
  document.execCommand('copy');
  
  document.body.removeChild(inputEle);
}

export function sort(items, fieldName) {
  return [...items].sort(function (a, b) {
    return b[fieldName] - a[fieldName];
  });
}

export function notify(
  self,
  title = 'Error',
  message = 'Something went wrong...',
  type = 'error',
  sticky = false,
  errors
) {
  self.dispatchEvent(
    new CustomEvent('notify', {
      detail: {
        title,
        message,
        type,
        sticky,
        errors: errors
      },
      bubbles: true,
      composed: true
    })
  );
}
