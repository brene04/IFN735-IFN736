// Sample (seed) rows for the Phase 1 ERD reference tables.
// Generated from the earlier Administrative Admin sample data; edit freely.
// Used only by techData.ts to build the first copy of tbl_offices, tbl_positions,
// tbl_competencies and tbl_behavioral_indicators.

export const OFFICE_SEED: { code: string; name: string; status: 'Active' | 'Inactive'; description: string }[] = [
  {
    "code": "DOST-ASTI",
    "name": "Advanced Science and Technology Institute",
    "status": "Active",
    "description": "R&D in ICT, microelectronics and space technology applications."
  },
  {
    "code": "DOST-FNRI",
    "name": "Food and Nutrition Research Institute",
    "status": "Active",
    "description": "National food and nutrition research, surveys and policy inputs."
  },
  {
    "code": "DOST-FPRDI",
    "name": "Forest Products Research and Development Institute",
    "status": "Active",
    "description": "R&D on wood, bamboo and other forest-based products."
  },
  {
    "code": "DOST-ITDI",
    "name": "Industrial Technology Development Institute",
    "status": "Active",
    "description": "Industrial R&D, testing, calibration and technical services."
  },
  {
    "code": "DOST-MIRDC",
    "name": "Metals Industry Research and Development Center",
    "status": "Active",
    "description": "Support to the metals, engineering and allied industries."
  },
  {
    "code": "DOST-PNRI",
    "name": "Philippine Nuclear Research Institute",
    "status": "Active",
    "description": "Nuclear science R&D and regulation of nuclear materials."
  },
  {
    "code": "DOST-PTRI",
    "name": "Philippine Textile Research Institute",
    "status": "Active",
    "description": "Textile and natural fiber research and technology transfer."
  },
  {
    "code": "DOST-PCAARRD",
    "name": "Philippine Council for Agriculture, Aquatic and Natural Resources R&D",
    "status": "Active",
    "description": "Plans and monitors the national AANR research agenda."
  },
  {
    "code": "DOST-PCHRD",
    "name": "Philippine Council for Health Research and Development",
    "status": "Active",
    "description": "Coordinates the national health research system."
  },
  {
    "code": "DOST-PCIEERD",
    "name": "Philippine Council for Industry, Energy and Emerging Technology R&D",
    "status": "Active",
    "description": "Funds and monitors industry, energy and emerging tech R&D."
  },
  {
    "code": "DOST-ALS",
    "name": "Administrative and Legal Service",
    "status": "Active",
    "description": "Administrative, legal and general services of the Central Office."
  },
  {
    "code": "DOST-FMS",
    "name": "Financial and Management Service",
    "status": "Active",
    "description": "Budget, accounting and management services."
  },
  {
    "code": "DOST-PES",
    "name": "Planning and Evaluation Service",
    "status": "Active",
    "description": "Department-wide planning, monitoring and evaluation."
  },
  {
    "code": "DOST-ITCU",
    "name": "International Technology Cooperation Unit",
    "status": "Inactive",
    "description": "International S&T agreements and cooperation programs."
  },
  {
    "code": "DOST-HRMD",
    "name": "Human Resource Management Division",
    "status": "Active",
    "description": "Recruitment, L&D, performance and rewards (PRIME-HRM)."
  },
  {
    "code": "DOST-PAGASA",
    "name": "Philippine Atmospheric, Geophysical and Astronomical Services Administration",
    "status": "Active",
    "description": "Weather, flood, climate and astronomical services."
  },
  {
    "code": "DOST-PHIVOLCS",
    "name": "Philippine Institute of Volcanology and Seismology",
    "status": "Active",
    "description": "Monitoring and warning for volcanoes, earthquakes and tsunamis."
  },
  {
    "code": "DOST-STII",
    "name": "Science and Technology Information Institute",
    "status": "Active",
    "description": "S&T information, libraries and science communication."
  },
  {
    "code": "DOST-SEI",
    "name": "Science Education Institute",
    "status": "Active",
    "description": "Science scholarships and S&T education programs."
  }
]

