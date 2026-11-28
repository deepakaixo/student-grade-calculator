# Manual Testing Checklist

Use this checklist after opening `index.html` in a modern browser.

## Grade calculation
- [ ] Load the sample data and confirm the subject totals are calculated.
- [ ] Change a mark and confirm percentage, CGPA, grade, and pass/fail update.
- [ ] Check the mark limits: Internal 0–20, Mid Term 0–20, Practical 0–20, End Term 0–40.
- [ ] Enter a decimal, negative number, or value above the maximum and confirm it is flagged.
- [ ] Try saving while a mark is invalid; the record should not be saved.

## Student records
- [ ] Save a student and confirm the saved-record count increases.
- [ ] Save the same student ID again and confirm the existing student record is updated.
- [ ] Open the database and load a saved student; verify the details and marks return.
- [ ] Search by student ID, name, and course.
- [ ] Confirm the search also filters the subject marks table.
- [ ] Sort students by name, percentage in both directions, and most recently saved.
- [ ] Delete a student and confirm the student's linked marks are removed too.

## Backup and reports
- [ ] Export the database as JSON and check that the file includes a schema version and export date.
- [ ] Import a valid JSON backup and confirm the records are restored.
- [ ] Try importing invalid JSON and confirm the current database remains unchanged.
- [ ] Export student summaries as CSV.
- [ ] Export subject-wise marks as CSV and check that columns and rows are readable.

## Interface and accessibility
- [ ] Confirm database overview counts match the saved data.
- [ ] Close the database dialog using its close buttons, outside click, and Escape key.
- [ ] Confirm notification messages are announced by screen readers.
- [ ] Check the layout at desktop and narrow mobile widths.
- [ ] Print or save the report card as a PDF.
