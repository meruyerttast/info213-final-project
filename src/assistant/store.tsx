import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  appData,
  type ActivityItem,
  type AutonomyChoice,
  type AutonomyTask,
  type CalendarEvent,
  type ConnectedSource,
  type InboxItem,
  type RegistrationField,
  type RegistrationStatus,
  type RegistrationSubmission,
} from "./data"

type AppStore = {
  inbox: InboxItem[]
  calendar: CalendarEvent[]
  activity: ActivityItem[]
  registrationFields: RegistrationField[]
  selectedEmployers: string[]
  registrationStatus: RegistrationStatus
  submission: RegistrationSubmission | null
  toast: string | null
  assistantPaused: boolean
  autonomy: Record<AutonomyTask, AutonomyChoice>
  connectedSources: ConnectedSource[]
  currentResume: string
  notifications: Record<string, boolean>
  formChangedError: boolean
  cantReachFormError: boolean
  paperworkChecks: boolean[]
  onboardingComplete: boolean
  meetingPollSent: boolean
  meetingBooked: boolean
  canUndoDismiss: boolean
  approve: (id: string) => void
  updateRegistrationField: (id: RegistrationField["id"], value: string) => void
  toggleEmployer: (employer: string) => void
  completeCareerRegistration: (options: {
    conflictChoice: "message-team" | "arrive-late" | "automatic"
    teamMessageSent: boolean
    teamMessage: string
  }) => void
  skipCareerRegistration: () => void
  cancelCareerRegistration: () => void
  clearToast: () => void
  setAssistantPaused: (paused: boolean) => void
  setAutonomyChoice: (task: AutonomyTask, choice: AutonomyChoice) => void
  disconnectSource: (id: ConnectedSource["id"]) => void
  setCurrentResume: (id: string) => void
  setNotification: (id: string, enabled: boolean) => void
  deleteAssistantData: () => void
  resetDemo: () => void
  loadRegisteredDemo: () => void
  setFormChangedError: (enabled: boolean) => void
  setCantReachFormError: (enabled: boolean) => void
  joinWaitlist: (policy: "ask" | "automatic") => void
  togglePaperworkCheck: (index: number) => void
  completePaperwork: () => void
  connectSource: (id: ConnectedSource["id"]) => void
  setAutonomyPreset: (preset: "alwaysAsk" | "personalOnly" | "routine") => void
  setOnboardingComplete: (complete: boolean) => void
  sendMeetingPoll: (automatic: boolean) => void
  undoMeetingPoll: () => void
  bookMeeting: () => void
  remindCareerNight: (label: string) => void
  dismissCareerNight: () => void
  undoDismissCareerNight: () => void
}

