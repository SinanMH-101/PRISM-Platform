export type AssessmentStatus = "draft" | "active" | "closed";
export type RepeatType = "weekly" | "fortnightly";
export type FeedbackVisibility = "immediate" | "after-deadline";
export type EducatorStatus = "invited" | "joined";

export type Assessment = {
  id: string;
  name: string;
  unitCode: string;
  assessmentWeighting: number;
  processWeighting: number;
  cohortSize: number;
  studentsPerGroup: number;
  educatorCount: number;
  repeatType: RepeatType;
  deadlineDay: string;
  deadlineTime: string;
  weeks: number;
  startDate: string;
  feedbackVisibility: FeedbackVisibility;
  status: AssessmentStatus;
  educatorsInvited: number;
  educatorsJoined: number;
};

export type Educator = {
  id: string;
  assessmentId: string;
  name: string;
  email: string;
  status: EducatorStatus;
  inviteSentDate: string;
};

export const deadlineDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const assessments: Assessment[] = [
  {
    id: "comp3000-a1",
    name: "Team Contribution Portfolio",
    unitCode: "COMP3000",
    assessmentWeighting: 40,
    processWeighting: 50,
    cohortSize: 168,
    studentsPerGroup: 5,
    educatorCount: 8,
    repeatType: "weekly",
    deadlineDay: "Sunday",
    deadlineTime: "23:55",
    weeks: 13,
    startDate: "2026-07-27",
    feedbackVisibility: "after-deadline",
    status: "active",
    educatorsInvited: 8,
    educatorsJoined: 6,
  },
  {
    id: "desn2204-peer",
    name: "Studio Peer Review",
    unitCode: "DESN2204",
    assessmentWeighting: 25,
    processWeighting: 30,
    cohortSize: 92,
    studentsPerGroup: 4,
    educatorCount: 5,
    repeatType: "fortnightly",
    deadlineDay: "Friday",
    deadlineTime: "17:00",
    weeks: 13,
    startDate: "2026-08-03",
    feedbackVisibility: "immediate",
    status: "draft",
    educatorsInvited: 3,
    educatorsJoined: 1,
  },
  {
    id: "engr4102-capstone",
    name: "Capstone Process Review",
    unitCode: "ENGR4102",
    assessmentWeighting: 35,
    processWeighting: 40,
    cohortSize: 124,
    studentsPerGroup: 6,
    educatorCount: 6,
    repeatType: "weekly",
    deadlineDay: "Wednesday",
    deadlineTime: "18:00",
    weeks: 10,
    startDate: "2026-03-09",
    feedbackVisibility: "after-deadline",
    status: "closed",
    educatorsInvited: 6,
    educatorsJoined: 6,
  },
];

export const educators: Educator[] = [
  { id: "e1", assessmentId: "comp3000-a1", name: "Mia Chen", email: "mia.chen@university.edu", status: "joined", inviteSentDate: "2026-07-01" },
  { id: "e2", assessmentId: "comp3000-a1", name: "Oliver James", email: "oliver.james@university.edu", status: "invited", inviteSentDate: "2026-07-01" },
  { id: "e3", assessmentId: "comp3000-a1", name: "Nora Patel", email: "nora.patel@university.edu", status: "joined", inviteSentDate: "2026-07-02" },
  { id: "e4", assessmentId: "desn2204-peer", name: "Alex Smith", email: "alex.smith@university.edu", status: "invited", inviteSentDate: "2026-07-05" },
  { id: "e5", assessmentId: "desn2204-peer", name: "Priya Rao", email: "priya.rao@university.edu", status: "joined", inviteSentDate: "2026-07-05" },
];

export function getAssessment(assessmentId: string) {
  if (assessmentId === "draft-new") {
    return {
      ...assessments[0],
      id: "draft-new",
      name: "New assessment draft",
      unitCode: "NEW1001",
      status: "draft" as const,
      educatorsInvited: 0,
      educatorsJoined: 0,
    };
  }

  return assessments.find((assessment) => assessment.id === assessmentId);
}

export function getAssessmentEducators(assessmentId: string) {
  return educators.filter((educator) => educator.assessmentId === assessmentId);
}

export function formatSchedule(assessment: Assessment) {
  const repeat = assessment.repeatType === "weekly" ? "Weekly" : "Fortnightly";
  return `${repeat}, ${assessment.deadlineDay} at ${assessment.deadlineTime}`;
}

export function processOverallWeight(assessment: Assessment) {
  return (assessment.assessmentWeighting * assessment.processWeighting) / 100;
}
