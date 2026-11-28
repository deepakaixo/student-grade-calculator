/**
 * Student Grade Calculator - Application Logic
 * Implements assessment calculation and simulated relational database schema
 * (Courses, Students, Marks Distribution) based on handwritten specification.
 */

// Configuration & Grading Thresholds
const MARKS_LIMITS = {
  internal: 20,
  midTerm: 20,
  practical: 20,
  endTerm: 40,
  subjectTotal: 100
};

const GRADE_SCALE = [
  { min: 90, grade: 'A+', points: 10, label: 'Outstanding' },
  { min: 80, grade: 'A',  points: 9,  label: 'Excellent' },
  { min: 70, grade: 'B',  points: 8,  label: 'Very Good' },
  { min: 60, grade: 'C',  points: 7,  label: 'Good' },
  { min: 50, grade: 'D',  points: 6,  label: 'Above Average' },
  { min: 40, grade: 'E',  points: 5,  label: 'Pass' },
  { min: 0,  grade: 'F',  points: 0,  label: 'Fail' }
];

// Initial State
let subjectCounter = 0;
const DB_STORAGE_KEY = 'grade_calculator_db_v1';

// DOM Elements
const studentIdInput = document.getElementById('student-id');
const studentNameInput = document.getElementById('student-name');
const courseIdInput = document.getElementById('course-id');
const courseNameInput = document.getElementById('course-name');
const subjectsContainer = document.getElementById('subjects-container');
const btnAddSubject = document.getElementById('btn-add-subject');
const btnCalculate = document.getElementById('btn-calculate');
const btnReset = document.getElementById('btn-reset');
const btnLoadSample = document.getElementById('btn-load-sample');
const btnSaveRecord = document.getElementById('btn-save-record');
const btnPrintReport = document.getElementById('btn-print-report');
const btnToggleDb = document.getElementById('btn-toggle-db');
const btnCloseDb = document.getElementById('btn-close-db');
const btnCloseDbBottom = document.getElementById('btn-close-db-bottom');
const btnClearDb = document.getElementById('btn-clear-db');
const btnImportDb = document.getElementById('btn-import-db');
const dbImportFile = document.getElementById('db-import-file');
const btnExportDb = document.getElementById('btn-export-db');
const dbModal = document.getElementById('db-modal');
const toastEl = document.getElementById('toast');
const savedCountEl = document.getElementById('saved-count');

// Summary DOM Elements
const dispStudentName = document.getElementById('disp-student-name');
const dispStudentId = document.getElementById('disp-student-id');
const dispCourseName = document.getElementById('disp-course-name');
const dispCourseId = document.getElementById('disp-course-id');
const dispPercentage = document.getElementById('disp-percentage');
const dispTotalMarks = document.getElementById('disp-total-marks');
const dispCgpa = document.getElementById('disp-cgpa');
const dispLetterGrade = document.getElementById('disp-letter-grade');
const dispStatus = document.getElementById('disp-status');
const passFailBadge = document.getElementById('pass-fail-badge');
const summaryTableBody = document.getElementById('summary-table-body');

// -------------------------------------------------------------
// Database Simulation (Courses, Students, Marks Distribution)
// -------------------------------------------------------------
function createEmptyDatabase() {
  return { courses: [], students: [], marksDistribution: [] };
}

function getDatabase() {
  try {
    const data = localStorage.getItem(DB_STORAGE_KEY);
    if (!data) {
      return createEmptyDatabase();
    }

    const parsed = JSON.parse(data);
    return {
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
      marksDistribution: Array.isArray(parsed.marksDistribution) ? parsed.marksDistribution : []
    };
  } catch (error) {
    console.error('Unable to read saved grade records:', error);
    return { courses: [], students: [], marksDistribution: [] };
  }
}

function saveDatabase(db) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    updateSavedCount();
    return true;
  } catch (error) {
    console.error('Unable to save grade records:', error);
    showToast('Could not save records. Browser storage may be full or disabled.', true);
    return false;
  }
}

function updateSavedCount() {
  const db = getDatabase();
  if (savedCountEl) savedCountEl.textContent = db.students.length;
}