export const POSITION_SEED: { code: string; title: string; salaryGrade: number; description: string; department: string }[] = [
  {
    "code": "POS-001",
    "title": "Director IV",
    "salaryGrade": 28,
    "description": "Heads an institute or council and sets its strategic direction.",
    "department": "Executive"
  },
  {
    "code": "POS-002",
    "title": "Chief Science Research Specialist",
    "salaryGrade": 24,
    "description": "Leads a research division and its programmes.",
    "department": "Research & Development"
  },
  {
    "code": "POS-003",
    "title": "Supervising Science Research Specialist",
    "salaryGrade": 22,
    "description": "Supervises research sections and project teams.",
    "department": "Research & Development"
  },
  {
    "code": "POS-004",
    "title": "Senior Science Research Specialist",
    "salaryGrade": 19,
    "description": "Designs and leads research studies.",
    "department": "Research & Development"
  },
  {
    "code": "POS-005",
    "title": "Science Research Specialist II",
    "salaryGrade": 15,
    "description": "Conducts experiments and analyses research data.",
    "department": "Research & Development"
  },
  {
    "code": "POS-006",
    "title": "Science Research Specialist I",
    "salaryGrade": 11,
    "description": "Assists in research activities and data gathering.",
    "department": "Research & Development"
  },
  {
    "code": "POS-007",
    "title": "Information Technology Officer I",
    "salaryGrade": 19,
    "description": "Manages ICT systems, networks and data security.",
    "department": "ICT"
  },
  {
    "code": "POS-008",
    "title": "Administrative Officer V",
    "salaryGrade": 18,
    "description": "Oversees administrative and general services.",
    "department": "Administrative Services"
  },
  {
    "code": "POS-009",
    "title": "Accountant III",
    "salaryGrade": 19,
    "description": "Maintains books of accounts and financial reports.",
    "department": "Finance"
  },
  {
    "code": "POS-010",
    "title": "Human Resource Management Officer II",
    "salaryGrade": 15,
    "description": "Handles recruitment, records and L&D under PRIME-HRM.",
    "department": "Human Resources"
  },
  {
    "code": "POS-011",
    "title": "Administrative Assistant II",
    "salaryGrade": 8,
    "description": "Provides clerical and records support.",
    "department": "Administrative Services"
  },
  {
    "code": "POS-012",
    "title": "Science Aide",
    "salaryGrade": 6,
    "description": "Supports laboratory work and sample handling.",
    "department": "Research & Development"
  },
  {
    "code": "POS-013",
    "title": "Information Technology Officer III",
    "salaryGrade": 22,
    "description": "Leads ICT systems development and operations.",
    "department": "ICT"
  }
]

