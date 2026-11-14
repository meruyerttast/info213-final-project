export type Source = "Profile" | "Resume" | "Email" | "bCourses" | "Calendar" | "WhatsApp"
export type ItemStatus = "needs-ok" | "in-progress" | "done"

export type InboxItem = {
  id: string
  icon: "event" | "video" | "people" | "checklist" | "book"
  title: string
  detail: string
  meta?: string
  source: Source
  age: string
  proposal: string
  status: ItemStatus
}

export type CalendarEvent = {
  id: string
  title: string
  day: number
  start: number
  end: number
  source: Source
  color: "blue" | "green" | "violet" | "amber"
  detail?: string
  week: 0 | 1
  kind?: "deadline"
  assistantAdded?: boolean
  approvalLabel?: string
}

export type ActivityItem = {
  id: string
  title: string
  detail: string
  time: string
  source: Source
  automatic?: boolean
  kind?: "career-registration" | "career-cancellation" | "career-skipped"
}

export type RegistrationStatus = "draft" | "registered" | "cancelled" | "skipped"

export type RegistrationSubmission = {
  fields: RegistrationField[]
  employers: string[]
  conflictChoice: "message-team" | "arrive-late" | "automatic"
  organizerNote?: string
  teamMessageSent: boolean
  teamMessage: string
  confirmationNumber: string
  submittedAt: string
}

export type AutonomyTask = "eventRegistrations" | "meetingScheduling" | "calendarEntries"

export type AutonomyChoice = "alwaysAsk" | "askIfPersonal" | "doAndTell"

export type ConnectedSource = {
  id: "bcourses" | "gmail" | "calendar" | "career" | "whatsapp"
  name: string
  detail?: string
  lastRead: string
  source: Source
  connected: boolean
}

export type PrivacyRead = {
  title: string
  source: Source
  time: string
}

export type RegistrationField = {
  id: "fullName" | "email" | "program" | "resume" | "linkedin" | "dietary"
  label: string
  value: string
  source: Source
  sourceLabel: string
}