// -------------------------------------------------------------
// Grade Calculation Utilities
// -------------------------------------------------------------
function getGradeInfo(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return GRADE_SCALE[GRADE_SCALE.length - 1];

  const rounded = Math.round(numericScore * 10) / 10;
  return GRADE_SCALE.find(item => rounded >= item.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

// -------------------------------------------------------------
// Dynamic Subject Management
// -------------------------------------------------------------
function createSubjectCard(defaultName = '', marks = { internal: '', midTerm: '', practical: '', endTerm: '' }) {
  subjectCounter++;
  const id = subjectCounter;
  const name = defaultName || `Sub ${id}`;

  const subjectDiv = document.createElement('div');
  subjectDiv.className = 'subject-item';
  subjectDiv.dataset.id = id;

  subjectDiv.innerHTML = `
    <div class="subject-top-bar">
      <input type="text" class="subject-title-input" value="${escapeHtml(String(name))}" placeholder="Subject Name (e.g. Sub ${id})" />
      <div class="subject-top-meta">
        <span class="subject-score-badge" id="sub-badge-${id}">0 / 100 (F)</span>
        <button type="button" class="btn-remove-sub" title="Remove Subject">&times;</button>
      </div>
    </div>
    <div class="marks-inputs-grid">
      <div class="mark-field">
        <label>Internal <span class="max-tag">max 20</span></label>
        <input type="number" class="mark-internal" min="0" max="20" step="1" inputmode="numeric" placeholder="0" value="${escapeHtml(String(marks.internal ?? ''))}" />
      </div>
      <div class="mark-field">
        <label>Mid Term <span class="max-tag">max 20</span></label>
        <input type="number" class="mark-mid" min="0" max="20" step="1" inputmode="numeric" placeholder="0" value="${escapeHtml(String(marks.midTerm ?? ''))}" />
      </div>
      <div class="mark-field">
        <label>Practical <span class="max-tag">max 20</span></label>
        <input type="number" class="mark-practical" min="0" max="20" step="1" inputmode="numeric" placeholder="0" value="${escapeHtml(String(marks.practical ?? ''))}" />
      </div>
      <div class="mark-field">
        <label>End Term <span class="max-tag">max 40</span></label>
        <input type="number" class="mark-end" min="0" max="40" step="1" inputmode="numeric" placeholder="0" value="${escapeHtml(String(marks.endTerm ?? ''))}" />
      </div>
    </div>
  `;

  // Attach event listeners for real-time calculation & validation
  const inputs = subjectDiv.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      validateInput(input);
      calculateAll(false);
    });
  });

  const titleInput = subjectDiv.querySelector('.subject-title-input');
  titleInput.addEventListener('input', () => calculateAll(false));

  const btnRemove = subjectDiv.querySelector('.btn-remove-sub');
  btnRemove.addEventListener('click', () => {
    const totalSubjects = document.querySelectorAll('.subject-item').length;
    if (totalSubjects <= 1) {
      showToast('⚠️ At least one subject is required for calculation.', true);
      return;
    }
    subjectDiv.remove();
    calculateAll(false);
  });

  subjectsContainer.appendChild(subjectDiv);
  return subjectDiv;
}

function validateInput(input) {
  const max = Number(input.getAttribute('max'));
  const min = Number(input.getAttribute('min')) || 0;
  const val = input.value === '' ? NaN : Number(input.value);
  const isInvalid = !Number.isFinite(val) || val < min || val > max || !Number.isInteger(val);

  input.classList.toggle('input-error', isInvalid);
  input.setAttribute('aria-invalid', String(isInvalid));

  if (!Number.isFinite(val)) return 0;
  return Math.min(Math.max(val, min), max);
}

function hasInvalidMarks() {
  return Array.from(document.querySelectorAll('.marks-inputs-grid input[type="number"]'))
    .some(input => input.value !== '' && (
      !Number.isFinite(Number(input.value)) ||
      !Number.isInteger(Number(input.value)) ||
      Number(input.value) < Number(input.min) ||
      Number(input.value) > Number(input.max)
    ));
}

