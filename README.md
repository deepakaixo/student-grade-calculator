# Student Grade Calculator 

A simple and beginner-friendly web application to calculate student grades and academic performance. Built using **HTML, CSS, and JavaScript**.

## Features

- **Student Details**: Enter Student ID, Student Name, and Course.
- **Subjects & Marks Breakdown**: Score each subject out of 100 based on:
  - Internal Marks (Max: 20)
  - Mid Term (Max: 20)
  - Practical (Max: 20)
  - End Term (Max: 40)
- **Automatic Calculations**:
  - Total Marks scored
  - Overall Percentage (%)
  - CGPA (10-point scale)
  - Letter Grade (A+, A, B, C, D, E, F)
  - Pass / Fail status
- **Add or Remove Subjects**: Easily add more subjects or remove them.
- **Save Records**: Save student grades in the browser (LocalStorage) and view them in a database view.
- **Print Report Card**: Print or save your report card as a PDF.
- **Database Backup**: Export versioned JSON backups and restore a validated backup file.
- **CSV Reports**: Export student summaries or subject-wise marks as separate CSV files.
- **Student Search & Sorting**: Find records by ID, name, or course and sort by name, percentage, or save date.
- **Record Management**: Load or delete saved student records, with linked marks removed together.
- **Database Overview**: View live counts for students, courses, and subject mark records.
- **Sample Data Button**: Quickly test the app with one click.

---

## Technologies Used

- **HTML5** - Structure of the web page
- **CSS3** - Styling and responsive design
- **JavaScript** - Calculation logic and saving records

---

## How to Run

1. Clone or download this repository.
2. Open the project folder.
3. Open `index.html` in a modern web browser.

No package installation or build step is required.

## Data Storage

Student records are saved in the browser's `localStorage` on the device and browser where the app is used. This is a front-end demonstration; it does not connect to a hosted SQL database. Clearing browser site data can remove saved records.

## Author

- **Deepak Kumar**
- GitHub: [@deepakaixo](https://github.com/deepakaixo)