const StoreContext = createContext<AppStore | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [inbox, setInbox] = useState(appData.inbox)
  const [calendar, setCalendar] = useState(appData.calendar)
  const [activity, setActivity] = useState(appData.activity)
  const [registrationFields, setRegistrationFields] = useState(
    appData.careerNight.registrationFields,
  )
  const [selectedEmployers, setSelectedEmployers] = useState<string[]>([])
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>("draft")
  const [submission, setSubmission] = useState<RegistrationSubmission | null>(
    null,
  )
  const [toast, setToast] = useState<string | null>(null)
  const [assistantPaused, setAssistantPausedState] = useState(false)
  const [autonomy, setAutonomy] = useState(appData.settings.autonomy)
  const [connectedSources, setConnectedSources] = useState(
    appData.settings.connectedSources,
  )
  const [currentResume, setCurrentResumeState] = useState("oct")
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    appData.settings.notifications,
  )
  const [formChangedError, setFormChangedErrorState] = useState(false)
  const [cantReachFormError, setCantReachFormErrorState] = useState(false)
  const [paperworkChecks, setPaperworkChecks] = useState([false, false, false])
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => window.location.hash !== "#onboarding",
  )
  const [meetingPollSent, setMeetingPollSent] = useState(false)
  const [meetingBooked, setMeetingBooked] = useState(false)
  const [canUndoDismiss, setCanUndoDismiss] = useState(false)

  const saveToast = () => {
    setCanUndoDismiss(false)
    setToast("Saved")
  }

  const setAssistantPaused = (paused: boolean) => {
    setAssistantPausedState(paused)
    saveToast()
  }

  const setAutonomyChoice = (task: AutonomyTask, choice: AutonomyChoice) => {
    setAutonomy((current) => ({ ...current, [task]: choice }))
    const taskLabel: Record<AutonomyTask, string> = {
      eventRegistrations: "Event registrations",
      meetingScheduling: "Meeting scheduling",
      calendarEntries: "Calendar entries & reminders",
    }
    const choiceLabel: Record<AutonomyChoice, string> = {
      alwaysAsk: "Always ask",
      askIfPersonal: "Ask if it sends personal info",
      doAndTell: "Do it and tell me",
    }
    setActivity((items) => [
      {
        id: `activity-autonomy-${task}-${Date.now()}`,
        title: `You changed: ${taskLabel[task]} -> ${choiceLabel[choice]}`,
        detail: "Assistant autonomy preference updated",
        time: "Now",
        source: "Profile",
      },
      ...items,
    ])
    saveToast()
  }

  const disconnectSource = (id: ConnectedSource["id"]) => {
    setConnectedSources((sources) =>
      sources.map((source) =>
        source.id === id ? { ...source, connected: false } : source,
      ),
    )
    saveToast()
  }

  const connectSource = (id: ConnectedSource["id"]) => {
    setConnectedSources((sources) =>
      sources.map((source) =>
        source.id === id ? { ...source, connected: true } : source,
      ),
    )
  }

  const setAutonomyPreset = (
    preset: "alwaysAsk" | "personalOnly" | "routine",
  ) => {
    const presets: Record<typeof preset, Record<AutonomyTask, AutonomyChoice>> =
      {
        alwaysAsk: {
          eventRegistrations: "alwaysAsk",
          meetingScheduling: "alwaysAsk",
          calendarEntries: "alwaysAsk",
        },
        personalOnly: {
          eventRegistrations: "askIfPersonal",
          meetingScheduling: "alwaysAsk",
          calendarEntries: "doAndTell",
        },
        routine: {
          eventRegistrations: "doAndTell",
          meetingScheduling: "doAndTell",
          calendarEntries: "doAndTell",
        },
      }
    setAutonomy(presets[preset])
  }

  const setCurrentResume = (id: string) => {
    setCurrentResumeState(id)
    const resume = appData.settings.profile.resumes.find(
      (candidate) => candidate.id === id,
    )
    if (resume) {
      setRegistrationFields((fields) =>
        fields.map((field) =>
          field.id === "resume"
            ? {
                ...field,
                value: resume.name,
                source: "Profile",
                sourceLabel: "Profile - current",
              }
            : field,
        ),
      )
    }
    saveToast()
  }

  const setNotification = (id: string, enabled: boolean) => {
    setNotifications((current) => ({ ...current, [id]: enabled }))
    saveToast()
  }

  const deleteAssistantData = () => {
    setCanUndoDismiss(false)
    setToast("Your data was deleted")
  }

  const resetDemo = () => {
    setInbox(appData.inbox.map((item) => ({ ...item })))
    setCalendar(appData.calendar.map((event) => ({ ...event })))
    setActivity(appData.activity.map((item) => ({ ...item })))
    setRegistrationFields(
      appData.careerNight.registrationFields.map((field) => ({ ...field })),
    )
    setSelectedEmployers([])
    setRegistrationStatus("draft")
    setSubmission(null)
    setAssistantPausedState(false)
    setAutonomy({ ...appData.settings.autonomy })
    setConnectedSources(
      appData.settings.connectedSources.map((source) => ({ ...source })),
    )
    setCurrentResumeState("oct")
    setNotifications({ ...appData.settings.notifications })
    setFormChangedErrorState(false)
    setCantReachFormErrorState(false)
    setPaperworkChecks([false, false, false])
    setOnboardingComplete(true)
    setMeetingPollSent(false)
    setMeetingBooked(false)
    setCanUndoDismiss(false)
    setToast(null)
  }

  const loadRegisteredDemo = () => {
    const fields = appData.careerNight.registrationFields.map((field) => ({
      ...field,
    }))
    const teamMessage =
      "Hi team! I've got Career Night Thu 6:00-8:00pm. Could we move our sync to Thu 5:00pm or Fri morning?"
    setInbox(
      appData.inbox.map((item) =>
        item.id === "career-night"
          ? {
              ...item,
              status: "done",
              proposal: "Registered · Confirmation CN-4815",
            }
          : { ...item },
      ),
    )
    setCalendar([
      ...appData.calendar.map((event) => ({ ...event })),
      { ...appData.proposedCalendarEvents["career-night"] },
    ])
    setActivity([
      {
        id: "activity-career-registration",
        title: "Registered you for Product Design Career Night",
        detail: "You approved · Confirmation CN-4815",
        time: "10:46am",
        source: "Email",
        kind: "career-registration",
      },
      {
        id: "activity-team-message",
        title: "Sent your message to INFO 213 team (WhatsApp)",
        detail: "You approved the message before it was sent",
        time: "10:45am",
        source: "WhatsApp",
      },
      ...appData.activity.map((item) => ({ ...item })),
    ])
    setRegistrationFields(fields)
    setSelectedEmployers(["Figma"])
    setRegistrationStatus("registered")
    setSubmission({
      fields,
      employers: ["Figma"],
      conflictChoice: "message-team",
      teamMessageSent: true,
      teamMessage,
      confirmationNumber: "CN-4815",
      submittedAt: "10:46am",
    })
    setAssistantPausedState(false)
    setAutonomy({ ...appData.settings.autonomy })
    setConnectedSources(
      appData.settings.connectedSources.map((source) => ({ ...source })),
    )
    setCurrentResumeState("oct")
    setNotifications({ ...appData.settings.notifications })
    setFormChangedErrorState(false)
    setCantReachFormErrorState(false)
    setPaperworkChecks([false, false, false])
    setOnboardingComplete(true)
    setMeetingPollSent(false)
    setMeetingBooked(false)
    setCanUndoDismiss(false)
    setToast(null)
  }

  const joinWaitlist = (policy: "ask" | "automatic") => {
    setInbox((items) =>
      items.map((item) =>
        item.id === "google-ux"
          ? {
              ...item,
              status: "in-progress",
              proposal: "On the waitlist · #7",
            }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: `activity-google-waitlist-${Date.now()}`,
        title:
          policy === "ask"
            ? "Joined waitlist, will ask you first"
            : "Joined waitlist, will take a spot automatically",
        detail: "Google UX Research Info Session · #7",
        time: "Now",
        source: "Email",
      },
      ...items,
    ])
  }

  const togglePaperworkCheck = (index: number) => {
    setPaperworkChecks((checks) =>
      checks.map((checked, candidate) =>
        candidate === index ? !checked : checked,
      ),
    )
  }

  const completePaperwork = () => {
    setPaperworkChecks([true, true, true])
    setInbox((items) =>
      items.map((item) =>
        item.id === "address"
          ? { ...item, status: "done", proposal: "Checklist complete" }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: `activity-address-${Date.now()}`,
        title: "Completed US address update checklist",
        detail: "Marked done by you",
        time: "Now",
        source: "Email",
      },
      ...items,
    ])
    setToast("Marked done")
  }

  const sendMeetingPoll = (automatic: boolean) => {
    setMeetingPollSent(true)
    setInbox((items) =>
      items.map((item) =>
        item.id === "kai-meeting"
          ? {
              ...item,
              status: "in-progress",
              proposal: automatic
                ? "Poll sent automatically"
                : "Poll sent · waiting for replies",
            }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: "activity-meeting-poll",
        title: "Sent a scheduling poll to INFO 213 team",
        detail: automatic
          ? "Sent automatically based on your settings"
          : "You approved the WhatsApp poll",
        time: "Now",
        source: "WhatsApp",
      },
      ...items,
    ])
  }

  const undoMeetingPoll = () => {
    setMeetingPollSent(false)
    setInbox((items) =>
      items.map((item) =>
        item.id === "kai-meeting"
          ? {
              ...item,
              status: "needs-ok",
              proposal: "I can find a time for 4 people",
            }
          : item,
      ),
    )
    setActivity((items) =>
      items.filter((item) => item.id !== "activity-meeting-poll"),
    )
    setToast("Poll undone")
  }

  const bookMeeting = () => {
    setMeetingBooked(true)
    setInbox((items) =>
      items.map((item) =>
        item.id === "kai-meeting"
          ? { ...item, status: "done", proposal: "Fri 10:00am booked" }
          : item,
      ),
    )
    setCalendar((events) =>
      events.some((event) => event.id === "m3-deck-meeting")
        ? events
        : [
            ...events,
            {
              id: "m3-deck-meeting",
              title: "INFO 213 · M3 deck",
              day: 4,
              start: 10,
              end: 11,
              source: "WhatsApp",
              color: "violet",
              week: 0,
              detail: "Winning poll slot · 4 teammates",
              assistantAdded: true,
              approvalLabel: "Added by Personal Assistant",
            },
          ],
    )
    setActivity((items) => [
      {
        id: "activity-meeting-booked",
        title: "Booked INFO 213 team meeting",
        detail: "Fri Nov 13 · 10:00-11:00am · Poll winner",
        time: "2 hours later",
        source: "WhatsApp",
      },
      ...items,
    ])
  }

  const updateRegistrationField = (
    id: RegistrationField["id"],
    value: string,
  ) => {
    setRegistrationFields((fields) =>
      fields.map((field) =>
        field.id === id
          ? { ...field, value, sourceLabel: "Edited by you" }
          : field,
      ),
    )
  }

  const toggleEmployer = (employer: string) => {
    setSelectedEmployers((employers) =>
      employers.includes(employer)
        ? employers.filter((candidate) => candidate !== employer)
        : [...employers, employer],
    )
  }

  const completeCareerRegistration = (options: {
    conflictChoice: "message-team" | "arrive-late" | "automatic"
    teamMessageSent: boolean
    teamMessage: string
  }) => {
    const event = appData.proposedCalendarEvents["career-night"]
    const submissionRecord: RegistrationSubmission = {
      fields: registrationFields.map((field) => ({ ...field })),
      employers: [...selectedEmployers],
      conflictChoice: options.conflictChoice,
      organizerNote:
        options.conflictChoice === "arrive-late"
          ? "Arriving at 7:00pm"
          : undefined,
      teamMessageSent: options.teamMessageSent,
      teamMessage: options.teamMessage,
      confirmationNumber: "CN-4815",
      submittedAt: "10:46am",
    }
    setSubmission(submissionRecord)
    setRegistrationStatus("registered")
    setInbox((items) =>
      items.map((item) =>
        item.id === "career-night"
          ? {
              ...item,
              status: "done",
              proposal: "Registered · Confirmation CN-4815",
            }
          : item,
      ),
    )
    const calendarEvent =
      options.conflictChoice === "arrive-late"
        ? {
            ...event,
            detail: `${event.detail} · Arriving 7:00pm`,
          }
        : options.conflictChoice === "automatic"
          ? {
              ...event,
              approvalLabel: "Added automatically (your setting)",
            }
          : event
    setCalendar((events) =>
      events.some((candidate) => candidate.id === event.id)
        ? events
        : [...events, calendarEvent],
    )
    setActivity((items) => [
      {
        id: "activity-career-registration",
        title:
          options.conflictChoice === "automatic"
            ? "Registered you automatically (your setting)"
            : "Registered you for Product Design Career Night",
        detail:
          options.conflictChoice === "automatic"
            ? "Product Design Career Night · Confirmation CN-4815"
            : "You approved · Confirmation CN-4815",
        time: "10:46am",
        source: "Email",
        kind: "career-registration",
        automatic: options.conflictChoice === "automatic",
      },
      ...(options.teamMessageSent
        ? [
            {
              id: "activity-team-message",
              title: "Sent your message to INFO 213 team (WhatsApp)",
              detail: "You approved the message before it was sent",
              time: "10:45am",
              source: "WhatsApp" as const,
            },
          ]
        : []),
      ...items,
    ])
  }

  const remindCareerNight = (label: string) => {
    setInbox((items) =>
      items.map((item) =>
        item.id === "career-night"
          ? { ...item, proposal: "Reminder set" }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: `activity-career-reminder-${Date.now()}`,
        title: `Reminder set for Product Design Career Night`,
        detail: label,
        time: "Now",
        source: "Email",
      },
      ...items,
    ])
    setToast(`I’ll remind you ${label}`)
  }

  const dismissCareerNight = () => {
    setInbox((items) =>
      items.map((item) =>
        item.id === "career-night"
          ? { ...item, status: "done", proposal: "Dismissed" }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: "activity-career-dismissed",
        title: "Dismissed Product Design Career Night",
        detail: "Marked not interested by you",
        time: "Now",
        source: "Email",
        kind: "career-skipped",
      },
      ...items,
    ])
    setCanUndoDismiss(true)
    setToast("Event dismissed")
  }

  const undoDismissCareerNight = () => {
    setInbox((items) =>
      items.map((item) =>
        item.id === "career-night"
          ? { ...item, status: "needs-ok", proposal: "I can register you" }
          : item,
      ),
    )
    setActivity((items) =>
      items.filter((item) => item.id !== "activity-career-dismissed"),
    )
    setCanUndoDismiss(false)
    setToast("Dismissal undone")
  }

  const skipCareerRegistration = () => {
    setRegistrationStatus("skipped")
    setInbox((items) =>
      items.map((item) =>
        item.id === "career-night"
          ? { ...item, status: "done", proposal: "Skipped" }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: "activity-career-skipped",
        title: "Skipped Product Design Career Night",
        detail: "You chose not to register",
        time: "10:46am",
        source: "Email",
        kind: "career-skipped",
      },
      ...items,
    ])
  }

  const cancelCareerRegistration = () => {
    setRegistrationStatus("cancelled")
    setCalendar((events) => events.filter((event) => event.id !== "career-cal"))
    setInbox((items) =>
      items.map((item) =>
        item.id === "career-night"
          ? { ...item, status: "done", proposal: "Registration cancelled" }
          : item,
      ),
    )
    setActivity((items) => [
      {
        id: `activity-career-cancelled-${Date.now()}`,
        title: "Cancelled by you",
        detail: "Product Design Career Night registration and reminder removed",
        time: "Now",
        source: "Email",
        kind: "career-cancellation",
      },
      ...items,
    ])
    setToast("Registration cancelled, calendar updated")
  }

  const approve = (id: string) => {
    const item = inbox.find((candidate) => candidate.id === id)
    if (!item || item.status !== "needs-ok") return

    setInbox((items) =>
      items.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              status: "done",
              proposal:
                id === "career-night"
                  ? "Registration confirmed"
                  : "Request sent",
            }
          : candidate,
      ),
    )

    const approvedEvent = appData.proposedCalendarEvents[id]
    if (approvedEvent) {
      setCalendar((events) =>
        events.some((event) => event.id === approvedEvent.id)
          ? events
          : [...events, approvedEvent],
      )
    }

    setActivity((items) => [
      {
        id: `activity-${id}`,
        title:
          id === "career-night"
            ? "Registered for Product Design Career Night"
            : `Approved: ${item.title}`,
        detail: "You reviewed and approved this action",
        time: "Now",
        source: item.source,
      },
      ...items,
    ])
  }

  const value = useMemo(
    () => ({
      inbox,
      calendar,
      activity,
      registrationFields,
      selectedEmployers,
      registrationStatus,
      submission,
      toast,
      assistantPaused,
      autonomy,
      connectedSources,
      currentResume,
      notifications,
      formChangedError,
      cantReachFormError,
      paperworkChecks,
      onboardingComplete,
      meetingPollSent,
      meetingBooked,
      canUndoDismiss,
      approve,
      updateRegistrationField,
      toggleEmployer,
      completeCareerRegistration,
      skipCareerRegistration,
      cancelCareerRegistration,
      clearToast: () => {
        setToast(null)
        setCanUndoDismiss(false)
      },
      setAssistantPaused,
      setAutonomyChoice,
      disconnectSource,
      setCurrentResume,
      setNotification,
      deleteAssistantData,
      resetDemo,
      loadRegisteredDemo,
      setFormChangedError: setFormChangedErrorState,
      setCantReachFormError: setCantReachFormErrorState,
      joinWaitlist,
      togglePaperworkCheck,
      completePaperwork,
      connectSource,
      setAutonomyPreset,
      setOnboardingComplete,
      sendMeetingPoll,
      undoMeetingPoll,
      bookMeeting,
      remindCareerNight,
      dismissCareerNight,
      undoDismissCareerNight,
    }),
    [
      inbox,
      calendar,
      activity,
      registrationFields,
      selectedEmployers,
      registrationStatus,
      submission,
      toast,
      assistantPaused,
      autonomy,
      connectedSources,
      currentResume,
      notifications,
      formChangedError,
      cantReachFormError,
      paperworkChecks,
      onboardingComplete,
      meetingPollSent,
      meetingBooked,
      canUndoDismiss,
    ],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used inside StoreProvider")
  return store
}