export const appData = {
  now: "Tue Nov 10 2026, 10:42am",
  user: {
    name: "Maya Chen",
    firstName: "Maya",
    initials: "MC",
    program: "MIMS 2028",
  },
  today: [
    {
      id: "today-1",
      title: "INFO 203",
      time: "11:00am",
      source: "Calendar" as Source,
      color: "blue",
    },
    {
      id: "today-2",
      title: "Study block",
      time: "1:30pm",
      source: "Calendar" as Source,
      color: "violet",
    },
    {
      id: "today-3",
      title: "Dinner with friends",
      time: "7:00pm",
      source: "Calendar" as Source,
      color: "green",
    },
  ],
  deadlines: [
    {
      id: "deadline-1",
      course: "INFO 203",
      title: "Assignment 4",
      due: "Wed 9:00am",
    },
    {
      id: "deadline-2",
      course: "INFO 203",
      title: "Reading response",
      due: "Thu 11:59pm",
    },
    {
      id: "deadline-3",
      course: "INFO 213",
      title: "Milestone 3",
      due: "Sun 11:59pm",
    },
  ],
  inbox: [
    {
      id: "career-night",
      icon: "event",
      title: "Product Design Career Night",
      detail: "Thu Nov 19 · 6:00-8:00pm",
      meta: "Career Center Rm 110 · Register by Mon Nov 16",
      source: "Email",
      age: "9:58am",
      proposal: "I can register you",
      status: "needs-ok",
    },
    {
      id: "google-ux",
      icon: "video",
      title: "Google UX Research Info Session",
      detail: "Wed Nov 18 · 5:00-6:00pm",
      meta: "Zoom · Currently full",
      source: "Email",
      age: "Yesterday",
      proposal: "I can join the waitlist",
      status: "needs-ok",
    },
    {
      id: "kai-meeting",
      icon: "people",
      title: "Kai · INFO 213 team",
      detail: "“Can we meet this week to finish the M3 deck?”",
      source: "WhatsApp",
      age: "8:15am",
      proposal: "I can find a time for 4 people",
      status: "needs-ok",
    },
    {
      id: "address",
      icon: "checklist",
      title: "Update your US address",
      detail: "Due Fri Nov 20",
      source: "Email",
      age: "Mon",
      proposal: "I made a checklist",
      status: "in-progress",
    },
    {
      id: "reading",
      icon: "book",
      title: "INFO 203 reading response added",
      detail: "Due Thu Nov 12 · 11:59pm",
      source: "bCourses",
      age: "Mon",
      proposal: "Added to your calendar",
      status: "done",
    },
  ] as InboxItem[],
  calendar: [
    {
      id: "gym-mon",
      title: "Gym",
      day: 0,
      start: 7,
      end: 8,
      source: "Calendar",
      color: "green",
      week: 0,
    },
    {
      id: "info213-mon",
      title: "INFO 213",
      day: 0,
      start: 14,
      end: 15.5,
      source: "Calendar",
      color: "violet",
      week: 0,
    },
    {
      id: "info203-tue",
      title: "INFO 203",
      day: 1,
      start: 11,
      end: 12.5,
      source: "Calendar",
      color: "blue",
      week: 0,
    },
    {
      id: "dinner-tue",
      title: "Dinner with friends",
      day: 1,
      start: 19,
      end: 21,
      source: "Calendar",
      color: "green",
      week: 0,
    },
    {
      id: "study-block-tue",
      title: "Study block: INFO 203 Assignment 4",
      day: 1,
      start: 13.5,
      end: 17,
      source: "Calendar",
      color: "amber",
      week: 0,
    },
    {
      id: "gym-wed",
      title: "Gym",
      day: 2,
      start: 7,
      end: 8,
      source: "Calendar",
      color: "green",
      week: 0,
    },
    {
      id: "info213-wed",
      title: "INFO 213",
      day: 2,
      start: 14,
      end: 15.5,
      source: "Calendar",
      color: "violet",
      week: 0,
    },
    {
      id: "study-wed",
      title: "Study group",
      day: 2,
      start: 16,
      end: 17,
      source: "Calendar",
      color: "amber",
      week: 0,
    },
    {
      id: "info203-thu",
      title: "INFO 203",
      day: 3,
      start: 11,
      end: 12.5,
      source: "Calendar",
      color: "blue",
      week: 0,
    },
    {
      id: "sync-thu",
      title: "INFO 213 team sync",
      day: 3,
      start: 18,
      end: 19,
      source: "Calendar",
      color: "violet",
      week: 0,
    },
    {
      id: "gym-fri",
      title: "Gym",
      day: 4,
      start: 7,
      end: 8,
      source: "Calendar",
      color: "green",
      week: 0,
    },
    {
      id: "assignment-4-deadline",
      title: "INFO 203 Assignment 4",
      day: 2,
      start: 9,
      end: 9,
      source: "bCourses",
      color: "amber",
      detail: "Assignment deadline",
      kind: "deadline",
      week: 0,
    },
    {
      id: "reading-response-deadline",
      title: "INFO 203 Reading response",
      day: 3,
      start: 23 + 59 / 60,
      end: 23 + 59 / 60,
      source: "bCourses",
      color: "amber",
      detail: "Reading response deadline",
      kind: "deadline",
      week: 0,
    },
    {
      id: "milestone-3-deadline",
      title: "INFO 213 Milestone 3",
      day: 6,
      start: 23 + 59 / 60,
      end: 23 + 59 / 60,
      source: "bCourses",
      color: "amber",
      detail: "Milestone deadline",
      kind: "deadline",
      week: 0,
    },
    {
      id: "gym-mon-w2",
      title: "Gym",
      day: 0,
      start: 7,
      end: 8,
      source: "Calendar",
      color: "green",
      week: 1,
    },
    {
      id: "info213-mon-w2",
      title: "INFO 213",
      day: 0,
      start: 14,
      end: 15.5,
      source: "Calendar",
      color: "violet",
      week: 1,
    },
    {
      id: "info203-tue-w2",
      title: "INFO 203",
      day: 1,
      start: 11,
      end: 12.5,
      source: "Calendar",
      color: "blue",
      week: 1,
    },
    {
      id: "gym-wed-w2",
      title: "Gym",
      day: 2,
      start: 7,
      end: 8,
      source: "Calendar",
      color: "green",
      week: 1,
    },
    {
      id: "info213-wed-w2",
      title: "INFO 213",
      day: 2,
      start: 14,
      end: 15.5,
      source: "Calendar",
      color: "violet",
      week: 1,
    },
    {
      id: "info203-thu-w2",
      title: "INFO 203",
      day: 3,
      start: 11,
      end: 12.5,
      source: "Calendar",
      color: "blue",
      week: 1,
    },
    {
      id: "sync-thu-w2",
      title: "INFO 213 team sync",
      day: 3,
      start: 18,
      end: 19,
      source: "Calendar",
      color: "violet",
      week: 1,
    },
    {
      id: "gym-fri-w2",
      title: "Gym",
      day: 4,
      start: 7,
      end: 8,
      source: "Calendar",
      color: "green",
      week: 1,
    },
  ] as CalendarEvent[],
  proposedCalendarEvents: {
    "career-night": {
      id: "career-cal",
      title: "Product Design Career Night",
      day: 3,
      start: 18,
      end: 20,
      source: "Email",
      color: "blue",
      week: 1,
      detail: "Career Center Rm 110 · Registered",
      assistantAdded: true,
      approvalLabel: "Added by Personal Assistant, you approved",
    },
    "google-ux": {
      id: "google-cal",
      title: "Google UX Research Info Session",
      day: 2,
      start: 17,
      end: 18,
      source: "Email",
      color: "blue",
      week: 1,
      detail: "Zoom · Waitlist joined",
    },
  } as Record<string, CalendarEvent>,
  careerNight: {
    date: "Thu Nov 19",
    time: "6:00-8:00pm",
    location: "Career Center Rm 110",
    registrationDeadline: "Mon Nov 16",
    employers: ["Figma", "Adobe", "Notion", "Airbnb", "LinkedIn", "Other"],
    note: "Bring 3 printed resumes",
    reason: "Matches your interest in product design.",
    email: {
      sender: "UC Berkeley Career Center",
      address: "careercenter@berkeley.example",
      received: "Today at 9:58am",
      subject: "Product Design Career Night — registration closes Monday",
      greeting: "Hi Maya,",
      intro:
        "You’re invited to our Product Design Career Night for graduate students.",
      closing:
        "Space is limited. We hope to see you there!\n\nUC Berkeley Career Center",
    },
    registrationFields: [
      {
        id: "fullName",
        label: "Full name",
        value: "Maya Chen",
        source: "Profile",
        sourceLabel: "Profile",
      },
      {
        id: "email",
        label: "Email",
        value: "maya.chen@berkeley.example",
        source: "Profile",
        sourceLabel: "Profile",
      },
      {
        id: "program",
        label: "Program & year",
        value: "MIMS 2028",
        source: "Profile",
        sourceLabel: "Profile",
      },
      {
        id: "resume",
        label: "Resume",
        value: "Maya_Chen_Resume_Oct.pdf",
        source: "Profile",
        sourceLabel: "Profile - current",
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        value: "linkedin.com/in/mayachen-example",
        source: "Profile",
        sourceLabel: "Profile",
      },
      {
        id: "dietary",
        label: "Dietary needs",
        value: "None",
        source: "Profile",
        sourceLabel: "Profile",
      },
    ] as RegistrationField[],
  },
  settings: {
    autonomy: {
      eventRegistrations: "alwaysAsk",
      meetingScheduling: "alwaysAsk",
      calendarEntries: "doAndTell",
    } as Record<AutonomyTask, AutonomyChoice>,
    connectedSources: [
      {
        id: "bcourses",
        name: "bCourses",
        lastRead: "Today at 10:31am",
        source: "bCourses",
        connected: true,
      },
      {
        id: "gmail",
        name: "Berkeley Gmail",
        lastRead: "Today at 10:38am",
        source: "Email",
        connected: true,
      },
      {
        id: "calendar",
        name: "Google Calendar",
        lastRead: "Today at 10:40am",
        source: "Calendar",
        connected: true,
      },
      {
        id: "career",
        name: "Career Center events",
        lastRead: "Today at 9:58am",
        source: "Email",
        connected: true,
      },
      {
        id: "whatsapp",
        name: "WhatsApp",
        detail: "Forward-only",
        lastRead: "Today at 8:15am",
        source: "WhatsApp",
        connected: true,
      },
    ] as ConnectedSource[],
    profile: {
      name: "Maya Chen",
      email: "maya.chen@berkeley.example",
      program: "MIMS 2028",
      linkedin: "linkedin.com/in/mayachen-example",
      interests: ["Product design", "UX research"],
      resumes: [
        {
          id: "oct",
          name: "Maya_Chen_Resume_Oct.pdf",
          detail: "MIMS 2028",
        },
        {
          id: "aug",
          name: "Maya_Chen_Resume_Aug.pdf",
          detail: "MIMS 2028",
        },
      ],
    },
    privacyReads: [
      {
        title: "Product Design Career Night",
        source: "Email",
        time: "Today 9:58am",
      },
      {
        title: "Google UX Research Info Session",
        source: "Email",
        time: "Mon 3:24pm",
      },
      {
        title: "Address update reminder",
        source: "Email",
        time: "Mon 11:08am",
      },
      {
        title: "INFO 203 Assignment 4",
        source: "bCourses",
        time: "Today 10:31am",
      },
      {
        title: "INFO 203 Reading response",
        source: "bCourses",
        time: "Mon 4:12pm",
      },
      {
        title: "INFO 213 Milestone 3",
        source: "bCourses",
        time: "Mon 4:10pm",
      },
    ] as PrivacyRead[],
    notifications: {
      requestReminders: true,
      actionConfirmations: true,
      deadlineAlerts: true,
      weeklySummary: false,
    },
  },
  activity: [
    {
      id: "activity-reading",
      title: "Added INFO 203 reading response to your calendar",
      detail: "Detected a new deadline in bCourses",
      time: "Mon 4:12pm",
      source: "bCourses",
      automatic: true,
    },
  ] as ActivityItem[],
}

export const sourceStyles: Record<Source, string> = {
  Profile: "source-profile",
  Resume: "source-resume",
  Email: "source-email",
  bCourses: "source-bcourses",
  Calendar: "source-calendar",
  WhatsApp: "source-whatsapp",
}