// -------------------------------------------------------------
// Calculation Engine
// -------------------------------------------------------------
function calculateAll(showNotification = true) {
  const subjectElements = document.querySelectorAll('.subject-item');
  if (subjectElements.length === 0) {
    resetSummary();
    return null;
  }

  // Header meta binding
  const studentName = studentNameInput.value.trim() || '---';
  const studentId = studentIdInput.value.trim() || '---';
  const courseName = courseNameInput.value.trim() || '---';
  const courseId = courseIdInput.value.trim() || '---';

  dispStudentName.textContent = studentName;
  dispStudentId.textContent = studentId;
  dispCourseName.textContent = courseName;
  dispCourseId.textContent = courseId;

  let totalScored = 0;
  const maxPossible = subjectElements.length * 100;
  let totalGradePoints = 0;
  let hasFailure = false;
  const breakdownData = [];

  subjectElements.forEach(item => {
    const id = item.dataset.id;
    const title = item.querySelector('.subject-title-input').value.trim() || `Subject ${id}`;
    
    const intInput = item.querySelector('.mark-internal');
    const midInput = item.querySelector('.mark-mid');
    const pracInput = item.querySelector('.mark-practical');
    const endInput = item.querySelector('.mark-end');

    const internal = Math.min(Math.max(parseFloat(intInput.value) || 0, 0), MARKS_LIMITS.internal);
    const midTerm = Math.min(Math.max(parseFloat(midInput.value) || 0, 0), MARKS_LIMITS.midTerm);
    const practical = Math.min(Math.max(parseFloat(pracInput.value) || 0, 0), MARKS_LIMITS.practical);
    const endTerm = Math.min(Math.max(parseFloat(endInput.value) || 0, 0), MARKS_LIMITS.endTerm);

    const subTotal = internal + midTerm + practical + endTerm;
    const gradeInfo = getGradeInfo(subTotal);

    if (gradeInfo.grade === 'F') {
      hasFailure = true;
    }

    totalScored += subTotal;
    totalGradePoints += gradeInfo.points;

    // Update subject card badge
    const badge = item.querySelector(`#sub-badge-${id}`);
    if (badge) {
      badge.textContent = `${subTotal} / 100 (${gradeInfo.grade})`;
      badge.style.backgroundColor = gradeInfo.grade === 'F' ? '#fee2e2' : '#e0e7ff';
      badge.style.color = gradeInfo.grade === 'F' ? '#b91c1c' : '#4338ca';
    }

    breakdownData.push({
      subjectName: title,
      internal,
      midTerm,
      practical,
      endTerm,
      total: subTotal,
      grade: gradeInfo.grade,
      points: gradeInfo.points
    });
  });

  // Calculate Overall Aggregates
  const percentage = maxPossible > 0 ? (totalScored / maxPossible) * 100 : 0;
  const cgpa = subjectElements.length > 0 ? totalGradePoints / subjectElements.length : 0;
  const overallGradeInfo = getGradeInfo(percentage);
  const isPassed = !hasFailure && percentage >= 40;
  const formattedPercentage = percentage.toFixed(1);
  const formattedCgpa = cgpa.toFixed(2);

  // Update Summary DOM
  dispPercentage.textContent = `${formattedPercentage}%`;
  dispTotalMarks.textContent = `${totalScored} / ${maxPossible}`;
  dispCgpa.textContent = formattedCgpa;
  dispLetterGrade.textContent = isPassed ? overallGradeInfo.grade : 'F';
  
  dispStatus.textContent = isPassed ? 'PASSED' : 'FAIL / BACK';
  dispStatus.className = `metric-val status-highlight ${isPassed ? 'pass' : 'fail'}`;

  passFailBadge.textContent = isPassed ? 'PASSED' : 'REMARKS: FAIL';
  passFailBadge.className = `badge ${isPassed ? 'badge-success' : 'badge-danger'}`;

  // Render Mini Summary Table
  renderSummaryTable(breakdownData);

  if (showNotification) {
    showToast(`Calculated: ${formattedPercentage}% | CGPA: ${formattedCgpa} | Grade: ${isPassed ? overallGradeInfo.grade : 'F'}`);
  }

  return {
    studentId,
    studentName,
    courseId,
    courseName,
    breakdownData,
    totalScored,
    maxPossible,
    percentage: parseFloat(percentage.toFixed(2)),
    cgpa: parseFloat(cgpa.toFixed(2)),
    grade: isPassed ? overallGradeInfo.grade : 'F',
    status: isPassed ? 'PASS' : 'FAIL'
  };
}

