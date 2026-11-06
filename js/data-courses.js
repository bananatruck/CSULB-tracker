/* Course data: CSULB B.S. Computer Science, 2023-2024 catalog.
   Source: https://csulb.catalog.acalog.com/preview_program.php?catoid=8&poid=3752
   Each course links to its own catalog page via coid.
   pre/co are expressions: a course id, {all:[...]}, or {any:[...]}.
   ext lists prerequisites outside the program list (shown, not enforced).
   minUnits is a units-completed prerequisite (for example 60 units). */
(function (root) {
  const A = (...x) => ({ all: x });
  const O = (...x) => ({ any: x });
  const c = (id, title, units, coid, o = {}) => Object.assign({ id, title, units, coid }, o);

  const courses = [
    // Pre-major gate and math
    c('MATH 122', 'Calculus I', 4, 72002, { ext: ['MATH 111 and MATH 112B or 113, or placement'] }),
    c('MATH 123', 'Calculus II', 4, 72003, { pre: 'MATH 122' }),
    // Science
    c('PHYS 151', 'Mechanics and Heat', 4, 72550, { co: O('MATH 122', 'MATH 123') }),
    c('CHEM 111A', 'General Chemistry', 5, 69290, { ext: ['MATH 112B or higher and chemistry placement'] }),
    c('BIOL 200', 'General Biology', 4, 68636, { ext: ['GE B4 and one GE A course'] }),
    c('BIOL 205', 'Human Biology', 4, 68637, { ext: ['GE B4 and one GE A course'] }),
    c('BIOL 207', 'Human Physiology', 4, 68638, { ext: ['GE B4 and one GE A course'] }),
    // Lower division
    c('CECS 105', 'Introduction to Computer Engineering and Computer Science', 1, 69027),
    c('CECS 174', 'Introduction to Programming and Problem Solving', 3, 69029, { co: 'MATH 122' }),
    c('CECS 225', 'Digital Logic and Assembly Programming', 3, 69034, { co: 'CECS 174' }),
    c('CECS 228', 'Discrete Structures with Computing Applications', 3, 69035, { pre: A('CECS 174', 'MATH 122') }),
    c('CECS 229', 'Discrete Structures with Computing Applications II', 3, 69036, { pre: A('MATH 123', 'CECS 228') }),
    c('CECS 274', 'Data Structures', 3, 69039, { pre: 'CECS 174' }),
    c('CECS 277', 'Object Oriented Application Development', 3, 69041, { pre: 'CECS 174' }),
    c('ENGR 101', 'Introduction to the Engineering Profession', 1, 70540, { ext: ['Freshman standing; MATH 111, 113 or 122 prereq/coreq'] }),
    c('ENGR 102', 'Academic Success Skills', 1, 70541, { pre: 'ENGR 101' }),
    // Upper division core
    c('CECS 325', 'System Programming', 3, 74192, { pre: A('CECS 274', 'CECS 277') }),
    c('CECS 326', 'Operating Systems', 3, 69050, { pre: A('CECS 325', 'CECS 341'), note: 'Catalog also accepts legacy CECS 275 or 282 in place of CECS 325, and CECS 346 in place of CECS 341.' }),
    c('CECS 327', 'Introduction to Networks and Distributed Computing', 3, 69051, { pre: 'CECS 326' }),
    c('CECS 328', 'Algorithms', 3, 69052, { pre: A('CECS 228', 'CECS 274'), note: 'Catalog also accepts legacy CECS 275 in place of CECS 274.' }),
    c('CECS 329', 'Concepts of Computer Science Theory', 3, 73938, { pre: 'CECS 328' }),
    c('CECS 341', 'Computer Architecture and Organization', 3, 69053, { pre: 'CECS 225' }),
    c('CECS 342', 'Principles of Programming Languages', 3, 73939, { pre: 'CECS 328' }),
    c('CECS 343', 'Introduction to Software Engineering', 3, 69054, { pre: 'CECS 277', note: 'Catalog also accepts legacy CECS 275.' }),
    c('CECS 378', 'Introduction to Computer Security Principles', 3, 69058, { pre: A('CECS 229', 'CECS 274'), note: 'Catalog also accepts legacy CECS 275 in place of CECS 274.' }),
    c('ENGR 350', 'Computers, Ethics and Society', 3, 70550, { minUnits: 60 }),
    c('CECS 491A', 'Computer Science Senior Project I', 3, 69150, { pre: A('CECS 343', 'ENGR 350'), co: A('CECS 323', 'CECS 328') }),
    c('CECS 491B', 'Computer Science Senior Project II', 3, 69151, { pre: 'CECS 491A', note: 'Also needs consent of instructor.' }),
    // Choose one: writing / sustainability
    c('ENGR 361', 'Scientific Research Communication', 3, 73791, { ext: ['GE foundation courses and GWAR placement score 11+ (or the GWAR portfolio course)'] }),
    c('ENGR 390', 'Information and Communication Technology for Sustainability', 3, 70554, { co: 'ENGR 350', ext: ['GE foundation, upper-division standing, GWAR placement score 11+'], note: 'Corequisite is ENGR 350 or another ethics course, or consent.' }),
    // Choose one: probability
    c('CECS 381', 'Stochastic Computing', 3, 76162, { pre: 'CECS 229' }),
    c('E E 381', 'Probability and Statistics with Applications to Computing', 3, 69915, { pre: 'CECS 229' }),
    // Software Development focus
    c('CECS 323', 'Database Fundamentals', 3, 69049, { pre: A('CECS 228', 'CECS 277') }),
    c('CECS 443', 'Software Project Management and Testing', 3, 74128, { pre: 'CECS 343' }),
    c('CECS 448', 'User Interface Design', 3, 69070, { pre: 'CECS 343', note: 'Or consent of instructor.' }),
    c('CECS 453', 'Mobile Application Development', 3, 69073, { pre: 'CECS 328', note: 'Or consent of instructor.' }),
    c('CECS 470', 'Web Programming and Accessibility', 3, 69078, { pre: A('CECS 323', 'CECS 343') }),
    c('CECS 475', 'Software Development with Frameworks', 3, 69080, { pre: 'CECS 343' }),
    // Cybersecurity focus
    c('CECS 478', 'Introduction to Computer Security', 3, 69082, { pre: 'CECS 328', note: 'Catalog also accepts CECS 346.' }),
    c('CECS 303', 'Networks and Network Security', 3, 69047, { pre: 'CECS 378', note: 'Catalog also accepts CECS 278.' }),
    c('CECS 474', 'Computer Network Interoperability', 3, 69079, { pre: 'CECS 326' }),
    c('I S 360', 'Cybersecurity in Business', 3, 73918),
    // ML and AI focus
    c('CECS 456', 'Machine Learning', 3, 73744, { pre: 'E E 381', note: 'Catalog lists E E 381 or STAT 381. It does not list CECS 381; confirm with an advisor.' }),
    c('CECS 457', 'Applied Machine Learning', 3, 74193, { pre: 'CECS 456' }),
    c('CECS 427', 'Dynamic Networks', 3, 74112, { pre: 'CECS 328', minUnits: 60 }),
    c('CECS 429', 'Search Engine Technology', 3, 69065, { pre: A('CECS 323', 'CECS 328', 'E E 381'), note: 'Catalog also accepts MATH 380 in place of E E 381.' }),
    c('CECS 450', 'Data Visualization', 3, 73740, { pre: 'CECS 343' }),
    c('CECS 451', 'Artificial Intelligence', 3, 69072, { pre: 'CECS 328' }),
    // Shared upper-division electives
    c('CECS 406', 'Selected Topics in Computer Science', 3, 69059, { ext: ['Senior standing, CS majors only'], note: 'May be repeated to a maximum of 6 units.' }),
    c('CECS 419', 'Theory of Computation', 3, 69062, { pre: 'CECS 329' }),
    c('CECS 428', 'Analysis of Algorithms', 3, 69064, { pre: 'CECS 328' }),
    c('CECS 444', 'Compiler Construction', 3, 69067, { pre: A('CECS 328', 'CECS 341') }),
    c('CECS 449', 'Computer Graphics', 3, 69071, { pre: A('CECS 328', 'CECS 229'), note: 'Catalog also accepts MATH 247 in place of CECS 229.' }),
    c('CECS 455', 'Introduction to Game Programming', 3, 69074, { pre: 'CECS 328', note: 'Or consent of instructor.' }),
    c('CECS 461', 'Hardware/Software Co-design', 3, 69076, { pre: 'CECS 341', note: 'Catalog also accepts CECS 440.' }),
    c('CECS 480', 'Quantum Computation', 3, 74111, { pre: 'CECS 328' }),
    c('CECS 495', 'Computational Physiology', 3, 69083, { pre: 'E E 381' }),
    c('CECS 497', 'Directed Studies', 3, 69085, { ext: ['Consent of instructor'], note: 'Catalog lists 1-3 units; counted as 3 here. May be repeated to 6 units.' }),
    c('MATH 323', 'Introduction to Numerical Analysis', 4, 72013, { ext: ['MATH 224 and a programming course'] })
  ];

  const ids = (s) => s.split(',').map((x) => x.trim());

  const requirements = {
    lower: ids('CECS 105,CECS 174,CECS 225,CECS 228,CECS 229,CECS 274,CECS 277,ENGR 101,ENGR 102,MATH 122,MATH 123'),
    upperCore: ids('CECS 325,CECS 326,CECS 327,CECS 328,CECS 329,CECS 341,CECS 342,CECS 343,CECS 378,ENGR 350,CECS 491A,CECS 491B'),
    pickOne: [
      { key: 'writing', label: 'ENGR 361 or ENGR 390', options: ids('ENGR 361,ENGR 390') },
      { key: 'stats', label: 'CECS 381 or E E 381', options: ids('CECS 381,E E 381') }
    ],
    science: {
      startOneOf: ids('PHYS 151,CHEM 111A'),
      pool: ids('PHYS 151,CHEM 111A,BIOL 200,BIOL 205,BIOL 207'),
      minUnits: 8
    },
    preMajor: ids('MATH 122,MATH 123,PHYS 151'),
    totalUnits: 120,
    tracks: {
      software: {
        name: 'Software Development',
        required: 'CECS 323',
        options: ids('CECS 443,CECS 448,CECS 453,CECS 470,CECS 475')
      },
      cyber: {
        name: 'Cybersecurity',
        required: 'CECS 478',
        options: ids('CECS 303,CECS 456,CECS 457,CECS 474,I S 360')
      },
      ml: {
        name: 'Machine Learning and AI',
        required: 'CECS 456',
        options: ids('CECS 427,CECS 429,CECS 450,CECS 451,CECS 457')
      }
    },
    sharedElectives: ids('CECS 303,CECS 323,CECS 406,CECS 419,CECS 427,CECS 428,CECS 429,CECS 443,CECS 444,CECS 448,CECS 449,CECS 450,CECS 451,CECS 453,CECS 455,CECS 456,CECS 457,CECS 461,CECS 470,CECS 474,CECS 475,CECS 478,CECS 480,CECS 495,CECS 497,MATH 323'),
    focusUnits: 12,
    electiveUnits: 6
  };

  const data = { courses, requirements, catalogYear: '2023-2024', catalogUrl: 'https://csulb.catalog.acalog.com/preview_program.php?catoid=8&poid=3752' };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.CSULB_DATA = data;
})(typeof window !== 'undefined' ? window : globalThis);