// type = Core / Functional / Leadership (matches tbl_competency_categories.category_name)
export const COMPETENCY_SEED: { code: string; name: string; description: string; type: string; indicators: [string, string, string, string] | null }[] = [
  { code: "C1", name: "Complete Staff Work (CSW)", description: "Prepares thorough, well-researched recommendations so decision-makers can act without needing further revisions.", type: "Core", indicators: ['Applies basic knowledge in delivering CSW with supervision', 'Ensures delivery of CSW without supervision', 'Evaluates performance of CSW and recommends areas for improvements in the performance of CSW', 'Conceptualizes and implements strategies to ensure delivery of CSW'] },
  { code: "C2", name: "Delivering Professional and Excellent Services", description: "Provides timely, courteous, client-focused public service that meets quality standards and stakeholder needs.", type: "Core", indicators: null },
  { code: "C3", name: "Use of Technology", description: "Uses digital tools and systems effectively to complete work efficiently and securely.", type: "Core", indicators: null },
  { code: "C4", name: "Oral and Written Communication", description: "Expresses ideas clearly and persuasively in speech and writing for different audiences.", type: "Core", indicators: null },
  { code: "C5", name: "Exemplifying Integrity", description: "Upholds ethical standards, honesty and public accountability in all official work and conduct.", type: "Core", indicators: null },
  { code: "C6", name: "Innovation", description: "Generates and applies new ideas to improve processes, services and outcomes.", type: "Core", indicators: null },
  { code: "C7", name: "Personal Effectiveness", description: "Manages own time, emotions and performance to achieve goals and adapt to change.", type: "Core", indicators: null },
  { code: "C8", name: "Planning and Organizing", description: "Sets goals, schedules tasks and allocates resources so work is completed on time.", type: "Core", indicators: null },
  { code: "C9", name: "Team Management (Team Work)", description: "Collaborates with colleagues, shares information and contributes to shared team goals.", type: "Core", indicators: null },
  { code: "C10", name: "Problem solving & Decision making", description: "Analyses issues, weighs options and makes sound, timely decisions.", type: "Core", indicators: null },
  { code: "F1", name: "Administrative Management", description: "Coordinates office operations, supplies, schedules and support services so the unit runs smoothly.", type: "Functional", indicators: null },
  { code: "F2", name: "Accounts Reconciliation", description: "Matches accounting records against source documents and resolves discrepancies accurately.", type: "Functional", indicators: null },
  { code: "F3", name: "Bills Review and Evaluation", description: "Checks billing documents for accuracy, completeness and compliance before approval for payment.", type: "Functional", indicators: null },
  { code: "F4", name: "Budget Administration and Control", description: "Plans, allocates and monitors budgets to keep spending within approved limits and rules.", type: "Functional", indicators: null },
  { code: "F5", name: "Building and Ground Management", description: "Maintains office buildings, grounds and facilities in safe, clean and functional condition.", type: "Functional", indicators: null },
  { code: "F6", name: "Cash Management", description: "Handles agency funds, collections and disbursements securely, with accurate records and sound controls.", type: "Functional", indicators: null },
  { code: "F7", name: "Compensation, Benefits, and Employee Welfare", description: "Administers pay, benefits and welfare programs fairly and in line with civil service rules.", type: "Functional", indicators: null },
  { code: "F8", name: "Continuous Improvement of Audit Quality", description: "Applies audit quality standards and reviews to steadily improve audit processes and results.", type: "Functional", indicators: null },
  { code: "F9", name: "Corporate Communication", description: "Shapes and delivers consistent internal and external messages that support the agency's image and goals.", type: "Functional", indicators: null },
  { code: "F10", name: "Critical Thinking", description: "Evaluates information objectively to reach reasoned, evidence-based conclusions and judgments.", type: "Functional", indicators: null },
  { code: "F11", name: "Digital Media and Visualization", description: "Creates clear visual and digital content, such as graphics, video and charts, to communicate information.", type: "Functional", indicators: null },
  { code: "F12", name: "Employee Engagement", description: "Builds staff motivation, morale and commitment through recognition, communication and involvement.", type: "Functional", indicators: null },
  { code: "F13", name: "Financial Management", description: "Manages funds, budgets and financial transactions in line with COA and government accounting rules.", type: "Functional", indicators: null },
  { code: "F14", name: "Generating Reports and Documentation", description: "Prepares accurate, well-structured reports and records that inform decisions and meet requirements.", type: "Functional", indicators: null },
  { code: "F15", name: "Information and Data Management and Dissemination", description: "Collects, organises, secures and shares data and information accurately for users who need it.", type: "Functional", indicators: null },
  { code: "F16", name: "Information Systems Management", description: "Plans, operates and maintains information systems that reliably support the agency's work.", type: "Functional", indicators: null },
  { code: "F17", name: "Internal Audit Planning and Management", description: "Plans and leads internal audits that assess controls, risks and compliance across the agency.", type: "Functional", indicators: null },
  { code: "F18", name: "Knowledge Management", description: "Captures, stores and shares organisational knowledge so lessons and expertise are reused.", type: "Functional", indicators: null },
  { code: "F19", name: "Learning and Development Planning", description: "Identifies skill needs and plans training and development activities that build staff capability.", type: "Functional", indicators: null },
  { code: "F20", name: "Legal Management", description: "Applies laws, regulations and legal processes to protect the agency's interests and ensure compliance.", type: "Functional", indicators: null },
  { code: "F21", name: "Legislative Policy Management", description: "Analyses and supports the development of legislative policies, positions and proposed laws.", type: "Functional", indicators: null },
  { code: "F22", name: "Media and Public Relations", description: "Manages media relations and public engagement to build understanding of, and trust in, the agency.", type: "Functional", indicators: null },
  { code: "F23", name: "Monitoring and Evaluation", description: "Tracks program progress and results against targets, then uses findings to improve performance.", type: "Functional", indicators: null },
  { code: "F24", name: "Negotiation", description: "Reaches fair, mutually beneficial agreements through clear communication, compromise and sound preparation.", type: "Functional", indicators: null },
  { code: "F25", name: "Networking and IT Security", description: "Builds professional networks and protects networks, systems and data from security threats.", type: "Functional", indicators: null },
  { code: "F26", name: "Organizational Development", description: "Plans and guides structural and cultural change to improve how the organisation performs.", type: "Functional", indicators: null },
  { code: "F27", name: "Organizational Planning", description: "Designs organisational structures, roles and staffing that fit the agency's mandate and goals.", type: "Functional", indicators: null },
  { code: "F28", name: "Performance Management", description: "Sets targets, monitors results and gives feedback to improve individual and team performance.", type: "Functional", indicators: null },
  { code: "F29", name: "Policy Development, Formulation and Implementation", description: "Drafts, reviews and puts policies into practice so they achieve their intended outcomes.", type: "Functional", indicators: null },
  { code: "F30", name: "Preparation and Interpretation of Financial Statements and Reports", description: "Prepares and interprets financial statements to show the agency's financial position and performance accurately.", type: "Functional", indicators: null },
  { code: "F31", name: "Procurement Management", description: "Conducts procurement under RA 9184, ensuring transparent, fair and cost-effective acquisition of goods and services.", type: "Functional", indicators: null },
  { code: "F32", name: "Program/Project Management", description: "Plans, schedules and delivers programs and projects within scope, time and budget.", type: "Functional", indicators: null },
  { code: "F33", name: "Programming & Web Development", description: "Designs, codes and maintains software and web applications that meet user requirements.", type: "Functional", indicators: null },
  { code: "F34", name: "Property Management", description: "Records, safeguards and manages government property and equipment from acquisition through disposal.", type: "Functional", indicators: null },
  { code: "F35", name: "Records and Documents Management", description: "Creates, files, retrieves and preserves records so documents stay accurate, secure and accessible.", type: "Functional", indicators: null },
  { code: "F36", name: "Research Information Management/ Data Management", description: "Collects, organises and manages research data and information so it stays accurate, secure and usable.", type: "Functional", indicators: null },
  { code: "F37", name: "Research/Resource Utilization", description: "Identifies and uses research resources, tools and funding efficiently to achieve research objectives.", type: "Functional", indicators: null },
  { code: "F38", name: "Rewards and Recognition", description: "Designs and applies recognition programs that fairly reward good performance and encourage contribution.", type: "Functional", indicators: null },
  { code: "F39", name: "Risk Analysis, Assessment and Management", description: "Identifies, assesses and controls risks to protect the agency's people, assets and objectives.", type: "Functional", indicators: null },
  { code: "F40", name: "Rule Enforcement", description: "Applies and upholds rules, standards and regulations consistently, fairly and in line with procedures.", type: "Functional", indicators: null },
  { code: "F41", name: "Secretariat and Committee Services", description: "Organises meetings, prepares agendas and minutes, and supports committees with accurate documentation.", type: "Functional", indicators: null },
  { code: "F42", name: "Software Support and Training", description: "Helps users operate software through troubleshooting, guidance and training.", type: "Functional", indicators: null },
  { code: "F43", name: "Statistics and Data Analysis", description: "Collects, analyses and interprets statistical data to produce reliable insights for decisions.", type: "Functional", indicators: null },
  { code: "F44", name: "Strategic Planning", description: "Sets long-term direction, goals and priorities and aligns plans and resources to achieve them.", type: "Functional", indicators: null },
  { code: "F45", name: "Talent Planning, Sourcing, Selection, and Management", description: "Plans workforce needs, attracts and selects suitable candidates, and manages talent for long-term capability.", type: "Functional", indicators: null },
  { code: "F46", name: "Technical Training Administration", description: "Plans, schedules and runs technical training programs and tracks their delivery and results.", type: "Functional", indicators: null },
  { code: "F47", name: "Technical Writing", description: "Prepares clear, accurate technical reports, papers and documents for specialist and general readers.", type: "Functional", indicators: null },
  { code: "F48", name: "Transaction Processing", description: "Processes accounting transactions accurately, completely and on time in line with government accounting standards.", type: "Functional", indicators: null },
  { code: "L1", name: "STI Advocacy", description: "Promotes science, technology and innovation to stakeholders and builds support for DOST programs.", type: "Leadership", indicators: null },
  { code: "L2", name: "Leading and Championing S&T Innovation", description: "Inspires and directs efforts to adopt science and technology innovation across the agency and sector.", type: "Leadership", indicators: null },
  { code: "L3", name: "Building Collaborative, Inclusive Working Relationships", description: "Builds trusting, inclusive relationships that encourage cooperation across teams, offices and partners.", type: "Leadership", indicators: null },
  { code: "L4", name: "Managing Performance and Coaching for Results", description: "Sets expectations, coaches staff and manages performance to deliver results.", type: "Leadership", indicators: null },
  { code: "L5", name: "Leading Change", description: "Guides people through change by communicating the vision and helping them adapt.", type: "Leadership", indicators: null },
  { code: "L6", name: "Thinking Strategically and Creatively", description: "Anticipates trends and develops creative, long-term strategies that move the organisation forward.", type: "Leadership", indicators: null },
  { code: "L7", name: "Creating and Nurturing a High Performing Organization", description: "Develops a motivated, capable organisation with a culture of excellence and shared accountability.", type: "Leadership", indicators: null },
]