function renderSummaryTable(data) {
  summaryTableBody.innerHTML = '';
  if (data.length === 0) {
    summaryTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No subjects available</td></tr>';
    return;
  }

  data.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(item.subjectName)}</strong></td>
      <td>${item.internal}</td>
      <td>${item.midTerm}</td>
      <td>${item.practical}</td>
      <td>${item.endTerm}</td>
      <td><strong>${item.total}</strong></td>
      <td><span class="badge ${item.grade === 'F' ? 'badge-danger' : 'badge-info'}">${item.grade}</span></td>
    `;
    summaryTableBody.appendChild(tr);
  });
}

function resetSummary() {
  dispPercentage.textContent = '0.0%';
  dispTotalMarks.textContent = '0 / 0';
  dispCgpa.textContent = '0.00';
  dispLetterGrade.textContent = '-';
  dispStatus.textContent = '-';
  dispStatus.className = 'metric-val status-highlight';
  passFailBadge.textContent = 'READY';
  passFailBadge.className = 'badge badge-success';
  summaryTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Add subjects and enter marks to view summary</td></tr>';
}

// -------------------------------------------------------------
// Database Operations (Matches Schema in Handwritten Diagram)
// -------------------------------------------------------------
function saveCurrentAssessment() {
  const result = calculateAll(false);
  if (!result) return;

  if (hasInvalidMarks()) {
    showToast('Please correct invalid marks before saving.', true);
    document.querySelector('.input-error')?.focus();
    return;
  }

  if (!result.studentId || result.studentId === '---') {
    showToast('⚠️ Please provide a Student ID before saving.', true);
    studentIdInput.focus();
    return;
  }
  if (!result.studentName || result.studentName === '---') {
    showToast('⚠️ Please provide a Student Name before saving.', true);
    studentNameInput.focus();
    return;
  }

  const db = getDatabase();

  // 1. Update Courses Table: Course id, Course name, Subjects
  let courseRecord = db.courses.find(c => c.courseId.toLowerCase() === (result.courseId || 'CS-101').toLowerCase());
  const subjectNames = result.breakdownData.map(b => b.subjectName);

  if (!courseRecord) {
    courseRecord = {
      courseId: result.courseId || 'CS-101',
      courseName: result.courseName || 'General Academic Course',
      subjects: subjectNames
    };
    db.courses.push(courseRecord);
  } else {
    courseRecord.subjects = Array.from(new Set([...courseRecord.subjects, ...subjectNames]));
  }

  // 2. Update Student Table: Student id, Student name, Course name
  const studentIndex = db.students.findIndex(s => s.studentId.toLowerCase() === result.studentId.toLowerCase());
  const studentRecord = {
    studentId: result.studentId,
    studentName: result.studentName,
    courseId: result.courseId || 'CS-101',
    courseName: result.courseName || 'General Course',
    percentage: result.percentage,
    cgpa: result.cgpa,
    grade: result.grade,
    status: result.status,
    timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    savedAt: new Date().toISOString()
  };

  if (studentIndex >= 0) {
    db.students[studentIndex] = studentRecord;
  } else {
    db.students.push(studentRecord);
  }

  // 3. Update Marks Distribution Table: Student id, Subject name, Internal, End Term, Mid Term, Practical, Grade
  // First remove old entries for this student to avoid duplicate rows
  db.marksDistribution = db.marksDistribution.filter(m => m.studentId.toLowerCase() !== result.studentId.toLowerCase());
  
  result.breakdownData.forEach(sub => {
    db.marksDistribution.push({
      studentId: result.studentId,
      subjectName: sub.subjectName,
      internal: sub.internal,
      midTerm: sub.midTerm,
      practical: sub.practical,
      endTerm: sub.endTerm,
      total: sub.total,
      grade: sub.grade
    });
  });

  if (!saveDatabase(db)) return;
  showToast(`✅ Saved records for ${result.studentName} (${result.studentId}) into relational database!`);
}

function renderDatabaseTables(searchTerm = '') {
  const db = getDatabase();
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const totalStudentsEl = document.getElementById('db-total-students');
  const totalCoursesEl = document.getElementById('db-total-courses');
  const totalMarksEl = document.getElementById('db-total-marks');
  if (totalStudentsEl) totalStudentsEl.textContent = db.students.length;
  if (totalCoursesEl) totalCoursesEl.textContent = db.courses.length;
  if (totalMarksEl) totalMarksEl.textContent = db.marksDistribution.length;
  const sortMode = document.getElementById('student-sort')?.value || 'recent';

  // 1. Marks Distribution Table
  const marksBody = document.getElementById('db-marks-body');
  marksBody.innerHTML = '';
  const visibleMarks = db.marksDistribution.filter(row => {
    const searchableText = [row.studentId, row.subjectName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  if (visibleMarks.length === 0) {
    const message = db.marksDistribution.length === 0
      ? 'No marks recorded in database.'
      : 'No marks match your search.';
    marksBody.innerHTML = `<tr><td colspan="8" class="empty-state">${message}</td></tr>`;
  } else {
    visibleMarks.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(row.studentId)}</strong></td>
        <td>${escapeHtml(row.subjectName)}</td>
        <td>${row.internal}</td>
        <td>${row.midTerm}</td>
        <td>${row.practical}</td>
        <td>${row.endTerm}</td>
        <td><strong>${row.total}</strong></td>
        <td><span class="badge ${row.grade === 'F' ? 'badge-danger' : 'badge-info'}">${row.grade}</span></td>
      `;
      marksBody.appendChild(tr);
    });
  }

  // 2. Student Table
  const studentsBody = document.getElementById('db-students-body');
  studentsBody.innerHTML = '';
  const visibleStudents = db.students.filter(stu => {
    const searchableText = [stu.studentId, stu.studentName, stu.courseName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  visibleStudents.sort((first, second) => {
    if (sortMode === 'name') {
      return String(first.studentName || '').localeCompare(String(second.studentName || ''));
    }
    if (sortMode === 'percentage-high') {
      return Number(second.percentage || 0) - Number(first.percentage || 0);
    }
    if (sortMode === 'percentage-low') {
      return Number(first.percentage || 0) - Number(second.percentage || 0);
    }
    const firstDate = Date.parse(first.savedAt || first.timestamp || '') || 0;
    const secondDate = Date.parse(second.savedAt || second.timestamp || '') || 0;
    return secondDate - firstDate;
  });

  if (visibleStudents.length === 0) {
    const message = db.students.length === 0
      ? 'No students found.'
      : 'No students match your search.';
    studentsBody.innerHTML = `<tr><td colspan="7" class="empty-state">${message}</td></tr>`;
  } else {
    visibleStudents.forEach(stu => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(stu.studentId)}</strong></td>
        <td>${escapeHtml(stu.studentName)}</td>
        <td>${escapeHtml(stu.courseName)}</td>
        <td>${stu.percentage}%</td>
        <td><strong>${stu.cgpa}</strong></td>
        <td><small>${stu.timestamp}</small></td>
        <td class="student-row-actions">
          <button class="btn btn-sm btn-outline btn-load-student" data-id="${escapeHtml(stu.studentId)}">Load</button>
          <button class="btn btn-sm btn-danger btn-delete-student" data-id="${escapeHtml(stu.studentId)}">Delete</button>
        </td>
      `;
      studentsBody.appendChild(tr);
    });

    // Attach listeners for loading existing student data
    studentsBody.querySelectorAll('.btn-load-student').forEach(btn => {
      btn.addEventListener('click', () => {
        loadStudentRecord(btn.dataset.id);
        dbModal.classList.add('hidden');
      });
    });

    studentsBody.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = btn.dataset.id;
        if (!confirm(`Delete the saved record for ${studentId}? This also removes its marks.`)) return;

        const currentDb = getDatabase();
        currentDb.students = currentDb.students.filter(student => student.studentId.toLowerCase() !== studentId.toLowerCase());
        currentDb.marksDistribution = currentDb.marksDistribution.filter(mark => mark.studentId.toLowerCase() !== studentId.toLowerCase());

        if (saveDatabase(currentDb)) {
          renderDatabaseTables(document.getElementById('student-search')?.value || '');
          showToast(`Deleted student record ${studentId}.`);
        }
      });
    });
  }

  // 3. Courses Table
  const coursesBody = document.getElementById('db-courses-body');
  coursesBody.innerHTML = '';
  if (db.courses.length === 0) {
    coursesBody.innerHTML = '<tr><td colspan="4" class="empty-state">No courses recorded.</td></tr>';
  } else {
    db.courses.forEach(c => {
      const enrolledCount = db.students.filter(s => (s.courseId || '').toLowerCase() === c.courseId.toLowerCase()).length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(c.courseId)}</strong></td>
        <td>${escapeHtml(c.courseName)}</td>
        <td>${escapeHtml(c.subjects.join(', '))}</td>
        <td><span class="badge badge-info">${enrolledCount} Students</span></td>
      `;
      coursesBody.appendChild(tr);
    });
  }
}

