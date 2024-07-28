const df = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'short',
  timeStyle: 'medium',
})

/**
 * @param {Date|number} date
 * @returns {string}
 */
export function dateTimeFormat(date) {
  return df.format(date)
}
