/* CECS faculty and lecturers.
   Sources (all csulb.edu):
   - Faculty list:   https://www.csulb.edu/college-of-engineering/computer-engineering-computer-science/faculty-staff
   - Office hours:   https://www.csulb.edu/college-of-engineering/computer-engineering-computer-science/faculty-office-hours
   - Each person's profile page (url field).
   Blank fields mean the page did not state them. Nothing here is guessed.
   rating: {score, count, date, url} is a hand-collected snapshot; null until collected.
   Snapshot date format: YYYY-MM-DD. */
(function (root) {
  const BASE = 'https://www.csulb.edu/college-of-engineering/computer-engineering-computer-science/page/';
  const SOURCES = {
    faculty: 'https://www.csulb.edu/college-of-engineering/computer-engineering-computer-science/faculty-staff',
    hours: 'https://www.csulb.edu/college-of-engineering/computer-engineering-computer-science/faculty-office-hours',
    schedule: 'https://www.csulb.edu/student-records/schedule-of-classes'
  };
  const fac = (slug, name, title, o = {}) => Object.assign({ slug, name, title, kind: 'Faculty', url: BASE + slug }, o);
  const lec = (slug, name, o = {}) => Object.assign({ slug, name, title: 'Lecturer', kind: 'Lecturer', url: BASE + slug }, o);

  const professors = [
    fac('dr-shadnaz-asgari', 'Shadnaz Asgari', 'Chair, Professor', { roles: ['Department chair'] }),
    fac('dr-amin-rezaei', 'Amin Rezaei', 'Associate Professor', { roles: ['Associate Chair', 'Computer Engineering undergraduate advisor'], interests: 'Hardware security, machine learning, computer architecture' }),
    fac('dr-wenlu-zhang', 'Wenlu Zhang', 'Associate Professor', { roles: ['Associate Chair', 'CS undergraduate advisor (last names A-G)', 'Applied Data Science advisor'] }),
    fac('dr-hossein-sayadi', 'Hossein Sayadi', 'Associate Professor', { roles: ['CS undergraduate advisor (last names H-O)'], interests: 'Hardware security, AI and machine learning, cybersecurity, computer architecture, cyber-physical systems, CS education' }),
    fac('dr-amir-ghasemkhani', 'Amir Ghasemkhani', 'Assistant Professor', { roles: ['CS undergraduate advisor (last names P-Z)'], interests: 'AI privacy and security for cyber-physical systems' }),
    fac('daniel-commey', 'Daniel Commey', 'Professor', { office: 'ECS-522', email: 'daniel.commey@csulb.edu', hours: 'TU 12-1:30PM (ECS-522); W 4:30-6PM (Zoom); or by appointment' }),
    fac('dr-todd-ebert', 'Todd Ebert', 'Associate Professor', { interests: 'Constraint programming: high-level languages for stating constraint problems and robust algorithms for solving them' }),
    fac('dr-bo-fu', 'Bo Fu', 'Associate Professor, Boeing Endowed Professor'),
    fac('dr-darin-goldstein', 'Darin Goldstein', 'Professor', { office: 'ECS-546', email: 'darin.goldstein@csulb.edu', hours: 'MW 8:15-10:15 AM', interests: 'Algorithms and data structures, games, distributed computation, computational complexity' }),
    fac('dr-forouzan-golshani', 'Forouzan Golshani', 'Professor'),
    fac('dr-min-he', 'Min He', 'Associate Professor', { interests: 'Embedded systems, hardware/software codesign, software engineering for embedded systems, parallel algorithms, optical interconnection networks' }),
    fac('dr-michael-hoffman', 'Michael Hoffman', 'Professor', { office: 'ECS-533', email: 'm.hoffman@csulb.edu', hours: 'W 4-5PM via Zoom; TH 4-5PM via Zoom; or via email/appointment' }),
    fac('dr-tracy-bradley-maples', 'Tracy Bradley Maples', 'Professor', { interests: 'Computer networking, modeling and simulation' }),
    fac('dr-ju-cheol-moon', 'Ju Cheol Moon', 'Associate Professor'),
    fac('dr-frank-murgolo', 'Frank Murgolo', 'Professor', { office: 'ECS-534', email: 'frank.murgolo@csulb.edu', hours: 'MW 12:30-1:30 PM, 7-8 PM; or by appointment' }),
    fac('dr-oscar-morales-ponce', 'Oscar Morales Ponce', 'Associate Professor', { interests: 'Cooperative algorithms for self-coordinating distributed systems' }),
    fac('dr-xin-qin', 'Xin Qin', 'Assistant Professor', { office: 'ECS-530', email: 'xin.qin@csulb.edu' }),
    fac('dr-muhammad-abdul-basit-ur-rahim', 'Muhammad Abdul Basit Ur Rahim', 'Assistant Professor', { interests: 'Formal modeling and analysis of industrial systems' }),
    fac('dr-arash-sarshar', 'Arash Sarshar', 'Assistant Professor', { interests: 'Theory and applications of machine learning; numerical methods for scientific simulation' }),
    fac('dr-shabnam-sodagari', 'Shabnam Sodagari', 'Professor', { roles: ['Graduate advisor'] }),
    fac('dr-jelena-trajkovic', 'Jelena Trajkovic', 'Associate Professor', { interests: 'Multicore embedded systems, pervasive computing, Internet of Things for biomedical and control applications' }),
    fac('wei-wei', 'Wei Wei', 'Professor', { office: 'ECS-535', email: 'wei.wei@csulb.edu', hours: 'MW 9-11 AM; or by appointment' }),
    fac('dr-xiaolong-wu', 'Xiaolong Wu', 'Associate Professor', { interests: 'Network-on-chip and system-on-chip design, IC design, interconnection networks, reliability modeling' }),
    fac('dr-hailu-xu', 'Hailu Xu', 'Associate Professor', { interests: 'AI/ML systems, human-robot collaboration, distributed computing, federated learning, cloud and edge computing, big data systems' }),
    fac('dr-yutong-zhao', 'Yutong Zhao', 'Assistant Professor', { interests: 'Software engineering, performance analysis, machine and deep learning, natural language processing' }),

    lec('samuel-addington', 'Samuel Addington', { office: 'ECS-601', email: 'samuel.addington@csulb.edu', hours: 'F 10:45-11:45 am; or by appointment' }),
    lec('dr-fahd-albinali', 'Fahd Albinali', { office: 'ECS-211', email: 'fahd.albinali@csulb.edu', hours: 'MW 8:30-9:30 AM; TTH 11:30AM-12:30PM; or by appointment' }),
    lec('dr-sina-askari', 'Sina Askari', { office: 'ECS-211', email: 'sina.askari@csulb.edu', hours: 'MW 4:30-5:30PM; or by appointment' }),
    lec('david-brown', 'David Brown', { title: 'Part-Time Lecturer', office: 'ECS-524', email: 'david.brown@csulb.edu', hours: 'MW 2-3:15PM; or by appointment' }),
    lec('shannon-cleary', 'Shannon Cleary', { office: 'ECS-524', email: 'shannon.cleary@csulb.edu', hours: 'MW 9:30-10AM, 11:50AM-12:30PM; TTH 10:20-11AM, 12:15-12:30PM' }),
    lec('dan-cregg', 'Dan Cregg', { office: 'ECS-501', email: 'dan.cregg@csulb.edu', hours: 'M/W 1-3 PM; or by appointment' }),
    lec('dr-arjang-fahim', 'Arjang Fahim', { office: 'ECS-211', email: 'arjang.fahim@csulb.edu', hours: 'M 2-4pm (CECS 448); TH 2-3pm (CECS 575); or by appointment', courses: ['CECS 448'] }),
    lec('parvaneh-ghaforyfard', 'Parvaneh Ghaforyfard', { office: 'ECS-601', email: 'parvaneh.ghaforyfard@csulb.edu', hours: 'M 1-3 pm; or by appointment' }),
    lec('dr-arin-ghazarian', 'Arin Ghazarian', { office: 'ECS-601', email: 'arin.ghazarian@csulb.edu', hours: 'MW 6-7 PM; TH 12-1 PM (virtual); or by appointment' }),
    lec('anthony-giacalone', 'Anthony Giacalone', { office: 'ECS-501', email: 'anthony.giacalone@csulb.edu', hours: 'TTH 10-11 AM, 2-3 PM; or by appointment' }),
    lec('steve-gold', 'Steve Gold', { office: 'VEC-219E', email: 'steven.gold@csulb.edu', hours: 'MW 5-5:30PM; TTH 4-5:30PM; or by appointment' }),
    lec('dr-benyamin-haghi', 'Benyamin Haghi', { office: 'ECS-211', email: 'benyamin.haghi@csulb.edu', hours: 'M 10-11AM (CECS 450); M 11AM-12PM (CECS 551); M 12-1PM (CECS 451); or by appointment', courses: ['CECS 450', 'CECS 451'] }),
    lec('eric-hernandez', 'Eric Hernandez', { office: 'VEC-524', email: 'eric.hernandez@csulb.edu', hours: 'MW 11 AM-12 PM; TTH 12-1 PM; or by appointment' }),
    lec('fei-hoffman', 'Fei Hoffman', { office: 'ECS-533', email: 'fei.hoffman@csulb.edu', hours: 'MW 8-10 am (Zoom); TTH 10:30-11 am; or by appointment' }),
    lec('dr-claus-jurgensen', 'Claus Jürgensen', { office: 'ECS-519', email: 'claus.jurgensen@csulb.edu', hours: 'MW by appointment via Zoom; TTH 12:45-1:45PM (ECS-519)' }),
    lec('dr-binh-le', 'Binh Le', { office: 'ECS-211', email: 'binh.le@csulb.edu' }),
    lec('dr-daniel-link', 'Daniel Link', { office: 'ECS-211', email: 'daniel.link@csulb.edu', hours: 'TU 12:30-1:30 PM; or by appointment' }),
    lec('malik-luti', 'Malik Luti', { office: 'ECS-211', email: 'malik.luti@csulb.edu', hours: 'F 2-4 PM via Zoom; SA 8:30-10 AM via Zoom; or by appointment' }),
    lec('dr-alireza-mehrnia', 'Alireza Mehrnia', { office: 'ECS-524', email: 'alireza.mehrnia@csulb.edu', hours: 'F 8-9:30 AM via Zoom; SA 12:30-1 PM, 3:30-4 PM, 6:30-7:30 PM; or by appointment' }),
    lec('dr-susan-nachawati', 'Susan Nachawati'),
    lec('minhthong-nguyen', 'Minhthong Nguyen', { office: 'ECS-601', email: 'minhthong.nguyen@csulb.edu', hours: 'M-TH 5-5:30 PM; or by appointment' }),
    lec('kate-nguyen', 'Kate Nguyen', { office: 'ECS-501', email: 'kate.nguyen@csulb.edu', hours: 'MW 9-9:30 AM, 10:45 AM-12:30 PM; or by appointment' }),
    lec('phuong-nguyen', 'Phuong Nguyen', { office: 'ECS-519', email: 'phuong.nguyen@csulb.edu', hours: 'M 1:50-3:15 PM, 4:45-5:15 PM; W 1:50-3:15PM; or by appointment' }),
    lec('sahar-nikbakht', 'Sahar Nikbakht', { office: 'ECS-524', hours: 'SA 2-3PM (in-person, walk-in); SA 3-4PM (by appointment)' }),
    lec('iftikhar-shahnawaz', 'Iftikhar Shahnawaz', { office: 'ECS-211', email: 'iftikhar.shahnawaz@csulb.edu', hours: 'MW 2:30-3:30 PM, 5:30-6:30 PM' }),
    lec('ali-sharifian', 'Ali Sharifian', { office: 'ECS-524', email: 'ali.sharifian@csulb.edu', hours: 'TTH 6:45-7:45PM' }),
    lec('jose-tamayo', 'Jose Tamayo', { office: 'ECS-305', email: 'jose.tamayo@csulb.edu', hours: 'M-F 6-8PM (by appointment); SA 12:30-1PM; or by appointment' }),
    lec('neal-terrell', 'Neal Terrell', { interests: 'Software engineering and architecture, programming languages, computer science education' }),
    lec('louis-uuh', 'Louis Uuh', { office: 'ECS-501', email: 'louis.uuh@csulb.edu', hours: 'MW 9:15-9:45PM; TTH 7:45-9:15PM; or by appointment' }),
    lec('katherine-varela', 'Katherine Varela', { office: 'ECS-601', email: 'katherine.varela@csulb.edu', hours: 'TTH 8:30-9:20 AM, 11 AM-12:20 PM; appointment necessary if in-person' }),
    lec('dave-winter', 'Dave Winter', { office: 'Remote', email: 'dave.winter@csulb.edu', hours: 'TTH 3-4:30PM via Zoom (15-minute appointments); W 1:30-2:30PM via Zoom (15-minute appointments)' }),
    lec('dr-ehsan-yaghmaei', 'Ehsan Yaghmaei', { office: 'ECS-211', email: 'ehsan.yaghmaei@csulb.edu', hours: 'MW 9:30-11 AM, 1-2 PM, 5-6:30 PM; or by appointment' })
  ].map((p) => Object.assign({ rating: null }, p));

  const data = { professors, SOURCES, snapshot: '2026-11-05' };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.CSULB_PROFS = data;
})(typeof window !== 'undefined' ? window : globalThis);