function loadStudentRecord(studentId) {
  const db = getDatabase();
  const student = db.students.find(s => s.studentId.toLowerCase() === studentId.toLowerCase());
  if (!student) return;

  studentIdInput.value = student.studentId;
  studentNameInput.value = student.studentName;
  courseIdInput.value = student.courseId;
  courseNameInput.value = student.courseName;

  const marks = db.marksDistribution.filter(m => m.studentId.toLowerCase() === studentId.toLowerCase());
  subjectsContainer.innerHTML = '';
  subjectCounter = 0;

  if (marks.length > 0) {
    marks.forEach(m => {
      createSubjectCard(m.subjectName, {
        internal: m.internal,
        midTerm: m.midTerm,
        practical: m.practical,
        endTerm: m.endTerm
      });
    });
  } else {
    initializeDefaultSubjects();
  }

  calculateAll(false);
  showToast(`Loaded assessment record for ${student.studentName}`);
}

// -------------------------------------------------------------
// Sample Data Generator (Instant Demo for Assignment)
// -------------------------------------------------------------
function loadSampleData() {
  studentIdInput.value = 'STU-2024-101';
  studentNameInput.value = 'Deepak Kumar';
  courseIdInput.value = 'CS-101';
  courseNameInput.value = 'B.Tech Computer Science';

  subjectsContainer.innerHTML = '';
  subjectCounter = 0;

  const sampleSubjects = [
    { name: 'Sub 1: Data Structures', internal: 18, midTerm: 17, practical: 19, endTerm: 34 },
    { name: 'Sub 2: Database Systems', internal: 19, midTerm: 16, practical: 18, endTerm: 36 },
    { name: 'Sub 3: Operating Systems', internal: 17, midTerm: 15, practical: 17, endTerm: 32 },
    { name: 'Sub 4: Computer Networks', internal: 20, midTerm: 18, practical: 19, endTerm: 37 }
  ];

  sampleSubjects.forEach(s => {
    createSubjectCard(s.name, {
      internal: s.internal,
      midTerm: s.midTerm,
      practical: s.practical,
      endTerm: s.endTerm
    });
  });

  calculateAll(true);
  showToast('⚡ Sample scenario loaded with 4 subjects matching notebook diagram!');
}

