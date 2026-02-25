import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  AUTH_USER: "@workova_auth_user",
  USERS: "@workova_users",
  JOBS: "@workova_jobs",
  WORKERS: "@workova_workers",
  OFFERS: "@workova_offers",
  CHATS: "@workova_chats",
  MESSAGES: "@workova_messages",
  REPORTS: "@workova_reports",
};

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function setJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: "customer" | "worker" | "both";
  blockedUsers: string[];
  createdAt: string;
};

export type WorkerProfile = {
  userId: string;
  displayName: string;
  bio: string;
  categories: string[];
  serviceRadius: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Job = {
  id: string;
  customerId: string;
  customerName: string;
  categoryId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  photos: string[];
  status: "open" | "offered" | "booked" | "in_progress" | "complete" | "cancelled";
  createdAt: string;
};

export type Offer = {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  customerId: string;
  price: number;
  etaText: string;
  message: string;
  status: "sent" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
};

export type Chat = {
  id: string;
  jobId: string;
  jobTitle: string;
  members: string[];
  memberNames: Record<string, string>;
  lastMessage: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type Report = {
  id: string;
  reporterId: string;
  targetType: "job" | "user" | "offer" | "message";
  targetId: string;
  reason: string;
  createdAt: string;
};

export const StorageService = {
  async getAuthUser(): Promise<AuthUser | null> {
    return getJSON<AuthUser>(KEYS.AUTH_USER);
  },

  async setAuthUser(user: AuthUser | null): Promise<void> {
    if (user) {
      await setJSON(KEYS.AUTH_USER, user);
      const users = await this.getAllUsers();
      users[user.id] = user;
      await setJSON(KEYS.USERS, users);
    } else {
      await AsyncStorage.removeItem(KEYS.AUTH_USER);
    }
  },

  async getAllUsers(): Promise<Record<string, AuthUser>> {
    return (await getJSON<Record<string, AuthUser>>(KEYS.USERS)) || {};
  },

  async getUserById(id: string): Promise<AuthUser | null> {
    const users = await this.getAllUsers();
    return users[id] || null;
  },

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const users = await this.getAllUsers();
    return Object.values(users).find((u) => u.email === email) || null;
  },

  async getAllJobs(): Promise<Job[]> {
    return (await getJSON<Job[]>(KEYS.JOBS)) || [];
  },

  async getJobById(id: string): Promise<Job | null> {
    const jobs = await this.getAllJobs();
    return jobs.find((j) => j.id === id) || null;
  },

  async getJobsByCustomer(customerId: string): Promise<Job[]> {
    const jobs = await this.getAllJobs();
    return jobs.filter((j) => j.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOpenJobs(excludeUserId?: string, blockedUserIds?: string[]): Promise<Job[]> {
    const jobs = await this.getAllJobs();
    const blocked = blockedUserIds || [];
    return jobs
      .filter((j) => j.status === "open" && j.customerId !== excludeUserId && !blocked.includes(j.customerId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createJob(job: Job): Promise<void> {
    const jobs = await this.getAllJobs();
    jobs.push(job);
    await setJSON(KEYS.JOBS, jobs);
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    const jobs = await this.getAllJobs();
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx >= 0) {
      jobs[idx] = { ...jobs[idx], ...updates };
      await setJSON(KEYS.JOBS, jobs);
    }
  },

  async getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
    const workers = (await getJSON<Record<string, WorkerProfile>>(KEYS.WORKERS)) || {};
    return workers[userId] || null;
  },

  async setWorkerProfile(profile: WorkerProfile): Promise<void> {
    const workers = (await getJSON<Record<string, WorkerProfile>>(KEYS.WORKERS)) || {};
    workers[profile.userId] = profile;
    await setJSON(KEYS.WORKERS, workers);
  },

  async getOffersForJob(jobId: string): Promise<Offer[]> {
    const offers = (await getJSON<Offer[]>(KEYS.OFFERS)) || [];
    return offers.filter((o) => o.jobId === jobId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOffersByWorker(workerId: string): Promise<Offer[]> {
    const offers = (await getJSON<Offer[]>(KEYS.OFFERS)) || [];
    return offers.filter((o) => o.workerId === workerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createOffer(offer: Offer): Promise<void> {
    const offers = (await getJSON<Offer[]>(KEYS.OFFERS)) || [];
    offers.push(offer);
    await setJSON(KEYS.OFFERS, offers);
  },

  async updateOffer(id: string, updates: Partial<Offer>): Promise<void> {
    const offers = (await getJSON<Offer[]>(KEYS.OFFERS)) || [];
    const idx = offers.findIndex((o) => o.id === id);
    if (idx >= 0) {
      offers[idx] = { ...offers[idx], ...updates };
      await setJSON(KEYS.OFFERS, offers);
    }
  },

  async getChatsForUser(userId: string): Promise<Chat[]> {
    const chats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    return chats
      .filter((c) => c.members.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getChatById(id: string): Promise<Chat | null> {
    const chats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    return chats.find((c) => c.id === id) || null;
  },

  async findChatByJobAndMembers(jobId: string, members: string[]): Promise<Chat | null> {
    const chats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    return chats.find((c) => c.jobId === jobId && members.every((m) => c.members.includes(m))) || null;
  },

  async createChat(chat: Chat): Promise<void> {
    const chats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    chats.push(chat);
    await setJSON(KEYS.CHATS, chats);
  },

  async updateChat(id: string, updates: Partial<Chat>): Promise<void> {
    const chats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    const idx = chats.findIndex((c) => c.id === id);
    if (idx >= 0) {
      chats[idx] = { ...chats[idx], ...updates };
      await setJSON(KEYS.CHATS, chats);
    }
  },

  async getMessagesForChat(chatId: string): Promise<Message[]> {
    const messages = (await getJSON<Message[]>(KEYS.MESSAGES)) || [];
    return messages
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async createMessage(message: Message): Promise<void> {
    const messages = (await getJSON<Message[]>(KEYS.MESSAGES)) || [];
    messages.push(message);
    await setJSON(KEYS.MESSAGES, messages);
  },

  async blockUser(currentUserId: string, targetUserId: string): Promise<AuthUser | null> {
    const user = await this.getAuthUser();
    if (user && user.id === currentUserId) {
      if (!user.blockedUsers.includes(targetUserId)) {
        user.blockedUsers.push(targetUserId);
        await this.setAuthUser(user);
      }
    }
    return user;
  },

  async unblockUser(currentUserId: string, targetUserId: string): Promise<AuthUser | null> {
    const user = await this.getAuthUser();
    if (user && user.id === currentUserId) {
      user.blockedUsers = user.blockedUsers.filter((id) => id !== targetUserId);
      await this.setAuthUser(user);
    }
    return user;
  },

  async isUserBlocked(currentUserId: string, targetUserId: string): Promise<boolean> {
    const user = await this.getAuthUser();
    if (user && user.id === currentUserId) {
      return user.blockedUsers.includes(targetUserId);
    }
    return false;
  },

  async createReport(report: Report): Promise<void> {
    const reports = (await getJSON<Report[]>(KEYS.REPORTS)) || [];
    reports.push(report);
    await setJSON(KEYS.REPORTS, reports);
  },

  async getReports(): Promise<Report[]> {
    return (await getJSON<Report[]>(KEYS.REPORTS)) || [];
  },

  async deleteAccount(userId: string): Promise<void> {
    const users = await this.getAllUsers();
    delete users[userId];
    await setJSON(KEYS.USERS, users);

    const workers = (await getJSON<Record<string, WorkerProfile>>(KEYS.WORKERS)) || {};
    delete workers[userId];
    await setJSON(KEYS.WORKERS, workers);

    const jobs = await this.getAllJobs();
    await setJSON(KEYS.JOBS, jobs.filter((j) => j.customerId !== userId));

    const offers = (await getJSON<Offer[]>(KEYS.OFFERS)) || [];
    await setJSON(KEYS.OFFERS, offers.filter((o) => o.workerId !== userId));

    const chats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    await setJSON(KEYS.CHATS, chats.filter((c) => !c.members.includes(userId)));

    const messages = (await getJSON<Message[]>(KEYS.MESSAGES)) || [];
    await setJSON(KEYS.MESSAGES, messages.filter((m) => m.senderId !== userId));

    await AsyncStorage.removeItem(KEYS.AUTH_USER);
  },

  async seedDemoData(): Promise<void> {
    const demoUser: AuthUser = {
      id: "demo-user-1",
      email: "demo@workova.app",
      displayName: "Demo User",
      role: "both",
      blockedUsers: [],
      createdAt: "2026-01-01",
    };
    const demoWorker: AuthUser = {
      id: "demo-worker-1",
      email: "worker@workova.app",
      displayName: "Alex Pro",
      role: "worker",
      blockedUsers: [],
      createdAt: "2026-01-01",
    };

    const users = await this.getAllUsers();
    users[demoUser.id] = demoUser;
    users[demoWorker.id] = demoWorker;
    await setJSON(KEYS.USERS, users);

    const workerProfile: WorkerProfile = {
      userId: "demo-worker-1",
      displayName: "Alex Pro",
      bio: "Experienced handyman and cleaner with 5+ years of professional experience.",
      categories: ["handyman", "cleaning", "plumbing"],
      serviceRadius: 25,
      ratingAvg: 4.8,
      ratingCount: 42,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    await this.setWorkerProfile(workerProfile);

    const now = new Date().toISOString();
    const demoJobs: Job[] = [
      {
        id: "demo-job-1",
        customerId: "demo-user-1",
        customerName: "Demo User",
        categoryId: "handyman",
        title: "Fix leaky kitchen faucet",
        description: "The kitchen faucet has been dripping for a few days. Need someone to replace the washer or cartridge. Standard single-handle faucet.",
        budgetMin: 50,
        budgetMax: 120,
        photos: [],
        status: "open",
        createdAt: now,
      },
      {
        id: "demo-job-2",
        customerId: "demo-user-1",
        customerName: "Demo User",
        categoryId: "cleaning",
        title: "Deep clean 2-bedroom apartment",
        description: "Moving out and need a thorough deep clean including kitchen, bathrooms, and all rooms. Approximately 900 sq ft.",
        budgetMin: 150,
        budgetMax: 250,
        photos: [],
        status: "open",
        createdAt: now,
      },
      {
        id: "demo-job-3",
        customerId: "demo-user-1",
        customerName: "Demo User",
        categoryId: "moving",
        title: "Help moving furniture to new apartment",
        description: "Need help moving a couch, dining table, bed frame, and several boxes from 2nd floor to a ground floor unit across town.",
        budgetMin: 200,
        budgetMax: 400,
        photos: [],
        status: "open",
        createdAt: now,
      },
      {
        id: "demo-job-4",
        customerId: "demo-worker-1",
        customerName: "Alex Pro",
        categoryId: "plumbing",
        title: "Bathroom sink installation",
        description: "Looking for help installing a new pedestal sink in the guest bathroom. Old vanity has been removed already.",
        budgetMin: 100,
        budgetMax: 200,
        photos: [],
        status: "open",
        createdAt: now,
      },
      {
        id: "demo-job-5",
        customerId: "demo-worker-1",
        customerName: "Alex Pro",
        categoryId: "landscaping",
        title: "Backyard lawn mowing and trimming",
        description: "Need weekly lawn mowing service for a medium-sized backyard. Includes edging and trimming around flower beds.",
        budgetMin: 40,
        budgetMax: 80,
        photos: [],
        status: "open",
        createdAt: now,
      },
    ];

    const existingJobs = await this.getAllJobs();
    const demoJobIds = demoJobs.map((j) => j.id);
    const filteredJobs = existingJobs.filter((j) => !demoJobIds.includes(j.id));
    await setJSON(KEYS.JOBS, [...filteredJobs, ...demoJobs]);

    const demoOffers: Offer[] = [
      {
        id: "demo-offer-1",
        jobId: "demo-job-1",
        workerId: "demo-worker-1",
        workerName: "Alex Pro",
        customerId: "demo-user-1",
        price: 75,
        etaText: "Today 2-4pm",
        message: "I have extensive experience with faucet repairs. I can fix this quickly and bring all necessary parts.",
        status: "sent",
        createdAt: now,
      },
      {
        id: "demo-offer-2",
        jobId: "demo-job-1",
        workerId: "demo-worker-1",
        workerName: "Alex Pro",
        customerId: "demo-user-1",
        price: 95,
        etaText: "Tomorrow morning",
        message: "I can also replace the entire faucet if needed for a more permanent fix.",
        status: "sent",
        createdAt: now,
      },
    ];

    const existingOffers = (await getJSON<Offer[]>(KEYS.OFFERS)) || [];
    const demoOfferIds = demoOffers.map((o) => o.id);
    const filteredOffers = existingOffers.filter((o) => !demoOfferIds.includes(o.id));
    await setJSON(KEYS.OFFERS, [...filteredOffers, ...demoOffers]);

    const demoChat: Chat = {
      id: "demo-chat-1",
      jobId: "demo-job-1",
      jobTitle: "Fix leaky kitchen faucet",
      members: ["demo-user-1", "demo-worker-1"],
      memberNames: { "demo-user-1": "Demo User", "demo-worker-1": "Alex Pro" },
      lastMessage: "Hi! I'm interested in helping with your faucet repair.",
      updatedAt: now,
    };

    const existingChats = (await getJSON<Chat[]>(KEYS.CHATS)) || [];
    const filteredChats = existingChats.filter((c) => c.id !== "demo-chat-1");
    await setJSON(KEYS.CHATS, [...filteredChats, demoChat]);

    const demoMessage: Message = {
      id: "demo-msg-1",
      chatId: "demo-chat-1",
      senderId: "demo-worker-1",
      senderName: "Alex Pro",
      text: "Hi! I'm interested in helping with your faucet repair.",
      createdAt: now,
    };

    const existingMsgs = (await getJSON<Message[]>(KEYS.MESSAGES)) || [];
    const filteredMsgs = existingMsgs.filter((m) => m.id !== "demo-msg-1");
    await setJSON(KEYS.MESSAGES, [...filteredMsgs, demoMessage]);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