function initializeDefaultSubjects() {
  subjectsContainer.innerHTML = '';
  subjectCounter = 0;
  // Initialize Sub 1, Sub 2, Sub 3, Sub 4 as shown in notebook diagram
  for (let i = 1; i <= 4; i++) {
    createSubjectCard(`Sub ${i}`);
  }
  calculateAll(false);
}

// -------------------------------------------------------------
// Helpers & Event Listeners
// -------------------------------------------------------------
function showToast(message, isWarning = false) {
  toastEl.textContent = message;
  toastEl.style.backgroundColor = isWarning ? '#b45309' : '#0f172a';
  toastEl.classList.remove('hidden');

  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3200);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

// Event Bindings
btnAddSubject.addEventListener('click', () => {
  createSubjectCard();
  calculateAll(false);
});

btnCalculate.addEventListener('click', () => calculateAll(true));

btnReset.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all inputs?')) {
    studentIdInput.value = '';
    studentNameInput.value = '';
    courseIdInput.value = '';
    courseNameInput.value = '';
    initializeDefaultSubjects();
    showToast('Form reset to default state.');
  }
});

btnLoadSample.addEventListener('click', loadSampleData);
btnSaveRecord.addEventListener('click', saveCurrentAssessment);
btnPrintReport.addEventListener('click', () => window.print());

// Modal Navigation
btnToggleDb.addEventListener('click', () => {
  const searchInput = document.getElementById('student-search');
  if (searchInput) searchInput.value = '';
  renderDatabaseTables();
  dbModal.classList.remove('hidden');
});

const studentSearchInput = document.getElementById('student-search');
if (studentSearchInput) {
  studentSearchInput.addEventListener('input', () => {
    renderDatabaseTables(studentSearchInput.value);
  });
}

const studentSortSelect = document.getElementById('student-sort');
if (studentSortSelect) {
  studentSortSelect.addEventListener('change', () => {
    renderDatabaseTables(studentSearchInput?.value || '');
  });
}

btnCloseDb.addEventListener('click', () => dbModal.classList.add('hidden'));
btnCloseDbBottom.addEventListener('click', () => dbModal.classList.add('hidden'));
dbModal.addEventListener('click', (e) => {
  if (e.target === dbModal) dbModal.classList.add('hidden');
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && dbModal && !dbModal.classList.contains('hidden')) {
    dbModal.classList.add('hidden');
  }
});

// Database Tabs Switching
document.querySelectorAll('.db-tab').forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    document.querySelectorAll('.db-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    tabBtn.classList.add('active');
    const targetPane = document.getElementById(tabBtn.dataset.tab);
    if (targetPane) targetPane.classList.add('active');
  });
});

btnClearDb.addEventListener('click', () => {
  if (confirm('Are you sure you want to wipe all stored database records?')) {
    localStorage.removeItem(DB_STORAGE_KEY);
    updateSavedCount();
    renderDatabaseTables();
    showToast('Database records cleared.');
  }
});

if (btnImportDb && dbImportFile) {
  btnImportDb.addEventListener('click', () => dbImportFile.click());

  dbImportFile.addEventListener('change', async () => {
    const file = dbImportFile.files?.[0];
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());
      const validArray = key => Array.isArray(backup[key]);
      if (!backup || typeof backup !== 'object' ||
          !validArray('courses') || !validArray('students') || !validArray('marksDistribution')) {
        throw new Error('The selected file is not a valid grade calculator backup.');
      }

      const studentIds = new Set();
      for (const student of backup.students) {
        if (!student || typeof student.studentId !== 'string' ||
            typeof student.studentName !== 'string' ||
            !Number.isFinite(Number(student.percentage)) ||
            !Number.isFinite(Number(student.cgpa))) {
          throw new Error('The backup contains an invalid student record.');
        }
        const normalizedId = student.studentId.trim().toLowerCase();
        if (!normalizedId || studentIds.has(normalizedId)) {
          throw new Error('The backup contains an empty or duplicate student ID.');
        }
        studentIds.add(normalizedId);
      }

      const confirmed = confirm(`Import ${backup.students.length} student record(s)? This replaces the current saved database.`);
      if (!confirmed) return;

      if (saveDatabase({
        courses: backup.courses,
        students: backup.students,
        marksDistribution: backup.marksDistribution
      })) {
        renderDatabaseTables(document.getElementById('student-search')?.value || '');
        showToast('Database backup imported successfully.');
      }
    } catch (error) {
      showToast(error.message || 'Unable to import this backup file.', true);
    } finally {
      dbImportFile.value = '';
    }
  });
}

btnExportDb.addEventListener('click', () => {
  const db = getDatabase();
  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    ...db
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grade_calculator_db_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Database exported as JSON file.');
});

const btnExportCsv = document.getElementById('btn-export-csv');
if (btnExportCsv) {
  btnExportCsv.addEventListener('click', () => {
    const students = getDatabase().students;
    if (students.length === 0) {
      showToast('There are no student records to export.', true);
      return;
    }

    const columns = ['studentId', 'studentName', 'courseId', 'courseName', 'percentage', 'cgpa', 'grade', 'status', 'timestamp'];
    const escapeCsv = value => {
      const safeValue = String(value ?? '').replace(/^[=+@-]/, "'    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;");
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = [
      columns.join(','),
      ...students.map(student => columns.map(column => escapeCsv(student[column])).join(','))
    ];
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_records_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Student records exported as CSV.');
  });
}

const btnExportMarksCsv = document.getElementById('btn-export-marks-csv');
if (btnExportMarksCsv) {
  btnExportMarksCsv.addEventListener('click', () => {
    const marks = getDatabase().marksDistribution;
    if (marks.length === 0) {
      showToast('There are no subject marks to export.', true);
      return;
    }

    const columns = ['studentId', 'subjectName', 'internal', 'midTerm', 'practical', 'endTerm', 'total', 'grade'];
    const escapeCsvCell = value => {
      const safeValue = String(value ?? '').replace(/^[=+@-]/, "'// Live updates on student/course info change");
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = [
      columns.join(','),
      ...marks.map(record => columns.map(column => escapeCsvCell(record[column])).join(','))
    ];
    const blob = new Blob(['\\uFEFF' + rows.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subject_marks_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Subject marks exported as CSV.');
  });
}

// Live updates on student/course info change
[studentIdInput, studentNameInput, courseIdInput, courseNameInput].forEach(inp => {
  inp.addEventListener('input', () => calculateAll(false));
});

// Startup Initialization
document.addEventListener('DOMContentLoaded', () => {
  initializeDefaultSubjects();
  updateSavedCount();
});
